import { useCallback, useContext, useEffect, useId, useRef, useState } from "react";

import Modal from "../ui/Modal.jsx";
import { Button, Note, SegmentedChoice } from "../ui/Controls.jsx";
import { ItemName, ItemThumb, LoadingRows } from "../ui/Sheet.jsx";
import { IconPlus, IconSearch } from "../ui/Icons.jsx";
import api, { assetUrl, errorMessage } from "../../lib/api.js";
import { UserContext } from "../../Context/UserContext.jsx";
import { DEMO } from "../../lib/demo.js";

const PAGE_SIZE = 24;

const nf = (n, d = 0) =>
  Number(n || 0).toLocaleString("en-GB", {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });

/**
 * Where gear comes from.
 *
 * The catalogue is a real table on the server, so it is drawn as one: the
 * search box sits above a list of records with a count beside it, and every
 * row is a stored item with its origin printed underneath. A free-text field
 * that quietly invents an item on submit would hide the fact that there is a
 * database behind this at all.
 *
 * Two scopes only — the shared catalogue, and the items this account added
 * itself. Other people's private items are never in the result set; the server
 * decides that, not this component.
 */
export default function Packlist_ItemPicker({
  category,
  addedIds = [],
  onAdd,
  onCreateOwn,
  onClose,
}) {
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState("CATALOG");
  const [wholeCatalogue, setWholeCatalogue] = useState(false);

  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const searchId = useId();
  const { user } = useContext(UserContext);
  const added = new Set(addedIds);

  // Jede Suche bekommt eine Nummer; nur die jüngste darf schreiben, sonst
  // überholt eine langsame Antwort eine schnellere.
  const runId = useRef(0);

  const load = useCallback(
    async (nextPage, { append }) => {
      const ticket = ++runId.current;
      setLoading(true);
      setError("");

      try {
        const { data } = await api.get("/items", {
          params: {
            q: query.trim() || undefined,
            category: wholeCatalogue ? undefined : category,
            source: scope,
            page: nextPage,
            limit: PAGE_SIZE,
          },
        });
        if (ticket !== runId.current) return;

        setResults((prev) => (append ? [...prev, ...data.items] : data.items));
        setTotal(data.total);
        setPage(nextPage);
      } catch (err) {
        if (ticket !== runId.current) return;
        setError(errorMessage(err, "The catalogue could not be searched."));
        if (!append) setResults([]);
      } finally {
        if (ticket === runId.current) setLoading(false);
      }
    },
    [query, category, scope, wholeCatalogue]
  );

  // Getippt wird schneller, als der Server antworten kann.
  useEffect(() => {
    const timer = setTimeout(() => load(1, { append: false }), 250);
    return () => clearTimeout(timer);
  }, [load]);

  const scopeOptions = [
    { value: "CATALOG", label: "Catalogue" },
    { value: "USER", label: "Your items" },
  ];

  const hasMore = results.length < total;

  return (
    <Modal
      onClose={onClose}
      title="Add gear"
      code={category ? `Category · ${category}` : undefined}
      width="wide"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="t-label">
            {DEMO
              ? "Not in the catalogue? Add it yourself — it joins the catalogue for this visit."
              : "Not in the catalogue? Add it yourself — it joins the shared catalogue, and only you can edit it."}
          </p>
          <Button variant="ghost" icon={IconPlus} onClick={onCreateOwn}>
            New item
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {error ? <Note tone="error">{error}</Note> : null}

        <div className="sticky -top-4 z-10 -mx-4 -mt-4 flex flex-col gap-4 bg-sheet px-4 pt-4 pb-3 sm:-top-5 sm:-mx-5 sm:-mt-5 sm:px-5 sm:pt-5">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={searchId} className="t-label t-label--ink">
            Search the catalogue
          </label>
          {/* Der Ring sitzt am Rahmen, nicht am nackten Eingabefeld — das
              Feld selbst hat keinen eigenen Rand. `outline-none` am Input
              bleibt deshalb nötig, darf aber nicht der einzige Zustand sein:
              vorher war das Feld beim Tabben nicht zu erkennen. */}
          <div className="flex items-center gap-2 border border-ink bg-sheet px-3 has-[:focus-visible]:outline-2 has-[:focus-visible]:-outline-offset-2 has-[:focus-visible]:outline-clay">
            <span aria-hidden="true" className="flex-none text-ink-soft">
              <IconSearch size={16} />
            </span>
            <input
              id={searchId}
              type="search"
              autoComplete="off"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tent, sleeping bag, frame bag…"
              className="min-h-11 w-full border-0 bg-transparent py-2 text-sm outline-hidden"
            />
          </div>
          <p className="t-label">
            Matches item names and where they come from in the catalogue.
          </p>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <SegmentedChoice
            legend="Where to look"
            name="picker-scope"
            value={scope}
            onChange={setScope}
            options={scopeOptions}
          />
          <label className="flex min-h-11 items-center gap-2 text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={wholeCatalogue}
              onChange={(e) => setWholeCatalogue(e.target.checked)}
              className="h-4 w-4 accent-clay"
            />
            Search every category
          </label>
        </div>

        <div className="flex items-baseline justify-between gap-4 border-b border-ink pb-2">
          <span className="t-label t-label--ink">
            {scope === "CATALOG" ? "Catalogue" : "Your items"}
          </span>
          <span className="t-label">
            {loading && results.length === 0
              ? "Searching…"
              : `${nf(total)} ${total === 1 ? "record" : "records"}`}
          </span>
        </div>
        </div>

        {loading && results.length === 0 ? (
          <LoadingRows rows={4} />
        ) : results.length === 0 ? (
          <div className="m-grid border border-dashed border-ink/40 px-4 py-8 text-center">
            <p className="text-sm text-ink-soft">
              {scope === "USER" && !user && !DEMO
                ? "Log in to see the items you added yourself."
                : query.trim()
                  ? `Nothing in the ${scope === "CATALOG" ? "catalogue" : "list"} matches “${query.trim()}”.`
                  : "This part of the catalogue is empty."}
            </p>
            {!wholeCatalogue && query.trim() ? (
              <button
                type="button"
                className="c-btn c-btn--quiet mt-3"
                onClick={() => setWholeCatalogue(true)}
              >
                Search every category
              </button>
            ) : null}
          </div>
        ) : (
          <ul className="border border-ink">
            {results.map((item) => {
              const isAdded = added.has(item._id);
              return (
                <li
                  key={item._id}
                  className="flex items-center gap-3 border-b border-rule bg-sheet p-3 last:border-b-0"
                >
                  <ItemThumb
                    src={assetUrl(item.IMG)}
                    alt=""
                    className="h-12 w-12"
                  />

                  <div className="min-w-0 flex-1">
                    <p className="flex text-sm font-semibold text-ink">
                      <ItemName name={item.Itemname} brand={item.Brand} />
                    </p>
                    <p className="t-label truncate">{item.Categorie}</p>
                  </div>

                  <div className="hidden flex-none text-right sm:block">
                    <p className="t-figure text-xs text-ink-soft">
                      {item.Weight > 0 ? `${nf(item.Weight)} g` : "— g"}
                    </p>
                    <p className="t-figure text-xs text-ink-soft">
                      {item.Price > 0 ? `${nf(item.Price, 2)} EUR` : "— EUR"}
                    </p>
                  </div>

                  <div className="flex-none">
                    {isAdded ? (
                      <span className="t-label t-label--ink px-2">On the list</span>
                    ) : (
                      <Button
                        variant="quiet"
                        icon={IconPlus}
                        onClick={() => onAdd(item)}
                        aria-label={`Add ${item.Itemname} to ${category}`}
                      >
                        Add
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {hasMore ? (
          <Button
            variant="quiet"
            busy={loading}
            onClick={() => load(page + 1, { append: true })}
            className="w-full"
          >
            Show more ({nf(total - results.length)} left)
          </Button>
        ) : null}
      </div>
    </Modal>
  );
}
