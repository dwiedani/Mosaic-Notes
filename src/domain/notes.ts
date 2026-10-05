export interface Note {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly pinned: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}
export interface Notebook {
  readonly version: 1;
  readonly notes: readonly Note[];
}
export const NOTES_KEY = ["notes", "list"] as const;
export const STORAGE_KEY = "notebook";
export const TITLE_LIMIT = 200;
export const BODY_LIMIT = 50000;

/** Unknown versions and corrupt data fail visibly; they are never reset silently. */
export function parseNotebook(input: unknown): Notebook {
  if (
    typeof input !== "object" ||
    input === null ||
    !("version" in input) ||
    input.version !== 1 ||
    !("notes" in input) ||
    !Array.isArray(input.notes)
  )
    throw new Error("Das gespeicherte Notizformat wird nicht unterstützt.");
  const ids = new Set<string>();
  const notes = input.notes.map((value: unknown): Note => {
    if (
      typeof value !== "object" ||
      value === null ||
      !("id" in value) ||
      typeof value.id !== "string" ||
      !value.id ||
      ids.has(value.id) ||
      !("title" in value) ||
      typeof value.title !== "string" ||
      !value.title.trim() ||
      value.title.length > TITLE_LIMIT ||
      !("body" in value) ||
      typeof value.body !== "string" ||
      value.body.length > BODY_LIMIT ||
      !("pinned" in value) ||
      typeof value.pinned !== "boolean" ||
      !("createdAt" in value) ||
      typeof value.createdAt !== "string" ||
      !Number.isFinite(Date.parse(value.createdAt)) ||
      !("updatedAt" in value) ||
      typeof value.updatedAt !== "string" ||
      !Number.isFinite(Date.parse(value.updatedAt))
    )
      throw new Error("Die gespeicherten Notizen sind ungültig.");
    ids.add(value.id);
    return {
      id: value.id,
      title: value.title,
      body: value.body,
      pinned: value.pinned,
      createdAt: value.createdAt,
      updatedAt: value.updatedAt,
    };
  });
  return { version: 1, notes };
}

export function saveNote(
  notebook: Notebook,
  draft: Pick<Note, "id" | "title" | "body" | "pinned">,
  now: string,
): Notebook {
  const title = draft.title.trim();
  if (!title || title.length > TITLE_LIMIT)
    throw new Error("Bitte einen Titel mit maximal 200 Zeichen eingeben.");
  if (draft.body.length > BODY_LIMIT)
    throw new Error("Eine Notiz darf maximal 50.000 Zeichen enthalten.");
  const existing = notebook.notes.find((note) => note.id === draft.id);
  const note: Note = {
    ...draft,
    title,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  return parseNotebook({
    version: 1,
    notes: [...notebook.notes.filter((item) => item.id !== note.id), note],
  });
}

export function selectNotes(
  notes: readonly Note[],
  search = "",
  pinnedOnly = false,
): Note[] {
  const term = search.trim().toLocaleLowerCase("de");
  return notes
    .filter(
      (note) =>
        (!pinnedOnly || note.pinned) &&
        `${note.title}\n${note.body}`.toLocaleLowerCase("de").includes(term),
    )
    .sort(
      (a, b) =>
        Number(b.pinned) - Number(a.pinned) ||
        b.updatedAt.localeCompare(a.updatedAt) ||
        a.id.localeCompare(b.id),
    );
}
