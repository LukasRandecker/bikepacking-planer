import { createContext } from "react";

import { EMPTY } from "./tourFormEmpty.js";

/**
 * Das Tourblatt: Name, Zeitraum, Radtyp, Schlafaufbau, Art und Modus.
 *
 * Nur das Context-Objekt — der Provider liegt in `TourFormProvider.jsx`, der
 * leere Ausgangszustand in `tourFormEmpty.js`. Eine Datei, die Komponenten
 * und anderes zugleich exportiert, bricht Fast Refresh
 * (`react-refresh/only-export-components`).
 */
export const TourFormContext = createContext({
  ...EMPTY,
  setTourData: () => {},
  resetTourForm: () => {},
});
