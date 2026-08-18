import { useContext, useState } from "react";
import { HashLink } from "react-router-hash-link";

import Login_Popup from "../components/Popups/Login.jsx";
import { Button } from "../components/ui/Controls.jsx";
import { SectionHead } from "../components/ui/Sheet.jsx";
import { IconArrow } from "../components/ui/Icons.jsx";
import { UserContext } from "../Context/UserContext.jsx";
import useDocumentTitle from "../lib/useDocumentTitle.js";

/** Fields this sheet will hold once the account view is built. */
const PLANNED = [
  "Saved tours",
  "Saved setups",
  "Item catalogue",
  "Account details",
];

function UserPage() {
  const { user, setUser } = useContext(UserContext);
  const [showLogin, setShowLogin] = useState(false);

  useDocumentTitle("Account");

  const handleLoginSuccess = (userData) => {
    if (!userData?._id) return;
    sessionStorage.setItem("userId", userData._id);
    setUser(userData._id);
    setShowLogin(false);
  };

  if (!user) {
    return (
      <section className="sheet-pad flex min-h-[60vh] flex-col justify-center py-14">
        <div className="grid lg:grid-cols-12">
          <div className="lg:col-span-7 lg:border-r lg:border-ink lg:pr-10">
            <h1 className="t-h1 border-y border-ink py-3">
              This sheet needs an account
            </h1>
            <p className="t-body mt-6 text-[0.9375rem]">
              Planning a tour works without one. Saving it, loading it again and
              uploading a GPX track do not — those write to your account.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button variant="clay" onClick={() => setShowLogin(true)}>
                Log in or register
              </Button>
              <HashLink smooth to="/overview#tour" className="c-btn c-btn--ghost">
                <span>Keep planning</span>
                <IconArrow size={16} />
              </HashLink>
            </div>
          </div>

          <div className="mt-10 lg:col-span-5 lg:mt-0 lg:pl-10">
            <div className="m-grid h-full min-h-[14rem] border border-dashed border-ink/40" />
          </div>
        </div>

        {showLogin ? (
          <Login_Popup
            onClose={() => setShowLogin(false)}
            onLoginSuccess={handleLoginSuccess}
            loginMessage="Log in to reach your saved tours and setups."
          />
        ) : null}
      </section>
    );
  }

  return (
    <section className="sheet-pad py-10 md:py-14">
      <SectionHead as="h1" title="Account" meta="Sheet 03 · In progress" />

      <div className="mt-8 grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <p className="t-body text-[0.9375rem]">
            The account sheet is not drawn yet. Tours and setups are saved to
            your account already — they are reached from the planner, through
            the load buttons on the tour and packlist sections.
          </p>
          <HashLink smooth to="/overview#tour" className="c-btn c-btn--clay mt-6">
            <span>Go to the planner</span>
            <IconArrow size={16} />
          </HashLink>
        </div>

        <div className="lg:col-span-5">
          <div className="c-cellgrid grid-cols-1">
            {PLANNED.map((field) => (
              <div
                key={field}
                className="c-cell flex items-center justify-between gap-4"
              >
                <span className="text-sm text-ink-soft">{field}</span>
                <span className="t-label">Pending</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default UserPage;
