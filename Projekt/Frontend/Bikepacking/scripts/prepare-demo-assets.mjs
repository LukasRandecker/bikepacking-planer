/**
 * Was der Demo-Modus vom Server braucht, ohne den Server.
 *
 * Zwei Dateien wandern aus `Projekt/Server/` in den `public`-Ordner des
 * Frontends. Beides passiert hier und nicht von Hand: eine Kopie, die jemand
 * einmal angelegt hat, laeuft von der Quelle weg, und dann sucht spaeter
 * jemand den Fehler im Katalog statt in der Kopie.
 *
 *   catalog.json   die 500 Katalogeintraege. Ohne Datenbank ist das die
 *                  Quelle, aus der der Item-Picker sucht. Wird bei jedem Build
 *                  neu kopiert und ist deshalb gitignored.
 *   openapi.json   die OpenAPI-Beschreibung der Server-Routen, erzeugt aus
 *                  denselben JSDoc-Kommentaren, aus denen der laufende Server
 *                  seine Swagger-Oberflaeche unter `/docs` baut. Der Demo-
 *                  Streifen verlinkt sie: ohne laufenden Server ist sie der
 *                  einzige pruefbare Beleg, dass es die API gibt.
 *
 * `swagger-jsdoc` liegt in den Abhaengigkeiten des Servers, nicht in denen des
 * Frontends. Auf einem Build-Server, der nur das Frontend installiert, ist es
 * deshalb nicht da — dann bleibt die eingecheckte `openapi.json` stehen. Wer
 * an den Server-Routen arbeitet, laesst hier lokal einmal `npm run build`
 * laufen und checkt die neue Datei mit ein.
 *
 * `Projekt/Server/` wird dabei nur gelesen. Nichts an dieser Datei schreibt
 * dorthin.
 */

import { createRequire } from "node:module";
import { copyFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const frontend = resolve(here, "..");
const server = resolve(frontend, "../../Server");
const publicDir = resolve(frontend, "public");

async function copyCatalog() {
  const from = resolve(server, "data/catalog.json");
  const to = resolve(publicDir, "catalog.json");
  await copyFile(from, to);
  console.log(`catalog.json  copied from ${from}`);
}

async function buildOpenApi() {
  const to = resolve(publicDir, "openapi.json");

  let swaggerJsdoc;
  try {
    swaggerJsdoc = createRequire(resolve(server, "package.json"))("swagger-jsdoc");
  } catch {
    console.log("openapi.json  kept as committed — swagger-jsdoc is not installed here");
    return;
  }

  // Dieselbe Definition wie in `Server/swagger.js`. Ein `servers`-Eintrag auf
  // localhost stuende in einer oeffentlichen Datei falsch; die Adresse traegt
  // nach, wer den Server irgendwo hinstellt.
  const spec = swaggerJsdoc({
    definition: {
      openapi: "3.0.0",
      info: {
        title: "Bikepacking API",
        description:
          "Routes of the Express server in Projekt/Server. Generated from the " +
          "same JSDoc comments the running server serves as Swagger UI under /docs.",
        version: "1.0.0",
      },
    },
    apis: [resolve(server, "routes/bikepacking/*.js").replace(/\\/g, "/")],
  });

  const paths = Object.keys(spec.paths || {}).length;
  if (paths === 0) {
    console.log("openapi.json  kept as committed — no routes were found to describe");
    return;
  }

  await writeFile(to, `${JSON.stringify(spec, null, 2)}\n`, "utf8");
  console.log(`openapi.json  generated, ${paths} paths`);
}

await mkdir(publicDir, { recursive: true });
await copyCatalog();
await buildOpenApi();
