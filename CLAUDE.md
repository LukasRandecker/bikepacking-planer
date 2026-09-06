# CLAUDE.md — Bikepacking-WebApp

## Was ist das
Full-Stack-Webapp rund um Bikepacking-Setups: Auf der Startseite stehen veröffentlichte Touren zeitlich sortiert; ein Klick führt auf die Tourseite mit Karte, Eckdaten und der Packliste, mit der sie gefahren wurde. Selbst planen geht auf `/overview`: GPX-Track hochladen, Tour beschreiben, Packliste aus dem Item-Katalog zusammenstellen (Suche + eigene Items), pro Nutzerkonto speichern und als PDF exportieren. Hochschulprojekt.

**Zwei Betriebsarten.** Im Normalbetrieb spricht das Frontend mit dem Express-Server; das ist die volle App und läuft lokal. Mit `VITE_DEMO=true` entsteht daraus eine Fassung, die **ohne jeden Netzwerkaufruf an eine API** im Browser läuft — für die öffentliche Demo, solange es keinen Server gibt. Siehe „Demo-Modus" weiter unten.

## Qualitätsstufe
Portfolio

## Stack
**Frontend** — `Projekt/Frontend/Bikepacking/`
- Framework: React 19 + Vite 7, Routing über react-router-dom 7 (`createBrowserRouter` in `main.jsx`)
- Sprache: JavaScript (JSX) — siehe „Bewusste Entscheidungen"
- Styling: Tailwind 4 über `@tailwindcss/vite`
- Zustand: drei React-Contexts. Das Context-Objekt liegt je allein in seiner Datei (`SetupItemsContext.jsx`, `TourFormContext.jsx`, `UserContext.jsx`), der Provider daneben (`PacklistContext.jsx`, `TourFormProvider.jsx`, `App.jsx`) — eine Datei, die Komponenten und anderes zugleich exportiert, bricht Fast Refresh
- Wichtige Pakete: axios, leaflet + react-leaflet (Karte), jspdf + jspdf-autotable (PDF-Export, dynamisch nachgeladen)
- Code-Splitting: nur die Startseite kommt mit dem ersten Bundle, die übrigen Routen hängen an `lazy` in `main.jsx`. Leaflet lädt dadurch nur auf `/overview` und `/tour/:id`, jspdf erst beim Export
- Design: eigenes System „Planblatt" — siehe `DESIGN.md`. Schriften (Archivo, Martian Mono) liegen self-hosted in `src/assets/fonts/`, Icons sind selbst gezeichnet in `src/components/ui/Icons.jsx`. **Keine Icon-Library installieren.**

**Server** — `Projekt/Server/`
- Framework: Express 4, CommonJS (`require`)
- Datenbank: MongoDB über Mongoose, feste DB `bikepacking`
- Auth: bcrypt-Hash in der DB, JWT im httpOnly-Cookie, Prüfung über `routes/session/verifyToken.js` (`verifyToken` erzwingt, `optionalToken` erlaubt beides)
- API-Doku: Swagger unter `/docs`
- Sicherheits-Header über `helmet`; `crossOriginResourcePolicy` steht auf `cross-origin` (sonst verweigert der Server dem Frontend jedes hochgeladene Bild), `/docs` bekommt eine eigene, weitere CSP für Swagger UI
- Rate Limit auf `/users/login` und `/users/register`: 10 Fehlversuche je 15 Minuten
- Zentraler Error- und 404-Handler am Ende von `app.js` — nach außen JSON, keine Stacktraces
- Port: 3030 (`PORT`), erlaubte Origins über `CORS_ORIGIN` (Standard `localhost:5173,localhost:4173`) mit `credentials: true`
- Node-Version: ≥ 18

Hosting: der Server nirgends. Das Frontend ist für Cloudflare Pages im Demo-Modus vorbereitet (Root-Directory `Projekt/Frontend/Bikepacking`, `VITE_DEMO=true`, `public/_redirects` für den SPA-Fallback) — Einzelheiten in `Projekt/README.md`.

## Befehle
```
# Frontend — in Projekt/Frontend/Bikepacking/
npm run dev        # Vite auf http://localhost:5173
npm run build      # Produktions-Build
npm run preview    # den Build ausliefern, http://localhost:4173
npm run lint       # ESLint

VITE_DEMO=true npm run build   # dieselbe App ohne Server (siehe Demo-Modus)

# Server — in Projekt/Server/
npm run dev        # nodemon, http://localhost:3030, Swagger unter /docs
npm start          # ohne Watch
npm run seed       # spielt den Item-Katalog ein (Alias auf seed:catalog)
npm run seed:catalog          # nur der Item-Katalog, idempotent
npm run seed:catalog -- --prune   # zusätzlich Katalogreste löschen
npm run migrate               # einmalige Altdaten-Migrationen (s. u.)
```
Es gibt weder `typecheck` noch `test`.

Eine leere DB zeigt einen leeren Item-Picker — vor dem ersten Start einmal `npm run seed` laufen lassen. Die Startseite bleibt danach trotzdem leer: **es gibt keine Demo-Touren mehr**, der Index füllt sich erst, wenn ein Konto eine eigene Tour veröffentlicht.

`npm run migrate` ist für Datenbestände von **vor** der Auth- und Upload-Umstellung: `migrate:passwords` hasht Klartext-Passwörter mit bcrypt (sonst kommt kein Altkonto mehr durch den Login), `migrate:owners` trägt `Tour.Owner` aus `user.tours` nach (sonst sind Alt-Touren für ihr eigenes Konto unsichtbar), `migrate:uploads` benennt Altdateien mit Leerzeichen oder Sonderzeichen im Namen um und zieht die Verweise nach (die gehärtete Leseroute normalisiert Namen und fände sie sonst nicht mehr), `migrate:sources` stellt Items vom alten `USER` auf `PRIVATE` um (sichtbarkeitserhaltend — niemand bekommt seine Sachen ungefragt ins Schaufenster gestellt). Alle vier sind wiederholbar und tun bei frischen Daten nichts.

