// TourFormContext.js
import { createContext, useState } from "react";

export const TourFormContext = createContext({
  tourName: "",
  startDate: "",
  endDate: "",
  bikeType: "MTB",
  sleepSetup: "INDOOR",
  rideType: "BIKEPACKING",
  mode: "SOLO",
  activeTourId: "",
  setTourData: () => {},
});

export const TourFormProvider = ({ children }) => {
  const [tourName, setTourName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [bikeType, setBikeType] = useState("MTB");
  const [sleepSetup, setSleepSetup] = useState("INDOOR");
  const [rideType, setRideType] = useState("BIKEPACKING");
  const [mode, setMode] = useState("SOLO");
  const [activeTourId, setActiveTourId] = useState("");

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
