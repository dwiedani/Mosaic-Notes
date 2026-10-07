import assert from "node:assert/strict";
import { test } from "node:test";
import {
  parseNotebook,
  saveNote,
  selectNotes,
  type Notebook,
} from "../src/domain/notes";
import {
  loadNotebook,
  mutateNotebook,
  persistNote,
} from "../src/services/notebook";
import type { DashboardAPI } from "@mosaic/sdk";

const first = "2026-10-05T08:00:00.000Z";
const later = "2026-10-05T09:00:00.000Z";
const empty: Notebook = { version: 1, notes: [] };
const draft = {
  id: "a",
  title: " Idee ",
  body: "Mosaic planen",
  pinned: false,
};
test("create and edit preserve identity, creation time and other notes", () => {
  const created = saveNote(empty, draft, first);
  const second = saveNote(
    created,
    { ...draft, id: "b", title: "Zweite" },
    first,
  );
  const updated = saveNote(
    second,
    { ...draft, title: "Änderung", pinned: true },
    later,
  );
  assert.equal(created.notes[0]?.title, "Idee");
  assert.equal(updated.notes.length, 2);
  assert.equal(updated.notes.find((note) => note.id === "a")?.createdAt, first);
  assert.equal(updated.notes.find((note) => note.id === "a")?.updatedAt, later);
  assert.equal(created.notes[0]?.pinned, false);
});
test("search matches title and body; pin filter and ordering are deterministic", () => {
  let book = saveNote(empty, draft, first);
  book = saveNote(
    book,
    { ...draft, id: "b", title: "Später", body: "", pinned: false },
    later,
  );
  book = saveNote(
    book,
    { ...draft, id: "c", title: "Wichtig", body: "", pinned: true },
    first,
  );
  assert.deepEqual(
    selectNotes(book.notes).map((note) => note.id),
    ["c", "b", "a"],
  );
  assert.deepEqual(
    selectNotes(book.notes, " MOSAIC ").map((note) => note.id),
    ["a"],
  );
  assert.deepEqual(
    selectNotes(book.notes, "", true).map((note) => note.id),
    ["c"],
  );
  assert.deepEqual(selectNotes(book.notes, "nicht vorhanden"), []);
});
test("invalid and future storage formats fail without silently replacing data", () => {
  const book = saveNote(empty, draft, first);
  assert.deepEqual(parseNotebook(book), book);
  for (const value of [
    null,
    [],
    { version: 2, notes: [] },
    { ...book, notes: [...book.notes, ...book.notes] },
    { version: 1, notes: [{ ...book.notes[0], updatedAt: "invalid" }] },
  ]) {
    assert.throws(() => parseNotebook(value));
  }
  assert.throws(() => saveNote(empty, { ...draft, title: " " }, first));
  assert.throws(() =>
    saveNote(empty, { ...draft, title: "x".repeat(201) }, first),
  );
  assert.throws(() =>
    saveNote(empty, { ...draft, body: "x".repeat(50001) }, first),
  );
});

