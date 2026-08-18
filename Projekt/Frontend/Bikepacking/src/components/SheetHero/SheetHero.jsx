import { HashLink } from "react-router-hash-link";
import { Plate } from "../ui/Sheet.jsx";
import { IconArrow } from "../ui/Icons.jsx";

const LINES = [
  { text: "Your tour.", gloss: "GPX in" },
  { text: "Your setup.", gloss: "Bike · sleep · style" },
  { text: "Your packlist.", gloss: "Grams · euros" },
];

/**
 * The first viewport, and the thesis: a sheet, not a hero image.
 *
 * The three lines are the three steps of the job, each on its own ruled row
 * with the mono gloss naming what that step actually takes. The photograph
 * sits beside them as a framed plate. The title block along the bottom answers
 * what / in / out and holds the one primary action.
 */
export default function SheetHero({ imagePath, plateCaption }) {
  return (
    <section className="sheet-pad">
      <div className="grid lg:grid-cols-12">
        <div className="py-8 md:py-12 lg:col-span-8 lg:border-r lg:border-ink lg:pr-10">
          <h1 className="t-display">
            {LINES.map(({ text, gloss }, i) => (
              <span
                key={text}
                className={`a-wipe a-d${i + 1} flex items-end justify-between gap-4 border-b border-ink py-2.5 first:border-t md:py-3.5`}
              >
                <span>{text}</span>
                <span className="t-label hidden whitespace-nowrap pb-1.5 sm:block md:pb-2.5">
                  {gloss}
                </span>
              </span>
            ))}
          </h1>

          <p className="t-body mt-6 text-[0.9375rem] md:mt-8">
            Route planners plan routes. This one plans what goes on the bike:
            load a GPX track, describe the tour beside it, and build the packing
            list against real grams and real euros.
          </p>
        </div>

        <div className="pb-8 lg:col-span-4 lg:py-12 lg:pl-10">
          <Plate
            src={imagePath}
            alt="A loaded bikepacking rig on a gravel road"
            caption={plateCaption}
            frameClassName="aspect-[16/9] sm:aspect-[2/1] lg:aspect-[4/5]"
            priority
            live
          />
        </div>
      </div>

      <div className="c-cellgrid mb-10 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 lg:mb-14">
        <div className="c-cell">
          <span className="t-label">What this is</span>
          <p className="mt-1.5 text-sm leading-snug">
            A planning sheet for bikepacking setups.
          </p>
        </div>
        <div className="c-cell">
          <span className="t-label">Goes in</span>
          <p className="mt-1.5 text-sm leading-snug">
            A GPX track from any route planner.
          </p>
        </div>
        <div className="c-cell">
          <span className="t-label">Comes out</span>
          <p className="mt-1.5 text-sm leading-snug">
            A weighed packing list, printable as PDF.
          </p>
        </div>
        <HashLink
          smooth
          to="/overview#tour"
          className="group relative flex min-h-[5rem] items-center justify-between gap-3 bg-clay px-4 py-5 text-paper no-underline transition-colors duration-200 hover:bg-ink focus-visible:bg-ink"
        >
          <span className="t-label text-paper">Start planning</span>
          <IconArrow size={22} />
        </HashLink>
      </div>
    </section>
  );
}
