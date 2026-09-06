# Bikepacking — Tour. Setup. Packlist.

Eine Planungsfläche für Bikepacking-Setups: GPX-Track hochladen, die Tour
beschreiben und daneben die Packliste aus einem Katalog von 500 Ausrüstungs­teilen
zusammenstellen. Jedes Item trägt Gewicht und Preis, das fertige Setup lässt
sich als PDF-Checkliste exportieren und pro Konto speichern. Veröffentlichte
Touren stehen mit Karte, Eckdaten und Packliste auf der Startseite.

Hochschul- und Portfolioprojekt. Der volle Betrieb läuft lokal; öffentlich
steht ein **Demo-Modus**, der ohne Server auskommt (siehe unten).

- **Frontend** — React 19, Vite 7, Tailwind 4, Leaflet · `Frontend/Bikepacking/`
- **Server** — Express 4, MongoDB über Mongoose, JWT im httpOnly-Cookie · `Server/`
- **Designsystem** — „Planblatt", dokumentiert in `../DESIGN.md`
- **Qualitätsmaßstab** — `../DEFINITION-OF-DONE.md`, Stufe „Portfolio"

## Voraussetzungen

- Node.js ≥ 18, npm ≥ 9
- MongoDB, lokal oder als Atlas-Cluster

## Einrichten

Zwei getrennte npm-Projekte — beide brauchen ihre eigenen Abhängigkeiten.

```bash
# Server
cd Projekt/Server
npm install
cp .env.example .env      # danach MONGO_URI und TOKEN_SECRET eintragen
npm run seed              # spielt den Item-Katalog ein (500 Einträge, idempotent)

# Frontend
cd ../Frontend/Bikepacking
npm install
```

Ohne `npm run seed` bleibt der Item-Picker leer. Die Startseite ist danach
trotzdem leer: sie füllt sich erst, wenn ein Konto eine eigene Tour
veröffentlicht — Demo-Touren gibt es bewusst keine.

## Env-Variablen

**`Server/.env`** — Vorlage samt Erklärungen in `Server/.env.example`.

| Variable | Pflicht | Standard | Wofür |
|---|---|---|---|
| `MONGO_URI` | ja | — | Verbindung zur MongoDB (DB-Name ist fest `bikepacking`) |
| `TOKEN_SECRET` | ja, ≥ 16 Zeichen | — | signiert die Sitzungs-Token; fehlt er, startet der Server nicht |
| `PORT` | nein | `3030` | Port des Servers |
| `CORS_ORIGIN` | nein | `localhost:5173,localhost:4173` | erlaubte Frontend-Adressen, kommagetrennt |
| `COOKIE_SECURE` | nein | `false` | beim Deployment auf `true` — sonst geht der Token über http |

**`Frontend/Bikepacking/.env.local`** — Vorlage in `.env.example`.

| Variable | Standard | Wofür |
|---|---|---|
| `VITE_API_URL` | `http://localhost:3030` | Adresse des Servers; im Demo-Modus ungenutzt |
| `VITE_SITE_URL` | `http://localhost:4173` | eigene Adresse; landet in `canonical`, `og:url`, `robots.txt` und `sitemap.xml` |
| `VITE_DEMO` | `false` | `true` schaltet den Demo-Modus ein (siehe unten) |

## Starten

```bash
# Server — http://localhost:3030, Swagger unter /docs
cd Projekt/Server
npm run dev

# Frontend — http://localhost:5173
cd Projekt/Frontend/Bikepacking
npm run dev
```

Beide müssen laufen: ohne Server zeigt die Startseite einen Fehlerzustand
statt Touren.

## Weitere Befehle

```bash
# Frontend
npm run build      # Produktions-Build nach dist/
npm run preview    # den Build ausliefern, http://localhost:4173
npm run lint       # ESLint

# Server
npm start                       # ohne Watch
npm run seed:catalog            # nur den Katalog, idempotent
npm run seed:catalog -- --prune # zusätzlich Katalogreste löschen
npm run migrate                 # Altdaten-Migrationen, alle wiederholbar
```

Tests gibt es keine.

## Demo-Modus — die App ohne Server

`VITE_DEMO=true` baut eine Fassung, die **keinen einzigen Netzwerkaufruf an eine
API absetzt**. Statt eines HTTP-Requests beantwortet ein eigener Axios-Adapter
(`src/lib/api.local.js`) jeden Aufruf im Browser. Für die aufrufenden
Komponenten ist das nicht zu unterscheiden — an den 29 Aufrufstellen und im
`Server/`-Ordner ändert sich dafür keine Zeile.

Fünf der neun Funktionen brauchen den Server ohnehin nicht, und es sind die,
die man ansieht:

| Funktion | Im Demo-Modus | Wo die Logik liegt |
|---|---|---|
| GPX lesen, km und Höhenmeter | läuft echt | `src/lib/gpx.js`, portiert aus `Server/GPX_Upload.js` |
| Karte zeichnen | läuft echt | Leaflet im Browser |
| Katalog, 500 Einträge, Suche und Filter | läuft echt | `public/catalog.json` |
| Packliste, Gewichts- und Preissumme | läuft echt | React-Context |
| PDF-Export | läuft echt | jsPDF im Browser |
| Konten, Speichern, Veröffentlichen, Bild-Upload | **nicht vorhanden** | braucht Server + MongoDB |