`Server/.env` braucht `MONGO_URI` und ein `TOKEN_SECRET` von mindestens 16 Zeichen — ohne das startet der Server nicht. Alle Variablen samt Erklärung stehen in `Server/.env.example`; fürs Frontend in `Frontend/Bikepacking/.env.example` (`VITE_API_URL`, `VITE_SITE_URL`).

## Struktur
- Zwei getrennte npm-Projekte unter `Projekt/`: `Frontend/Bikepacking/` und `Server/`. Jedes hat eigene `node_modules` und eigene `package.json`.
- Server-Routen sind nach Domäne gruppiert: `routes/bikepacking/{tours,items,itemlists,users}.js`, dazu `routes/session/` für Login und Token-Prüfung.
- Mongoose-Schemas liegen in `models/bikepacking/`.
- Upload-Logik ist aus `app.js` ausgelagert: `GPX_Upload.js` und `IMG_Upload.js` registrieren ihre Endpunkte selbst.
- Hochgeladene Dateien liegen im Dateisystem des Servers (`Server/images/`, `Server/files/bikepacking/`), in der DB steht nur der Pfad.
- Der Item-Katalog liegt als `Server/data/catalog.json` im Repo (500 Einträge; die ersten 277 geparst von fritzmeinecke.shop, der Rest ergänzt). Eingespielt wird er über `Server/scripts/seedCatalog.js`. Tour-Beispieldaten gibt es nicht — `files/bikepacking/` und `images/bikepacking/` sind leere Upload-Ordner (je ein `.gitkeep` hält sie im Repo).
- Frontend-Komponenten liegen je in einem eigenen Ordner mit gleichnamiger `.jsx`. Ausnahme: `components/ui/` ist das Designsystem (`Icons`, `Controls`, `Modal`, `Sheet`) und `src/lib/` hält Nicht-UI-Logik (`pdf.js`, `useDocumentTitle.js`).
- Der Demo-Modus liegt vollständig in neuen Dateien: `lib/demo.js` (der Schalter und die beiden Links), `lib/gpx.js` (die portierte GPX-Rechnung), `lib/api.local.js` (Routentabelle und Handler), `lib/demoData.js` (die zwei Beispieltouren), `components/DemoNotice/` (der Streifen). Dazu `scripts/prepare-demo-assets.mjs`, `public/demo/*.gpx`, `public/_redirects` und `public/openapi.json`.

## Projektregeln
- **Es gibt genau eine Stelle, die weiß, ob ein Server da ist: `DEMO` aus `src/lib/demo.js`.** Keine zwanzigste `import.meta.env.VITE_DEMO`-Prüfung in einer Komponente — dann ist der Schalter wieder verloren. Und: was ohne Server nicht trägt, wird **ausgeblendet, nicht deaktiviert**. Ein grauer Knopf lädt zum Draufklicken ein und erklärt nichts.
- **Der Demo-Modus greift genau an einer Naht ein: dem Axios-Adapter in `src/lib/api.js`.** Die 29 Aufrufstellen bleiben unangetastet — wer dort etwas ändern muss, hat einen Fehler im Adapter, nicht in der Komponente. Der Adapter antwortet in Axios' Form (`{ data, status, ... }`) und wirft im Fehlerfall einen `AxiosError` mit `response.data.message`, sonst greift `errorMessage()` nicht mehr und jede Meldung der App wäre leer.
- **`src/lib/gpx.js` ist eine Portierung, keine zweite Implementierung.** Haversine, Reihenfolge, Rundung und Rückgabeform sind Zeichen für Zeichen `parseGpx` aus `Server/GPX_Upload.js`. Zeigte der Demo-Modus andere Kilometer als der Server, wäre keiner der beiden Werte etwas wert — geprüft wird das gegen den laufenden Server, nicht durch Hinsehen.
- **Was aus `Server/` ins Frontend muss, kommt über den Build.** `scripts/prepare-demo-assets.mjs` kopiert `catalog.json` und erzeugt `openapi.json`. Von Hand kopierte Dateien laufen von der Quelle weg, und dann sucht später jemand den Fehler im Katalog statt in der Kopie.
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
- **Nie `outline-none` an etwas, das einen Fokusring bekommen soll.** In Tailwind 4 setzt das Utility auch `--tw-outline-style: none`, und genau diese Variable liest jedes spätere `focus-visible:outline-*` aus — Farbe und Breite kommen an, der Stil bleibt `none`, der Ring ist unsichtbar. Genau so verloren die Tour-Kacheln und das Katalog-Suchfeld ihren Fokus. Die globale Regel `:focus-visible` in `index.css` zeichnet den Ring bereits; wer die Standard-Outline wirklich unterdrücken muss, nimmt `outline-hidden` und gibt einen Ersatz (`has-[:focus-visible]` am Rahmen, oder eine `box-shadow` wie `.c-input`).
- **`sizes` steht an zwei Stellen und muss übereinstimmen.** Das Aufmacherbild trägt sein `sizes` im `<img>` (`SheetHero.jsx`) und noch einmal als `HERO_SIZES` im Preload (`vite.config.js`). Weichen die Werte voneinander ab, wählt der Preload eine andere Größe als das Bild und der Browser lädt beide. Und: `sizes` wird gemessen, nicht geschätzt — der geschätzte Wert lag um ein Fünftel daneben.
- **Fokusringe nur mit echter Tastatur messen.** `element.focus()` aus einem Skript löst `:focus-visible` nicht aus; jede Prüfung, die nur so misst, meldet reihenweise Elemente ohne Ring, die in Wahrheit einen haben. Erst einen echten Tab-Anschlag senden, dann messen.
- **Keine abgerundeten Ecken.** `border-radius: 0` ist global gesetzt; die Designentscheidungen stehen in `DESIGN.md`.

