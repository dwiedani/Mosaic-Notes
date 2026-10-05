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
export function persistNote(
  dashboard: DashboardAPI,
  draft: Pick<Note, "id" | "title" | "body" | "pinned">,
): Promise<void> {
  return mutateNotebook(dashboard, (current) =>
    saveNote(current, draft, new Date().toISOString()),
  );
}
