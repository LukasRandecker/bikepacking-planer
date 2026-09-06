import { useCallback, useState } from "react";

import { TourFormContext } from "./TourFormContext.jsx";
import { EMPTY } from "./tourFormEmpty.js";

/**
 * Haelt das Tourblatt. Das Context-Objekt und der leere Ausgangszustand
 * liegen in `TourFormContext.jsx`.
 */
export const TourFormProvider = ({ children }) => {
  const [tourName, setTourName] = useState(EMPTY.tourName);
  const [startDate, setStartDate] = useState(EMPTY.startDate);
  const [endDate, setEndDate] = useState(EMPTY.endDate);
  const [bikeType, setBikeType] = useState(EMPTY.bikeType);
  const [sleepSetup, setSleepSetup] = useState(EMPTY.sleepSetup);
  const [rideType, setRideType] = useState(EMPTY.rideType);
  const [mode, setMode] = useState(EMPTY.mode);
  const [activeTourId, setActiveTourId] = useState(EMPTY.activeTourId);

  const setTourData = (data) => {
    if (data.Name !== undefined) setTourName(data.Name);
    if (data.StartDate !== undefined) setStartDate(data.StartDate);
    if (data.EndDate !== undefined) setEndDate(data.EndDate);
    if (data.Biketype !== undefined) setBikeType(data.Biketype);
    if (data.Setupstyle !== undefined) setSleepSetup(data.Setupstyle);
    if (data.Type !== undefined) setRideType(data.Type);
    if (data.Mode !== undefined) setMode(data.Mode);
    if (data._id !== undefined) setActiveTourId(data._id);
  };

  /**
   * Zurück auf ein leeres Blatt.
   *
   * Räumt nur die Eingabe — eine bereits gespeicherte Tour bleibt auf dem
   * Konto. `activeTourId` fällt mit weg, sonst würde das nächste Speichern
   * die alte Tour überschreiben statt eine neue anzulegen.
   */
  const resetTourForm = useCallback(() => {
    setTourName(EMPTY.tourName);
    setStartDate(EMPTY.startDate);
    setEndDate(EMPTY.endDate);
    setBikeType(EMPTY.bikeType);
    setSleepSetup(EMPTY.sleepSetup);
    setRideType(EMPTY.rideType);
    setMode(EMPTY.mode);
    setActiveTourId(EMPTY.activeTourId);
  }, []);

  return (
    <TourFormContext.Provider
      value={{
        tourName,
        startDate,
        endDate,
        bikeType,
        sleepSetup,
        rideType,
        mode,
        activeTourId,
        setTourData,
        resetTourForm,
        setTourName,
        setStartDate,
        setEndDate,
        setBikeType,
        setSleepSetup,
        setRideType,
        setMode,
        setActiveTourId,
      }}
    >
      {children}
    </TourFormContext.Provider>
  );
};
