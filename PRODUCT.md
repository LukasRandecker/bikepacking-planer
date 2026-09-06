# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Bikepacker, die eine mehrtägige Tour vorbereiten — überwiegend am Desktop, zu Hause, Wochen vor der Abfahrt, mit einem GPX-Track aus einem Routenplaner bereits in der Hand. Der Job ist nicht „Route finden", sondern **entscheiden, was mitkommt**: Welches Rad, welcher Schlafaufbau, welche Teile, wie viel Gewicht, wie viel Geld. Zweiter Kontext: dieselbe Person kurz vor der Abfahrt am Handy, die die Packliste abarbeitet.

Sekundär: Lukas Randecker selbst — das Projekt ist ein Hochschul-/Portfolioprojekt und muss als Arbeitsprobe bestehen.

## Product Purpose

Tour und Ausrüstung an einem Ort zusammenführen. Der Nutzer lädt einen GPX-Track hoch, sieht Distanz, Höhenmeter und Verlauf auf der Karte, beschreibt die Tour über ein Formular (Name, Zeitraum, Radtyp, Schlafaufbau, Bikepacking/Race, Solo/Group) und baut daneben eine Packliste aus einem Item-Katalog auf, gruppiert in sechs Kategorien. Beides zusammen ist ein „Setup", das pro Nutzerkonto gespeichert und als PDF exportiert wird.

Erfolg: Der Nutzer verlässt die App mit einer ausgedruckten oder exportierten Liste, die er beim Packen abarbeiten kann — und findet sie beim nächsten Mal wieder.

## Positioning

Routenplaner planen Routen. Packlisten-Apps planen Gepäck. Diese App verbindet beides: Die Packliste steht neben der konkreten Tour, nicht losgelöst von ihr. Gewicht und Preis werden pro Item geführt, sodass das Setup gegen die Strecke gerechnet werden kann.

## Operating Context

- **Eingang:** GPX-Datei aus einem externen Routenplaner (Komoot, Strava, RideWithGPS). Die App plant keine Route, sie liest eine.
- **Ausgang:** PDF-Export der Packliste (jspdf + jspdf-autotable).
- **Katalog:** 500 Einträge serverseitig mit Gewicht, Preis, Marke und Produktlink. Bilder hat der Grundkatalog keine — das schwarze Rechteck ist dort der Normalfall. Nutzer legen eigene Items an, wahlweise mit Bild-Upload; die landen im gemeinsamen Katalog.
- **Sitzung:** Login über Username/Passwort, bcrypt-Hash auf dem Server, JWT in einem httpOnly-Cookie — der Client sieht den Token nie. Ohne Login sind Speichern und Laden nicht möglich, das Planen selbst schon.
- **Betrieb:** Zwei Betriebsarten, ein Codestand. Voll läuft die App lokal — Frontend Vite auf `:5173`, Express-Server auf `:3030`, MongoDB. Für die Öffentlichkeit gibt es einen **Demo-Modus** (`VITE_DEMO=true`), der ohne Server auskommt: ein eigener Axios-Adapter beantwortet jeden API-Aufruf im Browser, es geht **keine einzige Anfrage an eine API** hinaus. Der Server selbst ist nirgends deployt.

## Capabilities and Constraints

**Vorhanden:** GPX-Upload und -Parsing (km/hm), Leaflet-Karte mit Polyline, Tour-Formular, Tour speichern/laden, Packliste in 6 Kategorien (Bike and Bags, Camping Gear, Clothing, Hygiene, Tools, Other), Item anlegen/ändern/aus Liste entfernen, Bild-Upload, Setup speichern/laden, PDF-Export, Login/Register.

**Im Demo-Modus vorhanden:** GPX lesen samt Kilometern und Höhenmetern, Karte, Katalogsuche über alle 500 Einträge, eigene Items anlegen, Gewichts- und Preissumme, PDF-Export. Diese Funktionen arbeiten echt — die GPX-Rechnung ist wortgleich aus dem Server portiert und liefert am 2026-09-05 gegen den laufenden Server gemessen dieselben Werte auf zwei Nachkommastellen.

**Im Demo-Modus nicht vorhanden:** Konten, Speichern, Laden, Veröffentlichen, Bild-Upload. Sie sind **ausgeblendet, nicht ausgegraut** — ein toter Knopf lädt zum Draufklicken ein und erklärt nichts. Ein Streifen unter der Navigation sagt Besuchern, was sie vor sich haben, und verlinkt Server-Code und OpenAPI-Beschreibung. Nichts wird gespeichert, weder auf einem Server noch im Browser.

