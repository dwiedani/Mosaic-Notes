import {
  Button,
  EmptyState,
  ErrorState,
  LoadingState,
  Widget,
  WidgetBody,
  WidgetHeader,
  type WidgetProps,
} from "@mosaic/sdk";
import { selectNotes } from "../domain/notes";
import { useNotes } from "../services/use-notes";
import { NotesStyles } from "../components/styles";

export default function RecentNotes({ size, settings }: WidgetProps) {
  const { state, dashboard, retry } = useNotes();
  const configured =
    typeof settings.limit === "number" && Number.isFinite(settings.limit)
      ? Math.max(1, Math.min(8, Math.floor(settings.limit)))
      : 3;
  const limit = size === "medium" ? Math.min(3, configured) : configured;
  const pinnedOnly = settings["pinned-only"] === true;
  return (
    <Widget className="notes-surface">
      <NotesStyles />
      <WidgetHeader>
        <h2>{pinnedOnly ? "Angeheftete Notizen" : "Letzte Notizen"}</h2>
      </WidgetHeader>
      <WidgetBody>
        <div className="notes-widget-content">
          {state.status === "loading" ? (
            <LoadingState />
          ) : state.status === "error" ? (
            <ErrorState
              message="Notizen konnten nicht geladen werden."
              onRetry={retry}
            />
          ) : selectNotes(state.data.notes, "", pinnedOnly).length === 0 ? (
            <EmptyState
              title={
                pinnedOnly ? "Noch nichts angeheftet" : "Noch keine Notizen"
              }
            >
              <p>Halte deine erste Idee in der App fest.</p>
            </EmptyState>
          ) : (
            <ul className="notes-list">
              {selectNotes(state.data.notes, "", pinnedOnly)
                .slice(0, limit)
                .map((note) => (
                  <li key={note.id}>
                    <button
                      className="notes-item"
                      onClick={() =>
                        dashboard.navigation.openApp(
                          "notes",
                          `/${encodeURIComponent(note.id)}`,
                        )
                      }
                    >
                      <strong>
                        {note.pinned ? "↗ " : ""}
                        {note.title}
                      </strong>
                      {size === "large" && (
                        <span className="notes-preview notes-muted">
                          {note.body || "Ohne Inhalt"}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
            </ul>
          )}
          <Button onClick={() => dashboard.navigation.openApp("notes", "/")}>
            Alle Notizen öffnen
          </Button>
        </div>
      </WidgetBody>
    </Widget>
  );
}