## Demo-Modus

`VITE_DEMO=true` baut dieselbe App ohne Server. Der Schalter steht in
`src/lib/demo.js` und wirkt an zwei Stellen: Axios bekommt in `src/lib/api.js`
einen eigenen `adapter`, und die Oberfläche blendet aus, was ohne Konto nichts
trägt.

**Der Adapter** (`src/lib/api.local.js`) ist eine Routentabelle `Methode + Pfad
→ Handler`. Feste Pfade stehen vor denen mit Platzhaltern, sonst sucht der
Router eine Packliste namens „mine". Was er beantwortet:

| Endpunkt | Im Demo-Modus |
|---|---|
| `POST /upload` | Datei aus dem FormData, `parseGpxFile` im Browser |
| `GET /loadGpx/:name` | Datei aus `public/demo/`, durch dieselbe Rechnung |
| `GET /items`, `/items/brands` | `public/catalog.json`, Suche und Filter clientseitig |
| `POST /items`, `PUT /items/:id`, `POST /items/:id/fork` | im Speicher |
| `GET /itemlists/:id/items`, `add-item`, `remove-item` | im Speicher |
| `GET /tours/feed`, `GET /tours/:id/full` | die zwei Beispieltouren |
| alles Schreibende, alles mit Konto | 501 mit klarer Meldung — die Knöpfe dazu gibt es gar nicht |

**Was verschwindet:** Login und Logout, „Save" und „Load" in beiden Toolbars,
die Kontoseite samt Route (`main.jsx`) und ihrem Eintrag in der Sitemap
(`vite.config.js`), der Bild-Upload im Anlegen-Formular, der Account-Link in
Navigation und Footer. `requireLogin()` gibt im Demo-Modus immer `true` zurück,
`LockedRegion` sperrt nichts.

**Was bleibt und wirklich arbeitet:** GPX lesen samt Kilometern und
Höhenmetern, die Karte, die Katalogsuche über alle 500 Einträge, eigene Items
anlegen, Gewichts- und Preissumme, der PDF-Export.

**Der Demo-Streifen** (`components/DemoNotice/`) sitzt unter der Navigation auf
jeder Route. Er ist nicht Kosmetik: auf der Portfolio-Seite steht bei diesem
Projekt „Full-Stack · React, Express, MongoDB", und wer die Entwicklerwerkzeuge
aufmacht und null Netzwerkanfragen sieht, hält das Backend für eine
Behauptung. Deshalb verlinkt er den Server-Code und `public/openapi.json`.

**Zustand im Speicher, nichts sonst.** Kein localStorage, kein IndexedDB — die
Zusage im Streifen lautet „nothing leaves this device", und dazu gehört, dass
auch nichts darauf zurückbleibt.

## Bewusste Entscheidungen
- **React-Context statt Redux.** Es gibt drei klar getrennte Zustände (Packliste, Tourformular, Nutzer) und keinen Bedarf für einen globalen Store. Redux ist installiert, aber nirgends benutzt — es fliegt raus, es kommt nicht zurück.
- **JavaScript statt TypeScript.** Entscheidung für dieses Projekt, nicht für neue: **jedes neue Projekt startet weiter in TypeScript ab der ersten Datei.**