**Constraints:**
- Frontend JavaScript (JSX), React 19 + Vite 7, Tailwind 4. Kein TypeScript in diesem Projekt (bewusste, dokumentierte Entscheidung).
- Geteilter Zustand ausschließlich über die drei bestehenden Contexts: `PacklistContext`, `TourFormContext`, `UserContext`. Kein vierter Parallelzustand.
- Server-Aufrufe über axios, nicht über rohes `fetch` in Komponenten.
- Serveradresse und eigene Adresse stehen je an einer Stelle: `VITE_API_URL` (über `src/lib/api.js`) und `VITE_SITE_URL` (über `vite.config.js`, versorgt canonical, og:url, robots.txt und sitemap.xml). Ob überhaupt ein Server da ist, weiß genau eine Stelle: `DEMO` aus `src/lib/demo.js`.
- Die Qualitätsschwelle ist `DEFINITION-OF-DONE.md`, Stufe „Portfolio". Sie ist bindend und explizit: nur nennen, was gemessen wurde.

**Kaputt / offen** (Stand 2026-08-22, nach dem Härtungsdurchgang):
- **LCP 3,1 s auf Mobile**, die DoD verlangt unter 2,5 s. Gemessen ist der Grund eindeutig: das Bild liegt nach 48 ms bereit, 2,6 s gehen für den React-Start drauf. Bild und Bundle sind ausgereizt — das letzte Stück bräuchte Prerendering, also eine Architekturänderung.
- **Ohne JavaScript ist die Seite leer.** Bei einer client-gerenderten SPA erwartbar, für den DoD-Punkt „Kerninhalte ohne JS" trotzdem ein Nein. Gleiche Ursache, gleiche Lösung.
- Kein CSRF-Token; `sameSite: 'lax'` deckt den üblichen Fall ab, reicht aber für den öffentlichen Betrieb nicht.
- Passwort ändern und Konto wiederherstellen fehlen.
- Beigesteuerte Katalogeinträge werden nicht moderiert.
- Impressum, Datenschutz und AGB sind nicht geschrieben — der Footer weist sie als offen aus und verlinkt sie nicht. **Für eine öffentlich erreichbare Seite in Deutschland ist das nicht optional**; vor dem Schalten einer Domain zu klären.
- Der Demo-Modus hält nichts fest: kein localStorage, kein IndexedDB. Was in einem Tab entsteht, ist beim Neuladen weg. Bewusst so, damit die Zusage im Streifen stimmt.
- Nicht geprüft, weil dafür Hardware oder eine zweite Person nötig ist: echtes Handy, Querformat, Fast 3G, der 30-Sekunden-Test.

Erledigt und nachgemessen: der `lucide-react`-Build-Abbruch, `/user` als Platzhalter, die toten Footer-Links, `Packlist_Full.loadItemsFromItemlist` und die fehlenden Lade-, Leer- und Fehlerzustände. Die Zustände sitzen inzwischen auf jeder Ansicht, die Daten lädt. Einzelheiten in `CLAUDE.md`.

## Brand Commitments

- Name: **Bikepacking** / Claim im Footer: „Tour. Setup. Packlist."
- Oberflächensprache: **Englisch**, durchgängig (vom Nutzer am 2026-08-18 bestätigt; die verbliebenen deutschen Popup-Texte werden nachgezogen).
- Visuelle Richtung, vom Nutzer verbindlich gesetzt: minimalistisches Architektur-/Studio-Branding — scharfe Kanten ohne Rundungen, gerade Linien, geometrische Gestaltungselemente, Schwarz-Weiß als Basis, erdige Akzente (Lehm primär, Oliv sekundär), Rastersysteme, viel Weißraum. Referenzen: Rule Studio, Zenit, EYRC Architects.
- Fotografie bleibt Teil des Systems, aber gerahmt im Raster statt als vollflächige Bühne (bestätigt 2026-08-18).

## Evidence on Hand

