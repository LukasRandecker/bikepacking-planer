# Definition of Done — Stufe „Portfolio"

Eine Website gilt erst dann als fertig, wenn **jeder** Punkt geprüft **und das Ergebnis genannt** wurde.
Nicht abhaken, was nicht gemessen wurde. „Nicht geprüft" ist eine gültige Angabe — „vermutlich okay" nicht.

## 1. Baut und läuft
- [ ] `npm run build` läuft ohne Fehler durch
- [ ] `tsc --noEmit` meldet 0 Fehler
- [ ] ESLint: 0 Errors (Warnings dokumentiert oder behoben)
- [ ] Browser-Konsole im Produktions-Build: keine Errors, keine Warnings
- [ ] Keine toten Links, keine 404 auf Assets

## 2. Responsive — der harte Teil
- [ ] Getestet bei **320 / 375 / 480 / 768 / 1024 / 1280 / 1920 / 2560** px
- [ ] Zusätzlich **zwei krumme Breiten** (z. B. 620px, 1100px) — dort brechen Layouts wirklich
- [ ] Kein horizontales Scrollen bei irgendeiner Breite
- [ ] Bei **200 % Browser-Zoom** noch bedienbar (WCAG-Anforderung, kein Nice-to-have)
- [ ] Mit **langem Text** getestet: längster realistische Titel, längster Name, längste Überschrift
- [ ] Mit **leeren und fehlenden Daten** getestet
- [ ] Auf einem echten Handy geöffnet, nicht nur im DevTools-Emulator
- [ ] Querformat auf dem Handy geprüft
- [ ] Kein Inhalt hinter Notch/Statusleiste (`env(safe-area-inset-*)` wo nötig)

## 3. Eingabemethoden
- [ ] Komplette Seite **nur mit Tastatur** bedienbar — jeder Link, jeder Button, jedes Formular
- [ ] Fokus ist **immer sichtbar** und deutlich (nicht `outline: none` ohne Ersatz)
- [ ] Fokus-Reihenfolge entspricht der visuellen Reihenfolge
- [ ] Modals/Menüs: Fokus wird gefangen, `Esc` schließt, Fokus kehrt zum Auslöser zurück
- [ ] Touch-Ziele mindestens 44 × 44 px
- [ ] Keine Funktion, die es nur bei `:hover` gibt (auf Touch nicht erreichbar)

## 4. Accessibility
- [ ] Struktur aus `header`/`nav`/`main`/`footer`, genau eine `h1`, keine übersprungenen Ebenen
- [ ] Alle Bilder mit sinnvollem `alt` (dekorative: `alt=""`)
- [ ] Jedes Formularfeld mit verknüpftem `<label>`
- [ ] Fehlermeldungen sagen, **was zu tun ist** — nicht „ungültige Eingabe"
- [ ] Kontrast: Text ≥ 4.5:1, große Schrift und UI-Elemente ≥ 3:1
- [ ] `prefers-reduced-motion` wird respektiert
- [ ] `<html lang="de">` gesetzt
- [ ] axe DevTools: 0 kritische Verstöße

## 5. Zustände — der häufigste Anfängerfehler
Für **jede** Ansicht, die Daten lädt:
- [ ] Ladezustand
- [ ] Leerer Zustand („noch keine Einträge") mit Hinweis, was als Nächstes zu tun ist
- [ ] Fehlerzustand mit Wiederholen-Möglichkeit
- [ ] Erfolgs-Feedback nach Aktionen
- [ ] Deaktivierter/laufender Zustand bei Buttons (kein Doppel-Absenden)

## 6. Performance
- [ ] Lighthouse Mobile (Produktions-Build, nicht Dev-Server): Performance ≥ 90
- [ ] LCP < 2,5 s · CLS < 0,1 · INP < 200 ms
- [ ] Bilder in modernem Format, korrekt dimensioniert, `width`/`height` gesetzt
- [ ] Fonts selbst gehostet, `font-display: swap`, max. 2 Familien
- [ ] Keine ungenutzte Dependency in `package.json`
- [ ] JS-Bundle bewusst geprüft — nicht nur gehofft

## 7. SEO
- [ ] Eindeutiger `<title>` und `meta description` pro Seite
- [ ] Open-Graph-Bild und -Tags (Link-Vorschau prüfen)
- [ ] `robots.txt` und `sitemap.xml`
- [ ] Canonical URL
- [ ] Sinnvolle, lesbare URLs
- [ ] Ohne JavaScript sind die Kerninhalte im HTML vorhanden

## 8. Security
- [ ] Keine Secrets im Repository, keine im Client-Bundle
- [ ] `.env*` steht in `.gitignore` — und war nie committed (History prüfen)
- [ ] Jede Eingabe serverseitig validiert (Client-Validierung zählt nicht)
- [ ] Datenbankzugriffe parametrisiert — nie per String-Verkettung
- [ ] Bei Auth: Autorisierung pro Anfrage geprüft, nicht nur die UI versteckt
- [ ] `npm audit`: keine kritischen Lücken
- [ ] Sicherheits-Header gesetzt (CSP, X-Content-Type-Options, Referrer-Policy)

## 9. Code & Repository
- [ ] Keine Datei über ~300 Zeilen ohne guten Grund
- [ ] Keine auskommentierten Code-Leichen, keine `console.log`
- [ ] Namen sagen, was die Sache tut
- [ ] README: was ist das, wie starte ich es, wie deploye ich es, welche Env-Variablen
- [ ] Nachvollziehbare Commit-Historie
- [ ] Deployt und unter einer echten URL erreichbar

## 10. Der Realitätstest
- [ ] Auf einem fremden Gerät geöffnet, das nie im Dev-Modus war
- [ ] Im Drosselungsmodus „Fast 3G" geladen — ist die Seite dann noch benutzbar?
- [ ] Eine Person, die das Projekt nicht kennt, hat es 30 Sekunden benutzt. Wusste sie, was sie tun soll?

---

## Stufe „Sketch"
Nur: läuft, keine Secrets im Repo. Alles andere bewusst weggelassen.

## Stufe „Produktion"
Alles oben, plus:
- [ ] `/security-review` durchgeführt und Befunde abgearbeitet
- [ ] E2E-Tests für die kritischen Nutzerpfade (Playwright)
- [ ] Backup- und Rollback-Weg existiert und wurde einmal getestet
- [ ] Fehler-Monitoring aktiv
- [ ] Rechtliches: Impressum, Datenschutzerklärung, Cookie-Handhabung geklärt
