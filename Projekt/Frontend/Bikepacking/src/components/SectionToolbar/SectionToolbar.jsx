import { useCallback, useContext, useEffect, useRef, useState } from "react";
import axios from "axios";

import { SectionHead, Datum } from "../ui/Sheet.jsx";
import { Button, Note } from "../ui/Controls.jsx";
import { IconDownload, IconUpload } from "../ui/Icons.jsx";
import useSheetActions from "./useSheetActions.js";

import Login_Popup from "../Popups/Login.jsx";
import Upload_GPX_Popup from "../Popups/Upload_GPX.jsx";
import LoadTourPopup from "../Popups/LoadTour.jsx";
import LoadSetupPopup from "../Popups/LoadSetup.jsx";
import NewSetup_Popup from "../Popups/SaveNewSetup.jsx";

import { UserContext } from "../../Context/UserContext.jsx";
import { SetupItemsContext } from "../../Context/PacklistContext.jsx";

const nf = (n, digits = 0) =>
  Number(n || 0).toLocaleString("en-GB", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

/**
 * The head of a working section: what it is, what it measures, and what can be
 * done to it. Feedback lands inline on the sheet rather than in a modal —
 * "saved" is news, not an interruption that needs the screen to itself.
 */
export default function SectionToolbar({
  mode,
  tourInfo,
  onUploadSuccess,
  onLoadSetup,
}) {
  const isTour = mode === "tour";

  const { user, setUser } = useContext(UserContext);
  const { setSetupItems, totalWeight, totalPrice } =
    useContext(SetupItemsContext);

  const [feedback, setFeedback] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [loginMessage, setLoginMessage] = useState("");
  const timer = useRef(null);

  const notify = useCallback((tone, message) => {
    clearTimeout(timer.current);
    setFeedback({ tone, message });
    if (tone === "success") {
      timer.current = setTimeout(() => setFeedback(null), 6000);
    }
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  const { busy, saveTour, saveSetup, createSetup, exportPdf, itemCount } =
    useSheetActions({ tourInfo, notify });

  /** Every write needs an account; the gate is one place, not six buttons. */
  const guard = (run) => () => {
    if (!user) {
      setLoginMessage("Log in to save, load and upload.");
      setDialog("login");
      return;
    }
    run();
  };

  const handleSaveSetup = async () => {
    const outcome = await saveSetup();
    if (outcome === "needs-name") setDialog("new-setup");
  };

  const actions = isTour ? (
    <>
      <Button variant="quiet" onClick={guard(() => setDialog("load-tour"))}>
        Load
      </Button>
      <Button
        variant="ghost"
        onClick={guard(saveTour)}
        busy={busy === "save_tour"}
      >
        Save
      </Button>
      <Button
        variant="clay"
        icon={IconUpload}
        onClick={guard(() => setDialog("upload"))}
      >
        Upload GPX
      </Button>
    </>
  ) : (
    <>
      <Button variant="quiet" onClick={guard(() => setDialog("load-setup"))}>
        Load
      </Button>
      <Button
        variant="ghost"
        onClick={guard(handleSaveSetup)}
        busy={busy === "save_setup"}
      >
        Save
      </Button>
      <Button variant="clay" icon={IconDownload} onClick={guard(exportPdf)}>
        Export PDF
      </Button>
    </>
  );

  return (
    <>
      <SectionHead
        title={isTour ? tourInfo?.name || "Tour" : "Packlist"}
        meta={isTour ? "Route and details" : "Schedule of items"}
        action={<div className="flex flex-wrap gap-2">{actions}</div>}
      />

      {feedback ? (
        <Note tone={feedback.tone} className="mt-4">
          {feedback.message}
        </Note>
      ) : null}

      <div className="c-cellgrid mt-4 grid-cols-1 sm:grid-cols-3">
        {isTour ? (
          <>
            <Datum
              label="Distance"
              value={nf(tourInfo?.km)}
              unit="km"
              tone="clay"
              size="lg"
            />
            <Datum
              label="Climb"
              value={nf(tourInfo?.hm)}
              unit="m"
              tone="olive"
              size="lg"
            />
            <Datum
              label="GPX file"
              value={tourInfo?.gpxFileName || "None loaded"}
            />
          </>
        ) : (
          <>
            <Datum label="Items" value={nf(itemCount)} size="lg" />
            <Datum
              label="Total weight"
              value={nf(totalWeight / 1000, 2)}
              unit="kg"
              tone="clay"
              size="lg"
            />
            <Datum
              label="Total price"
              value={nf(totalPrice, 2)}
              unit="EUR"
              tone="olive"
              size="lg"
            />
          </>
        )}
      </div>

      {dialog === "login" ? (
        <Login_Popup
          onClose={() => setDialog(null)}
          loginMessage={loginMessage}
          onLoginSuccess={(userData) => {
            if (!userData?._id) return;
            sessionStorage.setItem("userId", userData._id);
            setUser(userData._id);
            setDialog(null);
          }}
        />
      ) : null}

      {dialog === "upload" ? (
        <Upload_GPX_Popup
          onClose={() => setDialog(null)}
          onUploadSuccess={(data) => {
            onUploadSuccess?.(data);
            setDialog(null);
            notify("success", "Track loaded onto the sheet.");
          }}
        />
      ) : null}

      {dialog === "load-tour" ? (
        <LoadTourPopup
          onClose={() => setDialog(null)}
          onUploadSuccess={(data) => {
            onUploadSuccess?.(data);
            setDialog(null);
          }}
        />
      ) : null}

      {dialog === "load-setup" ? (
        <LoadSetupPopup
          onClose={() => setDialog(null)}
          onLoadSetup={async (setupData) => {
            try {
              const items = await Promise.all(
                setupData.items.map((id) =>
                  axios
                    .get(`http://localhost:3030/bikepacking/items/${id}`)
                    .then((res) => res.data)
                )
              );
              const grouped = items.reduce((acc, item) => {
                if (!item?.Categorie) return acc;
                (acc[item.Categorie] ??= []).push(item);
                return acc;
              }, {});

              setSetupItems(grouped, setupData.id);
              onLoadSetup?.(setupData);
              setDialog(null);
              notify("success", `Setup loaded — ${items.length} items.`);
            } catch {
              setDialog(null);
              notify("error", "The setup could not be loaded. Try again.");
            }
          }}
        />
      ) : null}

      {dialog === "new-setup" ? (
        <NewSetup_Popup
          onClose={() => setDialog(null)}
          onSave={(name) => {
            setDialog(null);
            createSetup(name);
          }}
        />
      ) : null}
    </>
  );
}
