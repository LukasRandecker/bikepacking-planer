/**
 * Der Zustand eines unbeschriebenen Tourblatts.
 *
 * Steht an einer Stelle, damit "neu anfangen" und "zum ersten Mal öffnen"
 * garantiert dasselbe ergeben — der Context nimmt ihn als Vorgabewert, der
 * Provider als Startwert seiner States und `resetTourForm()` als Ziel.
 */
export const EMPTY = {
  tourName: "",
  startDate: "",
  endDate: "",
  bikeType: "MTB",
  sleepSetup: "INDOOR",
  rideType: "BIKEPACKING",
  mode: "SOLO",
  activeTourId: "",
};
