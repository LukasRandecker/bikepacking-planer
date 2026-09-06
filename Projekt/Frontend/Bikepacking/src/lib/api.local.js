import { AxiosError } from "axios";

import { parseGpxFile, parseGpxText } from "./gpx.js";
import { DEMO_TOURS, DEMO_TOUR_NOTE } from "./demoData.js";

/**
 * Der Server, wenn es keinen gibt.
 *
 * Axios laesst sich einen eigenen `adapter` geben — eine Funktion, die
 * anstelle eines HTTP-Requests selbst entscheidet, was zurueckkommt. Fuer die
 * aufrufenden Komponenten ist das von einer echten Antwort nicht zu
 * unterscheiden, und genau darum aendert sich im Demo-Modus an keiner der 29
 * Aufrufstellen eine Zeile.
 *
 * Was hier laeuft, laeuft wirklich: GPX wird gelesen und gerechnet, der
 * 500-Eintraege-Katalog wird durchsucht, gefiltert und seitenweise geliefert,
 * Packlisten summieren Gewicht und Preis. Was einen Server braucht — Konten,
 * dauerhaftes Speichern, Datei-Uploads — antwortet mit einer klaren Meldung
 * statt zu krachen. Die zugehoerigen Knoepfe sind im Demo-Modus ohnehin nicht
 * da (siehe `DEMO` in `demo.js`); diese Antworten sind das Netz darunter.
 *
 * Der Zustand liegt im Speicher und stirbt mit dem Tab. Kein localStorage,
 * kein IndexedDB — nichts an dieser Demo hinterlaesst etwas auf dem Geraet,
 * und der Streifen oben auf der Seite sagt genau das zu.
 */

// Dieselben sechs Kategorien wie in `Server/routes/bikepacking/items.js`.
const CATEGORIES = [
  "Bike and Bags",
  "Camping Gear",
  "Clothing",
  "Hygiene",
  "Tools",
  "Other",
];

const SHARED_SOURCES = ["CATALOG", "COMMUNITY"];
const MAX_QUERY = 80;
const MAX_NAME = 120;
const MAX_BRAND = 60;
const MAX_KEYWORDS = 300;
const MAX_LINK = 500;
const MAX_LIST_ITEMS = 300;

/** Wem im Demo-Modus die selbst angelegten Eintraege gehoeren. */
const VISITOR = "demo-visitor";

const NO_ACCOUNT =
  "This build runs in your browser and has no account or database. " +
  "Planning, the catalogue and the PDF export work; keeping things does not.";

// ---------------------------------------------------------------- Zustand --

let counter = 0;
const nextId = (prefix) => `${prefix}-${String(++counter).padStart(4, "0")}`;

/** Selbst angelegte und geforkte Items. */
const extraItems = [];

/** Packlisten, `_id` -> `{ _id, Name, items, demo }`. */
const lists = new Map();

let catalogRequest = null;
let toursRequest = null;
const trackCache = new Map();

const asset = (path) => `${import.meta.env.BASE_URL}${path}`.replace(/\/{2,}/g, "/");

/** Der Grundkatalog. Eine Datei, kein Datenbankaufruf — 500 Zeilen, 138 KB. */
function loadCatalog() {
  catalogRequest ??= fetch(asset("catalog.json"))
    .then((res) => {
      if (!res.ok) throw new Error("The catalogue file could not be loaded.");
      return res.json();
    })
    .then((rows) =>
      rows.map((row, i) => ({
        // Der Katalog bringt keine Ids mit — die Datenbank vergibt sie sonst.
        // Hier sind sie ableitbar und stabil, damit dieselbe Zeile ueber einen
        // Neuladevorgang hinweg dasselbe Item bleibt.
        _id: `cat-${String(i + 1).padStart(4, "0")}`,
        Categorie: row.Categorie || "Other",
        IMG: row.IMG || "",
        Itemname: row.Itemname || "",
        Brand: row.Brand || "",
        Link: row.Link || "",
        Weight: Number(row.Weight) || 0,
        Price: Number(row.Price) || 0,
        Section: row.Section || "",
        Keywords: row.Keywords || "",
        Source: "CATALOG",
        Owner: null,
      }))
    )
    .catch((err) => {
      catalogRequest = null;
      throw err;
    });

  return catalogRequest;
}

