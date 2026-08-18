# Design — Planblatt

<!-- impeccable:design-schema 1 -->

Recorded from the built frontend on 2026-08-18, not from intentions. The source
of truth is `Projekt/Frontend/Bikepacking/src/index.css`; this file explains it.

## The world

**A bikepacking setup is a drawing sheet.** Not a metaphor laid over the app —
the same document type. A tour has measured quantities (km, hm, g, €), a drawn
object (the GPX track), a schedule of parts (the packlist is literally what an
architectural drawing calls its parts list), a title block (name, dates, bike,
solo or group) and revisions (saved setups). The interface is that sheet.

What it refuses: the rounded card-grid product page the category ships, and its
predictable opposite, the dark surface with a neon accent.

Direction pinned by the brief (minimal architecture/studio branding; references
Rule Studio, Zenit, EYRC). Concept seed `2de63fb5`. The direction contract is an
HTML comment at the top of `index.html` and survives the production build.

## Ground rules

1. **Nothing is round.** `*, *::before, *::after { border-radius: 0 }` is a
   global reset, not a habit. There is no radius token to reach for.
2. **Cells abut and share edges.** Groups are `.c-cellgrid`: a 1px gap over an
   ink ground, so the "gap" is the rule. No gutters between cards, no shadows,
   no floating panels. The whole app contains zero `box-shadow` on content.
3. **Structure is drawn with hairlines.** `1px solid` in ink for structural
   edges, in `--color-rule` for subdivisions. Weight, not colour, ranks them.
4. **Every measured value is mono.** Grams, euros, kilometres, counts, file
   names, codes. Prose is never mono; mono is never decoration.
5. **Photographs are plates.** Framed, captioned, locked to the module,
   desaturated 28% at rest. Never a backdrop, never behind text, never bled.

## Colour

Restrained: black and white carry the surface, two earth tones carry meaning.
Contrast ratios are measured against the ground each token is used on.

| Token | Value | Role | Contrast |
|---|---|---|---|
| `--color-sheet` | `#ffffff` | the sheet | — |
| `--color-field` | `#f1f0ed` | recessed band (packlist section) | — |
| `--color-field-deep` | `#e6e4df` | the desk behind the sheet, ≥1761px | — |
| `--color-ink` | `#101010` | text, structural rules, reversed ground | 19.6:1 on sheet |
| `--color-ink-soft` | `#4a4a46` | body prose | 8.5:1 on sheet |
| `--color-ink-faint` | `#6e6e68` | labels, placeholders | 5.1:1 on sheet |
| `--color-rule` | `#d6d5d0` | subdivision hairline, hatch | — |
| `--color-clay` | `#606c38` | **active, primary action, the ridden line, the leading figure** | 5.7:1 on sheet |
| `--color-clay-light` | `#8fa06a` | the same role on ink | 6.7:1 on ink |
| `--color-olive` | `#754317` | **secondary series, confirmed state** | 8.2:1 on sheet |
| `--color-alarm` | `#8e1f14` | **errors only** | 8.9:1 on sheet |
| `--color-paper-soft` | `#b5b4ae` | secondary text on ink | 9.2:1 on ink |

Clay and olive are roles, never decoration: clay is what is active or leading,
olive is what is secondary or settled, alarm appears only on failure. Colour
never carries meaning alone — `Note` prints the tone word and a drawn mark too.