function fixture() {
  let value: unknown = null;
  let failNext = false;
  let invalidations = 0;
  const dashboard = {
    user: { id: "test" },
    app: { id: "notes" },
    storage: {
      get: async () => value,
      set: async (_key: string, next: unknown) => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        if (failNext) {
          failNext = false;
          throw new Error("Storage unavailable");
        }
        value = next;
      },
    },
    data: {
      invalidate: () => {
        invalidations++;
      },
    },
  } as unknown as DashboardAPI;
  return {
    dashboard,
    fail: () => {
      failNext = true;
    },
    invalidations: () => invalidations,
  };
}
test("parallel widget writes retain both notes and invalidate the shared query", async () => {
  const { dashboard, invalidations } = fixture();
  await Promise.all([
    mutateNotebook(dashboard, (book) => saveNote(book, draft, first)),
    mutateNotebook(dashboard, (book) =>
      saveNote(book, { ...draft, id: "b" }, later),
    ),
  ]);
  assert.equal((await loadNotebook(dashboard.storage)).notes.length, 2);
  assert.equal(invalidations(), 2);
});
test("only successfully created notes request context choice; prompt failures preserve saved data", async () => {
  const { dashboard, fail } = fixture();
  const requested: unknown[] = [];
  const notices: unknown[] = [];
  const withContexts = {
    ...dashboard,
    contexts: {
      ...dashboard.contexts,
      requestAssignment: async (entity: unknown, label: string) => {
        requested.push({ entity, label });
        assert.equal(
          (await loadNotebook(dashboard.storage)).notes.some(
            (note) => note.id === draft.id,
          ),
          true,
        );
        throw new Error("Request unavailable");
      },
    },
    notifications: { show: (notice: unknown) => notices.push(notice) },
  } as DashboardAPI;
  fail();
  await assert.rejects(persistNote(withContexts, draft));
  assert.equal(requested.length, 0);
  await persistNote(withContexts, draft);
  assert.deepEqual(requested, [
    { entity: { appId: "notes", type: "note", id: "a" }, label: "Idee" },
  ]);
  assert.equal(notices.length, 1);
  await persistNote(withContexts, { ...draft, title: "Edit" });
  assert.equal(requested.length, 1);
  assert.equal((await loadNotebook(dashboard.storage)).notes[0]?.title, "Edit");
});
test("new-note AI guessing is bounded, provider-neutral and never delays or assigns the save", async () => {
  const { dashboard } = fixture();
  const entity = { appId: "notes", type: "note", id: draft.id };
  const requestId = crypto.randomUUID();
  const calls: unknown[] = [];
  const notices: unknown[] = [];
  let failInference: (cause: Error) => void = () => {};
  const pendingInference = new Promise<never>((_resolve, reject) => {
    failInference = reject;
  });
  const runtime = {
    ...dashboard,
    contexts: {
      ...dashboard.contexts,
      requestAssignment: async () => ({ id: requestId, entity, label: "Idee" }),
    },
    ai: {
      ...dashboard.ai,
      providers: async () => [
        { id: "any-provider", capabilities: ["structured-output"] },
      ],
      suggestContexts: async (...args: unknown[]) => {
        calls.push(args);
        return pendingInference;
      },
    },
    notifications: { show: (notice: unknown) => notices.push(notice) },
  } as DashboardAPI;
  await persistNote(runtime, { ...draft, body: "x".repeat(20000) });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(calls.length, 1);
  const call = calls[0] as [
    unknown,
    { prompt: string; contextId: unknown },
    unknown,
  ];
  assert.deepEqual(call[0], entity);
  assert.equal(call[1].contextId, null);
  assert.deepEqual(JSON.parse(call[1].prompt), {
    title: "Idee",
    content: "x".repeat(12000),
    truncated: true,
  });
  assert.deepEqual(call[2], { assignmentRequestId: requestId });
  assert.equal(
    (await loadNotebook(dashboard.storage)).notes[0]?.body.length,
    20000,
  );
  await persistNote(runtime, { ...draft, title: "Edit" });
  assert.equal(calls.length, 1);
  failInference(new Error("Provider unavailable"));
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(notices.length, 1);
  assert.equal((await loadNotebook(dashboard.storage)).notes[0]?.title, "Edit");
  const noProvider = {
    ...runtime,
    ai: { ...runtime.ai, providers: async () => [] },
  };
  await persistNote(noProvider, { ...draft, id: "b" });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(calls.length, 1);
});
test("failed storage write preserves prior data and does not block retry or deletion", async () => {
  const { dashboard, fail, invalidations } = fixture();
  await mutateNotebook(dashboard, (book) => saveNote(book, draft, first));
  fail();
  await assert.rejects(
    mutateNotebook(dashboard, (book) =>
      saveNote(book, { ...draft, title: "Edit" }, later),
    ),
  );
  assert.equal((await loadNotebook(dashboard.storage)).notes[0]?.title, "Idee");
  assert.equal(invalidations(), 1);
  await mutateNotebook(dashboard, (book) => ({
    ...book,
    notes: book.notes.filter((note) => note.id !== "a"),
  }));
  assert.deepEqual(await loadNotebook(dashboard.storage), empty);
});
