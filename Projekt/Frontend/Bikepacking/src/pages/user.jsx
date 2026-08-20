import { useCallback, useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { HashLink } from "react-router-hash-link";

import PublishTour from "../components/Account/PublishTour.jsx";
import Modal from "../components/ui/Modal.jsx";
import { Button, Note } from "../components/ui/Controls.jsx";
import { SectionHead, Datum, EmptyPlate, LoadingRows } from "../components/ui/Sheet.jsx";
import { IconArrow, IconTrash } from "../components/ui/Icons.jsx";
import { UserContext } from "../Context/UserContext.jsx";
import api, { errorMessage } from "../lib/api.js";
import useDocumentTitle from "../lib/useDocumentTitle.js";

const dateLabel = (iso) => {
  if (!iso) return "Undated";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "Undated"
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

const num = (n) => Number(n || 0).toLocaleString("en-GB");

/**
 * Das Konto: was gespeichert ist, und was davon öffentlich steht.
 *
 * Veröffentlichen ist hier ein eigener Schritt und kein Nebeneffekt des
 * Speicherns — eine Tour landet erst auf dem Index, wenn sie ausdrücklich
 * dorthin geschickt wird, und lässt sich genauso wieder zurückziehen.
 */
function UserPage() {
  const { user, requireLogin, logout, checking } = useContext(UserContext);

  const [tours, setTours] = useState([]);
  const [packlists, setPacklists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");

  useDocumentTitle("Account");

  const load = useCallback(async () => {
    if (!user) return;
    setError("");
    try {
      const [tourRes, listRes] = await Promise.all([
        api.get("/tours/mine"),
        api.get("/itemlists/mine"),
      ]);
      setTours(tourRes.data);
      setPacklists(listRes.data);
    } catch (err) {
      setError(errorMessage(err, "Your account could not be loaded."));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    load();
  }, [user, load]);

  /**
   * Eine Tour endgültig löschen.
   *
   * Die Packliste bleibt: sie hängt am Konto und lässt sich an einer anderen
   * Tour weiterverwenden. Track und Cover gehörten nur dieser Tour und räumt
   * der Server mit ab.
   */
  const deleteTour = async () => {
    setError("");
    setBusy(true);
    try {
      await api.delete(`/tours/${deleting._id}`);
      setFeedback(`“${deleting.Name}” deleted.`);
      setDeleting(null);
      await load();
    } catch (err) {
      setError(errorMessage(err, "That tour could not be deleted."));
    } finally {
      setBusy(false);
    }
  };

  const togglePublic = async (tour) => {
    setError("");
    setFeedback("");
    try {
      await api.put(`/tours/${tour._id}/publish`, { Public: !tour.Public });
      setFeedback(
        tour.Public
          ? `“${tour.Name}” is off the index again.`
          : `“${tour.Name}” is on the index.`
      );
      await load();
    } catch (err) {
      setError(errorMessage(err, "The visibility could not be changed."));
    }
  };

  if (checking) {
    return (
      <section className="sheet-pad py-10 md:py-14">
        <SectionHead as="h1" title="Account" meta="Checking your session" />
        <div className="mt-8">
          <LoadingRows rows={3} />
        </div>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="sheet-pad flex min-h-[60vh] flex-col justify-center py-14">
        <div className="grid lg:grid-cols-12">
          <div className="lg:col-span-7 lg:border-r lg:border-ink lg:pr-10">
            <h1 className="t-h1 border-y border-ink py-3">
              This sheet needs an account
            </h1>
            <p className="t-body mt-6 text-[0.9375rem]">
              Browsing published tours and their packlists works without one.
              Building your own does not: tours, GPX tracks and packlists are
              all saved to your account, so there is nowhere to put them until
              there is one.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                variant="clay"
                onClick={() =>
                  requireLogin("Log in to reach your saved tours and setups.")
                }
              >
                Log in or register
              </Button>
              <HashLink smooth to="/" className="c-btn c-btn--ghost">
                <span>Browse published tours</span>
                <IconArrow size={16} />
              </HashLink>
            </div>
          </div>

          <div className="mt-10 lg:col-span-5 lg:mt-0 lg:pl-10">
            <div className="m-grid h-full min-h-[14rem] border border-dashed border-ink/40" />
          </div>
        </div>
      </section>
    );
  }

  const published = tours.filter((t) => t.Public).length;

  return (
    <>
      <section className="sheet-pad border-b border-ink py-8 md:py-10">
        <SectionHead
          as="h1"
          title={user.username}
          meta="Sheet 03 · Account"
          action={
            <Button variant="quiet" onClick={logout}>
              Log out
            </Button>
          }
        />

        <div className="c-cellgrid mt-6 grid-cols-2 sm:grid-cols-4">
          <Datum label="Tours" value={num(tours.length)} size="lg" />
          <Datum label="On the index" value={num(published)} tone="clay" size="lg" />
          <Datum label="Packlists" value={num(packlists.length)} size="lg" />
          <Datum
            label="Items filed"
            value={num(packlists.reduce((sum, l) => sum + (l.itemCount || 0), 0))}
          />
        </div>
      </section>

      <section className="sheet-pad bg-field py-10 md:py-14">
        <SectionHead
          title="Your tours"
          meta={`${tours.length} saved · ${published} public`}
          action={
            <HashLink smooth to="/overview#tour" className="c-btn c-btn--clay">
              <span>Plan a new one</span>
              <IconArrow size={16} />
            </HashLink>
          }
        />

        {error ? (
          <Note tone="error" className="mt-4">
            {error}
          </Note>
        ) : null}
        {feedback && !error ? (
          <Note tone="success" className="mt-4">
            {feedback}
          </Note>
        ) : null}

        <div className="mt-6">
          {loading ? (
            <LoadingRows rows={3} />
          ) : tours.length === 0 ? (
            <EmptyPlate
              title="No tours saved yet"
              body="Plan one on the planner sheet and press Save. Once it has a track and a packlist, it can go on the public index."
              actions={
                <HashLink smooth to="/overview#tour" className="c-btn c-btn--clay">
                  <span>Open the planner</span>
                  <IconArrow size={16} />
                </HashLink>
              }
            />
          ) : (
            <ul className="border-t border-ink">
              {tours.map((tour) => {
                const ready = Boolean(tour.GPX_file && tour.ItemCount > 0);
                return (
                  <li
                    key={tour._id}
                    className="grid gap-4 border-b border-ink bg-sheet p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <h3 className="t-h3 min-w-0 truncate">{tour.Name}</h3>
                        <span
                          className={`t-label ${tour.Public ? "t-label--clay" : ""}`}
                        >
                          {tour.Public ? "On the index" : "Private"}
                        </span>
                      </div>

                      <p className="t-label mt-1">
                        {dateLabel(tour.StartDate)} · {tour.Biketype} ·{" "}
                        {num(tour.Distance)} km · {num(tour.Elevation)} m
                      </p>

                      <p className="t-label mt-1">
                        {tour.GPX_file ? "Track on file" : "No track"} ·{" "}
                        {tour.ItemCount > 0
                          ? `${tour.ItemlistName || "Packlist"}, ${tour.ItemCount} items`
                          : "No packlist"}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      {tour.Public ? (
                        <Link
                          to={`/tour/${tour._id}`}
                          className="c-btn c-btn--quiet no-underline"
                        >
                          <span>View post</span>
                        </Link>
                      ) : null}

                      <Button
                        variant="ghost"
                        onClick={() => setEditing(tour)}
                      >
                        {tour.Public ? "Edit post" : "Prepare post"}
                      </Button>

                      <Button
                        variant={tour.Public ? "quiet" : "clay"}
                        onClick={() => togglePublic(tour)}
                        disabled={!tour.Public && !ready}
                      >
                        {tour.Public ? "Take offline" : "Publish"}
                      </Button>

                      <Button
                        variant="quiet"
                        icon={IconTrash}
                        iconOnly
                        onClick={() => setDeleting(tour)}
                        aria-label={`Delete ${tour.Name}`}
                        title={`Delete ${tour.Name}`}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <p className="t-label mt-4 max-w-prose">
          A tour needs a GPX track and a packlist with items before it can go on
          the index — a tile with nothing behind it is what the index exists to
          avoid.
        </p>
      </section>

      {deleting ? (
        <Modal
          onClose={() => setDeleting(null)}
          title="Delete this tour?"
          code={deleting.Name}
          footer={
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
              <Button variant="quiet" onClick={() => setDeleting(null)} disabled={busy}>
                Keep it
              </Button>
              <Button variant="clay" onClick={deleteTour} busy={busy}>
                Delete for good
              </Button>
            </div>
          }
        >
          <p className="t-body text-[0.9375rem]">
            {deleting.Public
              ? `“${deleting.Name}” comes off the public index and is deleted from your account. This cannot be undone.`
              : `“${deleting.Name}” is deleted from your account. This cannot be undone.`}
          </p>
          <p className="t-label mt-4">
            {deleting.ItemCount > 0
              ? `The packlist “${deleting.ItemlistName || "Unnamed setup"}” stays on your account — only the tour goes.`
              : "No packlist is attached, so nothing else is affected."}
          </p>
        </Modal>
      ) : null}

      {editing ? (
        <PublishTour
          tour={editing}
          packlists={packlists}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setFeedback(`“${editing.Name}” updated.`);
            load();
          }}
        />
      ) : null}
    </>
  );
}

export default UserPage;
