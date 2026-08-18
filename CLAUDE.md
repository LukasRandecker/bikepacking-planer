# CLAUDE.md — Bikepacking-WebApp

## Was ist das
Full-Stack-Webapp zum Planen von Bikepacking-Touren: GPX-Track hochladen und auf der Karte ansehen, Packlisten aus einem Item-Katalog zusammenstellen, Setups pro Nutzerkonto speichern und als PDF exportieren. Hochschulprojekt, läuft aktuell nur lokal.

## Qualitätsstufe
Portfolio

## Stack
**Frontend** — `Projekt/Frontend/Bikepacking/`
- Framework: React 19 + Vite 7, Routing über react-router-dom 7 (`createBrowserRouter` in `main.jsx`)
- Sprache: JavaScript (JSX) — siehe „Bewusste Entscheidungen"
- Styling: Tailwind 4 über `@tailwindcss/vite`
- Zustand: drei React-Contexts (`PacklistContext`, `TourFormContext`, `UserContext`)
- Wichtige Pakete: axios, leaflet + react-leaflet (Karte), jspdf + jspdf-autotable (PDF-Export), xmldom (GPX-Parsing)
- Design: eigenes System „Planblatt" — siehe `DESIGN.md`. Schriften (Archivo, Martian Mono) liegen self-hosted in `src/assets/fonts/`, Icons sind selbst gezeichnet in `src/components/ui/Icons.jsx`. **Keine Icon-Library installieren.**

**Server** — `Projekt/Server/`
- Framework: Express 4, CommonJS (`require`)
- Datenbank: MongoDB über Mongoose, feste DB `bikepacking`
- Auth: JWT (`jsonwebtoken`) + bcrypt, Prüfung über `routes/session/verifyToken.js`
- API-Doku: Swagger unter `/docs`
- Port: 3030, CORS fest auf `http://localhost:5173` mit `credentials: true`
- Node-Version: ≥ 18

Hosting: keins. Läuft lokal, ist nirgends deployt.

## Befehle
```
# Frontend — in Projekt/Frontend/Bikepacking/
npm run dev        # Vite auf http://localhost:5173
npm run build      # Produktions-Build
npm run preview
npm run lint       # ESLint

# Server — in Projekt/Server/
nodemon app.js     # http://localhost:3030, Swagger unter /docs
```
Der Server hat **kein** npm-Skript — Start läuft von Hand über nodemon (siehe Baustellen).
Es gibt weder `typecheck` noch `test`.

## Struktur
- Zwei getrennte npm-Projekte unter `Projekt/`: `Frontend/Bikepacking/` und `Server/`. Jedes hat eigene `node_modules` und eigene `package.json`.
- Server-Routen sind nach Domäne gruppiert: `routes/bikepacking/{tours,items,itemlists,users}.js`, dazu `routes/session/` für Login und Token-Prüfung.
- Mongoose-Schemas liegen in `models/bikepacking/`.
- Upload-Logik ist aus `app.js` ausgelagert: `GPX_Upload.js` und `IMG_Upload.js` registrieren ihre Endpunkte selbst.
- Hochgeladene Dateien liegen im Dateisystem des Servers (`Server/images/`, `Server/files/bikepacking/`), in der DB steht nur der Pfad.
- Frontend-Komponenten liegen je in einem eigenen Ordner mit gleichnamiger `.jsx`. Ausnahme: `components/ui/` ist das Designsystem (`Icons`, `Controls`, `Modal`, `Sheet`) und `src/lib/` hält Nicht-UI-Logik (`pdf.js`, `useDocumentTitle.js`).

## Projektregeln
- **Kein direkter `fetch` in Komponenten.** Server-Aufrufe laufen über axios, Base-URL und `withCredentials` gehören an genau eine Stelle — nicht als String in die Komponente.
- **Geteilter Zustand nur über die drei bestehenden Contexts.** Kein vierter Parallelzustand, kein Prop-Drilling quer durch die Seiten.
- **Jede Route wird serverseitig validiert.** Kein Endpunkt vertraut dem Client. Bei geschützten Routen: Autorisierung pro Anfrage über `verifyToken` — nicht nur den Button im UI verstecken.
- **Uploads immer gegen Dateityp und Größe prüfen** (GPX und Bilder). Die Upload-Endpunkte sind die offenste Stelle der App. Client-seitig geprüft wird bereits (GPX ≤ 10 MB, Bilder ≤ 5 MB, Typ-Whitelist) — **das ersetzt die Serverprüfung nicht.**
- **Neues Komponenten-CSS gehört in `@layer components`.** Eine nackte Regel nach `@import "tailwindcss"` schlägt sonst stillschweigend jede Tailwind-Utility.
- **Keine abgerundeten Ecken.** `border-radius: 0` ist global gesetzt; die Designentscheidungen stehen in `DESIGN.md`.

