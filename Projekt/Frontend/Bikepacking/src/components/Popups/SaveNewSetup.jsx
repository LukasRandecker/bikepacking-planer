import { useState } from "react";

const NewSetup_Popup = ({ onClose, onSave, initialMessage }) => {
  const [setupName, setSetupName] = useState("");
  const [error, setError] = useState(initialMessage || "");

  const handleSubmit = () => {
    setError("");
    if (!setupName.trim()) {
      setError("Bitte gib einen Namen für das Setup ein");
      return;
    }
    onSave(setupName.trim());
    setSetupName("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white w-80 md:w-96 rounded-xl p-6 relative space-y-4">
        <button onClick={onClose} className="absolute top-4 right-4 text-xl">
          ✕
        </button>

        <h2 className="text-2xl font-semibold text-center">
          Neues Setup erstellen
        </h2>

        <input
          type="text"
          placeholder="Setup-Name"
          value={setupName}
          onChange={(e) => setSetupName(e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
        />

        {error && (
          <div className="text-red-600 text-sm text-center">{error}</div>
        )}

        <button
          onClick={handleSubmit}
          className="w-full bg-black text-white py-2 rounded-lg uppercase"
        >
          Erstellen
        </button>
      </div>
    </div>
  );
};

export default NewSetup_Popup;
