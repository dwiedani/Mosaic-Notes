/** Embedded styles travel with each entrypoint; the builder has no CSS loader contract. */
export function NotesStyles() {
  return (
    <style>{`
    .notes-surface { color: var(--colors-text); min-width: 0; }
    .notes-surface * { box-sizing: border-box; }
    .notes-surface h1, .notes-surface h2, .notes-surface p { margin-top: 0; }
    .notes-toolbar { display: flex; align-items: center; justify-content: flex-end; gap: var(--spacing-md); flex-wrap: wrap; margin-bottom: var(--spacing-lg); }
    .notes-muted { color: var(--colors-textMuted); font-size: .85rem; }
    .notes-layout { display: grid; grid-template-columns: minmax(220px, 1fr) minmax(0, 2fr); gap: var(--spacing-lg); }
    .notes-list { list-style: none; padding: 0; margin: 0; display: grid; gap: var(--spacing-sm); max-height: 65vh; overflow: auto; }
    .notes-item { display: block; width: 100%; text-align: left; border: 1px solid var(--colors-border); border-radius: var(--radius-md); padding: var(--spacing-md); background: var(--colors-surfaceElevated); color: var(--colors-text); font: inherit; cursor: pointer; }
    .notes-item[aria-current="true"] { border-color: var(--colors-accent); box-shadow: inset 3px 0 var(--colors-accent); }
    .notes-item strong { display: block; overflow-wrap: anywhere; }
    .notes-preview { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; overflow-wrap: anywhere; margin: var(--spacing-xs) 0; }
    .notes-surface input:not([type="checkbox"]), .notes-surface textarea { width: 100%; min-width: 0; font: inherit; border: 1px solid var(--colors-border); border-radius: var(--radius-sm); background: var(--colors-surfaceElevated); color: var(--colors-text); padding: var(--spacing-sm); }
    .notes-surface textarea { resize: vertical; line-height: 1.6; }
    .notes-field { margin-bottom: var(--spacing-md); }
    .notes-field > label { margin-bottom: var(--spacing-sm); }
    .notes-surface :is(button,input,textarea):focus-visible { outline: 2px solid var(--colors-accent); outline-offset: 3px; }
    .notes-actions { display: flex; flex-wrap: wrap; align-items: center; gap: var(--spacing-sm); }
    .notes-check { display: flex; flex-direction: row; align-items: center; gap: var(--spacing-sm); }
    .notes-error { color: var(--colors-danger); }
    .notes-widget-content { display: flex; flex-direction: column; gap: var(--spacing-sm); height: 100%; min-height: 0; overflow: auto; }
    .notes-widget-content .notes-list { max-height: none; }
    .notes-widget-content .notes-item { padding: var(--spacing-sm); }
    .notes-widget-content label { margin-bottom: 0; }
    @media (max-width: 700px) { .notes-layout { grid-template-columns: minmax(0, 1fr); } .notes-list { max-height: 32vh; } }
  `}</style>
  );
}
