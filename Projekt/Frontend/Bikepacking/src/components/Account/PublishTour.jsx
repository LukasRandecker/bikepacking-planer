import { useEffect, useRef, useState } from "react";

import Modal from "../ui/Modal.jsx";
import { Button, Field, FileDrop, Note } from "../ui/Controls.jsx";
import { IconImage, IconUpload } from "../ui/Icons.jsx";
import api, { assetUrl, errorMessage } from "../../lib/api.js";

const MAX_DESCRIPTION = 1000;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_GPX_BYTES = 10 * 1024 * 1024;

const num = (n) => Number(n || 0).toLocaleString("en-GB");

/** "a track", "a track and a cover", "a track, a cover and a packlist" */
const listOut = (parts) =>
  parts.length < 2
    ? parts.join("")
    : `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;

/**
 * Der Beitrag zu einer Tour: das, was auf der Kachel im Index steht.
 *
 * Beides — Track und Cover — wird hier hochgeladen, nicht ausgewählt: ein
 * Beitrag zeigt die eigene Fahrt, und ein Vorrat an Bildern, aus dem alle
 * dieselben fünf Kacheln nehmen, wäre das Gegenteil davon. Strecke und
 * Höhenmeter tippt niemand ein; sie werden aus der GPX-Datei gelesen.
 */
export default function PublishTour({ tour, packlists, onClose, onSaved }) {
  const [description, setDescription] = useState(tour.Description || "");
  const [itemlist, setItemlist] = useState(tour.Itemlist ? String(tour.Itemlist) : "");

  // Track: entweder der bereits gespeicherte, oder ein frisch hochgeladener.
  const [track, setTrack] = useState(
    tour.GPX_file
      ? { fileName: tour.GPX_file, km: tour.Distance, hm: tour.Elevation }
      : null
  );
  const [gpxFile, setGpxFile] = useState(null);
  const [gpxBusy, setGpxBusy] = useState(false);
  const [gpxError, setGpxError] = useState("");

  const [cover, setCover] = useState(tour.Cover || "");
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [coverBusy, setCoverBusy] = useState(false);
  const [coverError, setCoverError] = useState("");

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Object-URLs der Vorschau müssen wieder freigegeben werden.
  const previewRef = useRef("");
  useEffect(() => {
    previewRef.current = coverPreview;
  }, [coverPreview]);
  useEffect(
    () => () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    },
    []
  );

  /** Lädt den Track hoch und liest Strecke und Höhenmeter direkt daraus. */
  const uploadTrack = async (file) => {
    setGpxError("");
    setGpxBusy(true);
    try {
      const form = new FormData();
      form.append("gpx", file);
      const { data } = await api.post("/upload", form);

      setTrack({
        fileName: data.fileName,
        km: Math.round(Number(data.km) || 0),
        hm: Math.round(Number(data.hm) || 0),
        points: (data.coordinates || []).length,
        name: data.tourName,
      });
      setGpxFile(null);
    } catch (err) {
      setGpxError(errorMessage(err, "The track could not be uploaded."));
    } finally {
      setGpxBusy(false);
    }
  };

  const uploadCover = async (file) => {
    setCoverError("");
    setCoverBusy(true);
    try {
      const form = new FormData();
      form.append("image", file);
      const { data } = await api.post("/uploadImage", form);
      setCover(data.path);
      setCoverFile(null);
    } catch (err) {
      setCoverError(errorMessage(err, "The image could not be uploaded."));
      setCover("");
    } finally {
      setCoverBusy(false);
    }
  };

  const takeCover = (file) => {
    setCoverFile(file);
    setCoverPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return URL.createObjectURL(file);
    });
    uploadCover(file);
  };

  const blockers = [
    !track && "a GPX track",
    !itemlist && "a packlist",
    !cover && "a cover photo",
  ].filter(Boolean);

  const save = async (publish) => {
    setError("");
    setBusy(true);
    try {
      await api.put(`/tours/${tour._id}`, {
        Description: description.trim(),
        Cover: cover,
        Itemlist: itemlist || null,
        GPX_file: track ? track.fileName : "",
        // Aus der Datei gelesen, nicht eingetippt.
        Distance: track ? track.km : 0,
        Elevation: track ? track.hm : 0,
      });

      if (publish !== null) {
        await api.put(`/tours/${tour._id}/publish`, { Public: publish });
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(errorMessage(err, "The post could not be saved."));
      setBusy(false);
    }
  };

  const working = busy || gpxBusy || coverBusy;

  return (
    <Modal
      onClose={onClose}
      title={tour.Public ? "Edit post" : "Publish tour"}
      code={tour.Name}
      width="wide"
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <Button variant="quiet" onClick={() => save(null)} busy={busy} disabled={working}>
            Save without publishing
          </Button>
          {tour.Public ? (
            <Button variant="ghost" onClick={() => save(false)} busy={busy} disabled={working}>
              Take offline
            </Button>
          ) : (
            <Button
              variant="clay"
              onClick={() => save(true)}
              busy={busy}
              disabled={working || blockers.length > 0}
            >
              Publish to the index
            </Button>
          )}
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        {error ? <Note tone="error">{error}</Note> : null}

        {blockers.length > 0 ? (
          <Note tone="info">
            This tour still needs {listOut(blockers)} before it can go on the
            index. You can save the post now and finish it later.
          </Note>
        ) : null}

        <div className="grid gap-6 sm:grid-cols-2">
          <FileDrop
            label="GPX track"
            icon={IconUpload}
            accept=".gpx,application/gpx+xml"
            extensions={[".gpx"]}
            maxBytes={MAX_GPX_BYTES}
            file={gpxFile}
            error={gpxError}
            hint=".gpx only · up to 10 MB"
            idleTitle={gpxBusy ? "Reading the track…" : "Drop a GPX track or browse"}
            onFile={(file) => {
              setGpxFile(file);
              uploadTrack(file);
            }}
            preview={
              track ? (
                <>
                  <span className="t-mono break-all text-sm">{track.fileName}</span>
                  <span className="t-figure text-sm font-semibold">
                    {num(track.km)} km · {num(track.hm)} m
                  </span>
                  <span className="t-label">
                    {track.points
                      ? `${num(track.points)} points · replace by dropping another`
                      : "On file · replace by dropping another"}
                  </span>
                </>
              ) : null
            }
          />

          <FileDrop
            label="Cover photo"
            icon={IconImage}
            accept="image/jpeg,image/png,image/webp"
            extensions={[".jpg", ".jpeg", ".png", ".webp"]}
            maxBytes={MAX_IMAGE_BYTES}
            file={coverFile}
            error={coverError}
            hint="JPG · PNG · WEBP · up to 5 MB"
            idleTitle={coverBusy ? "Uploading…" : "Drop your own photo or browse"}
            onFile={takeCover}
            onClear={
              cover
                ? () => {
                    setCover("");
                    setCoverFile(null);
                    setCoverPreview((old) => {
                      if (old) URL.revokeObjectURL(old);
                      return "";
                    });
                  }
                : undefined
            }
            preview={
              coverPreview || cover ? (
                <>
                  <img
                    src={coverPreview || assetUrl(cover)}
                    alt="Selected cover"
                    className="max-h-28 w-auto border border-ink object-contain"
                  />
                  <span className="t-label">
                    {coverBusy ? "Uploading…" : "Drop another to replace"}
                  </span>
                </>
              ) : null
            }
          />
        </div>

        <Field
          as="textarea"
          rows={4}
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value.slice(0, MAX_DESCRIPTION))}
          placeholder="What the tour was like, and what you would pack differently."
          hint={`${description.length} of ${MAX_DESCRIPTION} characters. Shown on the tour sheet, not on the tile.`}
        />

        <Field
          as="select"
          label="Packlist"
          value={itemlist}
          onChange={(e) => setItemlist(e.target.value)}
          hint="The list readers came for. Only your own packlists can be attached."
        >
          <option value="">No packlist attached</option>
          {packlists.map((list) => (
            <option key={list._id} value={list._id}>
              {list.Name || "Unnamed setup"} — {list.itemCount} items
            </option>
          ))}
        </Field>
      </div>
    </Modal>
  );
}
