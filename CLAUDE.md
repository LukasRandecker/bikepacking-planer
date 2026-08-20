# CLAUDE.md — Bikepacking-WebApp

## Was ist das
Full-Stack-Webapp rund um Bikepacking-Setups: Auf der Startseite stehen veröffentlichte Touren zeitlich sortiert; ein Klick führt auf die Tourseite mit Karte, Eckdaten und der Packliste, mit der sie gefahren wurde. Selbst planen geht auf `/overview`: GPX-Track hochladen, Tour beschreiben, Packliste aus dem Item-Katalog zusammenstellen (Suche + eigene Items), pro Nutzerkonto speichern und als PDF exportieren. Hochschulprojekt, läuft aktuell nur lokal.

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
- Auth: bcrypt-Hash in der DB, JWT im httpOnly-Cookie, Prüfung über `routes/session/verifyToken.js` (`verifyToken` erzwingt, `optionalToken` erlaubt beides)
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
npm run dev        # nodemon, http://localhost:3030, Swagger unter /docs
npm start          # ohne Watch
npm run seed       # Katalog + Demo-Touren in die DB (Katalog zuerst)
npm run seed:catalog          # nur der Item-Katalog, idempotent
npm run seed:catalog -- --prune   # zusätzlich Katalogreste löschen
npm run seed:tours            # nur die Demo-Touren, braucht den Katalog
npm run migrate               # einmalige Altdaten-Migrationen (s. u.)
```
Es gibt weder `typecheck` noch `test`.

Eine leere DB zeigt eine leere Startseite und einen leeren Item-Picker — vor dem ersten Start einmal `npm run seed` laufen lassen.

`npm run migrate` ist für Datenbestände von **vor** der Auth- und Upload-Umstellung: `migrate:passwords` hasht Klartext-Passwörter mit bcrypt (sonst kommt kein Altkonto mehr durch den Login), `migrate:owners` trägt `Tour.Owner` aus `user.tours` nach (sonst sind Alt-Touren für ihr eigenes Konto unsichtbar), `migrate:uploads` benennt Altdateien mit Leerzeichen oder Sonderzeichen im Namen um und zieht die Verweise nach (die gehärtete Leseroute normalisiert Namen und fände sie sonst nicht mehr), `migrate:sources` stellt Items vom alten `USER` auf `PRIVATE` um (sichtbarkeitserhaltend — niemand bekommt seine Sachen ungefragt ins Schaufenster gestellt). Alle vier sind wiederholbar und tun bei frischen Daten nichts.

`Server/.env` braucht `MONGO_URI` und ein `TOKEN_SECRET` von mindestens 16 Zeichen — ohne das startet der Server nicht.

## Struktur
- Zwei getrennte npm-Projekte unter `Projekt/`: `Frontend/Bikepacking/` und `Server/`. Jedes hat eigene `node_modules` und eigene `package.json`.
- Server-Routen sind nach Domäne gruppiert: `routes/bikepacking/{tours,items,itemlists,users}.js`, dazu `routes/session/` für Login und Token-Prüfung.
- Mongoose-Schemas liegen in `models/bikepacking/`.
- Upload-Logik ist aus `app.js` ausgelagert: `GPX_Upload.js` und `IMG_Upload.js` registrieren ihre Endpunkte selbst.
- Hochgeladene Dateien liegen im Dateisystem des Servers (`Server/images/`, `Server/files/bikepacking/`), in der DB steht nur der Pfad.
- Der Item-Katalog liegt als `Server/data/catalog.json` im Repo (500 Einträge; die ersten 277 geparst von fritzmeinecke.shop, der Rest ergänzt). Eingespielt wird er über `Server/scripts/seedCatalog.js`; `seedTours.js` legt die Demo-Touren samt erzeugter `*-demo.gpx` an.
- Frontend-Komponenten liegen je in einem eigenen Ordner mit gleichnamiger `.jsx`. Ausnahme: `components/ui/` ist das Designsystem (`Icons`, `Controls`, `Modal`, `Sheet`) und `src/lib/` hält Nicht-UI-Logik (`pdf.js`, `useDocumentTitle.js`).

## Projektregeln
- **Kein direkter `fetch` in Komponenten.** Jeder Server-Aufruf geht über die axios-Instanz aus `src/lib/api.js`. Dort steht die Base-URL (aus `VITE_API_URL`), `withCredentials` und `errorMessage()`. Keine URL im Komponentencode, auch keine für Bilder — dafür gibt es `assetUrl()`.
- **Schreiben geht nur eingeloggt — und das entscheidet der Server.** Jede schreibende Route hängt hinter `verifyToken`. Im Frontend ist der Türsteher `requireLogin(grund)` aus dem `UserContext`; gesperrte Formularbereiche bekommen `LockedRegion` aus `components/ui/Sheet.jsx` (Felder bleiben sichtbar, sind aber `inert`, die schraffierte Fläche darüber ist der Knopf). Das UI-Gate ist Bequemlichkeit, nicht Schutz.
- **Wer etwas tut, sagt der Token — nie der Client.** `Owner`, `Author` und `Public` werden serverseitig aus `req.user` bzw. als Default gesetzt und aus dem Body verworfen. Es gibt keine Route, die eine User-Id aus Pfad oder Body annimmt: das eigene Konto erreicht man über `/users/me`, `/tours/mine`, `/itemlists/mine`.
- **Kein `req.body` direkt in die Datenbank.** Jede Route hat eine `validate*`-Funktion, die ein neues Objekt aus geprüften Feldern baut. `new Model(req.body)` und `findByIdAndUpdate(id, req.body)` sind Mass Assignment — genau so ließ sich vorher jede fremde Tour öffentlich stellen.
- **Fremdes antwortet mit 404, nicht mit 403.** Wer Ids durchprobiert, soll daraus nicht ablesen können, welche existieren.
- **Ein Dateiname aus einer Anfrage wird nie zu einem Pfad.** Uploads bekommen einen generierten Namen, Lesezugriffe laufen über `resolveInside()` aus `uploadSafety.js`. Dateityp und Größe prüft multer serverseitig (GPX ≤ 10 MB, Bilder ≤ 5 MB). Wer Dateien von außerhalb einspielt, lässt `npm run migrate:uploads` laufen — sonst liegen sie unter einem Namen, den die Leseroute nie erzeugt.
- **Server-Dateien nur über `assetUrl()` verlinken.** Die Funktion präfixt `/images/` und `/files/` mit der Serveradresse und lässt alles andere in Ruhe: die Blattbilder der Demo-Touren liegen unter `/IMG/` im `public`-Ordner des Frontends, ein Präfix schickt sie ins Leere.
- **Ein Beitrag bringt sein eigenes Bild mit.** Cover werden hochgeladen, nicht aus einem Vorrat gewählt. Zum Veröffentlichen braucht eine Tour Track, Cover und eine Packliste mit Items — serverseitig in `PUT /tours/:id/publish` geprüft.
- **Der Katalog wächst mit.** Ein Item hat eine von drei Herkünften: `CATALOG` (Grundstock aus dem Seed), `COMMUNITY` (von einem Nutzer angelegt und dadurch für alle sichtbar) oder `PRIVATE` (persönliche Kopie aus `/items/:id/fork`, sieht nur der Besitzer). Wer etwas beisteuert, bleibt der Einzige, der es ändern kann; alle anderen bekommen beim Ändern eine eigene Kopie. Geteilte Einträge, die schon auf einer Packliste stehen, lassen sich nicht mehr löschen.
- **Ein Item heißt „Gegenstand · Marke".** `Itemname` trägt nur die Sache ("Oberrohrtasche"), `Brand` die Marke ("Cyclite") — zusammengesetzt wird erst beim Rendern, über `ItemName` aus `components/ui/Sheet.jsx`. Unter dem Namen steht die Kategorie, sonst nichts.
- **`Section` und `Keywords` werden nie angezeigt.** Beide tragen nur die Suche: `Section` die Herkunft aus der Quelle ("… · Schlafen"), `Keywords` die Suchbegriffe, die jemand beim Anlegen selbst vergibt. Wer sie ins UI holt, macht den Katalog wieder unleserlich.
- **Items ohne Bild bekommen ein schwarzes Rechteck**, kein Platzhalterfoto und kein graues Feld. Dafür gibt es `ItemThumb` in `components/ui/Sheet.jsx`. Der Katalog hat noch keine Bilder, das ist der Normalfall und nicht der Fehlerfall.
- **Beim Löschen einer Tour bleibt die Packliste.** Sie hängt am Konto und lässt sich an einer anderen Tour weiterverwenden. Track und Cover gehörten dagegen nur dieser Tour — `dropIfUnused()` in `routes/bikepacking/tours.js` räumt sie von der Platte, aber erst, wenn keine andere Tour mehr darauf zeigt.
- **Leeren heißt leeren, nicht löschen.** Der „New"-Knopf in beiden Toolbars räumt nur die Anzeige: `resetTourForm()` aus dem `TourFormContext`, `clearSetup()` aus dem `PacklistContext`. Beide werfen die aktive Id (`activeTourId`, `activeSetupId`) mit weg, damit das nächste Speichern eine neue Tour bzw. ein neues Setup anlegt statt das geladene zu überschreiben. Serverseitig passiert dabei nichts.
- **Geteilter Zustand nur über die drei bestehenden Contexts.** Kein vierter Parallelzustand, kein Prop-Drilling quer durch die Seiten.
- **Jede Route wird serverseitig validiert.** Kein Endpunkt vertraut dem Client. Autorisierung pro Anfrage über `verifyToken` — nicht nur den Button im UI verstecken.
- **Neues Komponenten-CSS gehört in `@layer components`.** Eine nackte Regel nach `@import "tailwindcss"` schlägt sonst stillschweigend jede Tailwind-Utility.
- **Keine abgerundeten Ecken.** `border-radius: 0` ist global gesetzt; die Designentscheidungen stehen in `DESIGN.md`.

## Bewusste Entscheidungen
- **React-Context statt Redux.** Es gibt drei klar getrennte Zustände (Packliste, Tourformular, Nutzer) und keinen Bedarf für einen globalen Store. Redux ist installiert, aber nirgends benutzt — es fliegt raus, es kommt nicht zurück.
- **JavaScript statt TypeScript.** Entscheidung für dieses Projekt, nicht für neue: **jedes neue Projekt startet weiter in TypeScript ab der ersten Datei.**

## Bekannte Baustellen
- [ ] Ungenutzte Dependencies im Frontend: `@reduxjs/toolkit` + `react-redux` — deinstallieren (serverseitig sind `redis` und `crypto-js` bereits raus)
- [ ] **Kein Rate Limit auf `/users/login`.** Passwörter sind gehasht und die Fehlermeldung verrät nicht, welcher Teil falsch war, aber Durchprobieren ist unbegrenzt möglich. Für den lokalen Betrieb hinnehmbar, vor jedem Deployment nicht
- [ ] **Cookie ohne `secure`.** Lokal läuft alles über http; beim Deployment muss `COOKIE_SECURE=true` in die Env, sonst geht der Token über die Leitung
- [ ] Kein CSRF-Token. `sameSite: 'lax'` deckt den üblichen Fall ab, ersetzt aber kein echtes Token, sobald die App öffentlich erreichbar ist
- [ ] Passwort ändern und Konto wiederherstellen fehlen — es gibt nur Registrieren, Einloggen, Ausloggen und Konto löschen
- [ ] **Preise, Gewichte und Marken im Katalog sind größtenteils geschätzt, nicht belegt.** Belegt sind fünf Gewichte aus der Quelle (Zelt 548 g, Isomatte Sommer 332 g, Isomatte Winter 640 g, Kopfkissen 60 g, Schlafsack F/H 777 g) und 33 Marken, die sich aus den Produktlinks ableiten lassen (Rose, Gore Wear, Ergon, Gaerne, Oakley, Garmin, Carinthia, Amazonas, Outdoor Research, Point 65, Novritsch, Fritz Meinecke). Alles andere ist eine plausible Annahme zum jeweiligen Produkt, damit die Summen nicht bei null stehen und die Marke nicht leer bleibt. Wer echte Zahlen braucht, muss sie gegen die Produktseiten prüfen
- [ ] **Beigesteuerte Items werden nicht moderiert.** Wer eingeloggt ist, kann beliebig viele Einträge in den gemeinsamen Katalog stellen; es gibt weder Meldefunktion noch Mengenbegrenzung noch eine Dublettenprüfung gegen bestehende Einträge. Für den lokalen Betrieb egal, für eine offene Plattform nicht
- [ ] Der Katalog trägt auch die Nicht-Rad-Abschnitte der Quelle (Airsoft, Kampfsport, Gaming-PC, Bücher) — alle unter `Other`. Bewusst so übernommen, weil die ganze Liste gewünscht war; falls das stört, ist der Filter `Section` im Seed die Stelle
- [ ] `npm run lint`: 2 Errors in `Context/PacklistContext.jsx` und `Context/TourFormContext.jsx` (`react-refresh/only-export-components`). Fix: das `createContext`-Objekt je in eine eigene Datei ziehen
- [ ] JS-Bundle 957 kB (306 kB gzip) — jspdf/html2canvas werden statisch importiert. Kandidat für dynamisches `import()` im PDF-Export
- [ ] `/user` ist Platzhalter, `Imprint`/`Privacy`/`Terms` existieren nicht (im Footer als unausgefüllte Felder ausgewiesen, nicht verlinkt)
- [ ] Lighthouse, echtes Handy, 200 %-Zoom und Fast-3G noch nicht geprüft (siehe „Zuletzt geprüft")

### Erledigt beim Katalog-Durchgang (2026-08-20)
- **Touren löschen auf `/user`**: Knopf pro Zeile, Bestätigungsdialog, der sagt was mitgeht und was bleibt. Der Server räumt verwaiste GPX- und Cover-Dateien mit ab
- **„New" in beiden Toolbars**: leert Tourblatt (Felder, Karte, Eckdaten, GPX-Bezug) bzw. Packliste. Fragt vorher nach, wenn etwas drinsteht, und läuft auf einem leeren Blatt ohne Rückfrage durch. Der Ausgangszustand des Tourformulars steht jetzt als `EMPTY` an einer Stelle, damit „neu anfangen" und „zum ersten Mal öffnen" dasselbe ergeben
- **Sections sind aus der Oberfläche verschwunden.** Unter dem Namen steht jetzt nur die Kategorie; `Section` bleibt in der DB und trägt weiter die Suche (eine Suche nach „schlafen" findet nach wie vor die Schlafsachen)
- **Jedes Item hat eine Marke.** `Brand` als eigenes Feld, gerendert als „Oberrohrtasche · Cyclite". 187 Marken im Katalog, nur vier Einträge ohne (Perso, Schlüssel, Bankkarten, Bargeld — die haben zu Recht keine)
- **Katalog von 277 auf 500 Einträge**, Schwerpunkt auf den dünnen Kategorien (Hygiene 17 → 60, Tools 24 → 75). Dabei 11 echte Dubletten gefunden und zusammengeführt, die sich vorher nur durch die Section unterschieden und nach deren Ausblenden ununterscheidbar gewesen wären
- **Selbst angelegte Items landen im gemeinsamen Katalog** (`COMMUNITY`) statt privat zu bleiben, samt selbst vergebener Suchbegriffe. Das Anlegen-Formular hat dafür ein Markenfeld mit Vorschlagsliste aus den bestehenden Marken und ein Feld für Suchbegriffe
- `GET /items/brands` füttert die Vorschlagsliste; `FileDrop` ersetzt auch im Anlegen-Formular die eigene Drop-Zone

### Erledigt beim Beitrags-Durchgang (2026-08-20)
- Publish-Dialog nimmt jetzt **beides selbst entgegen**: GPX-Track und Cover-Foto werden hochgeladen, die Bildauswahl aus den fünf Blattbildern ist raus. Strecke und Höhenmeter liest der Dialog aus der GPX-Datei, statt sie eintippen zu lassen
- `FileDrop` in `ui/Controls.jsx` ist die gemeinsame Drop-Zone (vorher hatte jede Stelle ihre eigene)
- `saveTour` speichert `Distance`/`Elevation` mit — vorher stand eine gespeicherte Tour trotz Track mit 0 km im Konto
- `assetUrl()` unterscheidet Server-Dateien von Frontend-Dateien
- **Cover-Muster war zu weit:** `/images/../../.env` passte auf die Prüfung, weil Punkt und Schrägstrich erlaubte Zeichen sind. Jetzt mit `..`-Sperre und Endungs-Whitelist
- **Nebenwirkung der Upload-Härtung gefunden:** Altdateien mit Leerzeichen im Namen (`1252km 8300hm _ Bordeaux - Sevilla.gpx`) waren über die normalisierende Leseroute nicht mehr erreichbar (404). `migrate:uploads` benennt sie um und zieht die DB-Verweise nach

### Erledigt beim Sicherheitsdurchgang (2026-08-19)
Funktional dazugekommen:
- `ScrollRestoration` in `App.jsx`: ein Klick auf eine Tour landet oben, Zurück stellt die alte Position wieder her, `#anker` gewinnt gegen beides
- `lib/useGridColumns.js` koppelt die Kachelzahl im Index an die Spaltenzahl (3 Spalten → 9, sonst 10), damit der Feed auf einer vollen Zeile endet
- `/user` ist gebaut: eigene Touren, Beitrag vorbereiten (Beschreibung, Cover, Packliste) und veröffentlichen bzw. zurückziehen. Eine Tour braucht Track **und** Packliste mit Items, bevor sie auf den Index darf — serverseitig geprüft in `PUT /tours/:id/publish`


