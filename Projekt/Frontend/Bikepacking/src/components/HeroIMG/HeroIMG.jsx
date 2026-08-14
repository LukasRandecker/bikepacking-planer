const HeroIMG = ({
  imagePath,
  headline1 = "YOUR TOUR.",
  headline2 = "YOUR SETUP.",
  headline3 = "YOUR PACKLIST.",
  alt = "Hero",
}) => {
  return (
    <section className="relative w-full h-[320px] md:h-[700px] shadow-2xl border-y-1 border-gray-500">
      <img src={imagePath} alt={alt} className="w-full h-full object-cover" />

      <div className="absolute top-5 left-5 md:top-10 md:left-20 text-black text-2xl md:text-6xl leading-6 md:leading-15 font-bold">
        {headline1} <br />
        {headline2} <br />
        {headline3}
      </div>
    </section>
  );
};

export default HeroIMG;
