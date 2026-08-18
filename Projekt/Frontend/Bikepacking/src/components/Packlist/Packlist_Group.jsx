import { useContext, useEffect, useId, useState } from "react";
import axios from "axios";

import Packlist_Item from "./Packlist_Item.jsx";
import Packlist_NewItem from "./Packlist_NewItem.jsx";
import { MeasureBar } from "../ui/Sheet.jsx";
import { Note } from "../ui/Controls.jsx";
import { IconChevron, IconPlus } from "../ui/Icons.jsx";
import { SetupItemsContext } from "../../Context/PacklistContext.jsx";

const API = "http://localhost:3030/bikepacking";

const nf = (n, d = 0) =>
  Number(n || 0).toLocaleString("en-GB", {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });

/**
 * A category of the schedule, folded until it has something in it.
 *
 * The row carries its own weight both ways: the figure, and the bar showing
 * what share of the whole load this category is. Which bag is the heavy one is
 * the question the list exists to answer.
 */
export default function Packlist_Group({ title, items = [], listId, totalWeight }) {
  const [open, setOpen] = useState(false);
  const [showNewItem, setShowNewItem] = useState(false);
  const [error, setError] = useState("");
  const { removeItem, updateItem, addItem } = useContext(SetupItemsContext);
  const panelId = useId();

  useEffect(() => {
    if (items.length > 0) setOpen(true);
  }, [items.length]);

  const groupWeight = items.reduce((sum, i) => sum + Number(i?.Weight || 0), 0);
  const groupPrice = items.reduce((sum, i) => sum + Number(i?.Price || 0), 0);

  const handleRemove = async (itemId) => {
    setError("");
    try {
      await axios.delete(`${API}/itemlists/remove-item`, {
        data: { listId, itemId },
      });
      removeItem(title, itemId);
    } catch {
      setError("That item could not be removed. Check the connection and try again.");
    }
  };

  const handleUpdate = async (itemId, changes) => {
    setError("");
    updateItem(title, itemId, changes);
    try {
      await axios.put(`${API}/items/${itemId}`, changes);
    } catch {
      setError("The change was not saved to the server. Reload to see the stored values.");
    }
  };

  /** Returns null on success, or the message the dialog should show. */
  const handleCreate = async (newItem) => {
    setError("");
    try {
      const form = new FormData();
      form.append("image", newItem.imageFile);
      const upload = await axios.post(`${API}/uploadImage`, form);

      const { data } = await axios.post(`${API}/items`, {
        Categorie: title,
        IMG: upload.data.path,
        Itemname: newItem.item,
        Link: newItem.productLink,
        Weight: Number(newItem.weight),
        Price: Number(newItem.price),
      });

      addItem(title, data);
      setShowNewItem(false);
      return null;
    } catch {
      return "The item could not be saved. Check the image size and your connection, then try again.";
    }
  };

  return (
    <div className="border-b border-ink last:border-b-0">
      <h3>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={panelId}
          className="group grid w-full grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 px-1 py-3.5 text-left transition-colors duration-150 hover:bg-field sm:grid-cols-[minmax(0,1fr)_10rem_6rem_1.5rem]"
        >
          <span className="flex items-center gap-3 min-w-0">
            <span className="t-h3 truncate">{title}</span>
            <span className="t-label flex-none">
              {items.length === 0 ? "Empty" : `${items.length} items`}
            </span>
          </span>

          <span className="hidden flex-col gap-1.5 sm:flex">
            <span className="t-figure text-xs text-ink-soft">
              {nf(groupWeight)} g
            </span>
            {totalWeight > 0 ? (
              <MeasureBar
                value={groupWeight}
                max={totalWeight}
                label={`${title}: ${nf(groupWeight)} of ${nf(totalWeight)} grams`}
              />
            ) : null}
          </span>

          <span className="t-figure hidden text-right text-xs text-ink-soft sm:block">
            {nf(groupPrice, 2)} EUR
          </span>

          <span
            aria-hidden="true"
            className={`justify-self-end transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          >
            <IconChevron size={18} />
          </span>
        </button>
      </h3>

      <div id={panelId} className="a-collapse" data-open={open}>
        <div>
          <div className="pb-4">
            {error ? (
              <Note tone="error" className="mb-3">
                {error}
              </Note>
            ) : null}

            {items.length > 0 ? (
              <div
                aria-hidden="true"
                className="hidden grid-cols-[4rem_minmax(0,1fr)_7rem_7rem_auto] gap-4 border-y border-ink px-3 py-2 lg:grid"
              >
                <span className="t-label">Image</span>
                <span className="t-label">Item</span>
                <span className="t-label">Weight (g)</span>
                <span className="t-label">Price (EUR)</span>
                <span className="t-label w-[6.25rem] text-right">Actions</span>
              </div>
            ) : null}

            {items.length > 0 ? (
              <ul className="border-x border-b border-ink lg:border-t-0">
                {items.map((item) => (
                  <Packlist_Item
                    key={item._id}
                    {...item}
                    onDelete={() => handleRemove(item._id)}
                    onChange={(changes) => handleUpdate(item._id, changes)}
                  />
                ))}
              </ul>
            ) : (
              <p className="m-grid border border-dashed border-ink/30 px-4 py-6 text-sm text-ink-soft">
                Nothing filed under {title.toLowerCase()} yet.
              </p>
            )}

            <div className="mt-3">
              <button
                type="button"
                onClick={() => setShowNewItem(true)}
                className="c-btn c-btn--quiet"
              >
                <IconPlus size={15} />
                <span>Add to {title.toLowerCase()}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {showNewItem ? (
        <Packlist_NewItem
          category={title}
          onClose={() => setShowNewItem(false)}
          onSave={handleCreate}
        />
      ) : null}
    </div>
  );
}
