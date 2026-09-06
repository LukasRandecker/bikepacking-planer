import { useContext } from "react";

import SectionToolbar from "../SectionToolbar/SectionToolbar.jsx";
import Packlist_Group from "./Packlist_Group.jsx";
import { LockedRegion } from "../ui/Sheet.jsx";
import { SetupItemsContext } from "../../Context/SetupItemsContext.jsx";
import { UserContext } from "../../Context/UserContext.jsx";
import { DEMO } from "../../lib/demo.js";

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
  const { user, requireLogin } = useContext(UserContext);

  return (
    <section
      id="packlist"
      className="sheet-pad scroll-mt-16 border-t border-ink bg-field py-10 md:py-14"
    >
      <SectionToolbar mode="setup" />

      <LockedRegion
        locked={!DEMO && !user}
        title="Log in to build a packlist"
        body="Gear is picked from the shared catalogue and saved as a setup on your account. The catalogue is right here — the login is what gives it somewhere to save to."
        onUnlock={() => requireLogin("Log in to build and save a packlist.")}
      >
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
      </LockedRegion>
    </section>
  );
}

export default Packlist_Full;
