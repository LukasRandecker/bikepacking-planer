import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { SetupItemsContext } from "../../Context/PacklistContext.jsx";

const LoadSetup = ({ onClose, onLoadSetup }) => {
  const [setups, setSetups] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [error, setError] = useState("");

  const { setActiveSetupId } = useContext(SetupItemsContext);
  const userId = sessionStorage.getItem("userId");

  useEffect(() => {
    const fetchSetups = async () => {
      try {
        const userRes = await axios.get(
          `http://localhost:3030/bikepacking/users/${userId}`
        );

        const setupIds = userRes.data.itemlists || [];
        console.log("Setup IDs:", setupIds);

        const data = await Promise.all(
          setupIds.map((id) =>
            axios
              .get(`http://localhost:3030/bikepacking/itemlists/${id}`)
              .then((r) => r.data)
          )
        );

        setSetups(data);
      } catch (err) {
        console.error(err);
        setError("Fehler beim Laden der Setups");
      }
    };

    if (userId) fetchSetups();
  }, [userId]);

  const handleConfirm = async () => {
    if (!selectedId) return;

    const setup = setups.find((s) => s._id === selectedId);
    if (!setup) return;
    setActiveSetupId(setup._id);
    onLoadSetup({
      id: setup._id,
      items: Array.isArray(setup.items) ? setup.items : [],
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white w-96 rounded-xl p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4">
          ✕
        </button>
        <h2 className="text-xl font-semibold mb-4 text-center">Setup laden</h2>

        {setups.map((setup) => (
          <div
            key={setup._id}
            onClick={() => setSelectedId(setup._id)}
            className={`p-2 mb-2 border rounded cursor-pointer ${
              selectedId === setup._id ? "bg-gray-200" : ""
            }`}
          >
            {setup.Name}
          </div>
        ))}

        <button
          onClick={handleConfirm}
          className="w-full bg-black text-white py-2 rounded mt-3"
        >
          Laden
        </button>
      </div>
    </div>
  );
};

export default LoadSetup;
