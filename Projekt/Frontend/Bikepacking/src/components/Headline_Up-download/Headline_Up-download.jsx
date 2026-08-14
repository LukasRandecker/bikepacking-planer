import { useState, useContext } from "react";
import axios from "axios";
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { Route as RouteIcon, Mountain } from "lucide-react";

// Contexts für User, Tour-Formular und Setup-/Packlisten-Daten
import { UserContext } from "../../Context/UserContext.jsx";
import { TourFormContext } from "../../Context/TourFormContext.jsx";
import { SetupItemsContext } from "../../Context/PacklistContext";

//Popups
import Login_Popup from "../Popups/Login";
import Upload_GPX_Popup from "../Popups/Upload_GPX.jsx";
import LoadTourPopup from "../Popups/LoadTour.jsx";
import Alert_Popup from "../Popups/alert.jsx";
import LoadSetupPopup from "../Popups/LoadSetup.jsx";
import NewSetup_Popup from "../Popups/SaveNewSetup.jsx";

// PDF Generation
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const Headline_Up_download = ({
  mode,
  onUploadSuccess,
  tourInfo
}) => {
  //Popup states 
  const [showLogin, setShowLogin] = useState(false);
  const [loginMessage, setLoginMessage] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [showLoadPopup, setShowLoadPopup] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [showSetupPopup, setShowSetupPopup] = useState(false);
  const [showNewSetupPopup, setShowNewSetupPopup] = useState(false);

  //Modus (Tour/Setup)
  const currentMode = mode;

  //Login und User Context
  const { user, setUser } = useContext(UserContext);
  const { itemsByCategory, activeSetupId, setSetupItems, setActiveSetupId, totalPrice, totalWeight } = useContext(SetupItemsContext);

  // Alert Popup
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const setAlertValues = (title, message) => {
    setAlertTitle(title);
    setAlertMessage(message);
  };

  // TourFormContext auslesen
  const {
    tourName,
    startDate,
    endDate,
    bikeType,
    sleepSetup,
    rideType,
    mode: tourMode,
    activeTourId,
  } = useContext(TourFormContext);


  //Zentrale steuereinheit was bei welchem button click passieren soll
  const handleButtonClick = (action) => {
  if (!user) {
    setLoginMessage("Please log in to use this feature.");
    setShowLogin(true);
    return;
  }

  if (action === "upload") setShowUpload(true);
  if (action === "download") generatePDF();

  if (action === "load_tour") loadTour();
  if (action === "load_setup") loadSetup();

  if (action === "save_tour") submitTour();
  if (action === "save_setup") submitSetup();
  };

  const loadTour = () => {
    setShowLoadPopup(true);
  };
  const loadSetup = () => {
    setShowSetupPopup(true);
  };

  // Tour speichern und User updaten
  const submitTour = async () => {
    if (
      !tourName ||
      !startDate ||
      !endDate ||
      !bikeType ||
      !sleepSetup ||
      !rideType ||
      !tourMode
    ) {
      setAlertValues(
        "Error",
        "Please fill in all fields and upload optional GPX file"
      );
      setShowAlert(true);
      return;
    }

    const payloadBase = {
      Name: tourName,
      StartDate: startDate,
      EndDate: endDate,
      Biketype: bikeType,
      Setupstyle: sleepSetup,
      Type: rideType,
      Mode: tourMode,
    };

    // Payload inkl. GPX-Datei
    const payload = { ...payloadBase, GPX_file: tourInfo.gpxFileName };
    if (activeTourId != "") {
      try {
        const saveResponse = await fetch(
          `http://localhost:3030/bikepacking/tours/${activeTourId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );

        if (!saveResponse.ok) throw new Error("Error saving the tour");
        setAlertValues("Success", "Tour updated successfully!");
        setShowAlert(true);
      } catch (error) {
        setAlertValues("Error", error.message);
        setShowAlert(true);
      }
    } else {
      try {
        const saveResponse = await fetch(
          "http://localhost:3030/bikepacking/tours",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );

        if (!saveResponse.ok) throw new Error("Error saving the tour");

        const savedTour = await saveResponse.json();

        const findResponse = await fetch(
          "http://localhost:3030/bikepacking/tours/find",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payloadBase),
          }
        );

        if (!findResponse.ok)
          throw new Error("Error retrieving tour ID");

        const { tourId } = await findResponse.json();

        const userId = sessionStorage.getItem("userId");
        if (!userId) throw new Error("User not logged in");

        const addTourResponse = await fetch(
          `http://localhost:3030/bikepacking/users/${userId}/addTours`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tourIds: [tourId] }),
          }
        );

        if (!addTourResponse.ok)
          throw new Error("Error adding tour to user");

        const updatedUser = await addTourResponse.json();

        setAlertValues("Success", "New tour saved successfully!");
        setShowAlert(true);
      } catch (error) {
        setAlertValues("Error", error.message);
        setShowAlert(true);
      }
    }
  };

  //Setup speichern und User updaten
  const submitSetup = async () => {
    const allItemIds = getAllItemIds();

    if (allItemIds.length === 0) {
      setAlertValues("Error", "No items in setup found!");
      setShowAlert(true);
      return;
    }

    try {
      let setupName = "";
      // Wenn activeSetupId existiert, erst die bestehende Setup-Daten holen
      if (activeSetupId) {
        const res = await fetch(
          `http://localhost:3030/bikepacking/itemlists/${activeSetupId}`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          }
        );

        if (!res.ok) throw new Error("Error loading setup");

        const data = await res.json();
        setupName = data.name; // Name aus bestehendem Setup
      }

      const payload = {
        Name: setupName,
        items: allItemIds,
      };

      // Update oder Create
      if (activeSetupId) {
        // Setup aktualisieren
        const saveResponse = await fetch(
          `http://localhost:3030/bikepacking/itemlists/${activeSetupId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );

        if (!saveResponse.ok)
          throw new Error("Error saving setup");

        setAlertValues("Success", "Setup updated successfully!");
        setShowAlert(true);
      } else {
        setShowNewSetupPopup(true);
      }
    } catch (error) {
      setAlertValues("Error", error.message);
      setShowAlert(true);
    }
  };

  //Wenn neues Setup gespeichert werden soll
  const handleNewSetup = async (setupName) => {
    const allItemIds = JSON.parse(sessionStorage.getItem("addedItems") || "[]");

    if (allItemIds.length === 0) {
      setAlertValues("Error", "No items in setup found!");
      setShowAlert(true);
      return;
    }

    try {
      const userId = sessionStorage.getItem("userId");
      if (!userId) throw new Error("User not logged in");

      // Neues Setup erstellen
      let payload = {
        Name: setupName,
        items: allItemIds,
      };

      const saveResponse = await fetch(
        "http://localhost:3030/bikepacking/itemlists",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!saveResponse.ok) throw new Error("Error creating setup");

      const { _id: newSetupId } = await saveResponse.json();
      payload = {
        itemlistIds: [newSetupId],
      };

      setActiveSetupId(newSetupId);

      // Items an User binden
      await fetch(
        `http://localhost:3030/bikepacking/users/${userId}/addItemlists`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      // SessionStorage zurücksetzen
      sessionStorage.removeItem("addedItems");

      setAlertValues("Success", "New setup saved successfully!");
      setShowAlert(true);
    } catch (err) {
      setAlertValues("Error", err.message);
      setShowAlert(true);
    }
  };

  //Hilfsfunktion um alle Item ID's aus einer Itemlist zu bekommen 
  const getAllItemIds = () => {
    return Object.values(itemsByCategory || {}).flatMap((categoryItems) =>
      categoryItems.map((item) => item._id)
    );
  };

  //PDF Generierung 
  const generatePDF = () => {
    try {
      const doc = new jsPDF();
      console.log("itemsByCategory:", itemsByCategory);
      autoTable(doc, {
        head: [["Checkbox", "Category", "Name"]],
        body: Object.entries(itemsByCategory).flatMap(([category, items]) =>
          items.map((item) => ["[   ]", category || "", item.Itemname || ""])
        ),
      });

      doc.save("setup_items.pdf");
    } catch (err) {
      console.error("Error generating PDF:", err);
      setAlertValues("Error", "PDF could not be created");
      setShowAlert(true);
    }
  };


  return (
    <div>
      <div className="flex max-w-md lg:max-w-4xl">
        <div>
          {/* Tourname oben */}
          <h1 className="text-2xl md:text-4xl font-bold">
            {tourInfo?.name || (currentMode === "tour" ? "TOUR" : "SETUP")}
          </h1>

          <h2 className="mb-4 p-1 text-sm">
            {currentMode === "tour" ? "SETTINGS" : "SUMMARY"}
          </h2>

          {/* km und hm anzeigen */}
          <div className="flex gap-5 text-gray-600 text-sm">
            <div className="flex items-center gap-1">
              <span>
                <RouteIcon />
              </span>
              <span>
                {currentMode === "tour" ? `${tourInfo?.km || 0} km` : `${totalWeight / 1000} kg`}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span>
                <Mountain />
              </span>
              <span>
                {currentMode === "tour" ? `${tourInfo?.hm || 0} hm` : `${totalPrice.toFixed(2)} €`}
              </span>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="w-1/2 md:w-1/4 grid grid-rows-2 gap-3 justify-end ml-auto">
          <div className="flex gap-2 py-1 justify-end">
            <button
              className="px-4 bg-black text-white rounded-xl text-sm max-h-10 h-10 flex items-center justify-center hover:bg-white hover:text-black hover:border border-solid uppercase"
              onClick={() =>
                handleButtonClick(
                  currentMode === "tour" ? "load_tour" : "load_setup"
                )
              }
            >
              LOAD
            </button>
            <button
              className="px-4 bg-black text-white rounded-xl text-sm max-h-10 h-10 flex items-center justify-center hover:bg-white hover:text-black hover:border border-solid uppercase"
              onClick={() =>
                handleButtonClick(
                  currentMode === "tour" ? "save_tour" : "save_setup"
                )
              }
            >
              SAVE
            </button>
          </div>

          <div className="flex gap-2 py-1 justify-end">
            <button
              className={`px-4 bg-black text-white rounded-xl text-sm max-h-10 h-10 flex items-center justify-center hover:bg-white hover:text-black hover:border border-solid uppercase ${
                currentMode === "setup" ? "visible" : "hidden"
              }`}
              onClick={() => handleButtonClick("download")}
            >
              <ArrowDownToLine />
            </button>

            <button
              className={`px-4 bg-black text-white rounded-xl text-sm max-h-10 h-10 flex items-center justify-center hover:bg-white hover:text-black hover:border border-solid uppercase ${
                currentMode === "tour" ? "visible" : "hidden"
              }`}
              onClick={() => handleButtonClick("upload")}
            >
              <ArrowUpFromLine />
            </button>
          </div>
        </div>
      </div>


      {/*Popup Steuerung*/}
      {showUpload && (
        <Upload_GPX_Popup
          onClose={() => setShowUpload(false)}
          onUploadSuccess={(data) => {
            if (onUploadSuccess) onUploadSuccess(data);
            setShowUpload(false);
          }}
        />
      )}
   
      {showLogin && (
        <Login_Popup
          onClose={() => setShowLogin(false)}
          onLoginSuccess={(userData) => {
            if (!userData || !userData._id) {
              return;
            }
            sessionStorage.setItem("userId", userData._id);
            setUser(userData._id);
            setShowLogin(false);
          }}
          loginMessage={loginMessage}
        />
      )}

      {showLoadPopup && (
        <LoadTourPopup
          onClose={() => setShowLoadPopup(false)}
          onUploadSuccess={(data) => {
            if (onUploadSuccess) onUploadSuccess(data);
            setShowLoadPopup(false);
          }}
        />
      )}

      {showSetupPopup && (
        <LoadSetupPopup
          onClose={() => setShowSetupPopup(false)}
          onLoadSetup={async (setupData) => {
            try {
              // Items per ID laden
              const items = await Promise.all(
                setupData.items.map((id) =>
                  axios
                    .get(`http://localhost:3030/bikepacking/items/${id}`)
                    .then((res) => res.data)
                )
              );
              // Items gruppieren
              const grouped = items.reduce((acc, item) => {
                if (!item?.Categorie) return acc;
                if (!acc[item.Categorie]) acc[item.Categorie] = [];
                acc[item.Categorie].push(item);
                return acc;
              }, {});

              // Context updaten
              setSetupItems(grouped, setupData._id); // ✅ korrekt

              setShowSetupPopup(false);
            } catch (err) {
              console.error("Fehler beim Laden der Items für Setup:", err);
            }
          }}
        />
      )}

      {showAlert && (
        <Alert_Popup
          title={alertTitle}
          message={alertMessage}
          onClose={() => setShowAlert(false)}
        />
      )}

      {showNewSetupPopup && (
        <NewSetup_Popup
          onClose={() => setShowNewSetupPopup(false)}
          onSave={handleNewSetup}
        />
      )}
    </div>
  );
};

export default Headline_Up_download;
