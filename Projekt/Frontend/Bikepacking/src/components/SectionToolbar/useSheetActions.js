import { useCallback, useContext, useState } from "react";

import { TourFormContext } from "../../Context/TourFormContext.jsx";
import { SetupItemsContext } from "../../Context/SetupItemsContext.jsx";
import { exportPacklistPdf } from "../../lib/pdf.js";
import api, { errorMessage } from "../../lib/api.js";

/**
 * Everything the tour and packlist toolbars do to the server, kept out of the
 * markup. Each action reports through `notify(tone, message)` and flips a busy
 * flag, so the buttons can show a running state instead of silently doing
 * nothing while a request is in flight.
 */
export default function useSheetActions({ tourInfo, notify }) {
  const [busy, setBusy] = useState(null);

  const {
    tourName,
    startDate,
    endDate,
    bikeType,
    sleepSetup,
    rideType,
    mode: tourMode,
    activeTourId,
    setActiveTourId,
  } = useContext(TourFormContext);

  const {
    itemsByCategory,
    activeSetupId,
    setActiveSetupId,
    totalWeight,
    totalPrice,
  } = useContext(SetupItemsContext);

  const allItemIds = useCallback(
    () =>
      Object.values(itemsByCategory || {}).flatMap((items) =>
        items.map((item) => item._id)
      ),
    [itemsByCategory]
  );

  const saveTour = useCallback(async () => {
    const missing = [
      !tourName && "a tour name",
      !startDate && "a start date",
      !endDate && "an end date",
    ].filter(Boolean);

    if (missing.length) {
      notify(
        "error",
        `Add ${missing.join(", ")} before saving — the tour needs them to be found again.`
      );
      return;
    }

    const payload = {
      Name: tourName,
      StartDate: startDate,
      EndDate: endDate,
      Biketype: bikeType,
      Setupstyle: sleepSetup,
      Type: rideType,
      Mode: tourMode,
      GPX_file: tourInfo?.gpxFileName || "",
      // Aus der GPX-Datei gelesen. Ohne das stünde die Tour später mit
      // 0 km / 0 m im Index, obwohl der Track dranhängt.
      Distance: Math.round(Number(tourInfo?.km) || 0),
      Elevation: Math.round(Number(tourInfo?.hm) || 0),
    };

    setBusy("save_tour");
    try {
      if (activeTourId) {
        await api.put(`/tours/${activeTourId}`, payload);
        notify("success", `“${tourName}” updated.`);
        return;
      }

      // POST gibt die Tour samt Id zurück und hängt sie ans eigene Konto —
      // die alte Suche über alle Felder braucht es dafür nicht mehr.
      const { data } = await api.post("/tours", payload);
      setActiveTourId(data._id);

      notify("success", `“${tourName}” saved to your account.`);
    } catch (err) {
      notify("error", errorMessage(err, "The tour could not be saved."));
    } finally {
      setBusy(null);
    }
  }, [
    tourName,
    startDate,
    endDate,
    bikeType,
    sleepSetup,
    rideType,
    tourMode,
    activeTourId,
    setActiveTourId,
    tourInfo,
    notify,
  ]);

  /** Saves into the open setup, or asks for a name when there is none yet. */
  const saveSetup = useCallback(async () => {
    const ids = allItemIds();
    if (ids.length === 0) {
      notify("error", "There are no items to save yet. Add gear to a category first.");
      return "empty";
    }
    if (!activeSetupId) return "needs-name";

    setBusy("save_setup");
    try {
      const { data: existing } = await api.get(`/itemlists/${activeSetupId}`);
      await api.put(`/itemlists/${activeSetupId}`, {
        Name: existing.Name,
        items: ids,
      });

      notify("success", `Setup updated — ${ids.length} items.`);
      return "saved";
    } catch (err) {
      notify("error", errorMessage(err, "The setup could not be saved."));
      return "failed";
    } finally {
      setBusy(null);
    }
  }, [allItemIds, activeSetupId, notify]);

  const createSetup = useCallback(
    async (name) => {
      const ids = allItemIds();
      if (ids.length === 0) {
        notify("error", "There are no items to save yet. Add gear to a category first.");
        return;
      }

      setBusy("save_setup");
      try {
        const { data } = await api.post("/itemlists", { Name: name, items: ids });
        setActiveSetupId(data._id);
        sessionStorage.removeItem("addedItems");

        // Hängt die Liste an die offene Tour — ohne Packliste darf eine Tour
        // nicht veröffentlicht werden.
        if (activeTourId) {
          await api.put(`/tours/${activeTourId}`, { Itemlist: data._id });
        }
        notify("success", `“${name}” saved — ${ids.length} items.`);
      } catch (err) {
        notify("error", errorMessage(err, "The setup could not be saved."));
      } finally {
        setBusy(null);
      }
    },
    [allItemIds, setActiveSetupId, activeTourId, notify]
  );

  const exportPdf = useCallback(async () => {
    if (allItemIds().length === 0) {
      notify("error", "The list is empty — there is nothing to print yet.");
      return;
    }
    // Der PDF-Code wird erst hier nachgeladen, das dauert einen Moment —
    // solange zeigt der Knopf seinen laufenden Zustand.
    setBusy("pdf");
    try {
      const file = await exportPacklistPdf({
        itemsByCategory,
        tour: { tourName, startDate, endDate, bikeType, rideType, mode: tourMode },
        totalWeight,
        totalPrice,
      });
      notify("success", `Saved as ${file}.`);
    } catch (err) {
      console.error(err);
      notify("error", "The PDF could not be created. Try again, or reload the page.");
    } finally {
      setBusy(null);
    }
  }, [
    allItemIds,
    itemsByCategory,
    tourName,
    startDate,
    endDate,
    bikeType,
    rideType,
    tourMode,
    totalWeight,
    totalPrice,
    notify,
  ]);

  return { busy, saveTour, saveSetup, createSetup, exportPdf, itemCount: allItemIds().length };
}
