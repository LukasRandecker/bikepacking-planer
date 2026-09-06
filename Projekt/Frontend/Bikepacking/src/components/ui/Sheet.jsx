import { useState } from "react";

import NoImage from "../../assets/NoImage.jpg";

/**
 * The parts a drawing sheet is made of. Cells abut and share hairline edges;
 * nothing floats, nothing is shadowed, nothing has a corner radius.
 */

/**
 * A section's heading with its metadata pinned to the far edge, the way a
 * drawing labels a view. The heading carries itself; the mono text beside it is
 * data about the view, not a decorative kicker above it.
 */
export function SectionHead({ as = "h2", title, meta, action, className = "" }) {
  const Tag = as;
  return (
    <div
      className={`flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-ink pb-3 ${className}`}
    >
      <Tag className="t-h2 min-w-0">{title}</Tag>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        {meta ? <span className="t-label">{meta}</span> : null}
        {action}
      </div>
    </div>
  );
}

/** A title-block cell: the field name above, the measured value below. */
export function Datum({ label, value, unit, tone = "ink", size = "md" }) {
  const fg =
    tone === "clay"
      ? "text-clay"
      : tone === "olive"
        ? "text-olive"
        : tone === "paper"
          ? "text-paper"
          : "text-ink";

  return (
    <div className="c-cell flex flex-col justify-between gap-2">
      <span className={`t-label ${tone === "paper" ? "t-label--paper" : ""}`}>
        {label}
      </span>
      <span className="flex items-baseline gap-1.5">
        <span
          className={`t-figure ${size === "lg" ? "t-figure--lg" : "text-base font-semibold"} ${fg}`}
        >
          {value}
        </span>
        {unit ? <span className="t-label">{unit}</span> : null}
      </span>
    </div>
  );
}

/**
 * A quantity drawn to scale beside its figure. Reading that one tour is ten
 * times another is the point; a column of numbers alone does not deliver it.
 */
export function MeasureBar({ value, max, tone = "clay", label }) {
  const ratio = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  const fill =
    tone === "olive"
      ? "c-bar__fill--olive"
      : tone === "ink"
        ? "c-bar__fill--ink"
        : "";

  return (
    <div
      className="c-bar"
      role="img"
      aria-label={label ?? `${value} of ${max}`}
    >
      <div
        className={`c-bar__fill ${fill}`}
        style={{ width: `${ratio * 100}%` }}
      />
    </div>
  );
}

/**
 * A photograph, locked to the module and framed like a plate in a monograph.
 * The caption is part of the plate, not a tooltip.
 */
export function Plate({
  src,
  srcSet,
  sizes,
  width,
  height,
  alt,
  caption,
  ratio = "4 / 3",
  frameClassName = "",
  live = false,
  priority = false,
  className = "",
}) {
  return (
    <figure className={`flex flex-col ${className}`}>
      <div
        className={`m-plate ${live ? "m-plate--live" : ""} w-full ${frameClassName}`}
        style={frameClassName ? undefined : { aspectRatio: ratio }}
      >
        <img
          src={src || NoImage}
          // Ohne `srcSet` bekam jedes Handy die 2222px-Fassung: 263 kB fuer
          // eine 370px breite Flaeche, und damit den langsamsten LCP der Seite.
          srcSet={src && srcSet ? srcSet : undefined}
          sizes={src && srcSet ? sizes : undefined}
          width={width}
          height={height}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : undefined}
          decoding={priority ? "sync" : "async"}
          onError={(e) => {
            if (e.currentTarget.src !== NoImage) e.currentTarget.src = NoImage;
          }}
        />
      </div>
      {caption ? (
        <figcaption className="t-label border-x border-b border-ink px-2.5 py-2">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

/**
 * The picture of one item — or the black rectangle that stands in for it while
 * the catalogue has no photographs. Not a grey box with a question mark: the
 * slot is drawn as filled, so a row keeps its shape once real photographs
 * arrive and nothing on the sheet shifts.
 */
export function ItemThumb({ src, alt = "", className = "" }) {
  const [failed, setFailed] = useState(false);
  const usable = src && !failed;

  return (
    <div className={`m-plate flex-none border-rule ${className}`}>
      {usable ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          className="object-contain"
          onError={() => setFailed(true)}
        />
      ) : (
        <span
          aria-hidden="true"
          className="block h-full w-full bg-ink"
          title="No photograph yet"
        />
      )}
    </div>
  );
}

/**
 * An empty region on a drawing is still drawn: gridded paper, the reason it is
 * empty, and the actions that fill it. Never a shrug in grey italics.
 */
export function EmptyPlate({ title, body, actions, className = "" }) {
  return (
    <div
      className={`m-grid flex min-h-full flex-col items-center justify-center gap-4 border border-dashed border-ink/40 px-6 py-12 text-center ${className}`}
    >
      <div className="max-w-sm">
        <p className="t-h3 mb-2">{title}</p>
        <p className="text-sm leading-snug text-ink-soft">{body}</p>
      </div>
      {actions ? (
        <div className="flex flex-wrap justify-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}

/**
 * Wie ein Item benannt wird: der Gegenstand, dann die Marke.
 *
 * "Oberrohrtasche · Cyclite" — die Marke steht hinter dem Namen, weil sie die
 * zweite Frage beantwortet, nicht die erste. Wo keine Marke hinterlegt ist
 * (Perso, Schlüssel, Bargeld), steht auch kein Trenner.
 */
export function ItemName({ name, brand, className = "" }) {
  return (
    <span className={`truncate ${className}`}>
      {name}
      {brand ? (
        <>
          <span aria-hidden="true" className="text-ink-soft"> · </span>
          <span className="font-normal text-ink-soft">{brand}</span>
        </>
      ) : null}
    </span>
  );
}

/**
 * A region of the sheet that cannot be filled in yet, because it writes to an
 * account and there is none.
 *
 * The fields stay visible — hiding them would hide what the account is *for* —
 * but they are hatched over and taken out of the tab order, and the hatch
 * itself is the button that asks for the login. Clicking anywhere in the
 * region says why, which is what someone reaching for a field expects.
 */
export function LockedRegion({ locked, title, body, action = "Log in", onUnlock, children }) {
  if (!locked) return children;

  return (
    <div className="relative">
      {/* `inert` keeps the covered fields off the keyboard path, so Tab cannot
          land in a form that has nowhere to save to. */}
      <div inert={true} className="pointer-events-none opacity-40">
        {children}
      </div>

      <button
        type="button"
        onClick={onUnlock}
        className="m-hatch absolute inset-0 flex flex-col items-center justify-center gap-2 border border-dashed border-ink/50 bg-sheet/75 px-6 py-8 text-center backdrop-blur-[1px] transition-colors duration-150 hover:bg-sheet/60 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-clay"
      >
        <span className="t-h3">{title}</span>
        <span className="max-w-sm text-sm leading-snug text-ink-soft">{body}</span>
        <span aria-hidden="true" className="c-btn c-btn--clay mt-2">
          <span>{action}</span>
        </span>
      </button>
    </div>
  );
}

/**
 * Skeleton rows for a loading table. Hatch, not a shimmer: on a drawing sheet
 * a region whose data has not arrived is hatched out.
 */
export function LoadingRows({ rows = 3, className = "" }) {
  return (
    <div className={`flex flex-col gap-px ${className}`} aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="m-hatch h-14 border border-rule" />
      ))}
    </div>
  );
}
