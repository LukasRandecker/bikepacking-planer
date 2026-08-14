import { useState, useEffect, useContext } from "react";
import { ChevronDown } from "lucide-react";
import Packlist_Item from "./Packlist_Item.jsx";
import Packlist_NewItem from "./Packlist_NewItem.jsx";

import { SetupItemsContext } from "../../Context/PacklistContext.jsx";

export default function Packlist_Group({ title, items, listId }) {
  const [open, setOpen] = useState(false);
  const [showNewItem, setShowNewItem] = useState(false);
  const { removeItem, updateItem, addItem } = useContext(SetupItemsContext);

  useEffect(() => {
    if ((items || []).length > 0) setOpen(true);
  }, [items]);

  const handleRemoveFromList = async (itemId, listId, title) => {
    const payload = { listId, itemId };
    try {
      const delResponse = await fetch(
        `http://localhost:3030/bikepacking/itemlists/remove-item`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      removeItem(title, itemId);
    } catch (err) {
      console.error("Error removing item:", err);
    }
  };

  const handleUpdateItem = async (category, itemId, changes) => {
    updateItem(category, itemId, changes);
    try {
      const res = await fetch(
        `http://localhost:3030/bikepacking/items/${itemId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(changes),
        }
      );
      if (!res.ok) throw new Error("Fehler beim Aktualisieren des Items");
    } catch (error) {
      console.error("Error updating item:", error);
    }
  };

//komplett chatGPT
  async function uploadImage(file) {
    const formData = new FormData();
    formData.append("image", file);
    const res = await fetch("http://localhost:3030/bikepacking/uploadImage", {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error("Bild Upload fehlgeschlagen");
    const data = await res.json();
    return data.path;
  }

  const handleAddNew = () => setShowNewItem(true);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-3 text-left"
      >
        <span className="flex items-center gap-2 text-lg font-semibold">
          {title}
          <ChevronDown
            className={`transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          />
        </span>
      </button>

      <div
          className={`transition-all duration-300 ${
            open ? " opacity-100" : "max-h-0 opacity-0"
          } overflow-auto`}
        >

        <div className="space-y-10 lg:space-y-5">
          {items.map((item) => (
            <Packlist_Item
              key={item._id}
              {...item}
              onDelete={() => handleRemoveFromList(item._id, listId, title)}
              onChange={(changes) => handleUpdateItem(title, item._id, changes)}
            />
          ))}
        </div>

        <div className="my-4 flex justify-center max-w-md lg:max-w-4xl">
          <button
            onClick={handleAddNew}
            className="p-2 bg-black text-white rounded-xl text-sm hover:bg-white hover:text-black hover:border border-solid uppercase"
          >
            Add new
          </button>
        </div>
      </div>

      {showNewItem && (
        <Packlist_NewItem
          onClose={() => setShowNewItem(false)}
          onSave={async (newItem) => {
            try {
              const imagePath = await uploadImage(newItem.imageFile);
              const payload = {
                Categorie: title,
                IMG: imagePath,
                Itemname: newItem.item,
                Link: newItem.productLink,
                Weight: Number(newItem.weight),
                Price: Number(newItem.price),
              };
              const res = await fetch(
                "http://localhost:3030/bikepacking/items",
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(payload),
                }
              );
              if (!res.ok) throw new Error("Item Upload fehlgeschlagen");
              const data = await res.json();

              addItem(title, data);
              setShowNewItem(false);
            } catch (err) {
              console.error(err);
            }
          }}
        />
      )}
    </div>
  );
}
