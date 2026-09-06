import { createContext } from "react";

/**
 * Die Packliste, wie sie gerade auf dem Blatt steht.
 *
 * Steht allein in dieser Datei, weil eine Datei entweder Komponenten
 * exportiert oder etwas anderes — sonst verliert Fast Refresh beim Speichern
 * den Zustand (`react-refresh/only-export-components`). Der Provider liegt
 * daneben in `PacklistContext.jsx`, genau wie `UserContext` und `App.jsx`
 * getrennt sind.
 */
export const SetupItemsContext = createContext(null);