Gefunden und geschlossen (jeweils vorher live gegen den laufenden Server reproduziert):
- **Path Traversal, lesend:** `GET /bikepacking/loadImage/..%2F..%2Fpackage.json` lieferte beliebige Serverdateien im Klartext aus — mit `.env` genauso. `loadGpx` las ebenfalls außerhalb seines Ordners. Jetzt über `resolveInside()` in `uploadSafety.js` abgeriegelt
- **Path Traversal, schreibend:** Uploads übernahmen `file.originalname` als Dateinamen; ein Name wie `../../app.js` hätte Serverdateien überschrieben. Uploads bekommen jetzt einen generierten Namen, dazu `fileFilter` und `limits`
- **Passwörter im Klartext:** `GET /users` lieferte jedes Konto samt Passwort aus, `GET /users/username/:name` ebenso — der Login verglich im Client. Jetzt bcrypt (12 Runden), `select: false` auf dem Feld, `toJSON`-Transform als zweiter Riegel, beide Routen entfernt
- **Keine Autorisierung:** jede Tour, Packliste und jedes Item ließ sich ohne Anmeldung ändern oder löschen; `PUT /tours/:id` mit `Public: true` stellte eine fremde Tour öffentlich. Alle schreibenden Routen hängen jetzt hinter `verifyToken`, Eigentum wird pro Anfrage geprüft
- **Mass Assignment:** `new Tour(req.body)` und `findByIdAndUpdate(id, req.body)` nahmen jedes Feld an. Ersetzt durch Feld-Whitelists
- **Tote Auth:** `routes/session/session.js` erwartete `email`/`password`, das Model hat `username`/`pw` — die Datei ist gelöscht, `crypto-js` und `redis` sind raus
- Token nur noch aus dem httpOnly-Cookie (nicht mehr aus dem `Authorization`-Header), `TOKEN_SECRET`-Prüfung beim Start, Body-Limit 100 kB, `x-powered-by` aus

