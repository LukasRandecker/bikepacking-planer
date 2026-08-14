import { useContext } from "react";
import { TourFormContext } from "../../Context/TourFormContext";

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

  const toggleRideType = () => {
    setRideType((prev) => (prev === "BIKEPACKING" ? "RACE" : "BIKEPACKING"));
  };

  const toggleMode = () => {
    setMode((prev) => (prev === "SOLO" ? "GROUP" : "SOLO"));
  };

  return (
    <div className="mt-6">
      <div className="flex flex-col md:flex-row lg:flex-col gap-6">
        <div className="flex-1 flex flex-col gap-6 md:gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="tourName" className="text-sm font-medium ">
              Tourname
            </label>
            <input
              type="text"
              id="tourName"
              className="px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-gray-400 text-sm"
              placeholder="NAME YOUR TOUR"
              value={tourName}
              onChange={(e) => setTourName(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="dateRange" className="text-sm font-medium">
              Date
            </label>
            <input
              type="date"
              id="startDate"
              className="px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-gray-400 text-sm"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <input
              type="date"
              id="endDate"
              className="px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-gray-400 text-sm"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col md:w-2/5 md:ml-5 gap-6 md:gap-4 justify-start lg:ml-0 lg:f">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">Bike</span>
            <div className="flex gap-4 text-sm">
              {["MTB", "GRAVEL", "ROAD"].map((type) => (
                <label key={type} className="flex items-center gap-1">
                  <input
                    type="radio"
                    name="bikeType"
                    checked={bikeType === type}
                    onChange={() => setBikeType(type)}
                  />
                  {type}
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">Setup Style</span>
            <div className="flex gap-4 text-sm">
              {["INDOOR", "OUTDOOR", "MIXED"].map((setup) => (
                <label key={setup} className="flex items-center gap-1">
                  <input
                    type="radio"
                    name="sleepSetup"
                    checked={sleepSetup === setup}
                    onChange={() => setSleepSetup(setup)}
                  />
                  {setup}
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium mr-4">Type:</span>
              <div
                className="relative w-44 h-8 lg:h-10 bg-gray-300 rounded-full cursor-pointer"
                onClick={toggleRideType}
              >
                <div
                  className="z-10 absolute top-0.5 h-7 lg:h-9 px-5 bg-black text-white rounded-full flex items-center justify-center text-xs transition-all duration-300"
                  style={{ left: rideType === "RACE" ? "60%" : "0%" }}
                >
                  {rideType}
                </div>
                <div className="absolute fit-content inset-0 flex items-center justify-between px-2 text-xs text-gray-600">
                  <span>BIKEPACKING</span>
                  <span>RACE</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium mr-4">Mode:</span>
              <div
                className="relative w-35 h-8 lg:h-10 bg-gray-300 rounded-full cursor-pointer"
                onClick={toggleMode}
              >
                <div
                  className="z-10 absolute top-0.5 h-7 lg:h-9 px-5 bg-black text-white rounded-full flex items-center justify-center text-xs transition-all duration-300"
                  style={{ left: mode === "SOLO" ? "50%" : "0%" }}
                >
                  {mode}
                </div>
                <div className="absolute fit-content inset-0 flex items-center justify-between px-2 text-xs text-gray-600">
                  <span>GROUP</span>
                  <span>SOLO</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tour_Form;