## Bekannte Baustellen
- [ ] **LCP 3,1 s auf Mobile** (DoD verlangt < 2,5 s). Die Messung ist eindeutig: Load Delay 0 ms, Load Time 6 ms, **Render Delay 2,6 s** — das Bild liegt nach 48 ms vollständig vor, die Zeit geht für den React-Start auf der gedrosselten CPU drauf. Bild- und Bundle-Optimierung sind ausgereizt; das letzte Stück bräuchte Prerendering oder SSR. Bewusst offen gelassen, weil das die Architektur ändert
- [ ] **Ohne JavaScript ist die Seite leer** (`<div id="root"></div>`). Bei einer client-gerenderten SPA erwartbar, für den DoD-Punkt „Kerninhalte ohne JS" aber ein Nein. Dieselbe Ursache wie oben, dieselbe Lösung
- [ ] Kein CSRF-Token. `sameSite: 'lax'` deckt den üblichen Fall ab, ersetzt aber kein echtes Token, sobald die App öffentlich erreichbar ist
- [ ] **Cookie ohne `secure` im lokalen Betrieb.** `COOKIE_SECURE=true` ist vorbereitet und in `.env.example` dokumentiert — beim Deployment setzen
- [ ] Passwort ändern und Konto wiederherstellen fehlen — es gibt nur Registrieren, Einloggen, Ausloggen und Konto löschen
- [ ] **Preise, Gewichte und Marken im Katalog sind größtenteils geschätzt, nicht belegt.** Belegt sind fünf Gewichte aus der Quelle (Zelt 548 g, Isomatte Sommer 332 g, Isomatte Winter 640 g, Kopfkissen 60 g, Schlafsack F/H 777 g) und 33 Marken, die sich aus den Produktlinks ableiten lassen (Rose, Gore Wear, Ergon, Gaerne, Oakley, Garmin, Carinthia, Amazonas, Outdoor Research, Point 65, Novritsch, Fritz Meinecke). Alles andere ist eine plausible Annahme zum jeweiligen Produkt, damit die Summen nicht bei null stehen und die Marke nicht leer bleibt. Wer echte Zahlen braucht, muss sie gegen die Produktseiten prüfen
- [ ] **Beigesteuerte Items werden nicht moderiert.** Wer eingeloggt ist, kann beliebig viele Einträge in den gemeinsamen Katalog stellen; es gibt weder Meldefunktion noch Mengenbegrenzung noch eine Dublettenprüfung gegen bestehende Einträge. Für den lokalen Betrieb egal, für eine offene Plattform nicht
- [ ] Der Katalog trägt auch die Nicht-Rad-Abschnitte der Quelle (Airsoft, Kampfsport, Gaming-PC, Bücher) — alle unter `Other`. Bewusst so übernommen, weil die ganze Liste gewünscht war; falls das stört, ist der Filter `Section` im Seed die Stelle
- [ ] `Imprint`/`Privacy`/`Terms` existieren nicht (im Footer als unausgefüllte Felder ausgewiesen, nicht verlinkt)
- [ ] Echtes Handy, Querformat und Fast 3G nicht geprüft — dafür braucht es ein Gerät
- [ ] **Der Demo-Modus hält nichts fest.** Was in einem Tab entsteht — angelegte Items, die Packliste, der geladene Track — ist beim Neuladen weg. Bewusst so (Stufe 1): kein localStorage, kein IndexedDB, damit die Zusage „nichts verlässt dieses Gerät und nichts bleibt" stimmt. Persistenz im Browser wäre Stufe 2
- [ ] **`public/openapi.json` ist eingecheckt und kann veralten.** Es entsteht nur neu, wenn der Build dort läuft, wo auch `Server/node_modules` liegt (`swagger-jsdoc`). Wer Server-Routen ändert, muss lokal einmal `npm run build` laufen lassen und die Datei mitcommitten
- [ ] **Zwei Konsolen-Warnungen im Produktions-Build, beide älter als der Demo-Modus und in beiden Betriebsarten gleich:** `No HydrateFallback element provided` beim Direktaufruf einer `lazy`-Route (`/overview`, `/tour/:id`), und `HeroIMG1-480 … preloaded but not used` auf jeder Route außer der Startseite — der Preload steht unbedingt in `index.html`, das Bild gibt es nur auf `/`. Beides sind Warnungen, keine Fehler; angefasst wurde keine, weil beide an der gemessenen LCP-Optimierung hängen
- [ ] **Impressum und Datenschutzerklärung fehlen weiterhin — für eine öffentlich erreichbare Seite in Deutschland ist das nicht optional.** Der Footer weist beides als offen aus. Vor dem Schalten der Domain zu klären; siehe die Liste im Dach-`CLAUDE.md` des Portfolios

### Erledigt beim Härtungsdurchgang (2026-08-22)
Der Prüfdurchgang davor hatte 4 Blocker, 7 Sicherheitsbefunde und 13 kleinere Sachen gefunden. Bis auf die zwei Punkte oben ist alles abgearbeitet und nachgemessen.

**Startete nicht auf fremden Rechnern:**
- **`multer` und `xmldom` waren in keiner `package.json` deklariert** und liefen nur, weil sie zufällig in einem globalen `node_modules` außerhalb des Projekts lagen. Nach `git clone && npm install` brach der Serverstart ab. Beide sind jetzt Abhängigkeiten, `xmldom` dabei auf den gepflegten Fork `@xmldom/xmldom` umgestellt
- **`swagger-jsdoc` und `swagger-ui-express` standen in `devDependencies`**, werden aber beim Start unbedingt geladen — `npm ci --omit=dev` wäre abgestürzt. Jetzt reguläre Abhängigkeiten
- **CORS stand fest auf `http://localhost:5173`**, der Produktions-Build auf `:4173` bekam bei jedem Aufruf einen CORS-Fehler und lud keine einzige Tour. Kommt jetzt aus `CORS_ORIGIN`, Standard sind beide lokalen Adressen
- **`npm audit`: je eine kritische Lücke** auf beiden Seiten (`jspdf` direkt, `tar` über `bcrypt`). Beide Seiten stehen jetzt auf **0 Lücken**; bcrypt ist dafür auf 6 gegangen (Hashes bleiben kompatibel, Login nachgeprüft)

**Sicherheit:**
- **Publish-Gate war umgehbar.** `PUT /tours/:id` nahm `Public` aus dem Body an — verworfen wurden nur `Owner` und `Author`. Damit ließ sich eine Tour ohne Cover, ohne Track und mit null Items in den öffentlichen Feed stellen. `delete value.Public` in `tours.js`; Sichtbarkeit geht ausschließlich über `/publish`
- **Keine Sicherheits-Header.** `helmet` sitzt jetzt vor den Routen. Zwei Voreinstellungen mussten weichen, sonst bricht die App: `crossOriginResourcePolicy` auf `cross-origin` (sonst verweigert der Server dem Frontend auf einem anderen Port jedes hochgeladene Bild) und eine eigene, weitere CSP nur unter `/docs` (Swagger UI startet über ein Inline-Script)
- **Fehlerseiten gaben absolute Serverpfade preis.** Ein 413 lieferte Express' Standard-Fehlerseite samt Stacktrace und Benutzernamen. Zentraler Error-Handler am Ende von `app.js`, dazu ein 404-Handler — beide antworten mit JSON und kurzer Meldung
- **Kontolöschung ließ alles zurück.** Eine veröffentlichte Tour blieb für immer im Index, weil `ownTour()` auf kein Konto mehr passte. `DELETE /users/me` räumt jetzt eigene Touren samt GPX- und Cover-Dateien, Packlisten und `PRIVATE`-Items ab; `COMMUNITY`-Items bleiben stehen (sie liegen in fremden Listen), verlieren aber ihren Besitzer
- **Bildinhalte wurden nicht geprüft.** Endung und gemeldeter MIME-Typ kommen beide vom Client — eine HTML-Datei als `x.png` kam durch und wurde als `image/png` wieder ausgeliefert. `looksLikeImage()` in `IMG_Upload.js` prüft jetzt die ersten Bytes (JPEG/PNG/WEBP-Signatur) und löscht, was durchfällt
- **Kein Rate Limit auf dem Login.** `express-rate-limit` auf `/login` und `/register`: 10 Fehlversuche je 15 Minuten, erfolgreiche zählen nicht mit

