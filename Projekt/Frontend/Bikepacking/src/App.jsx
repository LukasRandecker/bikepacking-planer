import { useState } from "react";
import { Outlet } from "react-router-dom";

import NavBar from "./components/NavBar/NavBar.jsx";
import Footer from "./components/Footer/Footer.jsx";

import { UserContext } from "./Context/UserContext.jsx";
import { TourFormProvider } from "./Context/TourFormContext.jsx";

function App() {
  const [user, setUser] = useState(() => sessionStorage.getItem("userId"));

  return (
    <UserContext.Provider value={{ user, setUser }}>
      <TourFormProvider>
        <div className="sheet-shell">
          <a
            href="#main"
            className="c-btn c-btn--clay c-skip"
          >
            Skip to content
          </a>
          <NavBar />
          <main id="main" className="flex-1">
            <Outlet />
          </main>
          <Footer />
        </div>
      </TourFormProvider>
    </UserContext.Provider>
  );
}

export default App;
