import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { HashLink } from "react-router-hash-link";

import {
  SectionHead,
  MeasureBar,
  EmptyPlate,
  LoadingRows,
} from "../ui/Sheet.jsx";
import { SegmentedChoice, Note } from "../ui/Controls.jsx";
import { IconArrow } from "../ui/Icons.jsx";
import api, { assetUrl, errorMessage } from "../../lib/api.js";
import useGridColumns, { fullRows } from "../../lib/useGridColumns.js";

const FILTERS = ["ALL", "MTB", "GRAVEL", "ROAD", "BIKEPACKING", "RACE"];

const num = (n) => Number(n || 0).toLocaleString("en-GB");

/** "14 Mar 2026" — the sheet dates things, it does not relativise them. */
const dateLabel = (iso) => {
  if (!iso) return "Undated";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "Undated"
    : d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
};

const nights = (start, end) => {
  const a = new Date(start);
  const b = new Date(end);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null;
  return Math.max(0, Math.round((b - a) / 86400000));
};

/** One measured row: the figure, and the same quantity drawn to scale. */
function Row({ label, value, unit, ratio, tone }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="t-label">{label}</span>
        <span className="t-figure text-sm font-semibold">
          {value}
          <span className="t-label ml-1">{unit}</span>
        </span>
      </div>
      <MeasureBar
        value={ratio.value}
        max={ratio.max}
        tone={tone}
        label={`${label}: ${value} ${unit}`}
      />
    </div>
  );
}

/**
 * The index of what other people have ridden, newest departure first.
 *
 * Every tile is a link into that tour's sheet, because the point of the index
 * is not the photograph — it is the packing list behind it. The item count is
 * printed on the tile so the promise is visible before the click.
 */
export default function TourIndex() {
  const columns = useGridColumns();
  const capacity = fullRows(columns);
  const [filter, setFilter] = useState("ALL");
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    api
      .get("/tours/feed", { params: { limit: 30 } })
      .then(({ data }) => {
        if (!cancelled) setTours(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (!cancelled)
          setError(errorMessage(err, "The tour index could not be loaded."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Scales stay fixed to the whole set, so a bar means the same thing in every
  // filter — the point of drawing the quantity at all.
  const scale = useMemo(
    () => ({
      km: Math.max(1, ...tours.map((t) => t.Distance || 0)),
      hm: Math.max(1, ...tours.map((t) => t.Elevation || 0)),
    }),
    [tours]
  );

  const matching =
    filter === "ALL"
      ? tours
      : tours.filter((t) => t.Biketype === filter || t.Type === filter);

  // Angezeigt wird nur, was das Raster voll füllt: bei drei Spalten neun
  // Kacheln, bei zwei zehn. Der Index endet damit auf einer vollen Zeile
  // statt auf einer angebrochenen.
  const shown = matching.slice(0, capacity);
  const hidden = matching.length - shown.length;

  const body = () => {
    if (loading) return <LoadingRows rows={3} />;

    if (error) {
      return (
        <Note tone="error">
          {error} The index reads from the server — start it on port 3030 and
          reload.
        </Note>
      );
    }

    if (tours.length === 0) {
      return (
        <EmptyPlate
          title="Nothing published yet"
          body="No tours have been shared on the platform so far. Plan one on the sheet, save it, and it can be the first."
          actions={
            <HashLink smooth to="/overview#tour" className="c-btn c-btn--clay">
              <span>Plan a tour</span>
              <IconArrow size={16} />
            </HashLink>
          }
        />
      );
    }

    if (matching.length === 0) {
      return (
        <EmptyPlate
          title="Nothing filed under that discipline"
          body="The index holds no published tour of that kind yet. Clear the filter to see all of them."
          actions={
            <button
              type="button"
              className="c-btn c-btn--ghost"
              onClick={() => setFilter("ALL")}
            >
              Clear filter
            </button>
          }
        />
      );
    }

    return (
      <ul className="c-cellgrid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
        {shown.map((tour) => {
          const days = nights(tour.StartDate, tour.EndDate);
          return (
            <li key={tour._id} className="flex flex-col">
              <Link
                to={`/tour/${tour._id}`}
                className="group flex flex-1 flex-col no-underline outline-none focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-clay"
              >
                <div className="m-plate m-plate--live aspect-square w-full border-0 border-b border-ink">
                  {tour.Cover ? (
                    <img
                      src={assetUrl(tour.Cover)}
                      alt=""
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <span aria-hidden="true" className="m-hatch block h-full w-full" />
                  )}
                </div>

                <div className="flex flex-1 flex-col gap-4 p-4">
                  <div>
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="t-h3 min-w-0 truncate group-hover:text-clay">
                        {tour.Name}
                      </h3>
                      <span className="t-label t-label--clay flex-none">
                        {tour.Biketype}
                      </span>
                    </div>
                    <p className="t-label mt-1">
                      {dateLabel(tour.StartDate)}
                      {days !== null ? ` · ${days} days` : ""}
                      {tour.Author ? ` · ${tour.Author}` : ""}
                    </p>
                  </div>

                  <div className="mt-auto flex flex-col gap-3">
                    <Row
                      label="Distance"
                      value={num(tour.Distance)}
                      unit="km"
                      ratio={{ value: tour.Distance || 0, max: scale.km }}
                      tone="clay"
                    />
                    <Row
                      label="Climb"
                      value={num(tour.Elevation)}
                      unit="m"
                      ratio={{ value: tour.Elevation || 0, max: scale.hm }}
                      tone="olive"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3 border-t border-rule pt-3">
                    <span className="t-label">
                      {tour.ItemCount > 0
                        ? `Packlist · ${tour.ItemCount} items`
                        : "No packlist filed"}
                    </span>
                    <span
                      aria-hidden="true"
                      className="flex-none text-ink-soft group-hover:text-clay"
                    >
                      <IconArrow size={16} />
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          );
        })}

        {/* Reicht der Bestand nicht für eine volle Zeile, hatcht die Zeichnung
            die Felder aus, für die sie nichts hat. */}
        {Array.from({
          length: (columns - (shown.length % columns)) % columns,
        }).map((_, i) => (
          <li
            key={`blank-${i}`}
            aria-hidden="true"
            className="m-hatch min-h-[12rem]"
          />
        ))}
      </ul>
    );
  };

  return (
    <section
      id="reference"
      className="sheet-pad border-t border-ink bg-sheet py-10 md:py-14"
    >
      <SectionHead
        title="Published tours"
        meta={
          loading
            ? "Loading"
            : hidden > 0
              ? `${shown.length} of ${matching.length} · Newest departure first`
              : `${shown.length} ${shown.length === 1 ? "tour" : "tours"} · Newest departure first`
        }
      />

      {tours.length > 0 ? (
        <div className="my-6 overflow-x-auto pb-1">
          <SegmentedChoice
            legend="Filter by discipline"
            name="tour-filter"
            value={filter}
            onChange={setFilter}
            options={FILTERS}
            accent
          />
        </div>
      ) : (
        <div className="my-6" />
      )}

      {body()}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-ink pt-4">
        <p className="t-label max-w-md">
          {hidden > 0
            ? `${hidden} more published ${hidden === 1 ? "tour" : "tours"} not shown. Distances and climb are drawn to one shared scale.`
            : "Distances and climb are drawn to one shared scale across the index."}
        </p>
        <HashLink smooth to="/overview#tour" className="c-btn c-btn--ghost">
          <span>Plan your own</span>
          <IconArrow size={16} />
        </HashLink>
      </div>
    </section>
  );
}
