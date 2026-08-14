import { useState, useEffect, useContext } from "react";
import { Bike, User } from "lucide-react";
import { HashLink } from "react-router-hash-link";

//User Context
import { UserContext } from "../../Context/UserContext.jsx";

 //Popup states 
import Login_Popup from "../Popups/Login";

const NavBar = () => {
  const { user, setUser } = useContext(UserContext);

  const [menuOpen, setMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  useEffect(() => {
    const storedUserId = sessionStorage.getItem("userId");
    if (storedUserId) {
      setUser({ _id: storedUserId }); 
    }
  }, []);

  const handleLinkClick = () => {
    setMenuOpen(false);
  };

  //Eingeloggter userID wird in Session gesetzt
  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("userId");
    setUser(null);
  };

  return (
    <nav className="w-full flex items-center justify-between px-6 py-3 md:px-20 md:py-7 bg-white relative">
      <div>
        <a href="/">
          <Bike />
        </a>
      </div>

      {/* Desktop Menu */}
      <div className="hidden md:flex gap-10 absolute left-1/2 -translate-x-1/2 text-lg">
        <HashLink smooth to="/" className="hover:scale-105 transition hover:text-gray-600"> Home </HashLink>
        <HashLink smooth to="/overview#tour" className="hover:scale-105 transition hover:text-gray-600"> Tour </HashLink>
        <HashLink smooth to="/overview#packlist" className="hover:scale-105 transition hover:text-gray-600"> Packlist </HashLink>
      </div>

      {/* Desktop Buttons */}
      <div className="hidden md:flex items-center gap-4">
        {user ? (
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-xl bg-white text-black border border-solid uppercase"
          >
            Logout
          </button>
        ) : (
          <button
            onClick={() => setLoginOpen(true)}
            className="px-4 py-2 bg-black text-white rounded-xl hover:bg-white hover:text-black hover:border border-solid uppercase"
          >
            Login
          </button>
        )}
        <HashLink smooth to="/user" className="flex items-center">
          <User />
        </HashLink>
      </div>

      {/* Mobile Buttons */}
      <div className="md:hidden flex items-center gap-4">
        {user ? (
          <button
            onClick={handleLogout}
            className="px-3 py-1 bg-white text-black rounded-lg uppercase"
          >
            Logout
          </button>
        ) : (
          <button
            onClick={() => setLoginOpen(true)}
            className="px-3 py-1 bg-black text-white rounded-lg uppercase"
          >
            Login
          </button>
        )}
        <button
          className="menu-btn pr-4 text-2xl"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="absolute top-full left-0 w-full bg-white shadow-md flex flex-col p-4 gap-4 md:hidden z-20">
          <HashLink
            smooth
            to="/"
            onClick={handleLinkClick}
            className="text-lg hover:text-gray-600"
          >
            Home
          </HashLink>
          <HashLink
            smooth
            to="/overview#tour"
            onClick={handleLinkClick}
            className="text-lg hover:text-gray-600"
          >
            Tour
          </HashLink>
          <HashLink
            smooth
            to="/overview#packlist"
            onClick={handleLinkClick}
            className="text-lg hover:text-gray-600"
          >
            Packlist
          </HashLink>
          <div className="flex items-center gap-2 border-t pt-3">
            <HashLink
              smooth
              to="/user"
              onClick={handleLinkClick}
              className="flex items-center"
            >
              <User />
            </HashLink>
          </div>
        </div>
      )}

     
      {loginOpen && (
        <Login_Popup
          onClose={() => setLoginOpen(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}
    </nav>
  );
};

export default NavBar;
