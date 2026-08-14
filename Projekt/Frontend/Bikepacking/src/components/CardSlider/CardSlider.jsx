import { useState } from "react";
import Card from "../Card/Card.jsx";
import "./CardSlider.css";


const mockCards = [
  {
    id: 1,
    image: "../../../IMG/CardImage.jpg",
    headline: "Morocco",
    category: "BIKEPACKING",
    distanceKm: 500,
    elevationHm: 5089,
    setupLink: "/setup/morocco",
  },
  {
    id: 2,
    image: "../../../IMG/Kyrgistan.png",
    headline: "Kyrgistan",
    category: "MTB",
    distanceKm: 850,
    elevationHm: 10400,
    setupLink: "/setup/kyrgistan",
  },
  {
    id: 3,
    image: "../../../IMG/Gravel.png",
    headline: "Across Germany",
    category: "GRAVEL",
    distanceKm: 1110,
    elevationHm: 6400,
    setupLink: "/setup/across_germany",
  },
  {
    id: 4,
    image: "../../../IMG/Peak_Planes.png",
    headline: "Peak & Planes",
    category: "ROAD",
    distanceKm: 545,
    elevationHm: 6500,
    setupLink: "/setup/peak_planes",
  },
  {
    id: 5,
    image: "../../../IMG/RAAM.png",
    headline: "RAAM 2025",
    category: "RACE",
    distanceKm: 5167,
    elevationHm: 60684,
    setupLink: "/setup/RAAM_2025",
  },
];

const CardSlider = () => {
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  const filteredCards =
    selectedCategory === "ALL"
      ? mockCards
      : mockCards.filter((card) => card.category === selectedCategory);

  return (
    <section className="w-full py-5 px-6 md:px-20 md:py-10 bg-gray-100">
      <h1 className=" text-2xl md:text-4xl font-bold ">GET INSPIRED</h1>

      <select
        className="mb-4 p-1 text-sm uppercase"
        value={selectedCategory}
        onChange={(e) => setSelectedCategory(e.target.value)}
      >
        <option value="ALL">ALL</option>
        <option value="MTB">MTB</option>
        <option value="GRAVEL">GRAVEL</option>
        <option value="ROAD">ROAD</option>
        <option value="BIKEPACKING">BIKEPACKING</option>
        <option value="RACE">RACE</option>
      </select>

      <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide mt-3">
        {filteredCards.map((card) => (
          <Card
            key={card.id}
            image={card.image}
            headline={card.headline}
            category={card.category}
            distanceKm={card.distanceKm}
            elevationHm={card.elevationHm}
            setupLink={card.setupLink}
          />
        ))}
      </div>
    </section>
  );
};

export default CardSlider;
