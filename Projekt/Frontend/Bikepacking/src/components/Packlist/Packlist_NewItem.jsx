import { useEffect, useId, useState } from "react";

import Modal from "../ui/Modal.jsx";
import { Button, Field, FileDrop, Note } from "../ui/Controls.jsx";
import { IconImage } from "../ui/Icons.jsx";
import api from "../../lib/api.js";

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * Ein Gegenstand, den der Katalog nicht hergab.
 *
 * Was hier entsteht, landet im gemeinsamen Katalog: was einer vermisst hat,
 * vermissen andere auch. Deshalb fragt das Formular nach Marke und
 * Suchbegriffen — ein Eintrag, den niemand findet, hilft niemandem.
 *
 * Das Foto ist optional, weil der Katalog selbst keines hat: ohne Bild
 * bekommt der Eintrag dasselbe schwarze Rechteck wie jede Katalogzeile.
 */
const Packlist_NewItem = ({ category, onClose, onSave }) => {
  const [values, setValues] = useState({
    item: "",
    brand: "",
    weight: "",
    price: "",
    productLink: "",
    keywords: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [brands, setBrands] = useState([]);

  const brandListId = useId();

  // Vorschlagsliste, damit nicht "Gore Wear", "GoreWear" und "gore wear" als
  // drei Marken im Katalog landen.
  useEffect(() => {
    let cancelled = false;
    api
      .get("/items/brands")
      .then(({ data }) => {
        if (!cancelled) setBrands(data.map((b) => b.brand));
      })
      .catch(() => {
        // Ohne Vorschläge lässt sich die Marke immer noch eintippen.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview]
  );

  const set = (key) => (e) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  const takeImage = (file) => {
    if (!TYPES.includes(file.type)) {
      setErrors((e) => ({ ...e, image: "Use a JPG, PNG or WEBP file." }));
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
      width="wide"
      footer={
        <Button variant="clay" onClick={handleSave} busy={busy} className="w-full">
          Add to the catalogue
        </Button>
      }
    >
      <div className="flex flex-col gap-5">
        {formError ? <Note tone="error">{formError}</Note> : null}

        <Note tone="info">
          New items join the shared catalogue, so the next person planning a
          tour finds them too. You stay the only one who can edit this entry.
        </Note>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Item"
            type="text"
            placeholder="e.g. Top tube bag"
            value={values.item}
            onChange={set("item")}
            error={errors.item}
            hint="What the thing is — without the brand."
          />

          <div className="flex flex-col gap-1.5">
            <Field
              label="Brand"
              type="text"
              list={brandListId}
              placeholder="e.g. Cyclite"
              value={values.brand}
              onChange={set("brand")}
              autoComplete="off"
              hint={
                brands.length
                  ? `Shown next to the name. ${brands.length} brands already in the catalogue.`
                  : "Shown next to the name."
              }
            />
            <datalist id={brandListId}>
              {brands.map((b) => (
                <option key={b} value={b} />
              ))}
            </datalist>
          </div>
        </div>

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
          label="Search terms"
          type="text"
          placeholder="e.g. bag handlebar front roll"
          value={values.keywords}
          onChange={set("keywords")}
          hint="Words you would search for that are not in the name. Never shown — they only make the item findable."
        />

        <Field
          label="Product link"
          type="url"
          placeholder="https://"
          value={values.productLink}
          onChange={set("productLink")}
          hint="Optional — where you bought it, so others can find it again."
        />

        <FileDrop
          label="Photo — optional"
          icon={IconImage}
          accept={TYPES.join(",")}
          extensions={[".jpg", ".jpeg", ".png", ".webp"]}
          maxBytes={MAX_BYTES}
          file={imageFile}
          error={errors.image}
          hint="JPG · PNG · WEBP · up to 5 MB"
          idleTitle="Drop a photo or browse"
          onFile={takeImage}
          onClear={
            imageFile
              ? () => {
                  setImageFile(null);
                  setPreview((old) => {
                    if (old) URL.revokeObjectURL(old);
                    return null;
                  });
                }
              : undefined
          }
          preview={
            preview ? (
              <>
                <img
                  src={preview}
                  alt="Selected item photo"
                  className="max-h-28 w-auto border border-ink object-contain"
                />
                <span className="t-label">Drop another to replace</span>
              </>
            ) : null
          }
        />
        <p className="t-label -mt-3">
          Without one the item gets a black plate, like every catalogue entry.
        </p>
      </div>
    </Modal>
  );
};

export default Packlist_NewItem;
