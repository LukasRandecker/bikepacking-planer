import { useContext } from "react";
import { TourFormContext } from "../../Context/TourFormContext.jsx";
import { Field, SegmentedChoice } from "../ui/Controls.jsx";

/**
 * The title block of the tour: the fields that describe the ride the route
 * alone cannot. Every either/or is one segmented strip — the pill toggles this
 * replaced were the only round things left on the sheet, and they hid which
 * side was actually selected.
 */
const Tour_Form = () => {
  const {
    tourName,
    setTourName,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    bikeType,
    setBikeType,
    sleepSetup,
    setSleepSetup,
    rideType,
    setRideType,
    mode,
    setMode,
  } = useContext(TourFormContext);

  const datesOutOfOrder =
    startDate && endDate && new Date(endDate) < new Date(startDate);

  return (
    <div className="mt-6 flex flex-col gap-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Tour name"
          id="tourName"
          type="text"
          placeholder="Name your tour"
          value={tourName}
          onChange={(e) => setTourName(e.target.value)}
          className="sm:col-span-2"
        />

        <Field
          label="Start date"
          id="startDate"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />

        <Field
          label="End date"
          id="endDate"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          error={
            datesOutOfOrder
              ? "The end date falls before the start date."
              : undefined
          }
        />
      </div>

      <div className="grid gap-6 border-t border-rule pt-6 sm:grid-cols-2">
        <SegmentedChoice
          legend="Bike"
          name="bikeType"
          value={bikeType}
          onChange={setBikeType}
          options={["MTB", "GRAVEL", "ROAD"]}
        />

        <SegmentedChoice
          legend="Sleep setup"
          name="sleepSetup"
          value={sleepSetup}
          onChange={setSleepSetup}
          options={["INDOOR", "OUTDOOR", "MIXED"]}
        />

        <SegmentedChoice
          legend="Ride type"
          name="rideType"
          value={rideType}
          onChange={setRideType}
          options={["BIKEPACKING", "RACE"]}
          accent
        />

        <SegmentedChoice
          legend="Riding as"
          name="tourMode"
          value={mode}
          onChange={setMode}
          options={["SOLO", "GROUP"]}
          accent
        />
      </div>
    </div>
  );
};

export default Tour_Form;
