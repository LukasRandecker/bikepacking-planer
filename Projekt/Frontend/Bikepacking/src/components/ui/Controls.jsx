import { useId, useRef, useState } from "react";
import { IconAlert, IconCheck } from "./Icons.jsx";

const VARIANTS = {
  ink: "",
  clay: "c-btn--clay",
  ghost: "c-btn--ghost",
  quiet: "c-btn--quiet",
};

/**
 * Every action in the app. The hover fill is plotted left to right; the label
 * is mono caps because a control on a drawing sheet is a stamped instruction.
 */
export function Button({
  variant = "ink",
  icon: Icon,
  iconOnly = false,
  busy = false,
  disabled = false,
  className = "",
  children,
  type = "button",
  ...rest
}) {
  return (
    <button
      type={type}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      className={`c-btn ${VARIANTS[variant]} ${
        iconOnly ? "c-btn--icon" : ""
      } ${className}`}
      {...rest}
    >
      {Icon ? <Icon size={16} /> : null}
      {iconOnly ? null : <span>{busy ? "Working…" : children}</span>}
    </button>
  );
}

/**
 * A labelled field. The label is always rendered and always linked — the app
 * has no placeholder-only inputs, because a placeholder disappears the moment
 * someone starts typing.
 */
export function Field({
  label,
  hint,
  error,
  id,
  className = "",
  inputClassName = "",
  as = "input",
  children,
  ...rest
}) {
  const auto = useId();
  const fieldId = id ?? auto;
  const hintId = `${fieldId}-hint`;
  const errorId = `${fieldId}-error`;
  const Tag = as;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={fieldId} className="t-label t-label--ink">
        {label}
      </label>
      <Tag
        id={fieldId}
        className={`c-input ${inputClassName}`}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={
          [error ? errorId : null, hint ? hintId : null]
            .filter(Boolean)
            .join(" ") || undefined
        }
        {...rest}
      >
        {children}
      </Tag>
      {hint && !error ? (
        <p id={hintId} className="t-label">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p
          id={errorId}
          className="t-label flex items-center gap-1.5 text-alarm"
        >
          <IconAlert size={13} />
          {error}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Segmented choice: real radio inputs rendered as abutting cells of one ruled
 * strip. This replaces the old pill toggles and the native category select —
 * one control shape for every either/or on the sheet.
 */
export function SegmentedChoice({
  legend,
  name,
  value,
  onChange,
  options,
  accent = false,
  className = "",
}) {
  return (
    <fieldset className={`flex flex-col gap-1.5 border-0 p-0 ${className}`}>
      <legend className="t-label t-label--ink mb-1.5 p-0">{legend}</legend>
      <div className="c-seg">
        {options.map((opt) => {
          const optValue = typeof opt === "string" ? opt : opt.value;
          const optLabel = typeof opt === "string" ? opt : opt.label;
          return (
            <label
              key={optValue}
              className={`c-seg__opt ${accent ? "c-seg__opt--clay" : ""}`}
            >
              <input
                type="radio"
                name={name}
                value={optValue}
                checked={value === optValue}
                onChange={() => onChange(optValue)}
              />
              {optLabel}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/**
 * Picking one saved record from a list. A radio group wearing the sheet's row
 * grammar: the chosen row inverts to ink, so the selection is readable without
 * hunting for a dot.
 */
export function RecordPicker({ legend, name, value, onChange, records }) {
  return (
    <fieldset className="border-0 p-0">
      <legend className="sr-only">{legend}</legend>
      <ul className="max-h-72 overflow-y-auto border border-ink">
        {records.map(({ id, title, meta }) => {
          const selected = value === id;
          return (
            <li key={id} className="border-b border-rule last:border-b-0">
              <label
                className={`relative flex min-h-[3.25rem] cursor-pointer items-center justify-between gap-4 px-3 py-2.5 transition-colors duration-150 ${
                  selected ? "bg-ink text-paper" : "hover:bg-field"
                } has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:-outline-offset-2 has-[:focus-visible]:outline-clay`}
              >
                <input
                  type="radio"
                  name={name}
                  value={id}
                  checked={selected}
                  onChange={() => onChange(id)}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
                <span className="min-w-0">
                  <span className="t-h3 block truncate">{title}</span>
                  {meta ? (
                    <span
                      className={`t-label block ${selected ? "text-paper-soft" : ""}`}
                    >
                      {meta}
                    </span>
                  ) : null}
                </span>
                {selected ? (
                  <span aria-hidden="true" className="flex-none text-clay-light">
                    <IconCheck size={16} />
                  </span>
                ) : null}
              </label>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}

/**
 * Eine Datei annehmen: Klicken oder Fallenlassen.
 *
 * Prüft Endung und Größe, bevor irgendetwas losgeschickt wird, und sagt bei
 * einem Fehlschlag die konkrete Zahl ("Die Datei ist 7,4 MB. Erlaubt sind 5.")
 * statt "ungültige Datei". Der Server prüft dasselbe noch einmal — diese
 * Prüfung hier ist Freundlichkeit, kein Schutz.
 */
export function FileDrop({
  label,
  hint,
  accept,
  extensions,
  maxBytes,
  file,
  onFile,
  onClear,
  error,
  preview,
  icon: Icon,
  idleTitle = "Drop a file or browse",
  className = "",
}) {
  const inputRef = useRef(null);
  const [localError, setLocalError] = useState("");
  const id = useId();

  const take = (candidate) => {
    if (!candidate) return;

    const name = candidate.name.toLowerCase();
    if (extensions && !extensions.some((ext) => name.endsWith(ext))) {
      setLocalError(`Use a ${extensions.join(" or ")} file.`);
      return;
    }
    if (maxBytes && candidate.size > maxBytes) {
      setLocalError(
        `That file is ${(candidate.size / 1024 / 1024).toFixed(1)} MB. The limit is ${Math.round(
          maxBytes / 1024 / 1024
        )} MB.`
      );
      return;
    }

    setLocalError("");
    onFile(candidate);
  };

  const shown = error || localError;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <span className="t-label t-label--ink">{label}</span>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          take(e.dataTransfer.files[0]);
        }}
        aria-describedby={shown ? `${id}-error` : undefined}
        className="m-grid flex min-h-[8rem] w-full flex-col items-center justify-center gap-2 border border-dashed border-ink/50 p-4 text-center transition-colors duration-150 hover:border-ink"
      >
        {preview ? (
          preview
        ) : file ? (
          <>
            {Icon ? <Icon size={22} /> : null}
            <span className="t-mono break-all text-sm">{file.name}</span>
            <span className="t-label">
              {(file.size / 1024).toFixed(0)} KB · ready
            </span>
          </>
        ) : (
          <>
            {Icon ? <Icon size={22} /> : null}
            <span className="t-label t-label--ink">{idleTitle}</span>
            {hint ? <span className="t-label">{hint}</span> : null}
          </>
        )}
      </button>

      {file && onClear ? (
        <button
          type="button"
          onClick={() => {
            setLocalError("");
            onClear();
          }}
          className="t-label t-label--clay self-start underline"
        >
          Remove
        </button>
      ) : null}

      {shown ? (
        <p id={`${id}-error`} className="t-label flex items-center gap-1.5 text-alarm">
          <IconAlert size={13} />
          {shown}
        </p>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => take(e.target.files[0])}
      />
    </div>
  );
}

const TONES = {
  error: { edge: "border-alarm", fg: "text-alarm", Icon: IconAlert, word: "Error" },
  success: { edge: "border-olive", fg: "text-olive", Icon: IconCheck, word: "Done" },
  info: { edge: "border-ink", fg: "text-ink-soft", Icon: IconAlert, word: "Note" },
};

/**
 * Feedback on the sheet. Colour never carries the meaning alone: the tone word
 * and the drawn mark say it too.
 */
export function Note({ tone = "info", children, className = "" }) {
  const { edge, fg, Icon, word } = TONES[tone] ?? TONES.info;
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`flex items-start gap-3 border ${edge} bg-sheet px-3 py-2.5 ${className}`}
    >
      <span className={`mt-0.5 flex-none ${fg}`}>
        <Icon size={15} />
      </span>
      <span className="min-w-0">
        <span className={`t-label ${fg} block`}>{word}</span>
        <span className="block text-sm leading-snug text-ink">{children}</span>
      </span>
    </div>
  );
}
