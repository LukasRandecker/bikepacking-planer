import { useContext, useState } from "react";

// Components
import Login_Popup from "../components/Popups/Login";

// Context
import { UserContext } from "../Context/UserContext.jsx";

function UserPage() {
  // User Context
  const { user, setUser } = useContext(UserContext);

  // Login Popup State
  const [showLogin, setShowLogin] = useState(false);

  // Wenn User NICHT eingeloggt ist → Login Ansicht
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6 border-t-1">
        <h1 className="text-3xl font-bold text-center">
          Please log in to access this page
        </h1>

        <button
          className="px-6 py-3 bg-black text-white rounded-xl hover:bg-white hover:text-black hover:border border-solid uppercase"
          onClick={() => setShowLogin(true)}
        >
          LOGIN
        </button>

        {/* Login Popup */}
        {showLogin && (
          <Login_Popup
            onClose={() => setShowLogin(false)}
            onLoginSuccess={(userData) => {
              if (!userData || !userData._id) return;

              sessionStorage.setItem("userId", userData._id);
              setUser(userData._id);
              setShowLogin(false);
            }}
            loginMessage="Please log in to continue."
          />
        )}
      </div>
    );
  }

  // Wenn User eingeloggt ist → Platzhalter-Inhalt
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center gap-4 border-t-1">
      <h1 className="text-4xl font-bold">
        Page under construction 🚧
      </h1>

      <p className="text-gray-600 max-w-xl">
        The content of this page has not been created yet.
        <br />
        No functionality or logic is implemented here at the moment.
      </p>
    </div>
  );
}

export default UserPage;
