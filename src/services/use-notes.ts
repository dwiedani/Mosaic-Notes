import { useCallback } from "react";
import { useAppQuery, useDashboard } from "@mosaic/sdk";
import { NOTES_KEY } from "../domain/notes";
import { loadNotebook } from "./notebook";

export function useNotes() {
  const dashboard = useDashboard();
  const query = useCallback(
    () => loadNotebook(dashboard.storage),
    [dashboard.storage],
  );
  const state = useAppQuery({ key: NOTES_KEY, query });
  return {
    dashboard,
    state,
    retry: () => dashboard.data.invalidate(NOTES_KEY),
  };
}
