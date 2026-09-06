import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * Die Adresse, unter der die Seite steht.
 *
 * Sie wird an vier Stellen gebraucht — `canonical`, `og:url`, `robots.txt` und
 * `sitemap.xml` — und soll deshalb genau einmal gepflegt werden. Ohne
 * `VITE_SITE_URL` gilt die Adresse des Vorschau-Servers, damit ein Build ohne
 * Konfiguration keine erfundene Domain in die Metadaten schreibt.
 */
const DEFAULT_SITE_URL = 'http://localhost:4173'

/**
 * Die Routen, die es wirklich gibt — `/tour/:id` haengt an Daten und faellt raus.
 *
 * Im Demo-Modus gibt es `/user` nicht (siehe `main.jsx`): ohne Server hat die
 * Kontoseite nichts zu zeigen. Eine Adresse in der Sitemap, die ins Leere
 * fuehrt, ist genau der Fehler, den `robots.txt` und `sitemap.xml` hier
 * abstellen sollen.
 */
const routes = (demo) => (demo ? ['/', '/overview'] : ['/', '/overview', '/user'])

/**
 * `sizes` des Aufmacherbilds — muss mit dem `sizes` am `<img>` in
 * SheetHero.jsx uebereinstimmen, sonst laedt der Browser zweimal.
 */
const HERO_SIZES = '(min-width: 1920px) 500px, (min-width: 1024px) 28vw, 92vw'

/**
 * Traegt die Seitenadresse in `index.html` ein und legt `robots.txt` und
 * `sitemap.xml` als echte Dateien daneben.
 *
 * Ohne die beiden Dateien beantwortet die SPA jede Anfrage danach mit ihrem
 * `index.html` — ein Crawler bekam also HTML mit Status 200 statt einer 404,
 * und Lighthouse las das als kaputte robots.txt mit 48 Fehlern.
 */
function siteMetadata(siteUrl, demo) {
  const base = siteUrl.replace(/\/+$/, '')
  const ROUTES = routes(demo)

  return {
    name: 'site-metadata',

    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        let out = html.replaceAll('%SITE_URL%', base)

        // Das Aufmacherbild ist das LCP-Element, wird aber erst entdeckt,
        // wenn React gerendert hat — der Browser faengt also spaet an. Der
        // Preload nennt ihm dieselbe Auswahl wie das <img>, damit er sofort
        // die passende Groesse zieht statt zu warten.
        if (ctx.bundle) {
          const heroes = Object.keys(ctx.bundle)
            .filter((f) => /\/HeroIMG1(-\d+)?-[\w-]+\.webp$/.test('/' + f))
            .map((f) => {
              const m = f.match(/HeroIMG1-(\d+)-/)
              return { file: f, width: m ? Number(m[1]) : 2222 }
            })
            .sort((a, b) => a.width - b.width)

          if (heroes.length) {
            const srcset = heroes.map((h) => `/${h.file} ${h.width}w`).join(', ')
            const smallest = heroes[0].file
            out = out.replace(
              '</head>',
              `  <link rel="preload" as="image" fetchpriority="high" href="/${smallest}" imagesrcset="${srcset}" imagesizes="${HERO_SIZES}" />\n  </head>`
            )
          }
        }

        return out
      }
    },

    generateBundle() {
      const today = new Date().toISOString().split('T')[0]

      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: [
          'User-agent: *',
          'Allow: /',
          '',
          `Sitemap: ${base}/sitemap.xml`,
          ''
        ].join('\n')
      })

      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
          ...ROUTES.map((route) =>
            [
              '  <url>',
              `    <loc>${base}${route}</loc>`,
              `    <lastmod>${today}</lastmod>`,
              '  </url>'
            ].join('\n')
          ),
          '</urlset>',
          ''
        ].join('\n')
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // '.' statt process.cwd(): Vite loest relativ zum Config-Verzeichnis auf,
  // und die Datei bleibt damit frei von Node-Globals.
  const env = loadEnv(mode, '.', '')
  const siteUrl = env.VITE_SITE_URL || DEFAULT_SITE_URL

  return {
    plugins: [react(), tailwindcss(), siteMetadata(siteUrl, env.VITE_DEMO === 'true')]
  }
})
