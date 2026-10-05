import { useEffect, useId, useRef, useState } from "react";
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  type AppProps,
} from "@mosaic/sdk";
import {
  BODY_LIMIT,
  TITLE_LIMIT,
  selectNotes,
  type Note,
} from "./domain/notes";
import { useNotes } from "./services/use-notes";
import { mutateNotebook, persistNote } from "./services/notebook";
import { NotesStyles } from "./components/styles";

type Draft = Pick<Note, "id" | "title" | "body" | "pinned">;
export default function NotesApp({ path }: AppProps) {
  const { dashboard, state, retry } = useNotes();
  const editorId = useId();
  const [search, setSearch] = useState("");
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [original, setOriginal] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const initializedPath = useRef<string | null>(null);
  const dirty = draft !== null && JSON.stringify(draft) !== original;
  function open(note: Draft) {
    setDraft(note);
    setOriginal(JSON.stringify(note));
    setMessage("");
    setError("");
    setDeleting(false);
  }
  useEffect(() => {
    if (state.status !== "ready" || initializedPath.current === path) return;
    initializedPath.current = path;
    if (path === "/new") {
      open({ id: crypto.randomUUID(), title: "", body: "", pinned: false });
      return;
    }
    let id: string;
    try {
      id = decodeURIComponent(path.slice(1));
    } catch {
      setError("Dieser Notizpfad ist ungültig.");
      return;
    }
    const note = state.data.notes.find((item) => item.id === id);
    if (note)
      open({
        id: note.id,
        title: note.title,
        body: note.body,
        pinned: note.pinned,
      });
    else if (id)
      setError(
        "Diese Notiz wurde nicht gefunden. Wähle eine Notiz oder erstelle eine neue.",
      );
  }, [path, state]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const canSwitch = () =>
    !dirty || window.confirm("Ungespeicherte Änderungen verwerfen?");
  const save = async () => {
    if (!draft || busy) return;
    setBusy(true);
    setError("");
    try {
      const saved = { ...draft, title: draft.title.trim() };
      await persistNote(dashboard, saved);
      setDraft(saved);
      setOriginal(JSON.stringify(saved));
      setMessage("Gespeichert.");
    } catch {
      setError(
        "Speichern fehlgeschlagen. Deine Änderungen bleiben erhalten. Bitte erneut versuchen.",
      );
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    if (!draft || busy) return;
    setBusy(true);
    setError("");
    try {
      await mutateNotebook(dashboard, (current) => ({
        ...current,
        notes: current.notes.filter((note) => note.id !== draft.id),
      }));
      setDraft(null);
      setOriginal("");
      setDeleting(false);
      setMessage("Notiz gelöscht.");
    } catch {
      setError("Löschen fehlgeschlagen. Bitte erneut versuchen.");
    } finally {
      setBusy(false);
    }
  };
  const notes =
    state.status === "ready"
      ? selectNotes(state.data.notes, search, pinnedOnly)
      : [];
  return (
    <Card className="notes-surface">
      <NotesStyles />
      <header className="notes-toolbar">
        <Button
          variant="primary"
          disabled={busy}
          onClick={() => {
            if (canSwitch())
              open({
                id: crypto.randomUUID(),
                title: "",
                body: "",
                pinned: false,
              });
          }}
        >
          Neue Notiz
        </Button>
      </header>
      {error && (
        <p role="alert" className="notes-error">
          {error}
        </p>
      )}
      <div className="notes-layout">
        <aside aria-label="Notizensammlung">
          <label>
            Notizen durchsuchen
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Titel oder Inhalt suchen …"
            />
          </label>
          <label className="notes-check">
            <input
              type="checkbox"
              checked={pinnedOnly}
              onChange={(event) => setPinnedOnly(event.target.checked)}
            />
            Nur angeheftete Notizen
          </label>
          {state.status === "loading" ? (
            <LoadingState />
          ) : state.status === "error" ? (
            <ErrorState
              message="Notizen konnten nicht geladen werden. Gespeicherte Daten wurden nicht verändert."
              onRetry={retry}
            />
          ) : notes.length === 0 ? (
            <EmptyState
              title={
                state.data.notes.length
                  ? "Keine passenden Notizen"
                  : "Deine erste Idee wartet"
              }
            >
              <p>
                {state.data.notes.length
                  ? "Passe deine Suche oder den Filter an."
                  : "Erstelle eine neue Notiz, um loszulegen."}
              </p>
            </EmptyState>
          ) : (
            <>
              <p className="notes-muted">
                {notes.length} {notes.length === 1 ? "Notiz" : "Notizen"}
              </p>
              <ul className="notes-list">
                {notes.map((note) => (
                  <li key={note.id}>
                    <button
                      className="notes-item"
                      aria-current={draft?.id === note.id}
                      disabled={busy}
                      onClick={() => {
                        if (draft?.id !== note.id && canSwitch())
                          open({
                            id: note.id,
                            title: note.title,
                            body: note.body,
                            pinned: note.pinned,
                          });
                      }}
                    >
                      <strong>
                        {note.pinned && "↗ "}
                        {note.title}
                      </strong>
                      <span className="notes-preview notes-muted">
                        {note.body || "Ohne Inhalt"}
                      </span>
                      <small className="notes-muted">
                        {note.pinned ? "Angeheftet · " : ""}
                        {new Date(note.updatedAt).toLocaleDateString("de-DE")}
                      </small>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </aside>
        <section aria-label="Notizeditor">
          {draft ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void save();
              }}
            >
              <fieldset
                disabled={busy}
                style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}
              >
                <label>
                  Titel
                  <input
                    autoFocus
                    required
                    maxLength={TITLE_LIMIT}
                    value={draft.title}
                    onChange={(event) =>
                      setDraft({ ...draft, title: event.target.value })
                    }
                    placeholder="Gib deiner Idee einen Namen"
                  />
                </label>
                <div className="notes-field">
                  <label htmlFor={`${editorId}-body`}>Inhalt</label>
                  <textarea
                    id={`${editorId}-body`}
                    rows={14}
                    maxLength={BODY_LIMIT}
                    value={draft.body}
                    onChange={(event) =>
                      setDraft({ ...draft, body: event.target.value })
                    }
                    placeholder="Was möchtest du festhalten?"
                  />
                </div>
                <label className="notes-check">
                  <input
                    type="checkbox"
                    checked={draft.pinned}
                    onChange={(event) =>
                      setDraft({ ...draft, pinned: event.target.checked })
                    }
                  />
                  Notiz anheften
                </label>
                <div className="notes-actions">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={!dirty || !draft.title.trim()}
                  >
                    {busy ? "Wird gespeichert …" : "Speichern"}
                  </Button>
                  <Button onClick={() => setDeleting(true)}>Löschen</Button>
                  <span role="status" className="notes-muted">
                    {dirty
                      ? "Ungespeicherte Änderungen"
                      : message || "Alle Änderungen gespeichert"}
                  </span>
                </div>
                {deleting && (
                  <div style={{ marginTop: "var(--spacing-md)" }}>
                    <p>Diese Notiz endgültig löschen?</p>
                    <div className="notes-actions">
                      <Button onClick={() => void remove()}>
                        Endgültig löschen
                      </Button>
                      <Button onClick={() => setDeleting(false)}>
                        Abbrechen
                      </Button>
                    </div>
                  </div>
                )}
              </fieldset>
            </form>
          ) : (
            <EmptyState title="Raum für deine Gedanken">
              <p>Wähle eine Notiz oder halte eine neue Idee fest.</p>
              <p role="status">{message}</p>
            </EmptyState>
          )}
        </section>
      </div>
    </Card>
  );
}
