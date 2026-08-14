import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { TourFormContext } from "../../Context/TourFormContext.jsx";

const LoadTourPopup = ({ onClose, onUploadSuccess }) => {
  const [userTours, setUserTours] = useState([]);
  const [selectedTourId, setSelectedTourId] = useState("");
  const [error, setError] = useState("");

  const { setTourData } = useContext(TourFormContext);
  const userId = sessionStorage.getItem("userId");

  useEffect(() => {
    const fetchUserTours = async () => {
      if (!userId) return;
      try {
        const userRes = await axios.get(
          `http://localhost:3030/bikepacking/users/${userId}`
        );
        const tourIds = userRes.data.tours || [];
        const toursData = await Promise.all(
          tourIds.map((id) =>
            axios
              .get(`http://localhost:3030/bikepacking/tours/${id}`)
              .then((r) => r.data)
          )
        );
        setUserTours(toursData);
      } catch (err) {
        console.error(err);
        setError("Fehler beim Laden der Touren");
      }
    };
    fetchUserTours();
  }, [userId]);

  const handleConfirm = async () => {
    if (!selectedTourId) {
      setError("Bitte eine Tour auswählen");
      return;
    }

    const tour = userTours.find((t) => t._id === selectedTourId);
    if (!tour) {
      setError("Tour nicht gefunden");
      return;
    }

    // Form Daten setzen
    setTourData(tour);

    // GPX laden, falls vorhanden
    if (tour.GPX_file && onUploadSuccess) {
      try {
        const gpxRes = await axios.get(
          `http://localhost:3030/bikepacking/loadGpx/${tour.GPX_file}`
        );
        const gpxData = gpxRes.data;

        // Direkt den Callback mit allen Daten aufrufen
        onUploadSuccess({
          coordinates: gpxData.coordinates,
          km: gpxData.km,
          hm: gpxData.hm,
          tourName: gpxData.tourName || tour.Name,
          fileName: gpxData.fileName,
        });
      } catch (err) {
        console.error(err);
        setError("Fehler beim Laden der GPX-Datei");
      }
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white w-79 md:w-99 rounded-xl p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-xl">
          ✕
        </button>
        <h2 className="text-2xl font-semibold mb-4 text-center">Tour laden</h2>
        {error && (
          <div className="text-red-600 text-sm mb-3 text-center">{error}</div>
        )}

        <div className="max-h-64 overflow-y-auto mb-3">
          {userTours.length === 0 && (
            <p className="text-gray-600 text-center">Keine Touren verfügbar</p>
          )}
          {userTours.map((tour) => (
            <div
              key={tour._id}
              onClick={() => setSelectedTourId(tour._id)}
              className={`p-2 mb-2 cursor-pointer border rounded ${
                selectedTourId === tour._id
                  ? "border-black bg-gray-100"
                  : "border-gray-300"
              }`}
            >
              <p className="font-semibold">{tour.Name}</p>
              <p className="text-sm text-gray-500">
                {tour.StartDate} - {tour.EndDate}
              </p>
            </div>
          ))}
        </div>

        <button
          onClick={handleConfirm}
          className="w-full bg-black text-white py-2 rounded-lg uppercase"
        >
          Laden
        </button>
      </div>
    </div>
  );
};

export default LoadTourPopup;
