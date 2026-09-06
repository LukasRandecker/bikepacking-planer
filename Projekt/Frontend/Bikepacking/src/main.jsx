import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

import { createBrowserRouter, RouterProvider } from "react-router-dom";
import HomePage from "./pages/home.jsx";
import { DEMO } from "./lib/demo.js";

/**
 * Die Startseite kommt mit dem ersten Bundle, alles andere wird beim Aufruf
 * nachgeladen.
 *
 * Der Grund ist Leaflet: die Karte hängt an `/overview` und `/tour/:id`, wog
 * aber im gemeinsamen Bundle mit, obwohl die Startseite keine Karte zeigt.
 * Wer nur den Index ansieht, lädt sie jetzt gar nicht erst.
 */
const page = (load) => async () => ({ Component: (await load()).default });

// Router erstellen
const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "overview", lazy: page(() => import("./pages/overview.jsx")) },
      { path: "tour/:id", lazy: page(() => import("./pages/tour.jsx")) },
      // Das Konto ist die eine Seite, die ohne Server nichts zu zeigen haette:
      // eigene Touren, Speichern, Veroeffentlichen. Im Demo-Modus gibt es die
      // Route deshalb nicht — verlinkt ist sie dort ohnehin nirgends, und der
      // Chunk samt Publish-Dialog wird gar nicht erst gebaut.
      ...(DEMO
        ? []
        : [{ path: "user", lazy: page(() => import("./pages/user.jsx")) }]),
      { path: "*", lazy: page(() => import("./pages/Error.jsx")) },
    ],
  },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
