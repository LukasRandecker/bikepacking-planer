/**
 * Der eine Schalter.
 *
 * `VITE_DEMO=true` heisst: es gibt keinen Server. Die App laeuft dann
 * vollstaendig im Browser — GPX lesen, Karte, Katalog, Packliste und
 * PDF-Export arbeiten echt, nur Konten, Speichern und Uploads fallen weg.
 * Alle Server-Aufrufe fangt der Adapter in `api.local.js` ab; die 29
 * Aufrufstellen merken davon nichts.
 *
 * Diese Konstante ist die einzige Stelle, an der die Frage gestellt wird.
 * Wer eine zwanzigste `import.meta.env`-Pruefung in eine Komponente schreibt,
 * hat den Schalter wieder verloren.
 */
export const DEMO = import.meta.env.VITE_DEMO === "true";

/**
 * Wohin der Demo-Streifen zeigt.
 *
 * Ohne diese beiden Links sieht eine Demo ohne einen einzigen Netzwerkaufruf
 * aus, als waere das Backend erfunden. Der Server liegt im Repo, die
 * OpenAPI-Beschreibung seiner Routen liegt als Datei daneben — beides ist
 * ohne laufenden Server pruefbar.
 */
export const REPO_URL = "https://github.com/LukasRandecker/bikepacking-planer";
export const API_SPEC_URL = "/openapi.json";
