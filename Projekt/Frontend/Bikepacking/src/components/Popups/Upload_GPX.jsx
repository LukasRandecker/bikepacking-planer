import { useState } from "react";
import api, { errorMessage } from "../../lib/api.js";

import Modal from "../ui/Modal.jsx";
import { Button, FileDrop, Note } from "../ui/Controls.jsx";
import { IconUpload } from "../ui/Icons.jsx";
import { DEMO } from "../../lib/demo.js";
import { DEMO_TOURS } from "../../lib/demoData.js";

const MAX_BYTES = 10 * 1024 * 1024;

const Upload_GPX_Popup = ({ onClose, onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleUpload = async () => {
    if (!file) {
      setError("Choose a GPX file first.");
      return;
    }

    const formData = new FormData();
    formData.append("gpx", file);

    setBusy(true);
    try {
      const res = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onUploadSuccess?.(res.data);
      onClose();
    } catch (err) {
      // Die Meldung kommt aus der Antwort, wenn es eine gibt — im Demo-Modus
      // vom Parser im Browser, sonst vom Server. Der Ersatztext greift nur,
      // wenn keine da ist, und darf dann nicht auf einen Port verweisen, den
      // es in einer oeffentlichen Demo nicht gibt.
      setError(
        errorMessage(
          err,
          err.response?.status === 413
            ? "That file is larger than 10 MB."
            : DEMO
              ? "That file could not be read as GPX. Try another one."
              : "The upload failed. Check that the server is running on port 3030, then try again."
        )
      );
    } finally {
      setBusy(false);
    }
  };

  /** Eine der mitgelieferten Beispieldateien auf das Blatt holen. */
  const plotExample = async (track) => {
    setError("");
    setBusy(true);
    try {
      const { data } = await api.get(`/loadGpx/${track.GPX_file}`);
      onUploadSuccess?.(data);
      onClose();
    } catch (err) {
      setError(errorMessage(err, "That example track could not be read."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      onClose={onClose}
      title="Upload a GPX track"
      code="Tour · Route"
      footer={
        <Button
          variant="clay"
          onClick={handleUpload}
          busy={busy}
          disabled={!file}
          className="w-full"
        >
          Plot the track
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        {error ? <Note tone="error">{error}</Note> : null}

        {/* Dieselbe Drop-Zone wie im Publish-Dialog und beim Anlegen eines
            Items. Vorher hatte diese Stelle ihre eigene Kopie — samt eigener
            Groessenanzeige, die unter einem Kilobyte "0 KB" schrieb, und einem
            unbeschrifteten Dateifeld. Pruefung von Endung und Groesse steckt
            jetzt in FileDrop; der Server prueft ohnehin noch einmal. */}
        <FileDrop
          label="GPX track"
          idleTitle="Drop a GPX file or browse"
          hint=".gpx only · up to 10 MB"
          accept=".gpx,application/gpx+xml"
          extensions={[".gpx"]}
          maxBytes={MAX_BYTES}
          file={file}
          onFile={(f) => {
            setError("");
            setFile(f);
          }}
          onClear={() => setFile(null)}
          icon={IconUpload}
        />

        <p className="t-label">
          Distance and climb are read from the file — nothing is typed in by
          hand.
        </p>

        {/* Die meisten Besucher haben keine GPX-Datei zur Hand. Ohne diese
            beiden Zeilen sehen sie eine leere Karte und gehen wieder. */}
        {DEMO ? (
          <div className="border border-ink">
            <div className="flex items-baseline justify-between gap-4 border-b border-ink px-3 py-2">
              <span className="t-label t-label--ink">No file at hand?</span>
              <span className="t-label">Example tracks</span>
            </div>

            <ul>
              {DEMO_TOURS.map((track) => (
                <li
                  key={track.slug}
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-rule px-3 py-3 last:border-b-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">
                      {track.Name}
                    </p>
                    <p className="t-label truncate">{track.GPX_file}</p>
                  </div>
                  <Button
                    variant="quiet"
                    onClick={() => plotExample(track)}
                    disabled={busy}
                  >
                    Plot this one
                  </Button>
                </li>
              ))}
            </ul>

            <p className="t-label border-t border-rule px-3 py-2.5">
              Routed with BRouter over OpenStreetMap data (ODbL), elevation from
              SRTM. Real roads, real terrain — not recorded rides.
            </p>
          </div>
        ) : null}
      </div>
    </Modal>
  );
};

export default Upload_GPX_Popup;
