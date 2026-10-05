# Changelog

## 0.0.1 — 5. Oktober 2026

- Eigenständige Mosaic-App `notes` mit Erstellen, Bearbeiten, Suche, Anheften und bestätigtem Löschen.
- Widgets `notes:recent` und `notes:quick-note` in Medium und Large.
- Versionierter, validierter Storage pro Nutzer und App; gemeinsame Query-Invalidierung.
- Cloud-/Pixel-Themes, responsive Oberfläche und native Formularbedienung.

Erstes Storage-Format: `{ version: 1, notes: [...] }`. Es sind keine Migrationen erforderlich. Unbekannte Versionen werden als Fehler angezeigt und nicht überschrieben.
