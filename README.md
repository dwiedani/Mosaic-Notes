# Mosaic Notes

Eine eigenständige Notizen-App für Mosaic (Dashboard-API `>=1.0.0 <2.0.0`).

## Funktionen

- Notizen mit Titel und Text erstellen, bearbeiten und nach Bestätigung löschen.
- Titel und Inhalt durchsuchen, Wichtiges anheften und nach angehefteten Notizen filtern.
- **Letzte Notizen:** Übersicht mit Detailnavigation, konfigurierbarer Anzahl und Pin-Filter.
- **Schnelle Notiz:** Direkt im Dashboard schreiben und speichern; Medium bietet einen kompakten Titel, Large zusätzlich ein Textfeld.
- Beide Widgets unterstützen `medium` und `large`, mehrere unabhängige Instanzen und Cloud/Flat/Pixel.

Änderungen im Editor werden ausdrücklich mit **Speichern** gesichert. Beim Wechsel zu einer anderen Notiz wird vor ungespeicherten Änderungen gewarnt. Vor dem Verlassen der App über die Mosaic-Navigation speichern. Texte werden als Klartext dargestellt, einschließlich Markdown-Zeichen.

## Lokale Entwicklung

Benötigt Node >=22.14 und die benachbarte Plattform:

```text
Mosaic/
Mosaic-Notes/
```

Das SDK ist noch nicht veröffentlicht; `@mosaic/sdk` wird über `file:../Mosaic/packages/sdk` eingebunden. Im Mosaic-Repository zuerst `npm ci` und `npm run build` ausführen, dann hier:

```sh
npm ci
npm run check
```

`check` prüft Formatierung, ESLint/React-Hooks, TypeScript, Domänen-/Storage-Tests, App-Vertrag und Release-Paket. Einzelbefehle: `npm run typecheck`, `npm test`, `npm run validate`, `npm run build`, `npm run package`.

`npm run test:browser` prüft das installierte Paket in einem isolierten Mosaic-Host auf Port 4312 mit Playwright aus der benachbarten Plattform. Vorher dort `npx playwright install chromium` ausführen und hier `npm run package`. Der Test deckt CRUD, Suche, Persistenz, Deep Links, Themes, mobile Breite, Widget-Größen/-Settings und mehrere Instanzen ab. Screenshots liegen in `test-results/`. Die temporäre Datenbank wird anschließend entfernt; bestehende Mosaic-Daten bleiben erhalten. Nur das Testfixture importiert Plattform-Interna, die App selbst ausschließlich `@mosaic/sdk`.

## Installation und Release

`npm run package` erzeugt `dist/manifest.json`, Browser-Entrypoints, `release/mosaic-app.zip` und `release/checksums.json`. React und SDK bleiben externe Host-Abhängigkeiten. Die Definition steht ausschließlich in `dashboard.config.ts`.

Für die Installation per Repository-Link ein stabiles GitHub-Release entsprechend der Paketversion mit den beiden Release-Dateien veröffentlichen. Anschließend in Mosaic unter Apps den Repository-Link `https://github.com/dwiedani/Mosaic-Notes` installieren oder aktualisieren. Ein lokaler Pakettest ersetzt keinen veröffentlichten GitHub-Release-Test.

## Daten und Grenzen

App und Widgets verwenden denselben Service, den Query-Key `["notes", "list"]` und den Storage-Key `notebook`. Mosaic isoliert Storage nach Nutzer und App. Das JSON-Format ist versioniert (`version: 1`) und wird beim Lesen geprüft; ungültige Daten werden nicht automatisch zurückgesetzt. Erfolgreiche Mutationen invalidieren die gemeinsame Query.

Schreibvorgänge innerhalb derselben Browser-Runtime werden serialisiert. Mehrere Tabs/Geräte unterliegen dem Last-Write-Wins-Verhalten des aktuellen Mosaic-Storage; ein Konfliktprotokoll und Offline-Synchronisierung sind nicht vorhanden. Grenzen: 200 Zeichen pro Titel, 50.000 Zeichen pro Inhalt. Keine externen Dienste, Secrets oder App-Backend-Abhängigkeiten.

Styles werden mit den Entrypoints eingebettet und auf `.notes-surface` begrenzt, da der aktuelle App-Builder keinen eigenständigen CSS-Loader anbietet. Alle Farben und Abstände folgen Mosaic-Tokens.

## Context-Unterstützung

Neue Notizen öffnen nach erfolgreichem Speichern ein Mosaic-Popup unten rechts, sofern der Host `contexts.requestAssignment` unterstützt. Der Nutzer wählt/bestätigt dort einen Context, erstellt einen neuen oder lässt die Notiz ausdrücklich ohne Context. Mehrere offene Anfragen werden gestapelt und pro Nutzer gespeichert. Notizinhalte werden nicht an AI geschickt; nur EntityRef und Titel dienen der Anfrage. Bearbeitungen erzeugen keine erneute Anfrage. Ein fehlgeschlagener Popup-Aufruf macht das erfolgreiche Speichern nicht rückgängig.

Die bestehende App-ID bleibt `notes`; EntityRefs verwenden `{ appId: "notes", type: "note", id }`. App und Recent-Widget filtern über die optionale Mosaic Context API, Context-Chips erlauben explizite Mehrfachzuordnungen. All zeigt alle Notizen. Neue Notizen und Quick-Note-Widget-Eingaben werden niemals automatisch dem aktiven Context zugeordnet. CRUD schreibt weiterhin ausschließlich das vollständige app-eigene Notebook; der gefilterte Sichtbestand wird nicht als Ersatz gespeichert. Cloud, Flat und Pixel verwenden dieselben semantischen Tokens und App-Logik.

Context-Support ist ab Release 0.0.2 enthalten. Eine Notiz mit „Digant“ im Text wird erst nach expliziter Zuordnung im Context Digant sichtbar. Ein aktiver Context nourish zeigt diese Notiz nur, wenn sie auch nourish zugeordnet ist. Der Editor blendet gespeicherte Notizen außerhalb des Scopes aus; ungespeicherte Entwürfe bleiben mit einem Hinweis erhalten.
