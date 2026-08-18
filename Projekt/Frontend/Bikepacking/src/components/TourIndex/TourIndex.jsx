import { useMemo, useState } from "react";
import { HashLink } from "react-router-hash-link";

import { SectionHead, Plate, MeasureBar, EmptyPlate } from "../ui/Sheet.jsx";
import { SegmentedChoice } from "../ui/Controls.jsx";
import { IconArrow } from "../ui/Icons.jsx";

/**
 * Reference tours. This is sample data — it is labelled as such on the sheet
 * rather than dressed up as a real catalogue, and it links nowhere, because
 * the setups behind these names do not exist yet.
 */
const REFERENCE_TOURS = [
  {
    id: 1,
    image: "/IMG/CardImage.webp",
    name: "Morocco",
    category: "BIKEPACKING",
    distanceKm: 500,
    elevationHm: 5089,
  },
  {
    id: 2,
    image: "/IMG/Kyrgistan.webp",
    name: "Kyrgyzstan",
    category: "MTB",
    distanceKm: 850,
    elevationHm: 10400,
  },
  {
    id: 3,
    image: "/IMG/Gravel.webp",
    name: "Across Germany",
    category: "GRAVEL",
    distanceKm: 1110,
    elevationHm: 6400,
  },
  {
    id: 4,
    image: "/IMG/Peak_Planes.webp",
    name: "Peak & Planes",
    category: "ROAD",
    distanceKm: 545,
    elevationHm: 6500,
  },
  {
    id: 5,
    image: "/IMG/RAAM.webp",
    name: "RAAM 2025",
    category: "RACE",
    distanceKm: 5167,
    elevationHm: 60684,
  },
];

const FILTERS = ["ALL", "MTB", "GRAVEL", "ROAD", "BIKEPACKING", "RACE"];

const num = (n) => n.toLocaleString("en-GB");

/** One measured row: the figure, and the same quantity drawn to scale. */
function Row({ label, value, unit, ratio, tone }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="t-label">{label}</span>
        <span className="t-figure text-sm font-semibold">
          {value}
          <span className="t-label ml-1">{unit}</span>
        </span>
      </div>
      <MeasureBar
        value={ratio.value}
        max={ratio.max}
        tone={tone}
        label={`${label}: ${value} ${unit}`}
      />
    </div>
  );
}

export default function TourIndex() {
  const [filter, setFilter] = useState("ALL");

  // Scales stay fixed to the whole set, so a bar means the same thing in every
  // filter — the point of drawing the quantity at all.
  const scale = useMemo(
    () => ({
      km: Math.max(...REFERENCE_TOURS.map((t) => t.distanceKm)),
      hm: Math.max(...REFERENCE_TOURS.map((t) => t.elevationHm)),
    }),
    []
  );

  const shown =
    filter === "ALL"
      ? REFERENCE_TOURS
      : REFERENCE_TOURS.filter((t) => t.category === filter);

  return (
    <section
      id="reference"
      className="sheet-pad border-t border-ink bg-sheet py-10 md:py-14"
    >
      <SectionHead
        title="Reference tours"
        meta={`${shown.length} of ${REFERENCE_TOURS.length} · Sample data`}
      />

      <div className="my-6 overflow-x-auto pb-1">
        <SegmentedChoice
          legend="Filter by discipline"
          name="tour-filter"
          value={filter}
          onChange={setFilter}
          options={FILTERS}
          accent
        />
      </div>

      {shown.length === 0 ? (
        <EmptyPlate
          title="Nothing filed under that discipline"
          body="The reference index only holds five tours so far. Clear the filter to see all of them."
          actions={
            <button
              type="button"
              className="c-btn c-btn--ghost"
              onClick={() => setFilter("ALL")}
            >
              Clear filter
            </button>
          }
        />
      ) : (
        <ul className="c-cellgrid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((tour) => (
            <li key={tour.id} className="flex flex-col">
              <div className="m-plate m-plate--live aspect-square w-full border-0 border-b border-ink">
                <img
                  src={tour.image}
                  alt={`${tour.name} — reference tour`}
                  loading="lazy"
                  decoding="async"
                />
              </div>

              <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="t-h3">{tour.name}</h3>
                  <span className="t-label t-label--clay">{tour.category}</span>
                </div>

                <div className="mt-auto flex flex-col gap-3">
                  <Row
                    label="Distance"
                    value={num(tour.distanceKm)}
                    unit="km"
                    ratio={{ value: tour.distanceKm, max: scale.km }}
                    tone="clay"
                  />
                  <Row
                    label="Climb"
                    value={num(tour.elevationHm)}
                    unit="m"
                    ratio={{ value: tour.elevationHm, max: scale.hm }}
                    tone="olive"
                  />
                </div>
              </div>
            </li>
          ))}
          {/* A drawing hatches the fields it has nothing to put in. */}
          {Array.from({ length: (3 - (shown.length % 3)) % 3 }).map((_, i) => (
            <li
              key={`blank-${i}`}
              aria-hidden="true"
              className="m-hatch hidden min-h-[12rem] xl:block"
            />
          ))}
          {shown.length % 2 === 1 ? (
            <li
              aria-hidden="true"
              className="m-hatch hidden min-h-[12rem] sm:block xl:hidden"
            />
          ) : null}
        </ul>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-ink pt-4">
        <p className="t-label max-w-md">
          Distances and climb are drawn to one shared scale across the index.
        </p>
        <HashLink smooth to="/overview#tour" className="c-btn c-btn--ghost">
          <span>Plan your own</span>
          <IconArrow size={16} />
        </HashLink>
      </div>
    </section>
  );
}
