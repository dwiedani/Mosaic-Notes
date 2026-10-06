import type { DashboardAPI } from "@mosaic/sdk";
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
      await dashboard.contexts.requestAssignment(
        { appId: dashboard.app.id, type: "note", id: draft.id },
        draft.title.trim().slice(0, 200),
      );
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
