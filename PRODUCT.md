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
- **Katalog:** Items liegen serverseitig mit Bild, Gewicht, Preis und Produktlink. Nutzer legen eigene Items an, inklusive Bild-Upload.
- **Sitzung:** Login über Username/Passwort, `userId` in `sessionStorage`. Ohne Login sind Speichern und Laden nicht möglich, das Planen selbst schon.
- **Betrieb:** Läuft ausschließlich lokal. Frontend Vite auf `:5173`, Express-Server auf `:3030`, MongoDB. Kein Deployment.

## Capabilities and Constraints

**Vorhanden:** GPX-Upload und -Parsing (km/hm), Leaflet-Karte mit Polyline, Tour-Formular, Tour speichern/laden, Packliste in 6 Kategorien (Bike and Bags, Camping Gear, Clothing, Hygiene, Tools, Other), Item anlegen/ändern/aus Liste entfernen, Bild-Upload, Setup speichern/laden, PDF-Export, Login/Register.

**Constraints:**
- Frontend JavaScript (JSX), React 19 + Vite 7, Tailwind 4. Kein TypeScript in diesem Projekt (bewusste, dokumentierte Entscheidung).
- Geteilter Zustand ausschließlich über die drei bestehenden Contexts: `PacklistContext`, `TourFormContext`, `UserContext`. Kein vierter Parallelzustand.
- Server-Aufrufe über axios, nicht über rohes `fetch` in Komponenten.
- `http://localhost:3030` steht über 20-mal hart im Frontend — bekannte Baustelle, macht die App undeploybar.
- Die Qualitätsschwelle ist `DEFINITION-OF-DONE.md`, Stufe „Portfolio". Sie ist bindend und explizit: nur nennen, was gemessen wurde.

**Kaputt / offen:**
- `lucide-react` wird in 5 Komponenten importiert, ist aber weder in `package.json` deklariert noch installiert — der Build schlägt fehl.
- `/user` ist eine Platzhalterseite ohne Funktion.
- Footer verlinkt `/impressum`, `/datenschutz`, `/agb` — diese Routen existieren nicht.
- `Packlist_Full.loadItemsFromItemlist` referenziert ein undefiniertes `setupData`.
- Ladezustände, Leerzustände und Fehlerzustände fehlen weitgehend (DoD 5).

## Brand Commitments

- Name: **Bikepacking** / Claim im Footer: „Tour. Setup. Packlist."
- Oberflächensprache: **Englisch**, durchgängig (vom Nutzer am 2026-08-18 bestätigt; die verbliebenen deutschen Popup-Texte werden nachgezogen).
- Visuelle Richtung, vom Nutzer verbindlich gesetzt: minimalistisches Architektur-/Studio-Branding — scharfe Kanten ohne Rundungen, gerade Linien, geometrische Gestaltungselemente, Schwarz-Weiß als Basis, erdige Akzente (Lehm primär, Oliv sekundär), Rastersysteme, viel Weißraum. Referenzen: Rule Studio, Zenit, EYRC Architects.
- Fotografie bleibt Teil des Systems, aber gerahmt im Raster statt als vollflächige Bühne (bestätigt 2026-08-18).

## Evidence on Hand

**Echt vorhanden:**
- Fotos in `Projekt/Frontend/Bikepacking/src/assets/` (HeroIMG1.jpg, HeroIMG3.jpg, CTA.png, NoImage.jpg) und `public/IMG/` (HeroIMG2.jpg, CardImage.jpg, Gravel.png, Kyrgistan.png, Peak_Planes.png, RAAM.png).
- Funktionierende Server-API mit Swagger unter `/docs`.

**Nicht echt, nicht als echt ausgeben:**
- Die fünf Touren im `CardSlider` (Morocco, Kyrgistan, Across Germany, Peak & Planes, RAAM 2025) sind Mock-Daten mit erfundenen Kilometer- und Höhenmeterwerten. Ihre `setupLink`-Ziele (`/setup/morocco` usw.) existieren als Routen nicht.
- `contact@example.com` ist eine Platzhalter-Adresse.
- Es gibt keine Nutzerzahlen, keine Testimonials, keine Presse. Nichts davon erfinden.

## Product Principles

1. **Die Tour rahmt die Liste.** Packliste und Tour gehören auf dieselbe Fläche; die Liste ohne ihren Anlass ist ein anderes Produkt.
2. **Zahlen sind der Inhalt.** Kilometer, Höhenmeter, Gramm, Euro — die App ist ein Rechenblatt mit Karte. Zahlen werden lesbar gesetzt, nicht dekoriert.
3. **Der Server ist die Wahrheit.** Jede Route wird serverseitig validiert; das UI versteckt nichts, was es nicht auch autorisiert.
4. **Planen geht ohne Konto, Behalten nicht.** Der Einstieg ist frei; Login ist der Preis fürs Speichern, nicht fürs Ausprobieren.
5. **Gemessen oder ungeprüft.** Die Definition of Done kennt kein „vermutlich okay". Jede Qualitätsaussage nennt ihr Ergebnis.

## Accessibility & Inclusion

Verbindlich über DEFINITION-OF-DONE.md, Stufe „Portfolio": Tastaturbedienbarkeit vollständig, Fokus immer sichtbar, Modals fangen den Fokus und schließen mit `Esc`, Touch-Ziele ≥ 44 × 44 px, Kontrast ≥ 4.5:1 für Text und ≥ 3:1 für UI, `prefers-reduced-motion` respektiert, semantische Landmarks mit genau einer `h1` pro Seite, jedes Formularfeld mit verknüpftem `<label>`, Fehlermeldungen sagen was zu tun ist. Aktueller Stand: nicht geprüft.
