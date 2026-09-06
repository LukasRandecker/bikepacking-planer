import { IconLink } from "../ui/Icons.jsx";
import { API_SPEC_URL, REPO_URL } from "../../lib/demo.js";

/**
 * Der Demo-Streifen.
 *
 * Auf der Portfolio-Seite steht bei diesem Projekt "Full-Stack · React,
 * Express, MongoDB". Wer hier die Entwicklerwerkzeuge aufmacht und null
 * Netzwerkanfragen sieht, haelt das Backend fuer eine Behauptung — und das
 * waere schlechter als gar kein Link. Also steht es auf der Seite, sichtbar
 * und auf jeder Route, nicht in einem Aufklapper.
 *
 * Die beiden Links sind der Beleg: der Server-Code und die
 * OpenAPI-Beschreibung seiner 22 Routen, erzeugt aus denselben Kommentaren,
 * aus denen der laufende Server seine Swagger-Oberflaeche baut.
 */
export default function DemoNotice() {
  return (
    <aside
      aria-label="About this build"
      className="sheet-pad border-b border-ink bg-field py-4"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
        <div className="flex flex-col gap-1.5 lg:flex-row lg:items-baseline lg:gap-5">
          <span className="t-label t-label--ink flex-none">
            Demo mode · No server
          </span>
          <p className="max-w-[62ch] text-sm leading-snug text-ink-soft">
            This build runs entirely in your browser: no account, no server,
            nothing leaves this device. The full Express and MongoDB backend is
            in the repository.
          </p>
        </div>

        <div className="flex flex-none flex-wrap gap-2">
          <a
            className="c-btn c-btn--quiet no-underline"
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
          >
            <span>Source code</span>
            <IconLink size={14} />
          </a>
          <a
            className="c-btn c-btn--quiet no-underline"
            href={API_SPEC_URL}
            target="_blank"
            rel="noreferrer"
          >
            <span>API reference</span>
            <IconLink size={14} />
          </a>
        </div>
      </div>
    </aside>
  );
}
