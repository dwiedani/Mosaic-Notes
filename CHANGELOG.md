# Changelog

## 0.0.4 — 7. Oktober 2026

- Neue Notizen und Quick Notes fragen im Hintergrund über `mosaic.ai.suggestContexts` nach Vorschlägen anhand von Titel und maximal 12.000 Zeichen Inhalt. Mosaic gibt alle verfügbaren Contexts mit; keine Suche in anderen Notizen und keine automatische Zuordnung.
- Vorschläge erscheinen mit geschätzter Sicherheit im Popup und benötigen User-Bestätigung. Speichern wartet nicht auf AI; ohne Provider, bei fehlendem Treffer oder Providerfehler bleibt manuelle Context-Auswahl möglich. Änderungen bestehender Notizen lösen keine erneute Inferenz aus.

## 0.0.3 — 7. Oktober 2026

- Neue Notizen aus App und Quick-Note-Widget öffnen nach erfolgreichem Speichern die zentrale Mosaic-Context-Auswahl. Keine automatische Zuordnung oder AI-Inhaltsanalyse; Fehler der Context-Anfrage lassen gespeicherte Notizen erhalten. Ältere Hosts bleiben über Capability-Check kompatibel. Storage-Format unverändert.

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
