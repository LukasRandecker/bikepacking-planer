import { useEffect, useId, useState } from "react";
import packlist_img from "../../assets/NoImage.jpg";
import { IconLink, IconTrash } from "../ui/Icons.jsx";

/**
 * One line of the schedule. On wide screens the row aligns to the column
 * headers above it and the field labels retire into screen-reader text; on
 * narrow screens the labels come back, because a bare column of numbers with
 * no headings is not a table, it is a guess.
 */
export default function Packlist_Item({
  Itemname: initialName,
  IMG,
  Weight: initialWeight,
  Price: initialPrice,
  Link,
  onDelete,
  onChange,
}) {
  const [Itemname, setItemname] = useState(initialName || "");
  const [Weight, setWeight] = useState(initialWeight ?? "");
  const [Price, setPrice] = useState(initialPrice ?? "");
  const id = useId();

  useEffect(() => setItemname(initialName || ""), [initialName]);
  useEffect(() => setWeight(initialWeight ?? ""), [initialWeight]);
  useEffect(() => setPrice(initialPrice ?? ""), [initialPrice]);

  const commit = () => onChange?.({ Itemname, Weight, Price });

  const field = (key, label, props) => (
    <div className="flex flex-col gap-1 min-w-0">
      <label htmlFor={`${id}-${key}`} className="t-label lg:sr-only">
        {label}
      </label>
      <input
        id={`${id}-${key}`}
        className="c-input"
        onBlur={commit}
        {...props}
      />
    </div>
  );

  return (
    <li className="grid grid-cols-1 items-end gap-3 border-b border-rule bg-sheet p-3 last:border-b-0 lg:grid-cols-[4rem_minmax(0,1fr)_7rem_7rem_auto] lg:gap-4">
      <div className="m-plate h-16 w-16 flex-none justify-self-start border-rule">
        <img
          src={IMG ? `http://localhost:3030${IMG}` : packlist_img}
          alt=""
          loading="lazy"
          decoding="async"
          className="object-contain"
          onError={(e) => {
            if (e.currentTarget.src !== packlist_img)
              e.currentTarget.src = packlist_img;
          }}
        />
      </div>

      {field("name", "Item", {
        type: "text",
        value: Itemname,
        placeholder: "Item name",
        onChange: (e) => setItemname(e.target.value),
      })}

      {field("weight", "Weight (g)", {
        type: "number",
        min: 0,
        inputMode: "numeric",
        value: Weight,
        placeholder: "g",
        onChange: (e) => setWeight(e.target.value),
      })}

      {field("price", "Price (EUR)", {
        type: "number",
        min: 0,
        step: "0.01",
        inputMode: "decimal",
        value: Price,
        placeholder: "EUR",
        onChange: (e) => setPrice(e.target.value),
      })}

      <div className="flex items-center gap-2 justify-self-end">
        {Link ? (
          <a
            href={Link}
            target="_blank"
            rel="noreferrer noopener"
            className="c-btn c-btn--quiet c-btn--icon no-underline"
            aria-label={`Open the product page for ${Itemname || "this item"} in a new tab`}
          >
            <IconLink size={16} />
          </a>
        ) : (
          <span
            aria-hidden="true"
            className="m-hatch h-11 w-11 flex-none border border-rule"
          />
        )}

        <button
          type="button"
          onClick={onDelete}
          className="c-btn c-btn--quiet c-btn--icon"
          aria-label={`Remove ${Itemname || "this item"} from the list`}
        >
          <IconTrash size={16} />
        </button>
      </div>
    </li>
  );
}
