import { useEffect, useId, useRef } from "react";
import { IconClose } from "./Icons.jsx";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * A dialog on the sheet: an ink scrim, a white panel ruled like a title block,
 * a header strip, the body, and an action strip pinned to the bottom edge.
 *
 * Escape closes it, Tab cannot leave it, and focus returns to whatever opened
 * it — the three things the previous popups did not do.
 */
export default function Modal({
  onClose,
  title,
  code,
  children,
  footer,
  width = "narrow",
}) {
  const panelRef = useRef(null);
  const openerRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    openerRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    const panel = panelRef.current;
    const first = panel?.querySelector(FOCUSABLE);
    (first ?? panel)?.focus();

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panel) return;

      const items = [...panel.querySelectorAll(FOCUSABLE)].filter(
        (el) => el.offsetParent !== null
      );
      if (items.length === 0) {
        e.preventDefault();
        return;
      }

      const edge = e.shiftKey ? items[0] : items[items.length - 1];
      if (document.activeElement === edge || !panel.contains(document.activeElement)) {
        e.preventDefault();
        (e.shiftKey ? items[items.length - 1] : items[0]).focus();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.body.style.overflow = overflow;
      openerRef.current?.focus?.();
    };
  }, [onClose]);

  const maxWidth = width === "wide" ? "max-w-2xl" : "max-w-md";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-ink/80 p-0 sm:items-center sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`a-drop w-full ${maxWidth} border border-ink bg-sheet outline-none`}
      >
        <div className="flex items-stretch justify-between border-b border-ink">
          <div className="flex min-w-0 flex-col justify-center px-4 py-3">
            {code ? <span className="t-label">{code}</span> : null}
            <h2 id={titleId} className="t-h3 truncate">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="c-btn c-btn--ghost c-btn--icon flex-none self-stretch border-0 border-l border-ink"
          >
            <IconClose size={18} />
          </button>
        </div>

        <div className="p-4 sm:p-5">{children}</div>

        {footer ? (
          <div className="border-t border-ink p-4 sm:px-5">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}
