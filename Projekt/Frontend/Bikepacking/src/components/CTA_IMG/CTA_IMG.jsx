import { HashLink } from "react-router-hash-link";

const CTA_IMG = ({
  headline,
  subheadline,
  imageSrc,
  linkTo = "/overview#setup",
  buttonText = "Get started",
  onLinkClick,
}) => {
  const handleLinkClick = () => {
    if (onLinkClick) onLinkClick();
  };

  return (
    <section className="md:w-full py-5 px-6 md:px-20 md:py-10 bg-gray-100 flex flex-col pb-10 items-center">
      <h1 className="text-2xl md:text-4xl font-bold mb-1 uppercase">
        {headline}
      </h1>

      <p className="text-gray-700 uppercase mb-4">{subheadline}</p>

      <div className="relative w-full max-w-3xl items-center mx-auto">
        <img
          src={imageSrc}
          className="w-full h-64 md:h-80 object-cover rounded-xl"
        />
        <div className="flex flex-col items-center gap-4 mt-4 md:mt-8">
          <HashLink
            smooth
            to={linkTo}
            onClick={handleLinkClick}
            className="px-4 py-2 bg-black text-white rounded-xl hover:bg-white hover:text-black hover:border hover:border-black uppercase"
          >
            {buttonText}
          </HashLink>
        </div>
      </div>
    </section>
  );
};

export default CTA_IMG;