/**
 * Eine Beispieldatei aus `public/demo/` lesen und durch dieselbe Rechnung
 * schicken wie einen Upload. Das Ergebnis wird gemerkt: der Index fragt beide
 * Tracks ab, die Tourseite gleich danach noch einmal.
 */
function loadTrack(fileName) {
  if (!trackCache.has(fileName)) {
    const request = fetch(asset(`demo/${fileName}`))
      .then(async (res) => {
        if (!res.ok) throw new Error("That track is not on file.");
        return parseGpxText(await res.text(), fileName);
      })
      .catch((err) => {
        trackCache.delete(fileName);
        throw err;
      });
    trackCache.set(fileName, request);
  }
  return trackCache.get(fileName);
}

/**
 * Die Beispieltouren, einmal aufgebaut.
 *
 * Distanz und Hoehenmeter werden aus der GPX-Datei gerechnet und nicht
 * eingetragen — eine getippte Zahl koennte von dem abweichen, was die Karte
 * daneben zeichnet.
 */
function loadTours() {
  toursRequest ??= (async () => {
    const catalog = await loadCatalog();

    const byName = new Map();
    catalog.forEach((item) => {
      if (!byName.has(item.Itemname)) byName.set(item.Itemname, item);
    });

    return Promise.all(
      DEMO_TOURS.map(async (spec) => {
        const track = await loadTrack(spec.GPX_file);
        const items = spec.packlist.map((name) => byName.get(name)).filter(Boolean);

        const listId = `demo-list-${spec.slug}`;
        lists.set(listId, {
          _id: listId,
          Name: spec.packlistName,
          items: items.map((item) => item._id),
          // Gehoert der Demo, nicht dem Besucher: taucht deshalb nicht unter
          // "meinen" Setups auf.
          demo: true,
        });

        return {
          _id: `demo-tour-${spec.slug}`,
          Name: spec.Name,
          StartDate: spec.StartDate,
          EndDate: spec.EndDate,
          Biketype: spec.Biketype,
          Setupstyle: spec.Setupstyle,
          Type: spec.Type,
          Mode: spec.Mode,
          GPX_file: spec.GPX_file,
          Itemlist: listId,
          // Kein erfundener Autor und kein Titelfoto: was es nicht gibt, wird
          // nicht behauptet.
          Author: "",
          Cover: "",
          Description: DEMO_TOUR_NOTE,
          Distance: Math.round(Number(track.km)),
          Elevation: Math.round(Number(track.hm)),
          Public: true,
          ItemCount: items.length,
        };
      })
    );
  })().catch((err) => {
    toursRequest = null;
    throw err;
  });

  return toursRequest;
}

const allItems = async () => [...(await loadCatalog()), ...extraItems];

// ----------------------------------------------------------------- Fehler --

class DemoError extends Error {
  constructor(status, message) {
    super(message);
    this.name = "DemoError";
    this.status = status;
  }
}

const bad = (message) => {
  throw new DemoError(400, message);
};
const notFound = (what) => {
  throw new DemoError(404, `${what} not found`);
};
const noAccount = () => {
  throw new DemoError(501, NO_ACCOUNT);
};

// ----------------------------------------------------------------- Pruefung -

/**
 * Wie `validateItem` auf dem Server: es entsteht ein neues Objekt aus
 * geprueften Feldern, nie eines aus dem Rumpf der Anfrage.
 */
