import { useContext, useEffect, useId, useRef, useState } from "react";
import { HashLink } from "react-router-hash-link";
import { Link, useLocation } from "react-router-dom";

import { Mark, IconAccount, IconClose, IconMenu } from "../ui/Icons.jsx";
import { Button } from "../ui/Controls.jsx";
import Login_Popup from "../Popups/Login.jsx";
import { UserContext } from "../../Context/UserContext.jsx";
import { DEMO } from "../../lib/demo.js";

const SHEETS = { "/": "01 · Index", "/overview": "02 · Planner", "/user": "03 · Account" };

// Ohne Server gibt es kein Konto — der Knopf und die Kontoseite verschwinden,
// statt grau und unbenutzbar dazustehen. Ein toter Knopf laedt zum Klicken ein
// und erklaert nichts.
const ACCOUNTS = !DEMO;

const LINKS = [
  { to: "/", label: "Home", match: (p, h) => p === "/" && !h },
  { to: "/overview#tour", label: "Tour", match: (p, h) => p === "/overview" && h !== "#packlist" },
  { to: "/overview#packlist", label: "Packlist", match: (p, h) => p === "/overview" && h === "#packlist" },
];

/**
 * The sheet's header strip. Each item is a cell of the title block, divided by
 * hairlines; the route in view is marked by a clay rule along its top edge —
 * the drawing's own way of flagging the active view.
 */
const NavBar = () => {
  const { user, setUser, logout } = useContext(UserContext);
  const { pathname, hash } = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const menuId = useId();
  const navRef = useRef(null);

  useEffect(() => setMenuOpen(false), [pathname, hash]);

  useEffect(() => {
    if (!menuOpen) return;

    const onKey = (e) => e.key === "Escape" && setMenuOpen(false);
    const onPointer = (e) => {
      if (!navRef.current?.contains(e.target)) setMenuOpen(false);
    };

    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [menuOpen]);

  // Ausloggen heisst: der Server loescht das Cookie. Ein lokales Vergessen
  // wuerde die Sitzung offen lassen.
  const handleLogout = () => {
    setMenuOpen(false);
    logout();
  };

  return (
    <header ref={navRef} className="sticky top-0 z-40 bg-sheet">
      <nav
        aria-label="Main"
        className="flex items-stretch border-b border-ink"
      >
        <Link
          to="/"
          className="flex flex-none items-center gap-2.5 px-3 py-3 md:px-6"
          aria-label="Bikepacking — home"
        >
          <Mark size={22} />
          {/* Below ~360px the wordmark and the two controls cannot share the
              bar without overflowing; the mark carries it alone there. */}
          <span className="t-h3 hidden min-[360px]:block">Bikepacking</span>
        </Link>

        <ul className="hidden items-stretch md:flex">
          {LINKS.map(({ to, label, match }) => {
            const active = match(pathname, hash);
            return (
              <li key={to} className="relative flex">
                {active ? (
                  <span
                    aria-hidden="true"
                    className="a-rule absolute inset-x-0 top-0 h-0.5 bg-clay"
                  />
                ) : null}
                <HashLink
                  smooth
                  to={to}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center border-l border-rule px-5 no-underline transition-colors duration-150 hover:bg-field ${
                    active ? "text-ink" : "text-ink-soft"
                  }`}
                >
                  <span className="t-label t-label--ink">{label}</span>
                </HashLink>
              </li>
            );
          })}
        </ul>

        <div className="ml-auto flex items-stretch">
          <span className="hidden items-center border-l border-rule px-5 lg:flex">
            <span className="t-label">
              Sheet {SHEETS[pathname] ?? "— · Not found"}
            </span>
          </span>

          {ACCOUNTS ? (
            <>
              {user ? (
                <Button
                  variant="quiet"
                  onClick={handleLogout}
                  className="flex-none self-stretch border-0 border-l border-rule"
                >
                  Log out
                </Button>
              ) : (
                <Button
                  variant="clay"
                  onClick={() => setLoginOpen(true)}
                  className="flex-none self-stretch border-0 border-l border-clay"
                >
                  Log in
                </Button>
              )}

              <Link
                to="/user"
                aria-label="Account"
                className="hidden w-11 flex-none items-center justify-center border-l border-rule transition-colors duration-150 hover:bg-field md:flex"
              >
                <IconAccount size={19} />
              </Link>
            </>
          ) : null}

          <button
            type="button"
            className="flex w-12 flex-none items-center justify-center border-l border-rule md:hidden"
            aria-expanded={menuOpen}
            aria-controls={menuId}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <IconClose size={20} /> : <IconMenu size={20} />}
          </button>
        </div>
      </nav>

      {menuOpen ? (
        <div
          id={menuId}
          className="a-drop absolute inset-x-0 top-full border-b border-ink bg-sheet md:hidden"
        >
          <ul className="flex flex-col">
            {LINKS.map(({ to, label, match }) => {
              const active = match(pathname, hash);
              return (
                <li key={to}>
                  <HashLink
                    smooth
                    to={to}
                    aria-current={active ? "page" : undefined}
                    className="flex min-h-[3.25rem] items-center justify-between border-b border-rule px-4 no-underline"
                  >
                    <span className="t-label t-label--ink">{label}</span>
                    {active ? (
                      <span aria-hidden="true" className="h-2 w-2 bg-clay" />
                    ) : null}
                  </HashLink>
                </li>
              );
            })}
            {ACCOUNTS ? (
              <li>
                <Link
                  to="/user"
                  className="flex min-h-[3.25rem] items-center gap-3 px-4 no-underline"
                >
                  <IconAccount size={18} />
                  <span className="t-label t-label--ink">Account</span>
                </Link>
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}

      {loginOpen && ACCOUNTS ? (
        <Login_Popup
          onClose={() => setLoginOpen(false)}
          onLoginSuccess={(userData) => {
            setUser(userData);
            setLoginOpen(false);
          }}
        />
      ) : null}
    </header>
  );
};

export default NavBar;
