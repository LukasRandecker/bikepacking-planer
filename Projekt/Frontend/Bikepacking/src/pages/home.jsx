import HeroIMG from "../components/HeroIMG/HeroIMG.jsx";
import CardSlider from "../components/CardSlider/CardSlider.jsx";
import CTA_IMG from "../components/CTA_IMG/CTA_IMG.jsx";

import heroImage from "../assets/HeroIMG1.jpg";
import CTA_image from "../assets/CTA.png";

function HomePage() {
  return (
    <>
      <HeroIMG
        imagePath={heroImage}
        headline1="YOUR TOUR."
        headline2="YOUR SETUP."
        headline3="YOUR PACKLIST."
      />
      <CardSlider />
      <CTA_IMG
        headline="Start to plan your adventure today!"
        subheadline="Create your custom bikepacking tour and packing list in just a few steps."
        imageSrc={CTA_image}
        linkTo="/overview#setup"
        buttonText="Get started"
      />
    </>
  );
}

export default HomePage;
