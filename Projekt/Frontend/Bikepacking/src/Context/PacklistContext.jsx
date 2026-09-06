import { useState, useCallback } from "react";

import { SetupItemsContext } from "./SetupItemsContext.jsx";

/**
 * Haelt die Packliste des Tourblatts. Das Context-Objekt selbst liegt in
 * `SetupItemsContext.jsx` — diese Datei exportiert nur den Provider.
 */
export const SetupItemsProvider = ({ children }) => {
  const [itemsByCategory, setItemsByCategory] = useState({});
  const [activeSetupId, setActiveSetupId] = useState("");
  const [totalWeight, setTotalWeight] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);

  const recalculateTotals = useCallback((itemsByCategory) => {
  let weight = 0;
  let price = 0;

  Object.values(itemsByCategory).forEach((items) => {
    items.forEach((item) => {
      weight += Number(item?.Weight || 0);
      price += Number(item?.Price || 0);
    });
  });

  setTotalWeight(weight);
  setTotalPrice(price);
}, []);


// einzelnes Item aktualisieren
const updateItem = useCallback((category, itemId, updates) => {
  setItemsByCategory((prev) => {
    const updated = {
      ...prev,
      [category]: prev[category].map((item) =>
        item._id === itemId ? { ...item, ...updates } : item
      ),
    };

    recalculateTotals(updated);
    return updated;
  });
}, [recalculateTotals]);



// ein einzelnes Item hinzufügen + SessionStorage
const addItem = useCallback((category, newItem) => {
  setItemsByCategory((prev) => {
    const updated = {
      ...prev,
      [category]: prev[category] ? [...prev[category], newItem] : [newItem],
    };

    recalculateTotals(updated);
    return updated;
  });

  // SessionStorage 
  try {
    const stored = sessionStorage.getItem("addedItems");
    const addedItems = stored ? JSON.parse(stored) : [];

    if (newItem?._id) {
      addedItems.push(newItem._id);
      sessionStorage.setItem("addedItems", JSON.stringify(addedItems));
    }
  } catch (err) {
    console.error("SessionStorage addItem error:", err);
  }
}, [recalculateTotals]);


// einzelnes Item löschen
const removeItem = useCallback((category, itemId) => {
  setItemsByCategory((prev) => {
    const updated = {
      ...prev,
      [category]: prev[category].filter((item) => item._id !== itemId),
    };

    recalculateTotals(updated);
    return updated;
  });
}, [recalculateTotals]);


  /**
   * Zurück auf eine leere Packliste.
   *
   * Nur die Anzeige — ein gespeichertes Setup bleibt auf dem Konto. Die
   * aktive Setup-Id fällt mit weg, damit das nächste Speichern nach einem
   * Namen fragt statt das alte Setup zu überschreiben.
   */
  const clearSetup = useCallback(() => {
    setItemsByCategory({});
    setActiveSetupId("");
    setTotalWeight(0);
    setTotalPrice(0);
    try {
      sessionStorage.removeItem("addedItems");
    } catch {
      // Ohne SessionStorage ist die Liste trotzdem leer.
    }
  }, []);

  // Setup setzen
  const setSetupItems = useCallback((groupedItems, setupId = "") => {
    setItemsByCategory(groupedItems); // itemsByCategory komplett überschreiben
    setActiveSetupId(setupId); // aktive Setup-ID setzen
    recalculateTotals(groupedItems);
  }, [recalculateTotals]);



  return (
    <SetupItemsContext.Provider
      value={{
        itemsByCategory,
        activeSetupId,
        setActiveSetupId, // nur für direkte Änderung der ID

        totalPrice, 
        totalWeight,

        // Actions
        updateItem, // Einzelitem aktualisieren
        removeItem, // Einzelitem löschen
        setSetupItems,
        addItem, // Einzelitem hinzufügen
        clearSetup, // Blatt leeren, ohne serverseitig zu löschen
      }}
    >
      {children}
    </SetupItemsContext.Provider>
  );
};
