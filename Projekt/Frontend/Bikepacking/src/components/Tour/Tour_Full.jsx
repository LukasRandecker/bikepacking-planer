import { useState } from "react";
import Headline_Up_download from "../Headline_Up-download/Headline_Up-download.jsx";
import Tour_Form from "./Tour_Form.jsx";
import Upload_GPX_Popup from "../Popups/Upload_GPX.jsx";
import LoadTourPopup from "../Popups/LoadTour.jsx";
import { MapContainer, TileLayer, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";

function Tour_Full({ user, setUser }) {
  const [mode, setMode] = useState("tour");
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [tourInfo, setTourInfo] = useState({
    km: 0,
    hm: 0,
    name: "",
    gpxFileName: "",
  });
  const [showUploadPopup, setShowUploadPopup] = useState(false);
  const [showLoadPopup, setShowLoadPopup] = useState(false);

  // Callback function für Upload oder Laden
  const handleGPXLoad = (data) => {
    if (!data || !data.coordinates) return;

    setRouteCoordinates(data.coordinates);
    setTourInfo({
      km: data.km,
      hm: data.hm,
      name: data.tourName || "",
      gpxFileName: data.fileName || "",
    });
  };

  return (
    <div
      id="tour"
      className="w-full py-8 px-6 md:px-20 bg-gray-100 lg:flex lg:flex-row"
    >
      <div className="lg:w-5/5 pr-10 py-4">
        <Headline_Up_download
          mode={mode}
          setMode={setMode}
          user={user}
          setUser={setUser}
          onUploadClick={() => setShowUploadPopup(true)}
          onLoadClick={() => setShowLoadPopup(true)}
          onUploadSuccess={handleGPXLoad}
          tourInfo={tourInfo}
        />
        <Tour_Form />
      </div>

      <div className="w-full h-[40vh] sm:h-[60vh] z-1 flex items-center justify-center bg-gray-200">
        {routeCoordinates.length === 0 ? (
          <span className="text-gray-500 text-lg p-5 text-center">
            Please upload or load the GPX file to view the route.
          </span>
        ) : (
          <MapContainer
            key={routeCoordinates.length}
            center={routeCoordinates[0]}
            zoom={13}
            scrollWheelZoom={true}
            className="w-full h-full"
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.carto.com/">CARTO</a>'
            />
            <Polyline positions={routeCoordinates} />
          </MapContainer>
        )}
      </div>

      {showUploadPopup && (
        <Upload_GPX_Popup
          onClose={() => setShowUploadPopup(false)}
          onUploadSuccess={(data) => {
            handleGPXLoad(data);
            setShowUploadPopup(false);
          }}
        />
      )}

      {showLoadPopup && (
        <LoadTourPopup
          onClose={() => setShowLoadPopup(false)}
          onUploadSuccess={(data) => {
            handleGPXLoad(data);
            setShowLoadPopup(false);
          }}
        />
      )}
    </div>
  );
}

export default Tour_Full;
