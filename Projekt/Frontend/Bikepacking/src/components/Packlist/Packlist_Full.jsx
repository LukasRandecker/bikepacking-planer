import { useContext } from "react";

import SectionToolbar from "../SectionToolbar/SectionToolbar.jsx";
import Packlist_Group from "./Packlist_Group.jsx";
import { SetupItemsContext } from "../../Context/PacklistContext.jsx";

const CATEGORIES = [
  "Bike and Bags",
  "Camping Gear",
  "Clothing",
  "Hygiene",
  "Tools",
  "Other",
];

/** The schedule of parts: six fixed categories, each folding open on demand. */
function Packlist_Full() {
  const { itemsByCategory, activeSetupId, totalWeight } =
    useContext(SetupItemsContext);

  return (
    <section
      id="packlist"
      className="sheet-pad scroll-mt-16 border-t border-ink bg-field py-10 md:py-14"
    >
      <SectionToolbar mode="setup" />

      <div className="mt-8 border-t border-ink">
        {CATEGORIES.map((cat) => (
          <Packlist_Group
            key={cat}
            title={cat}
            items={itemsByCategory[cat] || []}
            listId={activeSetupId}
            totalWeight={totalWeight}
          />
        ))}
      </div>
    </section>
  );
}

export default Packlist_Full;
