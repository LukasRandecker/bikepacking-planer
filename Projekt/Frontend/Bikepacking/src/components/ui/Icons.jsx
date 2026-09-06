/**
 * Icons drawn for this sheet, not imported from a library.
 *
 * One grammar, no exceptions: a 24-unit grid, 1.5 stroke, square caps, mitred
 * joins, straight segments only. Every off-the-shelf icon set rounds its caps
 * and joins, which is the one thing this design system does not do.
 */

const base = {
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "square",
  strokeLinejoin: "miter",
  "aria-hidden": "true",
  focusable: "false",
};

function Svg({ size = 20, title, children, ...rest }) {
  return (
    <svg
      {...base}
      {...rest}
      width={size}
      height={size}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : "true"}
      aria-label={title}
    >
      {children}
    </svg>
  );
}

/* The mark: the ridden line as a drafting polyline, nodes squared off. */
export const Mark = (p) => (
  <Svg {...p}>
    <path d="M2 19h6V10h6V5h6" />
    <path d="M1 18h2v2H1z" fill="currentColor" stroke="none" />
    <path d="M19 4h2v2h-2z" fill="currentColor" stroke="none" />
  </Svg>
);


export const IconUpload = (p) => (
  <Svg {...p}>
    <path d="M4 21h16" />
    <path d="M12 17V3" />
    <path d="m6 9 6-6 6 6" />
  </Svg>
);

export const IconDownload = (p) => (
  <Svg {...p}>
    <path d="M4 21h16" />
    <path d="M12 3v14" />
    <path d="m6 11 6 6 6-6" />
  </Svg>
);

export const IconTrash = (p) => (
  <Svg {...p}>
    <path d="M3 6h18" />
    <path d="M9 6V3h6v3" />
    <path d="m5 6 1 15h12l1-15" />
    <path d="M10 10v7M14 10v7" />
  </Svg>
);

export const IconLink = (p) => (
  <Svg {...p}>
    <path d="M14 3h7v7" />
    <path d="M21 3 11 13" />
    <path d="M18 14v7H3V6h7" />
  </Svg>
);

export const IconImage = (p) => (
  <Svg {...p}>
    <path d="M3 4h13v12H3z" />
    <path d="m3 13 4-4 3.5 3.5L14 9l2 2" />
    <path d="M18 14v7M14.5 17.5h7" />
  </Svg>
);

export const IconChevron = (p) => (
  <Svg {...p}>
    <path d="m5 9 7 7 7-7" />
  </Svg>
);

export const IconArrow = (p) => (
  <Svg {...p}>
    <path d="M3 12h17" />
    <path d="m14 6 6 6-6 6" />
  </Svg>
);

export const IconMail = (p) => (
  <Svg {...p}>
    <path d="M2 5h20v14H2z" />
    <path d="m2 5 10 8 10-8" />
  </Svg>
);

/* A figure built the only way this system builds anything: from straight cuts. */
export const IconAccount = (p) => (
  <Svg {...p}>
    <path d="M9 3h6v6H9z" />
    <path d="m3 21 4-8h10l4 8" />
  </Svg>
);

export const IconClose = (p) => (
  <Svg {...p}>
    <path d="m5 5 14 14M19 5 5 19" />
  </Svg>
);

export const IconMenu = (p) => (
  <Svg {...p}>
    <path d="M3 6h18M3 12h18M3 18h18" />
  </Svg>
);

export const IconCheck = (p) => (
  <Svg {...p}>
    <path d="m4 12 5.5 6L20 6" />
  </Svg>
);

/* Start over: a fresh sheet with its corner turned, and the plus that means a
   blank one. A round refresh spiral is the one shape this grammar cannot draw,
   so the action is named by what it produces instead. */
export const IconRedraw = (p) => (
  <Svg {...p}>
    <path d="M5 2h9l5 5v15H5z" />
    <path d="M14 2v5h5" />
    <path d="M12 12v6M9 15h6" />
  </Svg>
);

/* Searching the catalogue. The lens is squared off like everything else here. */
export const IconSearch = (p) => (
  <Svg {...p}>
    <path d="M4 4h11v11H4z" />
    <path d="M15 15l5 5" />
  </Svg>
);

export const IconPlus = (p) => (
  <Svg {...p}>
    <path d="M12 4v16M4 12h16" />
  </Svg>
);

/* Warning: the drawing's own revision triangle. */
export const IconAlert = (p) => (
  <Svg {...p}>
    <path d="M12 3 22 20H2z" />
    <path d="M12 10v5" />
    <path d="M11.25 17h1.5v1.5h-1.5z" fill="currentColor" stroke="none" />
  </Svg>
);

