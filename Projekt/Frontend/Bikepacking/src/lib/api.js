import axios from "axios";

import { DEMO } from "./demo.js";
import localAdapter from "./api.local.js";

/**
 * Die eine Stelle, an der die Serveradresse steht.
 *
 * Kein Aufruf im Frontend baut seine URL selbst zusammen — Base-URL und
 * `withCredentials` gehören hierher, sonst steht die Adresse wieder in zwanzig
 * Dateien und die App lässt sich nirgends deployen.
 *
 * Adresse setzen: `VITE_API_URL` in `.env.local` (siehe `.env.example`).
 */
const serverUrl = (
  import.meta.env.VITE_API_URL ?? "http://localhost:3030"
).replace(/\/+$/, "");

/**
 * Im Demo-Modus beantwortet ein eigener Axios-Adapter die Aufrufe im Browser,
 * statt sie ins Netz zu schicken (siehe `api.local.js`). Fuer die aufrufenden
 * Komponenten ist das nicht zu unterscheiden — deshalb aendert sich an keiner
 * der 29 Aufrufstellen eine Zeile. Ohne Server gibt es auch keine Sitzung, auf
 * die `withCredentials` sich beziehen koennte.
 */
const api = axios.create({
  baseURL: DEMO ? "" : `${serverUrl}/bikepacking`,
  withCredentials: !DEMO,
  adapter: DEMO ? localAdapter : undefined,
});

// Was der Express-Server ausliefert. Alles andere gehört dem Frontend.
const SERVER_PATHS = ["/images/", "/files/"];

/**
 * Vollständige URL für eine Datei, die der Server ausliefert — hochgeladene
 * Bilder stehen in der DB als Pfad (`/images/bikepacking/...`), nicht als URL.
 *
 * Pfade, die nicht vom Server kommen, bleiben unverändert: die Blattbilder der
 * Demo-Touren liegen unter `/IMG/...` im `public`-Ordner des Frontends, und
 * ein Präfix würde sie ins Leere schicken.
 */
export const assetUrl = (path) => {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  // Ohne Server gibt es keine Serveradresse, die man davorsetzen koennte —
  // ein Praefix schickte den Pfad ins Leere.
  if (DEMO) return path;
  return SERVER_PATHS.some((prefix) => path.startsWith(prefix))
    ? `${serverUrl}${path}`
    : path;
};

/**
 * Die Fehlermeldung des Servers, oder ein brauchbarer Ersatz. Axios wirft bei
 * Netzwerkfehlern ohne `response`, und "Request failed with status code 400"
 * hilft niemandem weiter.
 *
 * Der Ersatztext nennt im Normalbetrieb den Port, unter dem der Server laufen
 * muesste. In einer oeffentlichen Demo gibt es diesen Port nicht — dort waere
 * der Hinweis eine Anleitung ins Nichts.
 */
const NO_ANSWER = DEMO
  ? "Something in this browser demo did not answer. Reload the page and try again."
  : "The server did not answer. Check that it is running on port 3030.";

export const errorMessage = (err, fallback) =>
  err?.response?.data?.message || (err?.response ? fallback : NO_ANSWER);

export default api;
