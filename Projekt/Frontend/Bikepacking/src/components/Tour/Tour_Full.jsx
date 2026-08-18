import { useMemo, useState } from "react";
import { MapContainer, TileLayer, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import SectionToolbar from "../SectionToolbar/SectionToolbar.jsx";
import Tour_Form from "./Tour_Form.jsx";
import { EmptyPlate } from "../ui/Sheet.jsx";

/**
 * The drawing area and its title block. The route is plotted twice — a heavy
 * ink line under a clay one, the way a drawing weights its principal element —
 * and the frame around it is the plate frame used everywhere else.
 */
function Tour_Full() {
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [tourInfo, setTourInfo] = useState({
    km: 0,
    hm: 0,
    name: "",
    gpxFileName: "",
  });

  const handleGPXLoad = (data) => {
    if (!data?.coordinates) return;
    setRouteCoordinates(data.coordinates);
    setTourInfo({
      km: data.km,
      hm: data.hm,
      name: data.tourName || "",
      gpxFileName: data.fileName || "",
    });
  };

  /* Fit the whole track instead of dropping the viewer on its first point. */
  const bounds = useMemo(() => {
    if (routeCoordinates.length === 0) return null;
    const lats = routeCoordinates.map((c) => c[0]);
    const lngs = routeCoordinates.map((c) => c[1]);
    return [
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)],
    ];
  }, [routeCoordinates]);

  return (
    <section
      id="tour"
      className="sheet-pad scroll-mt-16 border-t border-ink bg-sheet py-10 md:py-14"
    >
      <div className="grid gap-y-8 lg:grid-cols-12 lg:gap-x-10">
        <div className="lg:col-span-6 xl:col-span-5">
          <SectionToolbar
            mode="tour"
            tourInfo={tourInfo}
            onUploadSuccess={handleGPXLoad}
          />
          <Tour_Form />
        </div>

        <div className="lg:col-span-6 xl:col-span-7">
          <figure className="flex h-full flex-col">
            <div className="flex items-center justify-between gap-4 border border-b-0 border-ink px-3 py-2">
              <span className="t-label t-label--ink">Route</span>
              <span className="t-label">
                {routeCoordinates.length > 0
                  ? `${routeCoordinates.length.toLocaleString("en-GB")} points plotted`
                  : "Awaiting track"}
              </span>
            </div>

            <div className="h-[22rem] border border-ink sm:h-[28rem] lg:h-[calc(100%-2.5rem)] lg:min-h-[30rem]">
              {bounds ? (
                <MapContainer
                  key={routeCoordinates.length}
                  bounds={bounds}
                  boundsOptions={{ padding: [24, 24] }}
                  scrollWheelZoom
                  className="h-full w-full"
                >
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                  />
                  <Polyline
                    positions={routeCoordinates}
                    pathOptions={{
                      color: "#101010",
                      weight: 7,
                      opacity: 0.16,
                      lineCap: "butt",
                    }}
                  />
                  <Polyline
                    positions={routeCoordinates}
                    pathOptions={{
                      color: "#a24e2b",
                      weight: 2.5,
                      opacity: 1,
                      lineCap: "butt",
                    }}
                  />
                </MapContainer>
              ) : (
                <EmptyPlate
                  className="h-full border-0"
                  title="No route on the sheet yet"
                  body="Upload a GPX track from your route planner, or load a tour you already saved. Distance and climb are read straight from the file."
                />
              )}
            </div>
          </figure>
        </div>
      </div>
    </section>
  );
}

export default Tour_Full;