Recoloured 2026-08-18 against a reference plate (Dark Moss Green, Pakistan
Green, Cornsilk, Earth Yellow, Tiger's Eye): clay now carries moss green as
the primary accent, olive now carries the earth brown that clay used to
carry. The token names (`clay`, `olive`) stayed on their original roles —
active/primary stays `clay`, secondary/confirmed stays `olive` — only the
hex values swapped, so every `c-btn--clay`, `text-olive`, etc. usage in
components needed no change.

Light, not dark, and not by category: this is a planning surface used at a desk
in daylight, alongside paper.

## Type

Two families, both variable, both self-hosted from `src/assets/fonts/` with
their OFL licences beside them. Latin subset only: 90 KB + 38 KB.

- **Archivo** (Omnibus-Type) — weight 100–900, width 62–125% in one file.
  Structure and prose.
- **Martian Mono** (Evil Martian) — weight 100–800, width 75–112.5%.
  Every measured value.

| Class | Face | Setting |
|---|---|---|
| `.t-display` | Archivo | 600, width 115%, caps, `-0.03em`, lh 0.92, `clamp(1.875rem, 8.4vw, 4.5rem)`, from `lg` `clamp(2.5rem, 5vw, 4.5rem)`, **`white-space: nowrap`** |
| `.t-h1` | Archivo | 600, width 112%, caps, `-0.025em`, `clamp(1.75rem, 4.4vw, 3rem)` |
| `.t-h2` | Archivo | 600, width 110%, caps, `-0.018em`, `clamp(1.3125rem, 2.6vw, 1.875rem)` |
| `.t-h3` | Archivo | 600, width 106%, caps, `1.0625rem` |
| `.t-body` | Archivo | 400, max 68ch, lh 1.6, ink-soft |
| `.t-label` | Martian Mono | 500, width 87.5%, caps, `0.625rem`, `+0.14em` |
| `.t-figure` | Martian Mono | 500–600, width 87.5%, tabular-nums, `-0.02em` |

The display is `nowrap` on purpose: the three hero lines are three parallel
statements, and a phrase breaking mid-way turns them into six fragments. The
ramp flattens at `lg` because the headline then shares its row with the plate.
**Any change to the headline copy must be re-measured across 320–2560px.**

`.t-label` is only ever a label for an adjacent value in a title-block cell. It
is never an eyebrow above a heading — headings carry themselves.

## Layout

- `.sheet-shell` — `max-width: 110rem`, centred, white. Above 1761px it takes a
  1px ink border, so the sheet reads as paper on the `--color-field-deep` desk.
- `.sheet-pad` — `padding-inline: clamp(1.25rem, 4vw, 4.5rem)`.
- Sections are separated by `border-t border-ink`, never by margin.
- 12-column grids at `lg`; the hero splits 8/4, the planner 6/6 (7/5 at `xl`).
- Scroll rhythm on the home page: white sheet → white index → **ink** → field.
  One reversed plate per page, maximum.

## Components

All in `src/components/ui/`, all inside `@layer components` so Tailwind
utilities override them rather than losing to source order. **This matters**: a
plain rule after `@import "tailwindcss"` silently beats every utility.

| Piece | File | Notes |
|---|---|---|
| `Button` | `Controls.jsx` | mono caps; hover fill plotted left→right via `::before scaleX`; min 44px; `busy` renders "Working…" and disables |
| `Field` | `Controls.jsx` | label always rendered and linked; error gets `aria-invalid` + `aria-describedby` |
| `SegmentedChoice` | `Controls.jsx` | real radios as abutting cells; replaced every pill toggle and the native select |
| `RecordPicker` | `Controls.jsx` | radio list; the chosen row inverts to ink |
| `Note` | `Controls.jsx` | inline feedback; `role="alert"` for errors |
| `Modal` | `Modal.jsx` | focus trap, Escape, focus return, scroll lock, `aria-modal` |
| `SectionHead`, `Datum`, `MeasureBar`, `Plate`, `EmptyPlate`, `LoadingRows` | `Sheet.jsx` | the sheet's parts |
| Icons | `Icons.jsx` | authored SVG, 24-grid, 1.5 stroke, **square caps, mitred joins** |

Icons are drawn here rather than imported: every off-the-shelf set rounds its
caps and joins, which is the one thing this system does not do. `lucide-react`
was removed (it was imported in five files but never installed — the build was
broken before this).

## Materials

- `.m-grid` — 24px plotting grid. **Only** on empty drawing areas and drop
  zones: an empty region on a drawing is still drawn.
- `.m-hatch` — 45° hatch. The drawing convention for a field carrying no data:
  unwritten legal pages, missing product links, leftover grid cells, loading
  rows.
- `.m-plate` — the photo frame.
- `.c-bar` — a magnitude bar. Weight and distance are drawn to scale beside the
  figure, so 5,167 km *looks* ten times 500 km. Scales are fixed to the whole
  set, never the filtered subset.

## Motion — "plotter draw"

One grammar: lines arrive by being drawn from their origin. `plot-x` (scaleX
from the left), `plot-wipe` (clip-path inset), `plot-drop`, `plot-lift`.
Easing is `--ease-plot: cubic-bezier(0.16, 1, 0.3, 1)`; durations 140/260/560ms.

Nothing scales, nothing bounces, nothing fades in from invisible content.
Accordions animate `grid-template-rows: 0fr → 1fr`, never a guessed max-height.
`prefers-reduced-motion: reduce` collapses every duration to 0.01ms.

The one authored moment: the hero's three rules plot across on load, staggered
90ms apart.

## Browser surfaces

Themed, not left to the browser: selection (clay), caret (clay), scrollbar
(ink thumb on field, clay on hover), focus ring (`2px solid clay`, offset 2px;
`clay-light` inside `.on-ink`), underline offset `0.22em`, tabular numerals on
every figure.

## Beyond the screen

The PDF export (`src/lib/pdf.js`) is the same sheet. jsPDF cannot load woff2, so
it uses the closest pair it carries — Helvetica for labels, Courier for measured
values — with the same title block, the same rules, the same hierarchy, and a
drawn tick box per row.

`@media print` drops `.no-print` and whitens the ground.

## Rules for future work

1. No radius, anywhere, for any reason.
2. A new control gets a mono caps label and a 44px minimum, or it is not a
   control.
3. A new colour needs a role first. There is no "brand blue" slot.
4. Grouped content uses `.c-cellgrid`, not cards with gaps and shadows.
5. Empty and loading states are drawn (grid, hatch), never apologised for in
   grey italics.
6. New component CSS goes inside `@layer components`.
7. Icons are drawn to the 24-grid with square caps. Do not install an icon set.
8. Changing hero copy means re-measuring the headline at 320–2560px.
