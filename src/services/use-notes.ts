import { useCallback } from "react";
import { useContextQuery, useDashboard } from "@mosaic/sdk";
import { NOTES_KEY } from "../domain/notes";
import { loadNotebook } from "./notebook";

export function useNotes() {
  const dashboard = useDashboard();
  const query = useCallback(async () => {
    const notebook = await loadNotebook(dashboard.storage);
    return {
      ...notebook,
      allNoteIds: notebook.notes.map((note) => note.id),
      notes: await dashboard.contexts.filter(notebook.notes, (note) => ({
        appId: dashboard.app.id,
        type: "note",
        id: note.id,
      })),
    };
  }, [dashboard.storage, dashboard.contexts, dashboard.app.id]);
  const state = useContextQuery({ key: NOTES_KEY, query });
  return {
    dashboard,
    state,
    retry: () => dashboard.data.invalidate(NOTES_KEY),
  };
}
