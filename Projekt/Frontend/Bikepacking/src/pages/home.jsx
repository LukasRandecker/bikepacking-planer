import SheetHero from "../components/SheetHero/SheetHero.jsx";
import TourIndex from "../components/TourIndex/TourIndex.jsx";
import CTA from "../components/CTA/CTA.jsx";
import useDocumentTitle from "../lib/useDocumentTitle.js";

import heroImage from "../assets/HeroIMG1.webp";
import hero480 from "../assets/HeroIMG1-480.webp";
import hero800 from "../assets/HeroIMG1-800.webp";
import hero1200 from "../assets/HeroIMG1-1200.webp";
import hero1600 from "../assets/HeroIMG1-1600.webp";

/**
 * Das Aufmacherbild ist das LCP-Element der Startseite. In einer Groesse
 * ausgeliefert kostete es auf dem Handy 263 kB fuer eine 370px breite Flaeche;
 * mit diesen Stufen sind es 29 kB.
 */
const heroSrcSet = [
  `${hero480} 480w`,
  `${hero800} 800w`,
  `${hero1200} 1200w`,
  `${hero1600} 1600w`,
  `${heroImage} 2222w`,
].join(", ");

function HomePage() {
  useDocumentTitle(
    "Plan the tour, weigh the load",
    "Load a GPX track, describe the tour, and build the packing list beside it. Every item carries its weight and price, and the finished setup exports as a printable checklist."
  );

  return (
    <>
      <SheetHero
        imagePath={heroImage}
        imageSrcSet={heroSrcSet}
        plateCaption="Plate A · Gravel, loaded"
      />
      <TourIndex />
      <CTA />
    </>
  );
}

export default HomePage;
