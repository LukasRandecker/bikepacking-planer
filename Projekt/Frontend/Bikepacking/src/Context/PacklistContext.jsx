import { createContext, useState, useCallback } from "react";

// Context erstellen
export const SetupItemsContext = createContext(null);

//provider
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
      }}
    >
      {children}
    </SetupItemsContext.Provider>
  );
};
