import { useContext, useEffect, useState } from "react";
import api from "../../lib/api.js";

import Modal from "../ui/Modal.jsx";
import { Button, Note, RecordPicker } from "../ui/Controls.jsx";
import { LoadingRows } from "../ui/Sheet.jsx";
import { SetupItemsContext } from "../../Context/PacklistContext.jsx";

const LoadSetup = ({ onClose, onLoadSetup }) => {
  const [setups, setSetups] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const { setActiveSetupId } = useContext(SetupItemsContext);

  useEffect(() => {
    let cancelled = false;

    // Eine Anfrage: der Server kennt aus dem Cookie, wessen Listen gemeint sind.
    api
      .get("/itemlists/mine")
      .then(({ data }) => {
        if (!cancelled) setSetups(data);
      })
      .catch(() => {
        if (!cancelled)
          setError("Your saved setups could not be fetched. Check the server and try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleConfirm = async () => {
    const setup = setups.find((s) => s._id === selectedId);
    if (!setup) {
      setError("Choose a setup from the list first.");
      return;
    }

    setBusy(true);
    setActiveSetupId(setup._id);
    await onLoadSetup({ id: setup._id });
    setBusy(false);
  };

  return (
    <Modal
      onClose={onClose}
      title="Load a setup"
      code="Packlist · Saved"
      footer={
        <Button
          variant="clay"
          onClick={handleConfirm}
          busy={busy}
          disabled={loading || setups.length === 0}
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
        ) : setups.length === 0 ? (
          <p className="m-grid border border-dashed border-ink/40 px-4 py-8 text-center text-sm text-ink-soft">
            You have not saved a setup yet. Add gear to the packlist and press
            Save.
          </p>
        ) : (
          <RecordPicker
            legend="Saved setups"
            name="saved-setup"
            value={selectedId}
            onChange={setSelectedId}
            records={setups.map((setup) => ({
              id: setup._id,
              title: setup.Name || "Unnamed setup",
              meta: `${setup.itemCount ?? 0} items`,
            }))}
          />
        )}
      </div>
    </Modal>
  );
};

export default LoadSetup;
