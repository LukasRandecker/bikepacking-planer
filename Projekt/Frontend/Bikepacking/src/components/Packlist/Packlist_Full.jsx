import { useState, useContext } from "react";
import axios from "axios";
import Headline_Up_download from "../Headline_Up-download/Headline_Up-download.jsx";
import Packlist_Group from "./Packlist_Group.jsx";

import { SetupItemsContext } from "../../Context/PacklistContext.jsx";

function Packlist_Full({ user, setUser }) {
  const [mode, setMode] = useState("setup");
  const { itemsByCategory, activeSetupId, setSetupItems, setActiveSetupId } = useContext(SetupItemsContext);

  const categories = [
    "Bike and Bags",
    "Camping Gear",
    "Clothing",
    "Hygiene",
    "Tools",
    "Other",
  ];

  const loadItemsFromItemlist = async (itemIds, setupId) => {
    if (!Array.isArray(itemIds)) {
      console.warn("loadItemsFromItemlist: keine Item IDs übergeben");
      return;
    }

    try {
      const items = await Promise.all(
        itemIds.map((id) =>
          axios
            .get(`http://localhost:3030/bikepacking/items/${id}`)
            .then((res) => res.data)
        )
      );

      //ChatGPT erweiterter Funktionsteil: Gruppieren der Items nach Kategorie
      const grouped = items.reduce((acc, item) => {
        if (!item?.Categorie) return acc;
        if (!acc[item.Categorie]) acc[item.Categorie] = [];
        acc[item.Categorie].push(item);
        return acc;
      }, {});

      setSetupItems(grouped, setupData._id);

      // aktive Setup-ID setzen
      if (setupId) setActiveSetupId(setupId);
    } catch (err) {
      console.error("Fehler beim Laden der Items", err);
    }
  };

  return (
    <div id="packlist" className="w-full py-6 px-6 md:px-20 bg-gray-100">
      <Headline_Up_download
        mode={mode}
        setMode={setMode}
        user={user}
        setUser={setUser}
        onLoadSetup={loadItemsFromItemlist}
      />

      {categories.map((cat) => (
        <Packlist_Group
          key={cat}
          title={cat}
          items={itemsByCategory[cat] || []}
          listId={activeSetupId} 
        />
      ))}
    </div>
  );
}

export default Packlist_Full;