**Bedienung:**
- **Tour-Kacheln und das Katalog-Suchfeld hatten keinen Fokusring.** Tailwind-4-Falle: `outline-none` setzt auch `--tw-outline-style: none`, und genau die Variable liest `focus-visible:outline-2` danach aus — Farbe und Breite kamen an, der Stil blieb `none`. An der Kachel ist `outline-none` raus (die globale Regel zeichnet den Ring), am Suchfeld sitzt der Ring jetzt über `has-[:focus-visible]` am Rahmen
- **Das versteckte Dateifeld in `FileDrop` war unbeschriftet** — axe meldete das als kritisch, je einmal im „New item"- und zweimal im Publish-Dialog. Bedient wird der Knopf daneben, deshalb ist das Feld jetzt `aria-hidden`
- **Der GPX-Dialog hatte noch seine eigene Drop-Zone** — mit demselben unbeschrifteten Feld und einer Größenanzeige, die unter einem Kilobyte „0 KB" schrieb. Auf `FileDrop` umgestellt, 37 Zeilen weniger
- **Ein Hinweistext sagte das Gegenteil dessen, was passiert:** „Add it yourself — it stays on your account", während selbst angelegte Items `COMMUNITY` werden und für alle sichtbar sind. Angeglichen an den Text im Formular
- **404-Seite lief bei 320 px 24 px aus dem Bild.** Sie hatte sich `t-display` geliehen, das `white-space: nowrap` trägt — der Vertrag der drei Hero-Zeilen, aber falsch für „Sheet not found". Jetzt `t-h1`
- „1 items" pluralisiert korrekt

**Tempo und Auffindbarkeit:**
- **Hauptbundle von 989 kB auf 378 kB** (gzip 315 → 124 kB). jspdf, jspdf-autotable und html2canvas werden über `import()` erst beim Export geladen; die Routen außer der Startseite hängen an `lazy`, wodurch Leaflet (153 kB) nur noch auf `/overview` und `/tour/:id` lädt
- **Aufmacherbild in fünf Größen** (480/800/1200/1600/2222) mit `srcset`. Mobile lädt 29 kB statt 263 kB. Das `sizes` ist nachgemessen, nicht geschätzt, und steht als `HERO_SIZES` in `vite.config.js` neben demselben Wert im `<img>` — weichen sie voneinander ab, lädt der Browser zwei Größen
- **`robots.txt` und `sitemap.xml` gab es nicht** — schlimmer noch, die SPA beantwortete beide mit ihrem `index.html` und Status 200, was Lighthouse als kaputte robots.txt mit 48 Fehlern las. Beide werden jetzt beim Build erzeugt
- **`canonical`, `og:url` und ein absolutes `og:image`** ergänzt; `og:image` war ein relativer Pfad und hätte in keiner Link-Vorschau funktioniert. Die Adresse kommt aus `VITE_SITE_URL` über ein kleines Vite-Plugin, damit sie an einer Stelle steht statt an vieren. Das alte `og:image` war ein 2-MB-PNG mit `.jpg`-Namen — ersetzt durch `public/IMG/og-cover.jpg`, 1200 × 630, 76 kB
- **Jeder anonyme Besucher bekam ein 401 in die Konsole**, weil die App den Token nicht sehen kann und deshalb immer nach `/users/me` fragte. Der Server setzt beim Login zusätzlich ein lesbares `signed_in`-Cookie ohne jede Vollmacht; ohne das fragt das Frontend gar nicht erst
- `<link rel="preload">` fürs LCP-Bild, mit `imagesrcset`/`imagesizes` aus dem Build

**Aufgeräumt:**
- **`npm run lint`: 0 Errors, 0 Warnings.** Die beiden alten `react-refresh`-Fehler sind weg: `SetupItemsContext` und `TourFormContext` liegen jetzt allein in ihren Dateien, die Provider daneben (`PacklistContext.jsx`, `TourFormProvider.jsx`), der leere Ausgangszustand des Tourblatts in `tourFormEmpty.js`
- `Server/.env.example` angelegt, `Projekt/README.md` neu geschrieben (die alte nannte Redux und einzelne `npm install`-Aufrufe)
- Der PDF-Export benutzte noch `CLAY = [162, 78, 43]` — die Farbe von vor der Umfärbung. Jetzt `[96, 108, 56]` wie im Rest der App

### Erledigt beim Cleanup-Durchgang (2026-08-20)
Rund 42 MB entfernt, davon 72 kB Quelltext — die App verhält sich unverändert.

