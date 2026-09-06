import { Link } from "react-router-dom";
import { HashLink } from "react-router-hash-link";
import { Mark, IconMail } from "../ui/Icons.jsx";
import { DEMO } from "../../lib/demo.js";

const YEAR = new Date().getFullYear();

/**
 * The sheet's title block. It used to be a photograph under a black wash; a
 * drawing sheet ends in ruled fields instead, and the fields nobody has filled
 * in yet are hatched out rather than linked to pages that do not exist.
 */
function Footer() {
  return (
    <footer className="sheet-pad border-t border-ink bg-field">
      <div className="c-cellgrid my-10 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 lg:my-14">
        <div className="c-cell flex flex-col gap-3 bg-sheet!">
          <span className="flex items-center gap-2.5">
            <Mark size={20} />
            <span className="t-h3">Bikepacking</span>
          </span>
          <p className="t-label t-label--ink">Tour. Setup. Packlist.</p>
          <p className="text-sm leading-snug text-ink-soft">
            Plan the ride. Dial in the setup. Never forget a thing.
          </p>
        </div>

        <nav aria-label="Footer" className="c-cell flex flex-col gap-3">
          <span className="t-label">Sheets</span>
          <ul className="flex flex-col text-sm">
            <li>
              <Link to="/" className="flex min-h-11 items-center hover:text-clay">
                Home
              </Link>
            </li>
            <li>
              <HashLink smooth to="/overview#tour" className="flex min-h-11 items-center hover:text-clay">
                Tour
              </HashLink>
            </li>
            <li>
              <HashLink
                smooth
                to="/overview#packlist"
                className="flex min-h-11 items-center hover:text-clay"
              >
                Packlist
              </HashLink>
            </li>
            {DEMO ? null : (
              <li>
                <Link to="/user" className="flex min-h-11 items-center hover:text-clay">
                  Account
                </Link>
              </li>
            )}
          </ul>
        </nav>

        <div className="c-cell flex flex-col gap-3">
          <span className="t-label">Legal</span>
          <ul className="flex flex-col gap-2">
            {["Imprint", "Privacy policy", "Terms"].map((item) => (
              <li
                key={item}
                className="flex items-center justify-between gap-3 text-sm text-ink-faint"
              >
                <span>{item}</span>
                <span
                  aria-hidden="true"
                  className="m-hatch h-3 w-12 flex-none border border-rule"
                />
              </li>
            ))}
          </ul>
          <p className="t-label">
            {DEMO
              ? "Not written yet. This is a portfolio demo, not a service."
              : "Not written yet — this build is local only."}
          </p>
        </div>

        <div className="c-cell flex flex-col gap-3">
          <span className="t-label">Contact</span>
          <p className="flex items-center gap-2 text-sm">
            <IconMail size={16} />
            <span className="t-mono">contact@example.com</span>
          </p>
          <p className="t-label">Placeholder address, not monitored.</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-2 border-t border-ink py-4">
        <span className="t-label">
          Project · Bikepacking &nbsp;·&nbsp; Build ·{" "}
          {DEMO ? "Browser demo" : "Local"} &nbsp;·&nbsp; {YEAR}
        </span>
        <span className="t-label">
          {DEMO
            ? "The two tours on the index ship with this demo. Nothing is stored."
            : "Reference tours on this site are sample data."}
        </span>
      </div>
    </footer>
  );
}

export default Footer;
