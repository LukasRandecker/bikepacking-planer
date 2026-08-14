const Card = ({
  image,
  headline,
  category,
  distanceKm,
  elevationHm,
  duration,
  setupLink,
}) => {
  return (
    <div className="w-[250px] md:w-[300px] flex-shrink-0 rounded-xl shadow-md overflow-hidden mr-10">
      <img
        src={image}
        alt={headline}
        className="w-full h-[65%] object-cover rounded-xl"
      />

      <div className="p-4">
        <h2 className="text-lg font-extrabold">{headline}</h2>
        <p className="text-gray-500 text-sm mb-3">{category}</p>

        <div className="flex justify-between items-center">
          <div className="flex flex-col text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <span>📍</span>
              <span>{distanceKm} km</span>
            </div>
            <div className="flex items-center gap-1">
              <span>⛰️</span>
              <span>{elevationHm} m</span>
            </div>
          </div>

          <a
            href={setupLink}
            className="px-4 py-2 mr-3 bg-black text-white rounded-xl hover:bg-white hover:text-black hover:border hover:border-black"
          >
            SETUP
          </a>
        </div>
      </div>
    </div>
  );
};

export default Card;