- **Toter Code raus:** vier nie importierte Icons (`IconRoute`, `IconElevation`, `IconSheet`, `IconTarget`) und die ungenutzte `SheetSection` aus `ui/Sheet.jsx`. Dazu in `index.css` die Regeln `.a-lift`, `.m-hatch--ink` und `.no-print` sowie die Keyframes `plot-y` und `plot-lift`, auf die keine Regel mehr zeigte. `.a-d1`–`.a-d4` sehen ungenutzt aus, sind es aber nicht: `SheetHero` baut den Klassennamen als `a-d${i + 1}` zusammen
- **Verwaiste Uploads raus:** die 23 Produktfotos in `Server/images/bikepacking/` (Reste der 2026-08-19 gelöschten Alt-Items) und der Alt-Track `1252km_8300hm___Bordeaux_-_Sevilla.gpx`. Vorher gegen die DB geprüft: 0 Items mit Bild, 0 Touren mit diesen Verweisen
- **`Server/images/bikepacking/` bleibt als Ordner bestehen** (`.gitkeep` mit Begründung). multer legt ihn zwar bei Bedarf an, aber die Leseroute und `dropIfUnused()` erwarten ihn als festen Ort — und ein frischer Clone soll das Upload-Ziel mitbringen
- **Bild-Originale raus:** `CTA.png`, `CTA_old.png` (alte Entwürfe — `CTA.jsx` rendert längst eine Live-Tabelle), `HeroIMG3.jpg`, `react.svg` sowie die `.jpg`/`.png`-Master zu den benutzten `.webp`-Dateien. **Damit gibt es zu den Kachelbildern kein Original mehr** — wer sie neu exportieren will, braucht neue Quelldateien. `public/IMG/HeroIMG2.jpg` ist geblieben, es hängt als `og:image` in `index.html`
- **Ungenutzte Pakete deinstalliert:** `@reduxjs/toolkit`, `react-redux` (nie benutzt), `xmldom` (GPX-Parsing läuft serverseitig) sowie `autoprefixer` und `postcss` (Tailwind 4 läuft über das Vite-Plugin, eine PostCSS-Config gibt es nicht)
- **Vite-Boilerplate-README gelöscht** — stand unverändert auf dem Template-Text und sagte nichts über dieses Projekt
- `dist/` und `.impeccable/` von der Platte geräumt (beide gitignored und regenerierbar), dazu `Server/routes/.DS_Store`
- `.claude/launch.json` kennt jetzt auch den Server, nicht nur das Frontend
- **Die fünf Demo-Touren sind weg** — auf Wunsch: eigene Beispiele folgen. Entfernt wurden die DB-Einträge, ihre fünf Packlisten, `scripts/seedTours.js`, das npm-Script `seed:tours`, die fünf `*-demo.gpx` und die fünf Cover in `public/IMG/`, die nur diese Touren benutzt haben. `npm run seed` ist jetzt ein Alias auf `seed:catalog`. Vor dem Löschen geprüft: keine andere Tour zeigte auf diese Packlisten, keine der Touren hatte einen Owner
- **Die Startseite steht damit im Leerzustand**, bis jemand eine eigene Tour veröffentlicht. `TourIndex` fängt das mit `EmptyPlate` ab — im Browser geprüft

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
- Die 23 Alt-Items aus der ersten Projektphase (22 davon mit echten Produktfotos) sind gelöscht; die DB hält jetzt ausschließlich die 277 Katalogeinträge, alle ohne Bild. Die Bilddateien lagen danach noch ungenutzt in `Server/images/bikepacking/` und sind beim Cleanup-Durchgang gelöscht worden
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

### Stand 2026-09-06 (Karte), beim Durchtesten des Demo-Builds gefunden

Drei Sachen, alle an derselben Stelle und alle älter als der Demo-Modus:

- **Die Karte lag über allem.** Leaflet legt seine Ebenen auf z-index 200–700 und seine Bedienelemente auf 800–1000. `.leaflet-container` war kein Stapelkontext, also galten diese Zahlen gegen die ganze Seite — die Karte deckte die klebende Navigation (z-40) und jeden Dialog (z-50) zu. Jetzt `isolation: isolate` plus `z-index: 0` am Container in `index.css`; keine Leaflet-Ebene selbst angefasst. Nachgemessen: über dem Navigationsband liegt wieder das `<nav>`, über der Karte der Dialog-Hintergrund
- **Die Kacheln trugen „API KEY REQUIRED" quer über die Karte.** CARTO verlangt für seine Basemaps inzwischen einen Schlüssel; die Anfrage kam mit 200 und einem PNG zurück, nur eben mit Wasserzeichen. Umgestellt auf `tile.openstreetmap.org` (kein Schlüssel nötig), Attribution entsprechend. Damit die Karte weiter zum Blatt passt, entfärbt `.leaflet-tile-pane` den Untergrund — die geplottete Linie ist dann die einzige Farbe darauf, was der Rolle von Clay in `DESIGN.md` entspricht
- **Die Strecke war noch im alten Clay gezeichnet.** `#a24e2b` in `Tour_Full.jsx` und `pages/tour.jsx` — die Farbe von vor der Umfärbung am 2026-08-18, derselbe Rest, der im PDF-Export schon gefunden worden war. Jetzt `#606c38`

Danach nachgemessen: `npm run lint` 0/0, Build ohne Fehler, Konsole ohne Fehler, axe-core 0 Verstöße auf der Tourseite, alle 18 geladenen Kacheln von `tile.openstreetmap.org`.

**Entschieden am 2026-09-06:** die Kacheln bleiben bei OpenStreetMap. Zur Debatte stand, die CARTO-Kacheln samt Wasserzeichen stehenzulassen, um sich rechtlich nichts einzuhandeln — das dreht die Lage um. Ohne Schlüssel wäre es ein fremder Dienst, der außerhalb seiner Bedingungen genutzt wird, und die Attributionspflicht bliebe dieselbe: CARTOs Kacheln sind selbst aus OSM-Daten gemacht. Dazu kündigt CARTO seine Raster-Kacheln ohnehin ab, die URL hört also irgendwann auf zu liefern.

Was die Richtlinie der OSM Foundation verlangt, ist erfüllt: sichtbare Attribution, HTTPS auf `tile.openstreetmap.org`, Referer aus dem Browser, Cache-Header werden respektiert, kein Vorladen und kein Offline-Archiv (Leaflet holt nur, was im Bild ist). Sie zielt auf Masse und Automatisierung, nicht auf kleine persönliche Seiten. Einen eigenen User-Agent wünscht sie sich zusätzlich — den kann eine Webseite nicht setzen, dort identifiziert der Referer die Seite.

