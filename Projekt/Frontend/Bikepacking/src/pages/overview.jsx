import { useContext } from "react";
import { HashLink } from "react-router-hash-link";

import Tour_Full from "../components/Tour/Tour_Full.jsx";
import Packlist_Full from "../components/Packlist/Packlist_Full.jsx";
import { SetupItemsProvider } from "../Context/PacklistContext.jsx";
import { UserContext } from "../Context/UserContext.jsx";
import { DEMO } from "../lib/demo.js";
import useDocumentTitle from "../lib/useDocumentTitle.js";

/**
 * The working sheet. No photograph and no hero: the drawing area starts at the
 * fold, because everything on this page is a task.
 */
function OverviewPage() {
  const { user } = useContext(UserContext);
  useDocumentTitle(
    "Planner",
    "Load a GPX track, describe the tour and build the packing list beside it."
  );

  return (
    <>
      <div className="sheet-pad pb-6 pt-8">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 border-b border-ink pb-4">
          <h1 className="t-h1">Planner</h1>
          <nav aria-label="On this sheet" className="flex items-center gap-5">
            <HashLink
              smooth
              to="/overview#tour"
              className="t-label t-label--ink inline-flex min-h-11 min-w-11 items-center justify-center"
            >
              Tour
            </HashLink>
            <span aria-hidden="true" className="h-3 w-px bg-rule" />
            <HashLink
              smooth
              to="/overview#packlist"
              className="t-label t-label--ink inline-flex min-h-11 min-w-11 items-center justify-center"
            >
              Packlist
            </HashLink>
            <span aria-hidden="true" className="h-3 w-px bg-rule" />
            <span className="t-label">
              {DEMO ? "Demo · nothing saved" : user ? "Signed in" : "Not signed in"}
            </span>
          </nav>
        </div>
      </div>

      <SetupItemsProvider>
        <Tour_Full />
        <Packlist_Full />
      </SetupItemsProvider>
    </>
  );
}

export default OverviewPage;
