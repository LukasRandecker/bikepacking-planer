import packlist_img from "../../assets/NoImage.jpg";
import { Trash2, Link as LinkIcon } from "lucide-react";
import { useState } from "react";
export default function Packlist_Item({
  _id,
  Itemname: initialName,
  IMG,
  Weight: initialWeight,
  Price: initialPrice,
  Link,
  onDelete,
  onChange,
}) {
  const [Itemname, setItemname] = useState(initialName || "");
  const [Weight, setWeight] = useState(initialWeight || "");
  const [Price, setPrice] = useState(initialPrice || "");

  return (
    <div className="w-full max-w-md lg:max-w-4xl rounded-2xl border border-gray-300 bg-gray-100 p-3 shadow-sm">
      <div className="grid grid-cols-1 gap-2 lg:grid-cols-[auto_1fr_1fr_1fr_auto_auto] lg:items-center">
        {/* Bild */}
        <div className="flex justify-center items-center lg:flex-none">
          <img
            src={IMG ? `http://localhost:3030${IMG}` : packlist_img}
            alt={Itemname}
            className="h-40 w-40 lg:h-20 lg:w-20 rounded-lg border border-gray-300 object-contain"
          />
        </div>


        {/* Editable Fields */}
        <input
          type="text"
          value={Itemname}
          onChange={(e) => setItemname(e.target.value)}
          onBlur={() => onChange && onChange({ Itemname, Weight, Price })}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
        />

        <input
          type="number"
          value={Weight}
          onChange={(e) => setWeight(e.target.value)}
          onBlur={() => onChange && onChange({ Itemname, Weight, Price })}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
        />

        <input
          type="number"
          value={Price}
          onChange={(e) => setPrice(e.target.value)}
          onBlur={() => onChange && onChange({ Itemname, Weight, Price })}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
        />

        {/* Delete + Link */}
<div className="flex gap-2 justify-end items-center">
  {/* Delete Button */}
  <button
    onClick={onDelete}
    className="rounded-lg border border-gray-300 p-2 hover:bg-gray-100"
  >
    <Trash2 size={18} />
  </button>

  {/* Link Button */}
  {Link && (
    <a
      href={Link}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-100"
    >
      <LinkIcon size={16} />
      Link
    </a>
  )}
</div>

      </div>
    </div>
  );
}
