import { Link } from "react-router-dom";
import { IconArrow } from "../components/ui/Icons.jsx";
import useDocumentTitle from "../lib/useDocumentTitle.js";
import { DEMO } from "../lib/demo.js";

function ErrorPage() {
  useDocumentTitle("Sheet not found");

  return (
    <section className="sheet-pad flex min-h-[60vh] flex-col justify-center py-14">
      <div className="grid lg:grid-cols-12">
        <div className="lg:col-span-7 lg:border-r lg:border-ink lg:pr-10">
          {/* `t-display` traegt `white-space: nowrap` — das ist der Vertrag
              der drei Hero-Zeilen auf der Startseite, hier aber falsch: „Sheet
              not found" ist laenger und schob die Seite bei 320px um 24px aus
              dem Bild. `t-h1` ist die Stufe fuer Ueberschriften, die umbrechen
              duerfen. */}
          <h1 className="t-h1 border-y border-ink py-3">Sheet not found</h1>
          <p className="t-body mt-6 text-[0.9375rem]">
            This route leads nowhere. The address may be mistyped, or the sheet
            behind it has not been drawn yet.
          </p>
          <Link to="/" className="c-btn c-btn--clay mt-8">
            <span>Back to the index</span>
            <IconArrow size={16} />
          </Link>
        </div>

        <div className="mt-10 lg:col-span-5 lg:mt-0 lg:pl-10">
          <div className="c-cellgrid grid-cols-2">
            <div className="c-cell">
              <span className="t-label">Status</span>
              <p className="t-figure mt-1.5 text-2xl font-semibold text-clay">
                404
              </p>
            </div>
            <div className="c-cell">
              <span className="t-label">Sheets that exist</span>
              {/* Im Demo-Modus gibt es das Kontoblatt nicht (siehe main.jsx) —
                  eine gezaehlte Seite, die 404 liefert, waere eine falsche
                  Zahl auf einer 404-Seite. */}
              <p className="t-figure mt-1.5 text-2xl font-semibold">
                {DEMO ? "02" : "03"}
              </p>
            </div>
            <div className="m-hatch col-span-2 h-24" aria-hidden="true" />
          </div>
        </div>
      </div>
    </section>
  );
}

export default ErrorPage;
