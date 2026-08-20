import { useSyncExternalStore } from "react";

/**
 * Wie viele Spalten das Kachelraster gerade hat.
 *
 * Die Breakpoints stehen hier doppelt — einmal als Tailwind-Klasse am Raster,
 * einmal als Media Query hier. Das ist der Preis dafür, die Kachelzahl an die
 * Spaltenzahl koppeln zu können; wer die Klassen am Raster ändert, ändert die
 * Werte hier mit.
 *
 *   < 640px   1 Spalte
 *   >= 640px  2 Spalten  (Tailwind `sm`)
 *   >= 1280px 3 Spalten  (Tailwind `xl`)
 */
const QUERIES = [
  { columns: 3, query: "(min-width: 1280px)" },
  { columns: 2, query: "(min-width: 640px)" },
];

const read = () => {
  if (typeof window === "undefined" || !window.matchMedia) return 3;
  const hit = QUERIES.find(({ query }) => window.matchMedia(query).matches);
  return hit ? hit.columns : 1;
};

const subscribe = (onChange) => {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};

  const lists = QUERIES.map(({ query }) => window.matchMedia(query));
  lists.forEach((list) => list.addEventListener("change", onChange));

  // Zweites Signal: `change` auf einer MediaQueryList ist das genauere
  // Ereignis, aber nicht überall verlässlich (ältere Safari-Versionen kennen
  // addEventListener darauf nicht). `resize` feuert in jedem Fall; doppelte
  // Meldungen kosten nichts, weil useSyncExternalStore nur bei geändertem
  // Wert neu rendert.
  window.addEventListener("resize", onChange);

  return () => {
    lists.forEach((list) => list.removeEventListener("change", onChange));
    window.removeEventListener("resize", onChange);
  };
};

export default function useGridColumns() {
  return useSyncExternalStore(subscribe, read, () => 3);
}

/**
 * Die größte Kachelzahl, die bei `columns` Spalten aufgeht und `max` nicht
 * überschreitet — damit die letzte Zeile voll ist und das Raster nicht
 * angebrochen endet.
 */
export function fullRows(columns, max = 10) {
  return Math.max(columns, Math.floor(max / columns) * columns);
}
