# Changelog

## 0.0.2 — 7. Oktober 2026

- Context-Filter in App und Recent-Widget sowie Context-Chips für explizite Mehrfachzuordnungen.
- All zeigt alle Notizen; neue Notizen werden nicht automatisch einem Context zugeordnet, auch nicht anhand ihres Inhalts.
- Gespeicherte Notizen außerhalb des aktiven Contexts werden auch im Editor ausgeblendet. Ungespeicherte Entwürfe bleiben mit sichtbarem Hinweis erhalten.
- Flat-Unterstützung über Mosaic-Tokens; Regressionstest für Context-Wechsel zwischen Digant und nourish.

## 0.0.1 — 5. Oktober 2026

- Eigenständige Mosaic-App `notes` mit Erstellen, Bearbeiten, Suche, Anheften und bestätigtem Löschen.
- Widgets `notes:recent` und `notes:quick-note` in Medium und Large.
- Versionierter, validierter Storage pro Nutzer und App; gemeinsame Query-Invalidierung.
- Cloud-/Pixel-Themes, responsive Oberfläche und native Formularbedienung.

Erstes Storage-Format: `{ version: 1, notes: [...] }`. Es sind keine Migrationen erforderlich. Unbekannte Versionen werden als Fehler angezeigt und nicht überschrieben.
