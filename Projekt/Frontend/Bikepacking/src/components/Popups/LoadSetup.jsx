import { useContext, useEffect, useState } from "react";
import axios from "axios";

import Modal from "../ui/Modal.jsx";
import { Button, Note, RecordPicker } from "../ui/Controls.jsx";
import { LoadingRows } from "../ui/Sheet.jsx";
import { SetupItemsContext } from "../../Context/PacklistContext.jsx";

const API = "http://localhost:3030/bikepacking";

const LoadSetup = ({ onClose, onLoadSetup }) => {
  const [setups, setSetups] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const { setActiveSetupId } = useContext(SetupItemsContext);
  const userId = sessionStorage.getItem("userId");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!userId) {
        setLoading(false);
        setError("Your session expired. Log in and try again.");
        return;
      }
      try {
        const userRes = await axios.get(`${API}/users/${userId}`);
        const ids = userRes.data.itemlists || [];
        const data = await Promise.all(
          ids.map((id) => axios.get(`${API}/itemlists/${id}`).then((r) => r.data))
        );
        if (!cancelled) setSetups(data);
      } catch {
        if (!cancelled)
          setError("Your saved setups could not be fetched. Check the server and try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const handleConfirm = async () => {
    const setup = setups.find((s) => s._id === selectedId);
    if (!setup) {
      setError("Choose a setup from the list first.");
      return;
    }

    setBusy(true);
    setActiveSetupId(setup._id);
    await onLoadSetup({
      id: setup._id,
      items: Array.isArray(setup.items) ? setup.items : [],
    });
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
              meta: `${(setup.items || []).length} items`,
            }))}
          />
        )}
      </div>
    </Modal>
  );
};

export default LoadSetup;