function validateItem(input, { partial = false } = {}) {
  const value = {};

  if (!partial || input.Itemname !== undefined) {
    const name = typeof input.Itemname === "string" ? input.Itemname.trim() : "";
    if (!name) bad("Itemname is required.");
    if (name.length > MAX_NAME) bad(`Itemname must be at most ${MAX_NAME} characters.`);
    value.Itemname = name;
  }

  if (!partial || input.Categorie !== undefined) {
    const cat = typeof input.Categorie === "string" ? input.Categorie.trim() : "";
    if (!CATEGORIES.includes(cat)) bad(`Categorie must be one of: ${CATEGORIES.join(", ")}.`);
    value.Categorie = cat;
  }

  for (const key of ["Weight", "Price"]) {
    if (input[key] === undefined || input[key] === "") {
      if (!partial) value[key] = 0;
      continue;
    }
    const n = Number(input[key]);
    if (!Number.isFinite(n) || n < 0) bad(`${key} must be a number of at least 0.`);
    value[key] = n;
  }

  if (input.Link !== undefined) {
    const link = typeof input.Link === "string" ? input.Link.trim() : "";
    if (link && (link.length > MAX_LINK || !/^https?:\/\//i.test(link))) {
      bad("Link must be an http(s) URL.");
    }
    value.Link = link;
  }

  if (input.Brand !== undefined) {
    const brand = typeof input.Brand === "string" ? input.Brand.trim() : "";
    if (brand.length > MAX_BRAND) bad(`Brand must be at most ${MAX_BRAND} characters.`);
    value.Brand = brand;
  }

  if (input.Keywords !== undefined) {
    const keywords = typeof input.Keywords === "string" ? input.Keywords.trim() : "";
    if (keywords.length > MAX_KEYWORDS) {
      bad(`Keywords must be at most ${MAX_KEYWORDS} characters.`);
    }
    value.Keywords = keywords;
  }

  return value;
}

// ---------------------------------------------------------------- Handler --

/** POST /upload — die Datei wird hier gelesen, nicht hochgeladen. */
async function uploadGpx({ config }) {
  const form = config.data;
  const file = form instanceof FormData ? form.get("gpx") : null;
  if (!file) bad("No GPX file uploaded.");

  try {
    return await parseGpxFile(file);
  } catch (err) {
    throw new DemoError(err.status || 400, err.message);
  }
}

/** GET /loadGpx/:fileName — dieselbe Rechnung, Quelle ist `public/demo/`. */
async function readTrack({ params }) {
  const name = String(params.fileName || "");
  // Ein Dateiname aus einer Anfrage wird nie zu einem Pfad — dieselbe Regel
  // wie serverseitig, auch wenn hier nur `public/` dahinterliegt.
  if (!/^[A-Za-z0-9._-]+\.gpx$/i.test(name)) bad("Invalid file name.");

  try {
    return await loadTrack(name);
  } catch {
    notFound("Track");
  }
}

/** GET /items — Suche, Filter und Seiten, wie der Server sie beantwortet. */
async function searchItems({ query }) {
  const { q, category, source = "CATALOG" } = query;

  if (q !== undefined && String(q).length > MAX_QUERY) {
    bad(`q must be a string of at most ${MAX_QUERY} characters.`);
  }
  if (category !== undefined && !CATEGORIES.includes(category)) {
    bad(`category must be one of: ${CATEGORIES.join(", ")}.`);
  }
  if (!["CATALOG", "USER", "ALL"].includes(source)) {
    bad("source must be CATALOG, USER or ALL.");
  }

  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 40, 1), 100);
  const page = Math.max(parseInt(query.page, 10) || 1, 1);

  const visible = (await allItems()).filter((item) => {
    const shared = SHARED_SOURCES.includes(item.Source);
    const mine = item.Owner === VISITOR;
    if (source === "CATALOG") return shared;
    if (source === "USER") return mine;
    return shared || mine;
  });

  const needle = typeof q === "string" ? q.trim().toLowerCase() : "";
  const matching = visible.filter((item) => {
    if (category && item.Categorie !== category) return false;
    if (!needle) return true;
    return [item.Itemname, item.Brand, item.Section, item.Keywords].some((field) =>
      String(field || "").toLowerCase().includes(needle)
    );
  });

  // Der Server sortiert `{ Itemname: 1 }`. Ein schlichter Vergleich auf dem
  // rohen String liegt naeher daran als `localeCompare`.
  matching.sort((a, b) => (a.Itemname < b.Itemname ? -1 : a.Itemname > b.Itemname ? 1 : 0));

  return {
    total: matching.length,
    page,
    limit,
    items: matching.slice((page - 1) * limit, page * limit),
  };
}

