import { useContext, useEffect, useId, useState } from "react";

import Packlist_Item from "./Packlist_Item.jsx";
import Packlist_NewItem from "./Packlist_NewItem.jsx";
import Packlist_ItemPicker from "./Packlist_ItemPicker.jsx";
import { MeasureBar } from "../ui/Sheet.jsx";
import { Note } from "../ui/Controls.jsx";
import { IconChevron, IconPlus } from "../ui/Icons.jsx";
import { SetupItemsContext } from "../../Context/SetupItemsContext.jsx";
import { UserContext } from "../../Context/UserContext.jsx";
import api, { errorMessage } from "../../lib/api.js";

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
  const [dialog, setDialog] = useState(null);
  const [error, setError] = useState("");
  const { removeItem, updateItem, addItem } = useContext(SetupItemsContext);
  const { user } = useContext(UserContext);
  const panelId = useId();

  useEffect(() => {
    if (items.length > 0) setOpen(true);
  }, [items.length]);

  const groupWeight = items.reduce((sum, i) => sum + Number(i?.Weight || 0), 0);
  const groupPrice = items.reduce((sum, i) => sum + Number(i?.Price || 0), 0);

  const handleRemove = async (itemId) => {
    setError("");
    removeItem(title, itemId);

    // Ohne offenes Setup gibt es serverseitig noch keine Liste, aus der etwas
    // entfernt werden könnte — das passiert erst beim Speichern.
    if (!listId) return;
    try {
      await api.delete("/itemlists/remove-item", { data: { listId, itemId } });
    } catch (err) {
      setError(errorMessage(err, "That item could not be removed from the saved setup."));
    }
  };

  /**
   * Gewicht und Preis ändern.
   *
   * Geteilte Einträge gehören allen: wer sie für seine Liste anpasst, bekommt
   * eine eigene Kopie, statt den Eintrag für jeden anderen zu überschreiben.
   * Nur was man selbst beigesteuert hat, lässt sich direkt ändern — der Server
   * sieht das genauso (409), hier wird es nur nicht erst versucht.
   */
  const handleUpdate = async (item, changes) => {
    setError("");

    const mine = user && item.Owner && String(item.Owner) === String(user._id);
    if (!mine) {
      try {
        const { data } = await api.post(`/items/${item._id}/fork`, changes);
        updateItem(title, item._id, data);

        if (listId) {
          await api.put("/itemlists/add-item", {
            listId,
            itemId: data._id,
            replaces: item._id,
          });
        }
      } catch (err) {
        setError(errorMessage(err, "The change could not be saved as your own copy."));
      }
      return;
    }

    updateItem(title, item._id, changes);
    try {
      await api.put(`/items/${item._id}`, changes);
    } catch (err) {
      setError(
        errorMessage(err, "The change was not saved. Reload to see the stored values.")
      );
    }
  };

  /** Ein Item aus dem Katalog auf die Liste holen. */
  const handlePick = async (item) => {
    setError("");
    addItem(title, item);

    if (!listId) return;
    try {
      await api.put("/itemlists/add-item", { listId, itemId: item._id });
    } catch (err) {
      setError(errorMessage(err, "The item was added, but not saved to the setup yet."));
    }
  };

  /** Returns null on success, or the message the dialog should show. */
  const handleCreate = async (newItem) => {
    setError("");
    try {
      let imagePath = "";
      if (newItem.imageFile) {
        const form = new FormData();
        form.append("image", newItem.imageFile);
        const upload = await api.post("/uploadImage", form);
        imagePath = upload.data.path;
      }

      const { data } = await api.post("/items", {
        Categorie: title,
        IMG: imagePath,
        Itemname: newItem.item,
        Brand: newItem.brand,
        Keywords: newItem.keywords,
        Link: newItem.productLink,
        Weight: Number(newItem.weight),
        Price: Number(newItem.price),
      });

      await handlePick(data);
      setDialog(null);
      return null;
    } catch (err) {
      return errorMessage(err, "The item could not be saved. Check the image size, then try again.");
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
              {items.length === 0
                ? "Empty"
                : `${items.length} ${items.length === 1 ? "item" : "items"}`}
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
                    onChange={(changes) => handleUpdate(item, changes)}
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
                onClick={() => setDialog("picker")}
                className="c-btn c-btn--quiet"
              >
                <IconPlus size={15} />
                <span>Add to {title.toLowerCase()}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {dialog === "picker" ? (
        <Packlist_ItemPicker
          category={title}
          addedIds={items.map((item) => item._id)}
          onAdd={handlePick}
          onCreateOwn={() => setDialog("new-item")}
          onClose={() => setDialog(null)}
        />
      ) : null}

      {dialog === "new-item" ? (
        <Packlist_NewItem
          category={title}
          onClose={() => setDialog(null)}
          onSave={handleCreate}
        />
      ) : null}
    </div>
  );
}