**Bleibt zu beobachten:** bekommt die Seite je ernsthafte Last, verlangt dieselbe Richtlinie einen eigenen oder kommerziellen Kachelserver. Das ist dann ein Tausch von einer URL, keine Umbauarbeit. Die dritte Möglichkeit — gar keine Hintergrundkarte, nur die geplottete Linie auf dem Raster — wurde verworfen, weil man dann nicht mehr sieht, wo die Tour liegt.

### Stand 2026-09-05 (Demo-Modus), gemessen am Produktions-Build auf `:4173`

**Baut und läuft**
- `npm run lint`: **0 Errors, 0 Warnings**
- `VITE_DEMO=true npm run build`: 0 Fehler. Hauptbundle **385,4 kB** (127 kB gzip); kein `user`-Chunk, weil die Kontoseite in dieser Betriebsart nicht existiert
- `VITE_DEMO=false npm run build`: 0 Fehler. Hauptbundle **377,9 kB** (124 kB gzip) — der Adapter wird herausgeworfen, `grep` findet weder `demo-visitor` noch die Beispieltouren in `dist/assets/`
- Konsole im Demo-Build: **keine Fehler**. Zwei Warnungen, beide auch im Nicht-Demo-Build und beide älter als diese Änderung (siehe Baustellen)
- Netzwerk-Tab im Demo-Build: **keine Anfrage an eine API, keine fehlgeschlagene Anfrage**. Geladen werden `catalog.json` und die zwei GPX-Dateien, sonst nur eigene Assets

**Der Test, auf den es ankam: dieselbe Datei gegen den echten Server**
Beide Beispieldateien in `Server/files/bikepacking/` abgelegt, den echten Express auf `:3030` gestartet und `GET /bikepacking/loadGpx/…` gegen `src/lib/gpx.js` im Browser gestellt (die ausgelieferte Datei importiert, keine Nachbildung):

| Datei | Server | Browser |
|---|---|---|
| `alpe-dhuez.gpx` | km `15.32` · hm `1252` · 933 Punkte · „Bourg-d'Oisans - Alpe d'Huez" | **identisch** |
| `freiburg-feldberg.gpx` | km `26.77` · hm `1354` · 928 Punkte · „Freiburg - Feldberg" | **identisch** |

Erster und letzter Koordinatenpunkt ebenfalls identisch. Die Testdateien sind danach wieder gelöscht; `Projekt/Server/` ist unverändert (keine Datei dort heute angefasst).

Fehlerfälle wortgleich zum Server: falsche Endung → „Only .gpx files are accepted.", über 10 MB → 413 „The GPX file is larger than 10 MB.", keine Datei → „No GPX file uploaded.", kaputte Datei → „That file could not be read as GPX.". Gültiges XML ohne `<trk>` ergibt wie auf dem Server 0,00 km und „Unbenannte Tour".

**Im Browser durchgespielt (Demo-Build, ohne Konto)**
- Startseite: zwei Beispieltouren, Distanz und Höhenmeter aus der Datei gerechnet (27 km/1.354 m und 15 km/1.252 m), Packlisten mit 25 bzw. 18 Items — alle Namen im Katalog gefunden
- Tourseite: Karte mit Polyline und Kacheln, 18 Items, 9,55 kg Gesamtgewicht
- `/overview`: **0 gesperrte Regionen**, kein „Log in", kein „Save", kein „Load" — Toolbars zeigen „New" und „Upload GPX" bzw. „New" und „Export PDF"
- GPX-Dialog: Beispieltrack laden → 15 km/1.252 m mit Polyline; echte Datei über das Dateifeld hochladen → 27 km/1.354 m, und der Dateiname des Clients wird wie serverseitig durch einen erzeugten ersetzt (`mtortv2g-1i8hg2s5.gpx`)
- Katalogsuche „zelt" → 7 Treffer, zwei Items übernommen, Summen 1,46 kg / 158,90 EUR
- PDF-Export: „Saved as packing-list-setup.pdf."
- `/user` gibt im Demo-Modus die 404-Seite, die Sitemap führt die Route nicht mehr

**Nicht-Demo-Build gegen den laufenden Server**
Unverändert: echter Request an `http://localhost:3030/bikepacking/tours/feed?limit=30` → 200, „Log in" und Account-Link wieder da, 2 gesperrte Regionen auf `/overview`, „Not signed in", keine Konsolenfehler.

**Barrierefreiheit und Responsive (Demo-Build)**
- axe-core (WCAG 2.0/2.1 A+AA): **0 Verstöße** auf `/`, `/overview`, `/tour/:id`, 404 — und im GPX-Dialog mit dem neuen Beispielblock
- 8 Breiten (320/375/480/768/1024/1280/1920/2560): **nirgends horizontales Scrollen**, auch nicht bei offenem Dialog
- Touch-Ziele im Demo-Streifen und im Dialog: **keines unter 44 × 44 px**

**Nicht geprüft**
- Lighthouse am Demo-Build (LCP dürfte sich durch den Streifen leicht verschieben)
- Der Deploy selbst: `_redirects` ist gebaut und liegt in `dist/`, aber nur Cloudflare kann zeigen, dass der Fallback dort greift. Lokal fängt `vite preview` den Direktaufruf ohnehin selbst ab
- Echtes Handy, Querformat, Fast 3G

### Stand 2026-08-22 (Härtungsdurchgang), gemessen am Produktions-Build auf `:4173` und live gegen den Server auf `:3030`

