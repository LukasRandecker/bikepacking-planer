import { useState } from "react";

import Modal from "../ui/Modal.jsx";
import { Button, Field } from "../ui/Controls.jsx";

const NewSetup_Popup = ({ onClose, onSave, initialMessage }) => {
  const [setupName, setSetupName] = useState("");
  const [error, setError] = useState(initialMessage || "");

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!setupName.trim()) {
      setError("Give the setup a name so you can find it again.");
      return;
    }
    setError("");
    onSave(setupName.trim());
  };

  return (
    <Modal
      onClose={onClose}
      title="Name this setup"
      code="Packlist · New"
      footer={
        <Button variant="clay" onClick={handleSubmit} className="w-full">
          Save setup
        </Button>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field
          label="Setup name"
          type="text"
          placeholder="e.g. Summer gravel, 4 nights"
          value={setupName}
          onChange={(e) => setSetupName(e.target.value)}
          error={error || undefined}
          hint="Saved to your account with everything currently on the list."
        />
        <button type="submit" className="sr-only" tabIndex={-1}>
          Save setup
        </button>
      </form>
    </Modal>
  );
};

export default NewSetup_Popup;
