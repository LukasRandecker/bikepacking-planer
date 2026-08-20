import axios from "axios";

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

const api = axios.create({
  baseURL: `${serverUrl}/bikepacking`,
  withCredentials: true,
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
  return SERVER_PATHS.some((prefix) => path.startsWith(prefix))
    ? `${serverUrl}${path}`
    : path;
};

/**
 * Die Fehlermeldung des Servers, oder ein brauchbarer Ersatz. Axios wirft bei
 * Netzwerkfehlern ohne `response`, und "Request failed with status code 400"
 * hilft niemandem weiter.
 */
export const errorMessage = (err, fallback) =>
  err?.response?.data?.message ||
  (err?.response
    ? fallback
    : "The server did not answer. Check that it is running on port 3030.");

export default api;
