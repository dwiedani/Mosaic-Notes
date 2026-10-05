import { useId, useState } from "react";
import {
  Button,
  Widget,
  WidgetBody,
  WidgetHeader,
  useDashboard,
  type WidgetProps,
} from "@mosaic/sdk";
import { BODY_LIMIT, TITLE_LIMIT } from "../domain/notes";
import { persistNote } from "../services/notebook";
import { NotesStyles } from "../components/styles";

export default function QuickNote({ size }: WidgetProps) {
  const dashboard = useDashboard();
  const id = useId();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const save = async () => {
    if (busy || !title.trim()) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await persistNote(dashboard, {
        id: crypto.randomUUID(),
        title,
        body,
        pinned: false,
      });
      setTitle("");
      setBody("");
      setMessage("Notiz gespeichert.");
    } catch {
      setError("Speichern fehlgeschlagen. Bitte erneut versuchen.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Widget className="notes-surface">
      <NotesStyles />
      <WidgetHeader>
        <h2>Schnelle Notiz</h2>
      </WidgetHeader>
      <WidgetBody>
        <form
          className="notes-widget-content"
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
        >
          <label htmlFor={`${id}-title`}>
            Titel
            <input
              id={`${id}-title`}
              required
              maxLength={TITLE_LIMIT}
              value={title}
              disabled={busy}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Eine Idee festhalten …"
            />
          </label>
          {size === "large" && (
            <div className="notes-field">
              <label htmlFor={`${id}-body`}>Inhalt</label>
              <textarea
                id={`${id}-body`}
                rows={5}
                maxLength={BODY_LIMIT}
                value={body}
                disabled={busy}
                onChange={(event) => setBody(event.target.value)}
              />
            </div>
          )}
          {error && (
            <p role="alert" className="notes-error">
              {error}
            </p>
          )}
          <div className="notes-actions">
            <Button
              type="submit"
              variant="primary"
              disabled={busy || !title.trim()}
            >
              {busy ? "Speichert …" : "Notiz speichern"}
            </Button>
            <Button
              disabled={busy}
              onClick={() => dashboard.navigation.openApp("notes", "/")}
            >
              App öffnen
            </Button>
          </div>
          <span role="status" className="notes-muted">
            {message}
          </span>
        </form>
      </WidgetBody>
    </Widget>
  );
}
