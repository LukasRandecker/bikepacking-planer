import { useRef, useState } from "react";
import axios from "axios";

import Modal from "../ui/Modal.jsx";
import { Button, Note } from "../ui/Controls.jsx";
import { IconUpload } from "../ui/Icons.jsx";

const MAX_BYTES = 10 * 1024 * 1024;

const Upload_GPX_Popup = ({ onClose, onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef(null);

  /* The upload endpoints are the app's most open surface, so the client
     checks type and size before the request and the server checks again. */
  const takeFile = (candidate) => {
    if (!candidate) return;
    if (!candidate.name.toLowerCase().endsWith(".gpx")) {
      setError(`“${candidate.name}” is not a GPX file. Export the track as GPX and try again.`);
      setFile(null);
      return;
    }
    if (candidate.size > MAX_BYTES) {
      setError(
        `That track is ${(candidate.size / 1024 / 1024).toFixed(1)} MB. The limit is 10 MB.`
      );
      setFile(null);
      return;
    }
    setError("");
    setFile(candidate);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Choose a GPX file first.");
      return;
    }

    const formData = new FormData();
    formData.append("gpx", file);

    setBusy(true);
    try {
      const res = await axios.post(
        "http://localhost:3030/bikepacking/upload",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      onUploadSuccess?.(res.data);
      onClose();
    } catch (err) {
      console.error(err);
      setError(
        err.response?.status === 413
          ? "The server rejected the file as too large."
          : "The upload failed. Check that the server is running on port 3030, then try again."
      );
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

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            takeFile(e.dataTransfer.files[0]);
          }}
          className="m-grid flex min-h-[9rem] w-full flex-col items-center justify-center gap-2 border border-dashed border-ink/50 p-5 text-center transition-colors duration-150 hover:border-ink"
        >
          <IconUpload size={22} />
          {file ? (
            <>
              <span className="t-mono break-all">{file.name}</span>
              <span className="t-label">
                {(file.size / 1024).toFixed(0)} KB · ready
              </span>
            </>
          ) : (
            <>
              <span className="t-label t-label--ink">
                Drop a GPX file or browse
              </span>
              <span className="t-label">.gpx only · up to 10 MB</span>
            </>
          )}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".gpx,application/gpx+xml"
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => takeFile(e.target.files[0])}
        />

        <p className="t-label">
          Distance and climb are read from the file — nothing is typed in by
          hand.
        </p>
      </div>
    </Modal>
  );
};

export default Upload_GPX_Popup;
