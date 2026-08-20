import { createContext } from "react";

/**
 * Wer eingeloggt ist — und die eine Stelle, an der nach einem Login gefragt
 * wird.
 *
 * `user` ist das Konto, wie der Server es sieht (`{ _id, username, tours,
 * itemlists }`), oder null. Es kommt aus `GET /users/me`, nicht aus dem
 * Browserspeicher: der Sitzungs-Token liegt in einem httpOnly-Cookie, an das
 * JavaScript nicht herankommt.
 *
 * `requireLogin(grund)` gibt `true` zurück, wenn jemand eingeloggt ist, und
 * öffnet sonst den Login-Dialog mit dem übergebenen Grund. Damit muss keine
 * Komponente ihren eigenen Login-Dialog halten.
 *
 * `checking` ist true, solange die erste Nachfrage beim Server läuft — in der
 * Zeit ist noch nicht entschieden, ob jemand eingeloggt ist.
 */
export const UserContext = createContext({
  user: null,
  setUser: () => {},
  requireLogin: () => false,
  logout: async () => {},
  checking: true,
});