### Erledigt beim Datendurchgang (2026-08-19, nach dem Funktionsausbau)
- Die 23 Alt-Items aus der ersten Projektphase (22 davon mit echten Produktfotos) sind gelöscht; die DB hält jetzt ausschließlich die 277 Katalogeinträge, alle ohne Bild. Die Bilddateien liegen weiterhin in `Server/images/bikepacking/` — ungenutzt, aber nicht gelöscht
- „Lukas - Testsetup" bestand komplett aus diesen Items und ist dadurch leer; die verwaisten Ids wurden aus der Liste entfernt
- Alle 277 Katalogeinträge haben Gewicht und Preis (siehe Baustellen zur Herkunft der Werte)
- Planen ist jetzt login-pflichtig: `requireLogin` im `UserContext`, `LockedRegion` über Tourformular und Packliste, Copy auf `/user` und im CTA entsprechend korrigiert

### Erledigt beim Funktionsausbau (2026-08-19)
- Startseite zeigt echte Touren aus `GET /tours/feed`, zeitlich sortiert, jede Kachel verlinkt auf `/tour/:id`
- Neue Tourseite `pages/tour.jsx`: Karte aus der GPX-Datei, Eckdaten, Packliste der Tour (nur lesen)
- Item-Picker `Packlist_ItemPicker.jsx`: Katalogsuche über `GET /items?q=&category=&source=`, Vorschläge je Kategorie, eigene Items als zweiter Bereich; eigenes Item anlegen ist der Ausweg, nicht der Standardweg
- Foto beim eigenen Item ist jetzt optional — der Katalog hat keine, das schwarze Rechteck ist der Normalfall
- `src/lib/api.js` als einzige Stelle für Base-URL, `withCredentials`, `assetUrl()` und `errorMessage()`; `localhost:3030` steht nirgends sonst mehr im Frontend
- Server: `dev`/`start`/`seed`-Skripte, Suchendpunkt mit Validierung, `/items/:id/fork`, `/itemlists/:id/items`, `/itemlists/add-item`, `/tours/feed`, `/tours/:id/full`
- `dbConnection.js` gibt sein Promise zurück, damit Skripte auf die Verbindung warten können