/** GET /items/brands — fuettert die Vorschlagsliste im Anlegen-Formular. */
async function listBrands() {
  const counts = new Map();
  (await allItems())
    .filter((item) => SHARED_SOURCES.includes(item.Source) || item.Owner === VISITOR)
    .forEach((item) => {
      if (!item.Brand) return;
      counts.set(item.Brand, (counts.get(item.Brand) || 0) + 1);
    });

  return [...counts.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
    .map(([brand, count]) => ({ brand, count }));
}

/** POST /items — bleibt im Speicher, ist aber sofort ueber die Suche zu finden. */
async function createItem({ body }) {
  const value = validateItem(body);
  const item = {
    _id: nextId("own"),
    IMG: "",
    Brand: "",
    Link: "",
    Section: "",
    Keywords: "",
    ...value,
    Source: "COMMUNITY",
    Owner: VISITOR,
  };
  extraItems.push(item);
  return item;
}

/** POST /items/:id/fork — eigene Kopie eines geteilten Eintrags. */
async function forkItem({ params, body }) {
  const source = (await allItems()).find((item) => item._id === params.id);
  if (!source) notFound("Item");

  const copy = {
    ...source,
    ...validateItem(body, { partial: true }),
    _id: nextId("own"),
    Source: "PRIVATE",
    Owner: VISITOR,
  };
  extraItems.push(copy);
  return copy;
}

/** PUT /items/:id — nur Eigenes. Katalogeintraege sind geteilte Daten. */
async function updateItem({ params, body }) {
  const existing = (await allItems()).find((item) => item._id === params.id);
  if (!existing) notFound("Item");

  if (existing.Source === "CATALOG") {
    throw new DemoError(
      409,
      "Catalogue items are shared and cannot be edited. Fork it into your own copy instead."
    );
  }
  if (existing.Owner !== VISITOR) notFound("Item");

  const { Itemname, Price, Weight } = body;
  if (Itemname === undefined || Price === undefined || Weight === undefined) {
    bad("Itemname, Price and Weight are required");
  }

  Object.assign(existing, validateItem({ Itemname, Price, Weight }, { partial: true }));
  return existing;
}

/** GET /items/:id */
async function readItem({ params }) {
  const item = (await allItems()).find((entry) => entry._id === params.id);
  if (!item) notFound("Item");
  if (!SHARED_SOURCES.includes(item.Source) && item.Owner !== VISITOR) notFound("Item");
  return item;
}

const ownList = (id) => {
  const list = lists.get(String(id));
  if (!list) notFound("Itemlist");
  return list;
};

/** GET /itemlists/:id/items — die Liste mit ausgeschriebenen Items und Summen. */
async function readListItems({ params }) {
  const list = ownList(params.id);
  const known = new Map((await allItems()).map((item) => [item._id, item]));
  const items = list.items.map((id) => known.get(id)).filter(Boolean);

  return {
    _id: list._id,
    Name: list.Name,
    items,
    totalWeight: items.reduce((sum, item) => sum + (item.Weight || 0), 0),
    totalPrice: items.reduce((sum, item) => sum + (item.Price || 0), 0),
  };
}

/** PUT /itemlists/add-item — `replaces` tauscht an Ort und Stelle (Fork). */
async function addToList({ body }) {
  const list = ownList(body.listId);
  const item = (await allItems()).find((entry) => entry._id === body.itemId);
  if (!item) notFound("Item");
  if (list.items.length >= MAX_LIST_ITEMS) {
    bad(`A packlist can hold at most ${MAX_LIST_ITEMS} items.`);
  }

  const at = body.replaces ? list.items.indexOf(String(body.replaces)) : -1;
  if (at !== -1) list.items.splice(at, 1, String(body.itemId));
  else if (!list.items.includes(String(body.itemId))) list.items.push(String(body.itemId));

  return list;
}

/** DELETE /itemlists/remove-item */
async function removeFromList({ body }) {
  const list = ownList(body.listId);
  const at = list.items.indexOf(String(body.itemId));
  if (at === -1) notFound("Item in list");
  list.items.splice(at, 1);
  return list;
}

/** GET /tours/feed — die Beispieltouren, zeitlich sortiert wie im Betrieb. */
async function tourFeed({ query }) {
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 12, 1), 50);
  const order = query.order === "oldest" ? 1 : -1;

  return [...(await loadTours())]
    .sort((a, b) => order * (new Date(b.StartDate) - new Date(a.StartDate)))
    .slice(0, limit);
}

/** GET /tours/:id/full — Tour samt Packliste, genau wie auf der Tourseite. */
async function tourFull({ params }) {
  const tour = (await loadTours()).find((entry) => entry._id === params.id);
  if (!tour) notFound("Tour");

  return {
    tour: { ...tour, IsOwner: false },
    packlist: await readListItems({ params: { id: tour.Itemlist } }),
  };
}

// ------------------------------------------------------------ Routentabelle -

/**
 * `Methode + Pfad -> Handler`, in dieser Reihenfolge geprueft: der erste
 * Treffer gewinnt, feste Pfade stehen deshalb vor den mit Platzhaltern.
 */