**Baut und läuft**
- `npm run build`: 0 Fehler. Hauptbundle 378 kB (124 kB gzip), keine 500-kB-Warnung mehr
- `npm run lint`: **0 Errors, 0 Warnings**
- Browser-Konsole im Produktions-Build: **leer** — kein Fehler, keine Warnung, auf frischem Tab geprüft
- `npm audit`: **0 Lücken**, Frontend wie Server

**Lighthouse 12.8.2 gegen den Produktions-Build**
- Mobile, drei Läufe, identisch: **Performance 91 · Accessibility 100 · Best Practices 100 · SEO 100**
  FCP 2,2 s · LCP 3,1 s · TBT 100–120 ms · CLS 0
- Desktop: **100 · 100 · 100 · 100** — FCP 0,5 s · LCP 0,6 s · TBT 0 ms · CLS 0,005
- LCP-Aufschlüsselung Mobile: TTFB 457 ms, Load Delay **0 ms**, Load Time **6 ms**, Render Delay **2612 ms** — das Bild liegt nach 48 ms vollständig vor, die Zeit ist React-Startzeit. Deshalb bleibt LCP über der 2,5-s-Grenze; siehe Baustellen
- `robots.txt` von Lighthouse als gültig gelesen (vorher: 48 Fehler, weil die SPA HTML auslieferte)

**Barrierefreiheit**
- axe-core (WCAG 2.0/2.1 A+AA): **0 Verstöße** auf `/`, `/overview`, `/user`, `/tour/:id`, 404 — und zusätzlich in den drei Dialogen, die vorher Verstöße hatten: GPX-Upload, „New item", „Publish tour" (dort waren es 1 bzw. 2 kritische)
- Fokusring: auf `/` alle 21 fokussierbaren Elemente mit sichtbarem Ring, mit echten Tab-Anschlägen gemessen (programmatisches `.focus()` löst `:focus-visible` nicht aus und misst falsch). Tour-Kachel: `solid 2px rgb(96,108,56)`, Katalog-Suchfeld: Ring am Rahmen über `has-[:focus-visible]`
- Modal: Fokusfalle hält (Tab vom letzten Element springt aufs erste), `Esc` schließt, Fokus kehrt zum Auslöser zurück, Body-Scroll wird wiederhergestellt
- Touch-Ziele: 0 unter 44 × 44 px auf allen Routen
- Kein Bild ohne `alt`, kein Formularfeld ohne Label

**Responsive**
- 5 Routen × 11 Breiten (320/375/480/620/768/1024/1100/1280/1440/1920/2560): **nirgends horizontales Scrollen**, bei echtem Viewport gemessen. Die 404-Seite lief vorher bei 320 px 24 px aus dem Bild
- 200 % Zoom (640 × 512): kein Überlauf, kein abgeschnittener Text, Ziele weiter ≥ 44 px

**Sicherheit, live gegen den laufenden Server**
- Sicherheits-Header gesetzt: CSP, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `X-Frame-Options`, `Cross-Origin-Resource-Policy: cross-origin`, HSTS
- Publish-Bypass geschlossen: `PUT /tours/:id {"Public":true}` ändert die Sichtbarkeit nicht mehr, die Tour bleibt aus dem Feed; `/publish` lehnt unvollständige Touren weiter mit 400 ab
- Bild-Upload: HTML als `x.png` mit `image/png` deklariert → 400; echtes PNG → 200
- Rate Limit: 14 Fehlversuche → ab dem 10. durchgehend 429
- Kontolöschung: veröffentlichte Tour verschwindet aus dem Feed, GPX und Cover sind von der Platte (beide 404), Packliste und `PRIVATE`-Fork gelöscht, `COMMUNITY`-Item bleibt mit `Owner: null`
- 404 und 413 antworten als JSON ohne Stacktrace (vorher gab der 413 absolute Serverpfade preis)
- CORS: `localhost:5173` und `localhost:4173` erlaubt, fremde Origin ohne Freigabe
- Unverändert dicht geblieben: Path Traversal auf `loadImage`/`loadGpx` (400), Schreiben ohne Token (401), NoSQL-Injection im Login (400), Konten-Isolation (durchgehend 404), Mass Assignment beim Anlegen, Katalogschutz (409)
- Cookies: `token` HttpOnly, `signed_in` bewusst lesbar und ohne Vollmacht

**Funktion, im Browser gegen den Produktions-Build durchgespielt**
- Registrieren über die Oberfläche, Sperrbereiche fallen von 2 auf 0
- GPX hochladen → 27 km / 400 hm aus der Datei gerechnet, Karte mit Polyline; Dateigröße zeigt „194 B" statt „0 KB"
- Falsche Endung im GPX-Dialog → „Use a .gpx file."
- Katalogsuche, Item übernehmen (Kategorie zeigt „1 item", Singular), eigenes Item anlegen, Setup speichern
- PDF-Export: 10 kB, Erfolgsmeldung mit Dateinamen. Der laufende Zustand am Knopf greift — beim ersten Export dauerte er die vollen 8 s (Chunk wird nachgeladen), danach 2 ms, per MutationObserver nachgewiesen
- Veröffentlichen mit Cover-Upload und Packlisten-Auswahl, Tour steht mit allen Daten im Feed; Zurückziehen und Löschen ebenfalls durchgespielt
- Falsches Passwort: Dialog bleibt offen mit „That username and password do not match."

**Nicht geprüft**
- Echtes Handy, Querformat, Fast 3G, fremdes Gerät — dafür braucht es Hardware
- Der 30-Sekunden-Test mit einer Person, die das Projekt nicht kennt
- Verhalten bei parallelen Sitzungen

### Stand 2026-08-19 (Funktionsausbau), gemessen am laufenden Dev-Build

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
