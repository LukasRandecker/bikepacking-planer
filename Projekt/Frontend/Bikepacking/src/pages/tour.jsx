import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { MapContainer, TileLayer, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import {
  SectionHead,
  Datum,
  MeasureBar,
  EmptyPlate,
  LoadingRows,
  ItemName,
  ItemThumb,
} from "../components/ui/Sheet.jsx";
import { Note } from "../components/ui/Controls.jsx";
import { IconArrow, IconLink } from "../components/ui/Icons.jsx";
import api, { assetUrl, errorMessage } from "../lib/api.js";
import useDocumentTitle from "../lib/useDocumentTitle.js";

const nf = (n, d = 0) =>
  Number(n || 0).toLocaleString("en-GB", {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });

const dateLabel = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
};

/** The category order the planner uses, so both sheets read the same way. */
const CATEGORY_ORDER = [
  "Bike and Bags",
  "Camping Gear",
  "Clothing",
  "Hygiene",
  "Tools",
  "Other",
];

/**
 * Somebody else's tour, read-only.
 *
 * Three things in one sheet, in the order they answer the question that
 * brought the reader here: where it went, what it was, and — the part the
 * platform exists for — what was on the bike.
 */
export default function TourPage() {
  const { id } = useParams();

  const [tour, setTour] = useState(null);
  const [packlist, setPacklist] = useState(null);
  const [route, setRoute] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [trackNote, setTrackNote] = useState("");

  useDocumentTitle(
    tour ? tour.Name : "Tour",
    tour?.Description || "A published tour with the packing list it was ridden with."
  );

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");
      setRoute([]);
      setTrackNote("");

      try {
        const { data } = await api.get(`/tours/${id}/full`);
        if (cancelled) return;

        setTour(data.tour);
        setPacklist(data.packlist);

        // Die Karte hängt an einer zweiten Anfrage: fehlt die GPX-Datei, steht
        // trotzdem alles andere auf dem Blatt.
        if (data.tour?.GPX_file) {
          try {
            const gpx = await api.get(`/loadGpx/${data.tour.GPX_file}`);
            if (!cancelled) setRoute(gpx.data.coordinates || []);
          } catch {
            if (!cancelled)
              setTrackNote(
                "The GPX file for this tour is missing on the server, so the map stays empty."
              );
          }
        }
      } catch (err) {
        if (!cancelled)
          setError(
            err?.response?.status === 404
              ? "There is no tour under that address."
              : errorMessage(err, "This tour could not be loaded.")
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  /* Fit the whole track instead of dropping the viewer on its first point. */
  const bounds = useMemo(() => {
    if (route.length === 0) return null;
    const lats = route.map((c) => c[0]);
    const lngs = route.map((c) => c[1]);
    return [
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)],
    ];
  }, [route]);

  const grouped = useMemo(() => {
    const byCategory = {};
    (packlist?.items || []).forEach((item) => {
      (byCategory[item.Categorie] ??= []).push(item);
    });
    return CATEGORY_ORDER.filter((cat) => byCategory[cat]?.length).map((cat) => ({
      cat,
      items: byCategory[cat],
      weight: byCategory[cat].reduce((sum, i) => sum + Number(i.Weight || 0), 0),
    }));
  }, [packlist]);

  if (loading) {
    return (
      <section className="sheet-pad py-10 md:py-14">
        <SectionHead as="h1" title="Loading tour" meta="Reading the sheet" />
        <div className="mt-8">
          <LoadingRows rows={5} />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="sheet-pad py-10 md:py-14">
        <SectionHead as="h1" title="Tour" meta="Not on file" />
        <div className="mt-8 flex flex-col gap-6">
          <Note tone="error">{error}</Note>
          <Link to="/" className="c-btn c-btn--ghost self-start">
            <span>Back to the index</span>
            <IconArrow size={16} />
          </Link>
        </div>
      </section>
    );
  }

  const days = (() => {
    const a = new Date(tour.StartDate);
    const b = new Date(tour.EndDate);
    if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null;
    return Math.max(0, Math.round((b - a) / 86400000));
  })();

  return (
    <>
      <section className="sheet-pad border-b border-ink py-8 md:py-10">
        <Link to="/" className="c-btn c-btn--quiet mb-6">
          <span className="rotate-180">
            <IconArrow size={14} />
          </span>
          <span>Index</span>
        </Link>

        <SectionHead
          as="h1"
          title={tour.Name}
          meta={`${tour.Type} · ${tour.Mode} · ${tour.Setupstyle}`}
        />

        {tour.Cover ? (
          <div className="m-plate m-plate--live mt-6 aspect-[3/1] w-full border border-ink">
            <img
              src={assetUrl(tour.Cover)}
              alt={`${tour.Name} — cover photograph`}
              // Der Rahmen steht auf 3:1.
              width={1200}
              height={400}
              loading="eager"
              decoding="async"
              fetchPriority="high"
            />
          </div>
        ) : null}

        <div className="mt-6 grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            {tour.Description ? (
              <p className="t-body max-w-prose text-[0.9375rem]">
                {tour.Description}
              </p>
            ) : null}
            <p className="t-label mt-4">
              {tour.Author ? `Filed by ${tour.Author} · ` : ""}
              {dateLabel(tour.StartDate)} – {dateLabel(tour.EndDate)}
              {/* Eine Eintagestour hat null Naechte — "0 days" waere keine Angabe. */}
              {days ? ` · ${days} ${days === 1 ? "day" : "days"}` : ""}
            </p>
          </div>

          <div className="lg:col-span-5">
            <div className="c-cellgrid grid-cols-2">
              <Datum
                label="Distance"
                value={nf(tour.Distance)}
                unit="km"
                tone="clay"
                size="lg"
              />
              <Datum
                label="Climb"
                value={nf(tour.Elevation)}
                unit="m"
                tone="olive"
                size="lg"
              />
              <Datum label="Bike" value={tour.Biketype} />
              <Datum
                label="Load"
                value={packlist ? nf((packlist.totalWeight || 0) / 1000, 2) : "—"}
                unit={packlist ? "kg" : undefined}
              />
            </div>
          </div>
        </div>
      </section>

      <section id="route" className="sheet-pad border-b border-ink bg-sheet py-10 md:py-14">
        <SectionHead
          title="Route"
          meta={
            route.length > 0
              ? `${nf(route.length)} points plotted`
              : "No track on file"
          }
        />

        {trackNote ? (
          <Note tone="info" className="mt-4">
            {trackNote}
          </Note>
        ) : null}

        <div className="mt-6 h-[22rem] border border-ink sm:h-[30rem]">
          {bounds ? (
            <MapContainer
              bounds={bounds}
              boundsOptions={{ padding: [24, 24] }}
              scrollWheelZoom
              className="h-full w-full"
            >
              <TileLayer
                // CARTO verlangt fuer seine Basemaps inzwischen einen
                // API-Key: die Kacheln kamen zwar mit 200 zurueck, trugen
                // aber quer ueber die Karte "API KEY REQUIRED". Die
                // Standardkacheln von OpenStreetMap brauchen keinen
                // Schluessel; entfaerbt werden sie in index.css.
                url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <Polyline
                positions={route}
                pathOptions={{
                  color: "#101010",
                  weight: 7,
                  opacity: 0.16,
                  lineCap: "butt",
                }}
              />
              <Polyline
                positions={route}
                pathOptions={{
                  color: "#606c38",
                  weight: 2.5,
                  opacity: 1,
                  lineCap: "butt",
                }}
              />
            </MapContainer>
          ) : (
            <EmptyPlate
              className="h-full border-0"
              title="No track filed with this tour"
              body="The tour was published without a GPX file, so there is nothing to plot. Its distance and climb are still on the sheet above."
            />
          )}
        </div>
      </section>

      <section id="packlist" className="sheet-pad bg-field py-10 md:py-14">
        <SectionHead
          title="Packlist"
          meta={
            packlist
              ? `${packlist.items.length} items · ${nf((packlist.totalWeight || 0) / 1000, 2)} kg`
              : "None filed"
          }
        />

        {!packlist || packlist.items.length === 0 ? (
          <div className="mt-6">
            <EmptyPlate
              title="This tour came without a list"
              body="Nothing was filed alongside the route. Build your own on the planner sheet — the catalogue behind it is the same one."
              actions={
                <Link to="/overview#packlist" className="c-btn c-btn--clay">
                  <span>Open the planner</span>
                  <IconArrow size={16} />
                </Link>
              }
            />
          </div>
        ) : (
          <>
            <div className="mt-8 border-t border-ink">
              {grouped.map(({ cat, items, weight }) => (
                <div key={cat} className="border-b border-ink">
                  <div className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 px-1 py-3.5 sm:grid-cols-[minmax(0,1fr)_10rem_6rem]">
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="t-h3 truncate">{cat}</span>
                      <span className="t-label flex-none">{items.length} items</span>
                    </span>

                    <span className="hidden flex-col gap-1.5 sm:flex">
                      <span className="t-figure text-xs text-ink-soft">
                        {nf(weight)} g
                      </span>
                      <MeasureBar
                        value={weight}
                        max={packlist.totalWeight || 1}
                        label={`${cat}: ${nf(weight)} of ${nf(packlist.totalWeight)} grams`}
                      />
                    </span>

                    <span className="t-figure hidden text-right text-xs text-ink-soft sm:block">
                      {nf(
                        items.reduce((sum, i) => sum + Number(i.Price || 0), 0),
                        2
                      )}{" "}
                      EUR
                    </span>
                  </div>

                  <ul className="border-x border-b border-ink">
                    {items.map((item) => (
                      <li
                        key={item._id}
                        className="flex items-center gap-3 border-b border-rule bg-sheet p-3 last:border-b-0"
                      >
                        <ItemThumb
                          src={assetUrl(item.IMG)}
                          alt=""
                          className="h-12 w-12"
                        />

                        <div className="min-w-0 flex-1">
                          <p className="flex text-sm font-semibold text-ink">
                            <ItemName name={item.Itemname} brand={item.Brand} />
                          </p>
                          <p className="t-label truncate">{item.Categorie}</p>
                        </div>

                        <div className="hidden flex-none text-right sm:block">
                          <p className="t-figure text-xs text-ink-soft">
                            {item.Weight > 0 ? `${nf(item.Weight)} g` : "— g"}
                          </p>
                          <p className="t-figure text-xs text-ink-soft">
                            {item.Price > 0 ? `${nf(item.Price, 2)} EUR` : "— EUR"}
                          </p>
                        </div>

                        {item.Link ? (
                          <a
                            href={item.Link}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="c-btn c-btn--quiet c-btn--icon flex-none no-underline"
                            aria-label={`Open the product page for ${item.Itemname} in a new tab`}
                          >
                            <IconLink size={16} />
                          </a>
                        ) : (
                          <span
                            aria-hidden="true"
                            className="m-hatch h-11 w-11 flex-none border border-rule"
                          />
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-ink pt-4">
              <p className="t-label max-w-md">
                Weights come from the catalogue; a dash means the entry has none
                on file yet.
              </p>
              <Link to="/overview#packlist" className="c-btn c-btn--ghost">
                <span>Build your own</span>
                <IconArrow size={16} />
              </Link>
            </div>
          </>
        )}
      </section>
    </>
  );
}
