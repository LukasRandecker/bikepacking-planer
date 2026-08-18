import { HashLink } from "react-router-hash-link";
import { IconArrow } from "../ui/Icons.jsx";

/**
 * Sample rows, clearly labelled as such on the sheet. Real gear names with
 * plausible figures — nothing here claims to be a user's stored data.
 */
const SAMPLE = [
  { name: "Tarp shelter", g: 620, eur: 189.0 },
  { name: "Sleeping bag, 0 °C", g: 890, eur: 249.0 },
  { name: "Frame bag, 6 L", g: 340, eur: 119.0 },
  { name: "Stove and pot", g: 285, eur: 74.5 },
];

const HEAVIEST = Math.max(...SAMPLE.map((r) => r.g));
const TOTAL_G = SAMPLE.reduce((s, r) => s + r.g, 0);
const TOTAL_EUR = SAMPLE.reduce((s, r) => s + r.eur, 0);

const nf = (n, d = 0) =>
  n.toLocaleString("en-GB", { minimumFractionDigits: d, maximumFractionDigits: d });

/**
 * The one reversed plate on the page: a drawing printed as a negative. Same
 * grid, same rules, same type — the ground inverts and nothing else does.
 *
 * The right column shows the schedule itself rather than a photograph of one.
 * The product's proof is that every line carries a weight; a picture cannot
 * make that argument, and the live rows can.
 */
export default function CTA() {
  return (
    <section className="on-ink sheet-pad border-t border-ink bg-ink text-paper">
      <div className="grid gap-y-10 py-10 md:py-16 lg:grid-cols-12 lg:gap-x-12">
        <div className="flex flex-col gap-8 lg:col-span-6">
          <div>
            <h2 className="t-h1">Put the load on paper</h2>
            <p className="mt-5 max-w-[46ch] text-[0.9375rem] leading-relaxed text-paper-soft">
              Load a track, pick the bike and the sleep setup, then add gear
              until the total stops surprising you. Weight and price add up as
              you go, and the finished setup prints as a checklist you can tick
              off beside the bike.
            </p>
          </div>

          <div className="c-cellgrid c-cellgrid--ink grid-cols-1 border-rule-dark sm:grid-cols-3">
            <div className="c-cell">
              <span className="t-label t-label--paper">Step one</span>
              <p className="mt-1.5 text-sm leading-snug">Upload the GPX</p>
            </div>
            <div className="c-cell">
              <span className="t-label t-label--paper">Step two</span>
              <p className="mt-1.5 text-sm leading-snug">Describe the tour</p>
            </div>
            <div className="c-cell">
              <span className="t-label t-label--paper">Step three</span>
              <p className="mt-1.5 text-sm leading-snug">Weigh the gear</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <HashLink
              smooth
              to="/overview#tour"
              className="c-btn c-btn--clay border-clay"
            >
              <span>Open the planner</span>
              <IconArrow size={16} />
            </HashLink>
            <p className="t-label t-label--paper max-w-[28ch]">
              Saving, loading and GPX upload need an account.
            </p>
          </div>
        </div>

        <div className="lg:col-span-6">
          <div className="border border-rule-dark">
            <div className="flex items-center justify-between gap-4 border-b border-rule-dark px-3 py-2.5">
              <span className="t-label text-paper">Camping gear</span>
              <span className="t-label t-label--paper">Sample schedule</span>
            </div>

            <ul>
              {SAMPLE.map((row) => (
                <li
                  key={row.name}
                  className="flex flex-col gap-2 border-b border-rule-dark px-3 py-3.5"
                >
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="min-w-0 truncate text-sm">{row.name}</span>
                    <span className="flex flex-none items-baseline gap-4">
                      <span className="t-figure text-sm text-paper">
                        {nf(row.g)}
                        <span className="t-label t-label--paper ml-1">g</span>
                      </span>
                      <span className="t-figure w-[5.5rem] text-right text-sm text-paper-soft">
                        {nf(row.eur, 2)}
                      </span>
                    </span>
                  </div>
                  <div className="c-bar bg-rule-dark">
                    <div
                      className="c-bar__fill"
                      style={{ width: `${(row.g / HEAVIEST) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex items-baseline justify-between gap-4 px-3 py-3.5">
              <span className="t-label text-paper">Total</span>
              <span className="flex flex-none items-baseline gap-4">
                <span className="t-figure text-base font-semibold text-clay-light">
                  {nf(TOTAL_G)}
                  <span className="t-label t-label--paper ml-1">g</span>
                </span>
                <span className="t-figure w-[5.5rem] text-right text-base font-semibold text-paper">
                  {nf(TOTAL_EUR, 2)}
                </span>
              </span>
            </div>
          </div>

          <p className="t-label t-label--paper mt-3">
            One of the six categories, shown as it appears on the sheet.
            Bars scale to the heaviest item in the group.
          </p>
        </div>
      </div>
    </section>
  );
}
