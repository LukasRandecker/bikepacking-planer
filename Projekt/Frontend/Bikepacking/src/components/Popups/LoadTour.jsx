import { useContext, useEffect, useState } from "react";
import api from "../../lib/api.js";

import Modal from "../ui/Modal.jsx";
import { Button, Note, RecordPicker } from "../ui/Controls.jsx";
import { LoadingRows } from "../ui/Sheet.jsx";
import { TourFormContext } from "../../Context/TourFormContext.jsx";

const LoadTourPopup = ({ onClose, onUploadSuccess }) => {
  const [tours, setTours] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const { setTourData } = useContext(TourFormContext);

  useEffect(() => {
    let cancelled = false;

    // Eine Anfrage: der Server kennt aus dem Cookie, wessen Touren gemeint sind.
    api
      .get("/tours/mine")
      .then(({ data }) => {
        if (!cancelled) setTours(data);
      })
      .catch(() => {
        if (!cancelled)
          setError("Your saved tours could not be fetched. Check the server and try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleConfirm = async () => {
    const tour = tours.find((t) => t._id === selectedId);
    if (!tour) {
      setError("Choose a tour from the list first.");
      return;
    }

    setBusy(true);
    setTourData(tour);

    if (tour.GPX_file && onUploadSuccess) {
      try {
        const { data } = await api.get(`/loadGpx/${tour.GPX_file}`);
        onUploadSuccess({
          coordinates: data.coordinates,
          km: data.km,
          hm: data.hm,
          tourName: data.tourName || tour.Name,
          fileName: data.fileName,
        });
      } catch {
        setBusy(false);
        setError(
          `“${tour.Name}” loaded, but its GPX track is missing on the server. The details are filled in; the map stays empty.`
        );
        return;
      }
    }

    setBusy(false);
    onClose();
  };

  return (
    <Modal
      onClose={onClose}
      title="Load a tour"
      code="Tour · Saved"
      footer={
        <Button
          variant="clay"
          onClick={handleConfirm}
          busy={busy}
          disabled={loading || tours.length === 0}
          className="w-full"
        >
          Load onto the sheet
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        {error ? <Note tone="error">{error}</Note> : null}

        {loading ? (
          <LoadingRows rows={3} />
        ) : tours.length === 0 ? (
          <p className="m-grid border border-dashed border-ink/40 px-4 py-8 text-center text-sm text-ink-soft">
            You have not saved a tour yet. Fill in the tour details on the sheet
            and press Save.
          </p>
        ) : (
          <RecordPicker
            legend="Saved tours"
            name="saved-tour"
            value={selectedId}
            onChange={setSelectedId}
            records={tours.map((tour) => ({
              id: tour._id,
              title: tour.Name || "Unnamed tour",
              meta:
                [tour.StartDate, tour.EndDate].filter(Boolean).join(" – ") ||
                "No dates",
            }))}
          />
        )}
      </div>
    </Modal>
  );
};

export default LoadTourPopup;