**Echt vorhanden:**
- Fotos in `Projekt/Frontend/Bikepacking/src/assets/` (HeroIMG1.webp, NoImage.jpg) und `public/IMG/` (HeroIMG2.jpg). Der übrige Bildbestand ist beim Cleanup-Durchgang 2026-08-20 entfallen — teils ungenutzt, teils Cover der gelöschten Demo-Touren.
- Funktionierende Server-API mit Swagger unter `/docs`.

**Echt vorhanden, seit 2026-09-05:**
- Zwei GPX-Beispieldateien in `Frontend/Bikepacking/public/demo/`. Mit BRouter über OpenStreetMap-Daten gerechnet — echte Straßen, echtes Gelände, echte SRTM-Höhen: Bourg-d'Oisans → Alpe d'Huez (15,32 km / 1.252 hm) und Freiburg → Feldberg (26,77 km / 1.354 hm). Lizenz: ODbL, © OpenStreetMap-Mitwirkende; Höhen SRTM (NASA/USGS, gemeinfrei). Die Herkunft steht in `Projekt/README.md`, im `<metadata>`-Block der Dateien und im Upload-Dialog.
- Die OpenAPI-Beschreibung der 22 Server-Routen, `Frontend/Bikepacking/public/openapi.json`, erzeugt aus den JSDoc-Kommentaren des Servers.

**Nicht echt, nicht als echt ausgeben:**
- Die fünf Beispiel-Touren (Morocco, Kyrgistan, Across Germany, Peak & Planes, RAAM 2025) waren erfundene Daten und sind am 2026-08-20 samt Seed-Skript gelöscht worden. Der Index zeigt jetzt ausschliesslich echte, von Konten veröffentlichte Touren — und ist leer, solange es keine gibt.
- `contact@example.com` ist eine Platzhalter-Adresse.
- Die zwei Touren, die im Demo-Modus auf dem Index stehen, sind **Beispiele und sagen das auch**: kein Autor, kein Titelfoto, und eine Beschreibung, die ausschreibt, was daran gerechnet und was gewählt ist. Echt sind Strecke, Distanz und Höhenmeter (aus der Datei, nicht eingetippt) und die Katalogwerte der Packliste; gewählt sind Zeitraum, Radtyp und Schlafaufbau — dieselbe Linie wie bei den Beispielzeilen im CTA. Sie geben sich nirgends als gefahrene Touren eines Kontos aus.
- Es gibt keine Nutzerzahlen, keine Testimonials, keine Presse. Nichts davon erfinden.

## Product Principles

1. **Die Tour rahmt die Liste.** Packliste und Tour gehören auf dieselbe Fläche; die Liste ohne ihren Anlass ist ein anderes Produkt.
2. **Zahlen sind der Inhalt.** Kilometer, Höhenmeter, Gramm, Euro — die App ist ein Rechenblatt mit Karte. Zahlen werden lesbar gesetzt, nicht dekoriert.
3. **Der Server ist die Wahrheit.** Jede Route wird serverseitig validiert; das UI versteckt nichts, was es nicht auch autorisiert.
4. **Planen geht ohne Konto, Behalten nicht.** Der Einstieg ist frei; Login ist der Preis fürs Speichern, nicht fürs Ausprobieren.
5. **Gemessen oder ungeprüft.** Die Definition of Done kennt kein „vermutlich okay". Jede Qualitätsaussage nennt ihr Ergebnis.

## Accessibility & Inclusion

Verbindlich über DEFINITION-OF-DONE.md, Stufe „Portfolio": Tastaturbedienbarkeit vollständig, Fokus immer sichtbar, Modals fangen den Fokus und schließen mit `Esc`, Touch-Ziele ≥ 44 × 44 px, Kontrast ≥ 4.5:1 für Text und ≥ 3:1 für UI, `prefers-reduced-motion` respektiert, semantische Landmarks mit genau einer `h1` pro Seite, jedes Formularfeld mit verknüpftem `<label>`, Fehlermeldungen sagen was zu tun ist. Stand 2026-08-22, gemessen am Produktions-Build: axe-core (WCAG 2.0/2.1 A+AA) meldet **0 Verstöße** auf allen fünf Routen und in allen Dialogen, Lighthouse Accessibility **100** auf Mobile und Desktop. Jedes fokussierbare Element hat einen sichtbaren Ring, kein Touch-Ziel liegt unter 44 × 44 px, und bei keiner der elf geprüften Breiten scrollt die Seite seitwärts. Nicht geprüft: echtes Handy und Querformat.