### Erledigt beim Redesign (2026-08-18)
- `lucide-react` war in 5 Dateien importiert, aber nie installiert — der Build brach ab. Ersetzt durch eigene SVG-Icons
- `Headline_Up-download.jsx` (508 Zeilen) aufgelöst in `SectionToolbar.jsx` + `useSheetActions.js` + `lib/pdf.js`, alle unter 300 Zeilen
- Rohe `fetch`-Aufrufe in `Packlist_Group.jsx` auf axios umgestellt (Projektregel)
- Bildpfade `../../../IMG/...` (liefen ins Leere) auf `/IMG/...` korrigiert

## Nicht anfassen
- `Server/.env` — wird nie gelesen, nie ausgegeben, nie committet. Bei Bedarf frage ich nach dem Wert, statt ihn mir selbst zu holen.

## Zuletzt geprüft
Stand 2026-08-19 (Funktionsausbau), gemessen am laufenden Dev-Build:
- `npm run build`: läuft durch, 0 Fehler
- `npm run lint`: unverändert 2 Errors (beide in `Context/`), 0 Warnings — keine neuen
- Startseite, `/tour/:id` und `/overview`: 0 Konsolenfehler, alle API-Aufrufe 200
- Katalogsuche, Item hinzufügen und Fork eines Katalog-Items im Browser durchgespielt; der Katalogeintrag blieb dabei unverändert
- Login-Sperre beidseitig geprüft: ausgeloggt sind 25 Felder `inert` und der Klick auf die Sperrfläche öffnet den Dialog mit passendem Grund; eingeloggt ist keine Region gesperrt
- Katalog nach dem Nachtragen: 277 Items, 0 ohne Gewicht, 0 ohne Preis, 0 mit Bild