## Bewusste Entscheidungen
- **React-Context statt Redux.** Es gibt drei klar getrennte Zustände (Packliste, Tourformular, Nutzer) und keinen Bedarf für einen globalen Store. Redux ist installiert, aber nirgends benutzt — es fliegt raus, es kommt nicht zurück.
- **JavaScript statt TypeScript.** Entscheidung für dieses Projekt, nicht für neue: **jedes neue Projekt startet weiter in TypeScript ab der ersten Datei.**

## Bekannte Baustellen
- [ ] `Server/.env` steht nicht in `Server/.gitignore` — enthält `MONGO_URI` und `TOKEN_SECRET`
- [ ] Server hat kein `start`-/`dev`-Skript in `package.json`
- [ ] Ungenutzte Dependencies: `@reduxjs/toolkit` + `react-redux` (Frontend), `redis` (Server) — deinstallieren
- [ ] `http://localhost:3030` steht weiterhin fest im Frontend-Code (jetzt gebündelt als `API`-Konstante je Datei, nicht mehr verstreut). Gehört hinter eine zentrale axios-Instanz mit Base-URL aus einer Env-Variable — sonst ist die App nicht deploybar
- [ ] **Login vergleicht das Passwort im Client** (`Popups/Login.jsx` holt den User per GET und prüft `res.data.pw !== pw`). Das Passwort verlässt damit den Server im Klartext. Gehört als POST-Login-Endpunkt auf den Server, mit bcrypt-Vergleich
- [ ] `npm run lint`: 2 Errors in `Context/PacklistContext.jsx` und `Context/TourFormContext.jsx` (`react-refresh/only-export-components`). Fix: das `createContext`-Objekt je in eine eigene Datei ziehen
- [ ] JS-Bundle 957 kB (306 kB gzip) — jspdf/html2canvas werden statisch importiert. Kandidat für dynamisches `import()` im PDF-Export
- [ ] `/user` ist Platzhalter, `Imprint`/`Privacy`/`Terms` existieren nicht (im Footer als unausgefüllte Felder ausgewiesen, nicht verlinkt)
- [ ] Lighthouse, echtes Handy, 200 %-Zoom und Fast-3G noch nicht geprüft (siehe „Zuletzt geprüft")

### Erledigt beim Redesign (2026-08-18)
- `lucide-react` war in 5 Dateien importiert, aber nie installiert — der Build brach ab. Ersetzt durch eigene SVG-Icons
- `Headline_Up-download.jsx` (508 Zeilen) aufgelöst in `SectionToolbar.jsx` + `useSheetActions.js` + `lib/pdf.js`, alle unter 300 Zeilen
- Rohe `fetch`-Aufrufe in `Packlist_Group.jsx` auf axios umgestellt (Projektregel)
- Bildpfade `../../../IMG/...` (liefen ins Leere) auf `/IMG/...` korrigiert

## Nicht anfassen
- `Server/.env` — wird nie gelesen, nie ausgegeben, nie committet. Bei Bedarf frage ich nach dem Wert, statt ihn mir selbst zu holen.

## Zuletzt geprüft
Stand 2026-08-18, gemessen am laufenden Dev-Build (nicht am Produktions-Build).
- `npm run build`: läuft durch, 0 Fehler
- `npm run lint`: 2 Errors (beide in `Context/`, siehe Baustellen), 0 Warnings
- Browser-Konsole: 0 Errors auf `/`, `/overview`, `/user`, 404
- axe-core (WCAG 2.0/2.1 A+AA): **0 Verstöße** auf 4 Routen × Desktop/Mobile, 0 im Modal
- Responsive 320 / 375 / 480 / 620 / 768 / 1024 / 1100 / 1280 / 1440 / 1920 / 2560: kein horizontales Scrollen
- Fokus: 19 fokussierbare Elemente auf `/`, alle mit sichtbarem Ring
- Modal: Fokusfalle hält, `Esc` schließt, Fokus kehrt zum Auslöser zurück
- Touch-Ziele auf `/overview` @375px: 0 unter 44 × 44 px
- **Nicht geprüft:** Lighthouse, echtes Handy, Querformat, 200 %-Zoom, Fast 3G, `npm audit`
