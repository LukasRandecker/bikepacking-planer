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
- Frontend-Komponenten liegen je in einem eigenen Ordner mit gleichnamiger `.jsx`.

## Projektregeln
- **Kein direkter `fetch` in Komponenten.** Server-Aufrufe laufen über axios, Base-URL und `withCredentials` gehören an genau eine Stelle — nicht als String in die Komponente.
- **Geteilter Zustand nur über die drei bestehenden Contexts.** Kein vierter Parallelzustand, kein Prop-Drilling quer durch die Seiten.
- **Jede Route wird serverseitig validiert.** Kein Endpunkt vertraut dem Client. Bei geschützten Routen: Autorisierung pro Anfrage über `verifyToken` — nicht nur den Button im UI verstecken.
- **Uploads immer gegen Dateityp und Größe prüfen** (GPX und Bilder). Die Upload-Endpunkte sind die offenste Stelle der App.

## Bewusste Entscheidungen
- **React-Context statt Redux.** Es gibt drei klar getrennte Zustände (Packliste, Tourformular, Nutzer) und keinen Bedarf für einen globalen Store. Redux ist installiert, aber nirgends benutzt — es fliegt raus, es kommt nicht zurück.
- **JavaScript statt TypeScript.** Entscheidung für dieses Projekt, nicht für neue: **jedes neue Projekt startet weiter in TypeScript ab der ersten Datei.**

## Bekannte Baustellen
- [ ] `Server/.env` steht nicht in `Server/.gitignore` — enthält `MONGO_URI` und `TOKEN_SECRET`. Muss rein, **bevor** der Ordner ein Git-Repo wird
- [ ] Kein Git-Repo vorhanden — keine Historie, kein Backup (DoD 9)
- [ ] Server hat kein `start`-/`dev`-Skript in `package.json`
- [ ] Ungenutzte Dependencies: `@reduxjs/toolkit` + `react-redux` (Frontend), `redis` (Server) — deinstallieren
- [ ] `http://localhost:3030` steht über 20-mal fest im Frontend-Code, dazu ein rohes `fetch` in `Packlist_Group.jsx:55`. Gehört hinter eine zentrale axios-Instanz mit Base-URL aus einer Env-Variable — sonst ist die App nicht deploybar
- [ ] `Headline_Up-download.jsx` hat 508 Zeilen (DoD 9: max. ~300)
- [ ] Vollständige DoD-Prüfung steht noch aus

## Nicht anfassen
- `Server/.env` — wird nie gelesen, nie ausgegeben, nie committet. Bei Bedarf frage ich nach dem Wert, statt ihn mir selbst zu holen.

## Zuletzt geprüft
- Lighthouse Mobile: nicht geprüft
- Tastaturbedienung: nicht geprüft
- Responsive 320–2560: nicht geprüft