Sicherheitsdurchgang, live gegen den laufenden Server:
- Path Traversal auf `loadImage`/`loadGpx`: vorher 200 mit Dateiinhalt, jetzt 400
- Schreiben ohne Token auf `/tours` (POST/PUT/DELETE/publish), `/items`, `/itemlists`, `/upload`, `/uploadImage`: durchgehend 401
- Konto B gegen Tour und Item von Konto A: PUT/DELETE/publish/GET durchgehend 404, `/tours/mine` liefert leer
- `Public: true` und `Author` im Body beim Anlegen: verworfen, Tour entsteht privat mit dem Namen aus dem Token
- Veröffentlichen ohne Track/Packliste: 400 mit Begründung; Cover mit fremder URL: 400; `GPX_file: "../../app.js"`: 400
- Katalog-Item ändern: 409; entfernte Routen (`GET /users`, `/users/username/:n`, `GET /itemlists`): 404
- Login mit migriertem Altpasswort: 200, `document.cookie` im Browser leer (httpOnly greift)
- Feed-Zeilen: 14 öffentliche Touren → 2 Spalten 10 Kacheln (5 Zeilen), 3 Spalten 9 Kacheln (3 Zeilen), 0 Füller; Live-Wechsel beim `resize` geprüft
- Scroll: Klick auf Kachel bei scrollY 1485 → 0; Zurück → 2477; `/overview#packlist` springt weiterhin auf den Anker
- Löschen durchgespielt: „Keep it" lässt die Tour stehen, „Delete for good" entfernt sie samt hochgeladenem Track und Cover; Kennzahlen aktualisieren sich. Zwei Touren mit derselben GPX-Datei: nach dem Löschen der ersten liegt die Datei noch da und die zweite ist weiter abrufbar (200), erst mit der letzten verschwindet sie. Eine angehängte Packliste bleibt nach dem Löschen der Tour auf dem Konto
- „New" beidseitig durchgespielt: Tourblatt mit Name, Daten und GRAVEL → nach dem Leeren alle Felder leer, Bike zurück auf MTB, Eckdaten 0, „None loaded"; Packliste mit 2 Items → 0 Items, alle Kategorien leer, `addedItems` aus dem SessionStorage raus. „Keep what is there" lässt alles stehen, ein leeres Blatt fragt nicht nach
- Reset löscht nichts serverseitig: gespeichertes Setup vor dem Reset angelegt, nach dem Reset noch mit 1 Item auf dem Konto — und Speichern fragt danach nach einem neuen Namen statt zu überschreiben
- Katalog: 500 Items, 0 ohne Gewicht, 0 ohne Preis, 0 mit Bild, 4 ohne Marke (gewollt)
- Suche gegen den laufenden Server: „ortlieb" 13 Treffer (Marke), „drybag" 1 (Suchbegriff), „popocreme" 2, „schlafen" 6 (ausgeblendete Section), „oberrohrtasche" 4
- Zwei Konten: A legt ein Item an → B und ein Ausgeloggter finden es; B kann es nicht ändern (409 mit Hinweis auf Fork), B's Fork ist PRIVATE und für A unsichtbar; Marke und Suchbegriffe werden beim Fork mitkopiert
- Im Browser durchgespielt: Item mit Marke und Suchbegriffen angelegt, landet auf der Liste und ist danach ohne Login über den Suchbegriff auffindbar
- Publish-Dialog: GPX-Upload liest 125 km / 600 m aus einer Testdatei, Cover-Upload zeigt Vorschau und schaltet den Publish-Knopf frei, Veröffentlichen und Zurückziehen durchgespielt
- Cover-Pfade: hochgeladenes Bild lädt über `http://localhost:3030/images/…`, die fünf Blattbilder unverändert über `/IMG/…` — beide 200
- **Nicht geprüft:** axe-core und Touch-Ziele auf `/user` und im Publish-Dialog; Verhalten bei parallelen Sitzungen. Bilder im Kachelraster konnten nicht im Browser sichtbar geprüft werden (die Vorschau-Pane rendert nicht, `loading="lazy"` lädt dann nicht) — geprüft wurde stattdessen jede URL einzeln über `new Image()`
- **Nicht erneut geprüft:** axe-core, Responsive-Raster, Fokusreihenfolge und Touch-Ziele auf den neuen Seiten (`/tour/:id`, Item-Picker)

### Stand 2026-08-18 (Redesign), gemessen am laufenden Dev-Build (nicht am Produktions-Build).
- `npm run build`: läuft durch, 0 Fehler
- `npm run lint`: 2 Errors (beide in `Context/`, siehe Baustellen), 0 Warnings
- Browser-Konsole: 0 Errors auf `/`, `/overview`, `/user`, 404
- axe-core (WCAG 2.0/2.1 A+AA): **0 Verstöße** auf 4 Routen × Desktop/Mobile, 0 im Modal
- Responsive 320 / 375 / 480 / 620 / 768 / 1024 / 1100 / 1280 / 1440 / 1920 / 2560: kein horizontales Scrollen
- Fokus: 19 fokussierbare Elemente auf `/`, alle mit sichtbarem Ring
- Modal: Fokusfalle hält, `Esc` schließt, Fokus kehrt zum Auslöser zurück
- Touch-Ziele auf `/overview` @375px: 0 unter 44 × 44 px
- **Nicht geprüft:** Lighthouse, echtes Handy, Querformat, 200 %-Zoom, Fast 3G, `npm audit`
