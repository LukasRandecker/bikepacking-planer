import { useCallback, useEffect, useMemo, useState } from "react";
import { Outlet, ScrollRestoration } from "react-router-dom";

import NavBar from "./components/NavBar/NavBar.jsx";
import Footer from "./components/Footer/Footer.jsx";
import DemoNotice from "./components/DemoNotice/DemoNotice.jsx";
import Login_Popup from "./components/Popups/Login.jsx";

import { UserContext } from "./Context/UserContext.jsx";
import { TourFormProvider } from "./Context/TourFormProvider.jsx";
import { DEMO } from "./lib/demo.js";
import api from "./lib/api.js";

function App() {
  /**
   * Wer eingeloggt ist, weiß der Server.
   *
   * Der Token liegt in einem httpOnly-Cookie, das JavaScript nicht lesen kann
   * — genau deshalb ist es sicher. Der Client fragt beim Start einmal nach und
   * merkt sich die Antwort; eine Id im sessionStorage wäre nur eine Behauptung.
   */
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  const [loginReason, setLoginReason] = useState(null);

  useEffect(() => {
    let cancelled = false;

    // Ohne Server gibt es keine Sitzung, nach der man fragen koennte.
    if (DEMO) {
      setChecking(false);
      return;
    }

    // Den Token selbst kann JavaScript nicht lesen — deshalb setzt der Server
    // beim Login zusätzlich ein sichtbares `signed_in`. Ohne dieses Cookie ist
    // sicher niemand angemeldet, und die Frage an den Server entfällt: sie
    // hätte nur ein 401 in die Konsole geschrieben und einen Roundtrip
    // gekostet, den jeder anonyme Besucher bezahlt.
    if (!document.cookie.split("; ").some((c) => c.startsWith("signed_in="))) {
      setUser(null);
      setChecking(false);
      return;
    }

    api
      .get("/users/me")
      .then(({ data }) => {
        if (!cancelled) setUser(data);
      })
      .catch(() => {
        // Der Hinweis war da, der Token aber abgelaufen oder ungültig.
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Die eine Türsteher-Funktion der App. Wer schreibt, fragt hier vorher;
   * wer nicht eingeloggt ist, bekommt den Dialog samt Grund statt eines
   * Formulars, das ohnehin nichts speichern könnte.
   */
  const requireLogin = useCallback(
    (reason) => {
      // Im Demo-Modus gibt es keine Tuer, vor der jemand stehen koennte:
      // planen, den Katalog durchsuchen und exportieren geht ohne Konto,
      // und was ein Konto braeuchte, ist gar nicht erst in der Oberflaeche.
      if (DEMO || user) return true;
      setLoginReason(reason || "Log in to use this part of the sheet.");
      return false;
    },
    [user]
  );

  const logout = useCallback(async () => {
    if (DEMO) return;
    try {
      await api.post("/users/logout");
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, setUser, requireLogin, logout, checking }),
    [user, requireLogin, logout, checking]
  );

  return (
    <UserContext.Provider value={value}>
      <TourFormProvider>
        {/* Ein Klick auf eine Tour soll oben auf dem Blatt landen, nicht dort,
            wo die vorige Seite gerade stand. Zurück stellt die alte Position
            wieder her, und ein `#anker` in der Adresse gewinnt gegen beides. */}
        <ScrollRestoration />

        <div className="sheet-shell">
          <a
            href="#main"
            className="c-btn c-btn--clay c-skip"
          >
            Skip to content
          </a>
          <NavBar />
          {DEMO ? <DemoNotice /> : null}
          <main id="main" className="flex-1">
            <Outlet />
          </main>
          <Footer />
        </div>

        {loginReason !== null && !DEMO ? (
          <Login_Popup
            loginMessage={loginReason}
            onClose={() => setLoginReason(null)}
            onLoginSuccess={(userData) => {
              setUser(userData);
              setLoginReason(null);
            }}
          />
        ) : null}
      </TourFormProvider>
    </UserContext.Provider>
  );
}

export default App;