const ROUTES = [
  ["post", "/upload", uploadGpx],
  ["get", "/loadGpx/:fileName", readTrack],

  ["get", "/items/brands", listBrands],
  ["get", "/items", searchItems],
  ["post", "/items", createItem],
  ["post", "/items/:id/fork", forkItem],
  ["put", "/items/:id", updateItem],
  ["get", "/items/:id", readItem],

  ["put", "/itemlists/add-item", addToList],
  ["delete", "/itemlists/remove-item", removeFromList],
  ["get", "/itemlists/:id/items", readListItems],
  // Die Demo kennt keine gespeicherten Setups: die beiden Listen im Speicher
  // gehoeren den Beispieltouren, nicht dem Besucher. Steht vor `/:id`, sonst
  // sucht der Router eine Liste namens "mine".
  ["get", "/itemlists/mine", async () => []],
  ["get", "/itemlists/:id", async ({ params }) => ownList(params.id)],
  ["put", "/itemlists/:id", noAccount],
  ["post", "/itemlists", noAccount],
  ["delete", "/itemlists/:id", noAccount],

  ["get", "/tours/feed", tourFeed],
  ["get", "/tours/mine", async () => []],
  ["get", "/tours/:id/full", tourFull],
  ["post", "/tours", noAccount],
  ["put", "/tours/:id/publish", noAccount],
  ["put", "/tours/:id", noAccount],
  ["delete", "/tours/:id", noAccount],
  ["get", "/tours/:id", noAccount],

  ["post", "/uploadImage", () => {
    throw new DemoError(
      501,
      "Photos are uploaded to the server, and this build has none. " +
        "An item without a photo gets the same black plate as every catalogue entry."
    );
  }],

  ["post", "/users/login", noAccount],
  ["post", "/users/register", noAccount],
  ["post", "/users/logout", async () => ({ message: "Logged out" })],
  ["get", "/users/me", () => {
    throw new DemoError(401, NO_ACCOUNT);
  }],
  ["delete", "/users/me", noAccount],
];

/** `/items/:id/fork` gegen `/items/cat-0001/fork` — Segment fuer Segment. */
function match(pattern, path) {
  const a = pattern.split("/");
  const b = path.split("/");
  if (a.length !== b.length) return null;

  const params = {};
  for (let i = 0; i < a.length; i++) {
    if (a[i].startsWith(":")) {
      if (!b[i]) return null;
      // Ein halbes Prozentzeichen im Pfad laesst `decodeURIComponent` werfen —
      // das waere ein 500 statt der 400, die der Handler daraus macht.
      try {
        params[a[i].slice(1)] = decodeURIComponent(b[i]);
      } catch {
        params[a[i].slice(1)] = b[i];
      }
    } else if (a[i] !== b[i]) {
      return null;
    }
  }
  return params;
}

/** Axios hat den Rumpf vor dem Adapter schon serialisiert. */
function readBody(config) {
  const raw = config.data;
  if (!raw || raw instanceof FormData) return {};
  if (typeof raw !== "string") return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

// ------------------------------------------------------------------ Adapter -

/**
 * Was Axios erwartet: bei Erfolg ein Antwortobjekt, im Fehlerfall ein
 * `AxiosError` mit `response.data.message` — sonst greift `errorMessage()` in
 * `api.js` nicht mehr und jede Fehlermeldung der App waere leer.
 */
export default async function localAdapter(config) {
  const method = String(config.method || "get").toLowerCase();
  const path =
    String(config.url || "/")
      .replace(/^https?:\/\/[^/]+/i, "")
      .replace(/\/bikepacking(?=\/|$)/, "")
      .split("?")[0]
      .replace(/\/+$/, "") || "/";

  try {
    for (const [verb, pattern, handler] of ROUTES) {
      if (verb !== method) continue;
      const params = match(pattern, path);
      if (!params) continue;

      const data = await handler({
        params,
        query: config.params || {},
        body: readBody(config),
        config,
      });

      return {
        data,
        status: 200,
        statusText: "OK",
        headers: {},
        config,
        request: null,
      };
    }

    throw new DemoError(404, `No route for ${method.toUpperCase()} ${path}.`);
  } catch (err) {
    const status = err instanceof DemoError ? err.status : 500;
    const message =
      err instanceof DemoError
        ? err.message
        : err?.message || "Something went wrong in the demo.";

    throw new AxiosError(message, String(status), config, null, {
      data: { message },
      status,
      statusText: "Demo",
      headers: {},
      config,
    });
  }
}
