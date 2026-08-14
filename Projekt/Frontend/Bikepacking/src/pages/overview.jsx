import { useState, useContext } from "react";
import Tour_Full from "../components/Tour/Tour_Full.jsx";
import Packlist_Full from "../components/Packlist/Packlist_Full.jsx";
import HeroIMG from "../components/HeroIMG/HeroIMG.jsx";
import heroImage from "../assets/HeroIMG3.jpg";

import { UserContext } from "../Context/UserContext.jsx";
import { SetupItemsProvider } from "../Context/PacklistContext.jsx";

function OverviewPage() {
  const { user, setUser } = useContext(UserContext);
  const [mode, setMode] = useState("setup");

  return (
    <>
      <HeroIMG
        imagePath={heroImage}
        headline1="OVERVIEW"
        headline2=""
        headline3=""
      />
      <SetupItemsProvider>
        <Tour_Full mode={mode} setMode={setMode} user={user} />
        <Packlist_Full mode={mode} setMode={setMode} user={user} />
      </SetupItemsProvider>
    </>
  );
}

export default OverviewPage;
