import type { DashboardAPI, ContextAssignmentRequest } from "@mosaic/sdk";
import {
  parseNotebook,
  saveNote,
  STORAGE_KEY,
  NOTES_KEY,
  type Note,
  type Notebook,
} from "../domain/notes";

type Storage = DashboardAPI["storage"];
// Serialize read/write cycles across app and widget instances in this browser.
const queues = new Map<string, Promise<unknown>>();
const CONTEXT_CONTENT_LIMIT = 12000;
async function suggestNoteContexts(
  dashboard: DashboardAPI,
  request: ContextAssignmentRequest,
  draft: Pick<Note, "title" | "body">,
) {
  if (!dashboard.ai?.suggestContexts) return;
  const providers = await dashboard.ai.providers();
  if (
    !providers.some((provider) =>
      provider.capabilities.includes("structured-output"),
    )
  )
    return;
  await dashboard.ai.suggestContexts(
    request.entity,
    {
      prompt: JSON.stringify({
        title: draft.title.trim(),
        content: draft.body.slice(0, CONTEXT_CONTENT_LIMIT),
        truncated: draft.body.length > CONTEXT_CONTENT_LIMIT,
      }),
      contextId: null,
    },
    { assignmentRequestId: request.id },
  );
}
export async function loadNotebook(storage: Storage): Promise<Notebook> {
  const value = await storage.get<unknown>(STORAGE_KEY);
  return value === null ? { version: 1, notes: [] } : parseNotebook(value);
}
export function mutateNotebook(
  dashboard: DashboardAPI,
  transform: (current: Notebook) => Notebook,
): Promise<void> {
  const key = `${dashboard.user.id}:${dashboard.app.id}`;
  const previous = queues.get(key) ?? Promise.resolve();
  const operation = previous
    .catch(() => undefined)
    .then(async () => {
      const current = await loadNotebook(dashboard.storage);
      await dashboard.storage.set(STORAGE_KEY, transform(current));
      dashboard.data.invalidate(NOTES_KEY);
    });
  queues.set(key, operation);
  void operation
    .finally(() => {
      if (queues.get(key) === operation) queues.delete(key);
    })
    .catch(() => undefined);
  return operation;
}
export async function persistNote(
  dashboard: DashboardAPI,
  draft: Pick<Note, "id" | "title" | "body" | "pinned">,
): Promise<void> {
  let created = false;
  await mutateNotebook(dashboard, (current) => {
    created = !current.notes.some((note) => note.id === draft.id);
    return saveNote(current, draft, new Date().toISOString());
  });
  // Older hosts keep working; a failed platform request must not undo a saved note.
  if (created && dashboard.contexts?.requestAssignment) {
    try {
      const request = await dashboard.contexts.requestAssignment(
        { appId: dashboard.app.id, type: "note", id: draft.id },
        draft.title.trim().slice(0, 200),
      );
      if (request)
        void suggestNoteContexts(dashboard, request, draft).catch(() => {
          dashboard.notifications.show({
            title: "Context manuell wählen",
            message:
              "Der AI-Vorschlag konnte nicht ermittelt werden. Die Notiz ist gespeichert.",
            kind: "info",
          });
        });
    } catch {
      dashboard.notifications.show({
        title: "Notiz gespeichert",
        message:
          "Die Context-Auswahl konnte nicht geöffnet werden. Du kannst den Context an der Notiz zuordnen.",
        kind: "error",
      });
    }
  }
}
