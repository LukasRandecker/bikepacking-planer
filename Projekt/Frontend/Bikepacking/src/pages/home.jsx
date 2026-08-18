import SheetHero from "../components/SheetHero/SheetHero.jsx";
import TourIndex from "../components/TourIndex/TourIndex.jsx";
import CTA from "../components/CTA/CTA.jsx";
import useDocumentTitle from "../lib/useDocumentTitle.js";

import heroImage from "../assets/HeroIMG1.webp";

function HomePage() {
  useDocumentTitle(
    "Plan the tour, weigh the load",
    "Load a GPX track, describe the tour, and build the packing list beside it. Every item carries its weight and price, and the finished setup exports as a printable checklist."
  );

  return (
    <>
      <SheetHero imagePath={heroImage} plateCaption="Plate A · Gravel, loaded" />
      <TourIndex />
      <CTA />
    </>
  );
}

export default HomePage;
