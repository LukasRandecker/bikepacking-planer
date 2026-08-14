import { useRef, useState } from "react";
import axios from "axios";

const Upload_GPX_Popup = ({ onClose, onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [gpxFileName, setGpxFileName] = useState("");
  const fileInputRef = useRef(null);

  const handleUpload = async () => {
    if (!file) {
      setError("Bitte eine GPX-Datei auswählen");
      return;
    }

    const formData = new FormData();
    formData.append("gpx", file);

    try {
      const res = await axios.post(
        "http://localhost:3030/bikepacking/upload",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (onUploadSuccess) {
        onUploadSuccess(res.data);
        setGpxFileName(res.data.fileName);
      }
      onClose();
    } catch (err) {
      console.error(err);
      setError("Upload fehlgeschlagen");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white w-79 md:w-99 rounded-xl p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-xl">
          ✕
        </button>

        <h2 className="text-2xl font-semibold mb-4 text-center">
          GPX-Datei hochladen
        </h2>

        <div
          onClick={() => fileInputRef.current.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            setFile(e.dataTransfer.files[0]);
            setError("");
          }}
          className="
            border-2 border-dashed border-gray-400 rounded-lg
            p-6 text-center cursor-pointer
            hover:border-black transition
            mb-3
          "
        >
          <p className="text-gray-600">
            {file ? `📄 ${file.name}` : "GPX-Datei hier ablegen oder klicken"}
          </p>
          <p className="text-sm text-gray-400 mt-1">Nur .gpx Dateien</p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".gpx"
          className="hidden"
          onChange={(e) => {
            setFile(e.target.files[0]);
            setError("");
          }}
        />

        {error && (
          <div className="text-red-600 text-sm mb-3 text-center">{error}</div>
        )}

        <button
          onClick={handleUpload}
          className="w-full bg-black text-white py-2 rounded-lg uppercase"
        >
          Upload
        </button>
      </div>
    </div>
  );
};

export default Upload_GPX_Popup;
