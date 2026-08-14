import { useRef, useState } from "react";
import { ImagePlus } from "lucide-react";

const Packlist_NewItem = ({ onClose, onSave }) => {
  const [item, setItem] = useState("");
  const [weight, setWeight] = useState("");
  const [price, setPrice] = useState("");
  const [productLink, setProductLink] = useState("");

  const fileInputRef = useRef(null);
  const [imageFile, setImageFile] = useState(null); // for backend
  const [image, setImage] = useState(null); // for preview

  const [errorMessage, setErrorMessage] = useState("");

  const handleImage = (file) => {
    if (!file) return;

    setImageFile(file); //Server file
    setImage(URL.createObjectURL(file)); // Preview nur blob
  };

  const handleSave = () => {
    if (!item || !weight || !price || !productLink || !imageFile) {
      setErrorMessage("Bitte alle Felder ausfüllen und ein Bild hochladen");
      return;
    }

    onSave({
      item,
      weight,
      price,
      productLink,
      imageFile,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white w-80 md:w-96 rounded-xl p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-xl">
          ✕
        </button>

        <h2 className="text-xl font-semibold mb-4 text-center">Neues Item</h2>

        <h2 className="mb-4 text-center text-sm text-red-500">
          {errorMessage}
        </h2>

        {/* IMAGE UPLOAD */}
        <div
          onClick={() => fileInputRef.current.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleImage(e.dataTransfer.files[0]);
          }}
          className="border-2 border-dashed border-gray-400 rounded-lg
                     p-6 text-center cursor-pointer hover:border-black transition mb-4"
        >
          {image ? (
            <img
              src={image}
              alt="Preview"
              className="mx-auto h-32 object-cover rounded-lg"
            />
          ) : (
            <>
              <ImagePlus className="mx-auto mb-2" />
              <p className="text-gray-600">Bild hier ablegen oder klicken</p>
              <p className="text-sm text-gray-400">JPG, PNG, WEBP</p>
            </>
          )}
        </div>

        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files[0];
            setImageFile(file); //backend
            setImage(URL.createObjectURL(file)); //show preview
          }}
        />

        {/* INPUTS */}
        <input
          placeholder="ITEM"
          value={item}
          onChange={(e) => setItem(e.target.value)}
          className="w-full mb-2 rounded-lg border px-3 py-2 text-sm"
        />

        <input
          placeholder="WEIGHT (in g)"
          type="number"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          className="w-full mb-2 rounded-lg border px-3 py-2 text-sm"
        />

        <input
          placeholder="PRICE"
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full mb-2 rounded-lg border px-3 py-2 text-sm"
        />

        <input
          placeholder="PRODUCT LINK"
          type="text"
          value={productLink}
          onChange={(e) => setProductLink(e.target.value)}
          className="w-full mb-4 rounded-lg border px-3 py-2 text-sm"
        />

        <button
          onClick={handleSave}
          className="w-full bg-black text-white py-2 rounded-lg uppercase"
        >
          Add Item
        </button>
      </div>
    </div>
  );
};

export default Packlist_NewItem;
