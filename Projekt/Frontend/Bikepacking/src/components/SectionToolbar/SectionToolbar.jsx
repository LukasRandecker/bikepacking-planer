import { useCallback, useContext, useEffect, useRef, useState } from "react";

import { SectionHead, Datum } from "../ui/Sheet.jsx";
import { Button, Note } from "../ui/Controls.jsx";
import { IconDownload, IconRedraw, IconUpload } from "../ui/Icons.jsx";
import Modal from "../ui/Modal.jsx";
import useSheetActions from "./useSheetActions.js";

import Upload_GPX_Popup from "../Popups/Upload_GPX.jsx";
import LoadTourPopup from "../Popups/LoadTour.jsx";
import LoadSetupPopup from "../Popups/LoadSetup.jsx";
import NewSetup_Popup from "../Popups/SaveNewSetup.jsx";

import { UserContext } from "../../Context/UserContext.jsx";
import { SetupItemsContext } from "../../Context/SetupItemsContext.jsx";
import { TourFormContext } from "../../Context/TourFormContext.jsx";
import { DEMO } from "../../lib/demo.js";
import api from "../../lib/api.js";

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
  onReset,
}) {
  const isTour = mode === "tour";

  const { requireLogin } = useContext(UserContext);
  const { setSetupItems, clearSetup, totalWeight, totalPrice } =
    useContext(SetupItemsContext);
  const { tourName, startDate, endDate, activeTourId, resetTourForm } =
    useContext(TourFormContext);

  const [feedback, setFeedback] = useState(null);
  const [dialog, setDialog] = useState(null);
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
    if (!requireLogin(isTour
      ? "Log in to create a tour, upload its GPX track and load it again."
      : "Log in to build, save and export a packlist.")) return;
    run();
  };

  const handleSaveSetup = async () => {
    const outcome = await saveSetup();
    if (outcome === "needs-name") setDialog("new-setup");
  };

  /**
   * Steht auf dem Blatt überhaupt etwas? Ein leeres Blatt zu leeren ist keine
   * Frage wert — dann läuft der Knopf ohne Rückfrage durch.
   */
  const hasContent = isTour
    ? Boolean(tourName || startDate || endDate || activeTourId || tourInfo?.gpxFileName)
    : itemCount > 0;

  /** Leert nur die Anzeige. Gespeichertes bleibt auf dem Konto. */
  const startFresh = () => {
    if (isTour) {
      resetTourForm();
      onReset?.();
    } else {
      clearSetup();
    }
    setDialog(null);
    setFeedback(null);
    notify("success", isTour ? "Fresh tour sheet." : "Fresh packlist.");
  };

  const newButton = (
    <Button
      variant="quiet"
      icon={IconRedraw}
      onClick={() => (hasContent ? setDialog("confirm-reset") : startFresh())}
      title={isTour ? "Empty the tour sheet" : "Empty the packlist"}
    >
      New
    </Button>
  );

  /**
   * Laden und Speichern setzen ein Konto voraus, das es im Demo-Modus nicht
   * gibt. Sie verschwinden, statt grau dazustehen: ein toter Knopf laedt zum
   * Draufklicken ein und erklaert nichts. Was bleibt, arbeitet echt — der
   * Track wird wirklich gelesen, das PDF wirklich erzeugt.
   */
  const actions = isTour ? (
    <>
      {newButton}
      {DEMO ? null : (
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
        </>
      )}
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
      {newButton}
      {DEMO ? null : (
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
        </>
      )}
      <Button
        variant="clay"
        icon={IconDownload}
        onClick={guard(exportPdf)}
        busy={busy === "pdf"}
      >
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
              // Eine Anfrage für die ganze Liste statt einer pro Item.
              const { data } = await api.get(`/itemlists/${setupData.id}/items`);
              const grouped = data.items.reduce((acc, item) => {
                if (!item?.Categorie) return acc;
                (acc[item.Categorie] ??= []).push(item);
                return acc;
              }, {});

              setSetupItems(grouped, setupData.id);
              onLoadSetup?.(setupData);
              setDialog(null);
              notify("success", `Setup loaded — ${data.items.length} items.`);
            } catch {
              setDialog(null);
              notify("error", "The setup could not be loaded. Try again.");
            }
          }}
        />
      ) : null}

      {dialog === "confirm-reset" ? (
        <Modal
          onClose={() => setDialog(null)}
          title={isTour ? "Empty the tour sheet?" : "Empty the packlist?"}
          code={isTour ? "Tour · New" : "Packlist · New"}
          footer={
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
              <Button variant="quiet" onClick={() => setDialog(null)}>
                Keep what is there
              </Button>
              <Button variant="clay" onClick={startFresh}>
                {isTour ? "Empty the sheet" : "Empty the list"}
              </Button>
            </div>
          }
        >
          <p className="t-body text-[0.9375rem]">
            {isTour
              ? "The fields, the loaded track and the link to a saved tour are cleared, so the next save files a new tour."
              : `All ${itemCount} items are taken off the sheet, and the next save asks for a new setup name.`}
          </p>
          <p className="t-label mt-4">
            {activeTourId || (!isTour && itemCount > 0)
              ? "Nothing is deleted from your account — this only empties what is on screen."
              : "Nothing has been saved yet, so this cannot be undone."}
          </p>
        </Modal>
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
