/**
 * Was im Demo-Modus auf dem Blatt steht.
 *
 * Zwei Beispieltouren, damit ein Besucher ohne eigene GPX-Datei nicht vor
 * einer leeren Karte sitzt. Beide sind ausdruecklich als Beispiel gekennzeich-
 * net — sie geben sich nicht als gefahrene Touren eines Kontos aus, tragen
 * keinen Autor und kein Titelfoto.
 *
 * Was daran echt ist und was nicht, gehoert nebeneinander:
 *
 *   echt   die Strecke. Beide `.gpx` sind mit BRouter ueber
 *          OpenStreetMap-Daten gerechnet (ODbL) und tragen SRTM-Hoehen. Sie
 *          folgen wirklichen Strassen ueber wirkliches Gelaende.
 *   echt   Distanz und Hoehenmeter. Die stehen nirgends in dieser Datei —
 *          `api.local.js` liest sie beim Aufruf aus dem Track, mit derselben
 *          Rechnung wie der Server. Eine getippte Zahl koennte davon abweichen.
 *   echt   die Packliste. Nur Namen aus `Server/data/catalog.json`, mit den
 *          Gewichten und Preisen, die dort stehen (siehe CLAUDE.md zu deren
 *          Herkunft).
 *   Beispiel  Zeitraum, Radtyp und Schlafaufbau. Plausibel gewaehlt, damit das
 *          Titelfeld nicht leer bleibt — so wie die Beispielzeilen im CTA.
 *
 * Kein Titelfoto: es gibt keine Aufnahme dieser Strecken, und ein beliebiges
 * Bikepacking-Foto daruntergelegt waere eine Behauptung. Die Kachel zeichnet
 * dafuer ihre Schraffur, so wie sie es fuer jedes fehlende Feld tut.
 */

export const DEMO_TOURS = [
  {
    slug: "alpe-dhuez",
    GPX_file: "alpe-dhuez.gpx",
    Name: "Bourg-d'Oisans — Alpe d'Huez",
    StartDate: "2026-06-13",
    EndDate: "2026-06-13",
    Biketype: "ROAD",
    Setupstyle: "INDOOR",
    Type: "RACE",
    Mode: "SOLO",
    packlistName: "Alpe d'Huez — day loadout",
    packlist: [
      "Fahrrad - Rennrad",
      "Flasche klein",
      "Oberrohrtasche",
      "Handyhalterung",
      "Schuhe",
      "kurze Bib",
      "Trikot kurz",
      "Armlinge",
      "Handschuhe kurz",
      "Pumpe",
      "Tool",
      "Reifenheber",
      "Kettenschloss",
      "Mini Sonnencreme",
      "Pflaster",
      "Navi",
      "Powerbank 20k",
      "USB-C Kabel",
    ],
  },
  {
    slug: "freiburg-feldberg",
    GPX_file: "freiburg-feldberg.gpx",
    Name: "Freiburg — Feldberg",
    StartDate: "2026-05-30",
    EndDate: "2026-05-31",
    Biketype: "GRAVEL",
    Setupstyle: "OUTDOOR",
    Type: "BIKEPACKING",
    Mode: "SOLO",
    packlistName: "Feldberg — one night out",
    packlist: [
      "Fahrrad - Gravelbike",
      "Rahmentasche",
      "Satteltasche (Apidura 5l)",
      "Oberrohrtasche",
      "Flasche klein",
      "Zelt",
      "Isomatte",
      "Schlafsack",
      "Kopfkissen",
      "Base Layer",
      "Regenjacke",
      "Windjacke",
      "dicke Socken",
      "Beinlinge",
      "Pumpe",
      "Tool",
      "Reifenheber",
      "Flicken selbstklebend",
      "Kabelbinder",
      "Blasenpflaster",
      "Mini Sonnencreme",
      "Frontlicht + Fernbedienung (Lupine SL AF)",
      "Powerbank 20k",
      "Schloss",
      "Navi",
    ],
  },
];

/** Steht als Beschreibung an jeder Beispieltour — auf der Kachel und im Blatt. */
export const DEMO_TOUR_NOTE =
  "Sample tour shipped with this browser demo. The track is routed over " +
  "OpenStreetMap data with BRouter (ODbL), elevation from SRTM; distance and " +
  "climb are read from that file. The packlist is a selection from the " +
  "catalogue. It is not a recorded ride, and it belongs to no account.";
