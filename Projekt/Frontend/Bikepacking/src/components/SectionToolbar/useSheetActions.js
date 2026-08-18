import { useCallback, useContext, useState } from "react";

import { TourFormContext } from "../../Context/TourFormContext.jsx";
import { SetupItemsContext } from "../../Context/PacklistContext.jsx";
import { exportPacklistPdf } from "../../lib/pdf.js";

const API = "http://localhost:3030/bikepacking";

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

    const base = {
      Name: tourName,
      StartDate: startDate,
      EndDate: endDate,
      Biketype: bikeType,
      Setupstyle: sleepSetup,
      Type: rideType,
      Mode: tourMode,
    };
    const payload = { ...base, GPX_file: tourInfo?.gpxFileName };

    setBusy("save_tour");
    try {
      if (activeTourId) {
        const res = await fetch(`${API}/tours/${activeTourId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("The server refused the update.");
        notify("success", `“${tourName}” updated.`);
        return;
      }

      const saveRes = await fetch(`${API}/tours`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!saveRes.ok) throw new Error("The server refused the new tour.");

      const findRes = await fetch(`${API}/tours/find`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(base),
      });
      if (!findRes.ok) throw new Error("The tour saved, but its id came back empty.");
      const { tourId } = await findRes.json();

      const userId = sessionStorage.getItem("userId");
      if (!userId) throw new Error("Your session expired. Log in and try again.");

      const linkRes = await fetch(`${API}/users/${userId}/addTours`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tourIds: [tourId] }),
      });
      if (!linkRes.ok)
        throw new Error("The tour saved, but it could not be linked to your account.");

      notify("success", `“${tourName}” saved to your account.`);
    } catch (err) {
      notify("error", err.message);
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
      const readRes = await fetch(`${API}/itemlists/${activeSetupId}`);
      if (!readRes.ok) throw new Error("The open setup could not be read back.");
      const existing = await readRes.json();

      const res = await fetch(`${API}/itemlists/${activeSetupId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Name: existing.Name, items: ids }),
      });
      if (!res.ok) throw new Error("The server refused the update.");

      notify("success", `Setup updated — ${ids.length} items.`);
      return "saved";
    } catch (err) {
      notify("error", err.message);
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

      const userId = sessionStorage.getItem("userId");
      if (!userId) {
        notify("error", "Your session expired. Log in and try again.");
        return;
      }

      setBusy("save_setup");
      try {
        const res = await fetch(`${API}/itemlists`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ Name: name, items: ids }),
        });
        if (!res.ok) throw new Error("The server refused the new setup.");

        const { _id: newSetupId } = await res.json();
        setActiveSetupId(newSetupId);

        const linkRes = await fetch(`${API}/users/${userId}/addItemlists`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemlistIds: [newSetupId] }),
        });
        if (!linkRes.ok)
          throw new Error("The setup saved, but it could not be linked to your account.");

        sessionStorage.removeItem("addedItems");
        notify("success", `“${name}” saved — ${ids.length} items.`);
      } catch (err) {
        notify("error", err.message);
      } finally {
        setBusy(null);
      }
    },
    [allItemIds, setActiveSetupId, notify]
  );

  const exportPdf = useCallback(() => {
    if (allItemIds().length === 0) {
      notify("error", "The list is empty — there is nothing to print yet.");
      return;
    }
    try {
      const file = exportPacklistPdf({
        itemsByCategory,
        tour: { tourName, startDate, endDate, bikeType, rideType, mode: tourMode },
        totalWeight,
        totalPrice,
      });
      notify("success", `Saved as ${file}.`);
    } catch (err) {
      console.error(err);
      notify("error", "The PDF could not be created. Try again, or reload the page.");
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
