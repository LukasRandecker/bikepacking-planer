import { useEffect } from "react";

const SUFFIX = "Bikepacking";

/** Gives every route its own <title>, which client-side routing otherwise eats. */
export default function useDocumentTitle(title, description) {
  useEffect(() => {
    document.title = title ? `${title} — ${SUFFIX}` : SUFFIX;

    if (!description) return;
    const tag = document.querySelector('meta[name="description"]');
    if (tag) tag.setAttribute("content", description);
  }, [title, description]);
}