Was ein Konto braucht, ist in der Oberfläche **nicht da** — nicht ausgegraut:
kein Login, kein „Save", kein „Load", kein „Publish", keine Kontoseite. Ein
toter Knopf lädt zum Draufklicken ein und erklärt nichts. Ein Streifen unter
der Navigation sagt Besuchern, was sie vor sich haben, und verlinkt den
Server-Code und `public/openapi.json`.

Der Zustand liegt im Speicher und stirbt mit dem Tab: kein localStorage, kein
IndexedDB, nichts bleibt auf dem Gerät.

### Zwei Dateien kommen beim Build aus `Server/`

`npm run build` (und `npm run dev`) rufen vorher
`scripts/prepare-demo-assets.mjs` auf. Das Skript liest aus `Server/`, schreibt
aber nur nach `Frontend/Bikepacking/public/`:

- **`catalog.json`** — Kopie von `Server/data/catalog.json`, gitignored, weil sie
  bei jedem Build neu entsteht. Eine eingecheckte zweite Kopie liefe von der
  Quelle weg.
- **`openapi.json`** — die OpenAPI-Beschreibung der 22 Server-Routen, erzeugt aus
  denselben JSDoc-Kommentaren, aus denen der laufende Server seine
  Swagger-Oberfläche unter `/docs` baut. Sie ist eingecheckt, weil
  `swagger-jsdoc` in den Abhängigkeiten des Servers liegt und auf einem
  Build-Server, der nur das Frontend installiert, fehlt. Wer an den
  Server-Routen arbeitet, lässt lokal einmal `npm run build` laufen und checkt
  die neue Datei mit ein.

### Beispieltouren

`public/demo/` enthält zwei GPX-Dateien, damit ein Besucher ohne eigenen Track
nicht vor einer leeren Karte sitzt:

| Datei | Strecke | Gemessen |
|---|---|---|
| `alpe-dhuez.gpx` | Bourg-d'Oisans → Alpe d'Huez | 15,32 km · 1.252 hm · 933 Punkte |
| `freiburg-feldberg.gpx` | Freiburg → Feldberg | 26,77 km · 1.354 hm · 928 Punkte |

**Herkunft und Lizenz:** beide sind mit [BRouter](https://brouter.de/) über
OpenStreetMap-Daten gerechnet. Die Streckengeometrie stammt damit aus
OpenStreetMap, © OpenStreetMap-Mitwirkende, lizenziert unter der
[ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/); die Höhenwerte
kommen aus SRTM (NASA/USGS, gemeinfrei). Beide Angaben stehen zusätzlich im
`<metadata>`-Block der Dateien selbst. Es sind **gerechnete Routen über echte
Straßen, keine Aufzeichnungen** und keine offiziellen Routenführungen — der
Text im Upload-Dialog und in der Tourbeschreibung sagt das auch so.

Die beiden Touren auf dem Index tragen keinen Autor und kein Titelfoto, weil es
weder das eine noch das andere gibt. Distanz und Höhenmeter stehen nirgends im
Code: sie werden beim Aufruf aus der GPX-Datei gerechnet, mit derselben Formel
wie auf dem Server. Zeitraum, Radtyp und Schlafaufbau sind als Beispiel
gewählt, die Packlisten sind Auswahlen aus dem Katalog.

### Cloudflare Pages

| Feld | Wert |
|---|---|
| Framework preset | None |
| Root directory | `Projekt/Frontend/Bikepacking` |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Node version | 20 oder höher |
| Environment variable | `VITE_DEMO=true`, dazu `VITE_SITE_URL` auf die echte Adresse |

Das Root-Directory ist ein Unterordner, weil das Repo Frontend **und** Server
enthält; gebaut wird nur das Frontend.

`public/_redirects` schickt jede Adresse an `index.html`. Ohne die Datei
beantwortet der Static-Host den direkten Aufruf von `/overview` oder
`/tour/:id` mit 404 — dieses Projekt routet über `createBrowserRouter`, nicht
über Hash-Routing.

## Deployment mit Server

Bisher nicht deployt. Was dafür zu setzen ist:

1. `COOKIE_SECURE=true` — sonst geht der Sitzungs-Token unverschlüsselt über die Leitung.
2. `CORS_ORIGIN` auf die echte Frontend-Adresse.
3. `VITE_API_URL` und `VITE_SITE_URL` im Frontend auf die echten Adressen,
   `VITE_DEMO=false`, dann `npm run build`.
4. `Server/images/` und `Server/files/bikepacking/` liegen im Dateisystem und
   brauchen dauerhaften Speicher — auf einer Plattform mit flüchtigem
   Dateisystem sind Uploads nach dem nächsten Deploy weg.
5. Offen vor einem öffentlichen Betrieb: CSRF-Token (`sameSite: 'lax'` deckt
   nur den üblichen Fall ab) und Moderation der beigesteuerten Katalogeinträge.
