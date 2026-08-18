import { useRef, useState } from "react";

import Modal from "../ui/Modal.jsx";
import { Button, Field, Note } from "../ui/Controls.jsx";
import { IconImage } from "../ui/Icons.jsx";

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * Adding gear to a category. The drop zone is a plate frame waiting for its
 * plate; the errors say which field is wrong and what to do about it, rather
 * than asking the user to fill in "all fields".
 */
const Packlist_NewItem = ({ category, onClose, onSave }) => {
  const [values, setValues] = useState({
    item: "",
    weight: "",
    price: "",
    productLink: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  const fileInputRef = useRef(null);

  const set = (key) => (e) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  const takeImage = (file) => {
    if (!file) return;
    if (!TYPES.includes(file.type)) {
      setErrors((e) => ({ ...e, image: "Use a JPG, PNG or WEBP file." }));
      return;
    }
    if (file.size > MAX_BYTES) {
      setErrors((e) => ({
        ...e,
        image: `That file is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is 5 MB.`,
      }));
      return;
    }
    setErrors((e) => ({ ...e, image: undefined }));
    setImageFile(file);
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return URL.createObjectURL(file);
    });
  };

  const handleSave = async () => {
    const next = {};
    if (!values.item.trim()) next.item = "Give the item a name.";
    if (values.weight === "" || Number(values.weight) < 0)
      next.weight = "Enter the weight in grams.";
    if (values.price === "" || Number(values.price) < 0)
      next.price = "Enter the price in euros.";
    if (!imageFile) next.image = "Add a photo so the item is recognisable in the list.";

    setErrors(next);
    if (Object.keys(next).length > 0) {
      setFormError("");
      return;
    }

    setBusy(true);
    const message = await onSave({ ...values, imageFile });
    setBusy(false);
    if (message) setFormError(message);
  };

  return (
    <Modal
      onClose={onClose}
      title="New item"
      code={category ? `Category · ${category}` : undefined}
      footer={
        <Button variant="clay" onClick={handleSave} busy={busy} className="w-full">
          Add item
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        {formError ? <Note tone="error">{formError}</Note> : null}

        <div className="flex flex-col gap-1.5">
          <span className="t-label t-label--ink">Photo</span>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              takeImage(e.dataTransfer.files[0]);
            }}
            aria-describedby={errors.image ? "new-item-image-error" : undefined}
            className="m-grid flex min-h-[8rem] w-full flex-col items-center justify-center gap-2 border border-dashed border-ink/50 p-4 transition-colors duration-150 hover:border-ink"
          >
            {preview ? (
              <img
                src={preview}
                alt="Selected item photo"
                className="max-h-32 w-auto border border-ink object-contain"
              />
            ) : (
              <>
                <IconImage size={22} />
                <span className="t-label t-label--ink">Drop a photo or browse</span>
                <span className="t-label">JPG · PNG · WEBP · up to 5 MB</span>
              </>
            )}
          </button>
          {errors.image ? (
            <p id="new-item-image-error" className="t-label text-alarm">
              {errors.image}
            </p>
          ) : null}

          <input
            type="file"
            accept={TYPES.join(",")}
            ref={fileInputRef}
            className="sr-only"
            tabIndex={-1}
            onChange={(e) => takeImage(e.target.files[0])}
          />
        </div>

        <Field
          label="Item"
          type="text"
          placeholder="e.g. Sleeping bag"
          value={values.item}
          onChange={set("item")}
          error={errors.item}
        />

        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Weight (g)"
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="g"
            value={values.weight}
            onChange={set("weight")}
            error={errors.weight}
          />
          <Field
            label="Price (EUR)"
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            placeholder="EUR"
            value={values.price}
            onChange={set("price")}
            error={errors.price}
          />
        </div>

        <Field
          label="Product link"
          type="url"
          placeholder="https://"
          value={values.productLink}
          onChange={set("productLink")}
          hint="Optional — where you bought it, so you can find it again."
        />
      </div>
    </Modal>
  );
};

export default Packlist_NewItem;
