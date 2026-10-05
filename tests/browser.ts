import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import { resolve } from "node:path";
const platformRequire = createRequire(resolve("../Mosaic/package.json"));
const { chromium, expect } = platformRequire("@playwright/test");
const host = spawn(
  process.execPath,
  [platformRequire.resolve("tsx/cli"), resolve("tests/host.ts")],
  { stdio: ["ignore", "pipe", "inherit"] },
);
await new Promise<void>((done, reject) => {
  host.stdout.on("data", (data) => {
    if (String(data).includes("Notes host ready")) done();
  });
  host.once("exit", (code) => reject(new Error(`Host exited: ${code}`)));
});
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.setDefaultTimeout(10000);
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
try {
  await page.goto("http://127.0.0.1:4312");
  await page.getByLabel("Passwort").fill("notes-test");
  await page.getByRole("button", { name: "Anmelden", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Widget hinzufügen", exact: true }),
  ).toBeVisible();
  await page.goto("http://127.0.0.1:4312/apps/notes/");
  await expect(
    page.getByRole("button", { name: "Neue Notiz", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Neue Notiz", exact: true }).click();
  await page.getByLabel("Titel", { exact: true }).fill("Mosaic Ideen");
  await page
    .getByLabel("Inhalt", { exact: true })
    .fill("Notizen für unser Dashboard.\nEine zweite Zeile.");
  await page.getByLabel("Notiz anheften", { exact: true }).check();
  await page.getByRole("button", { name: "Speichern", exact: true }).click();
  await expect(page.getByText("Gespeichert.", { exact: true })).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", { name: /Mosaic Ideen/ }),
  ).toBeVisible();
  await page.getByLabel("Notizen durchsuchen").fill("dashboard");
  await expect(
    page.getByRole("button", { name: /Mosaic Ideen/ }),
  ).toBeVisible();
  await page.getByLabel("Notizen durchsuchen").fill("unpassend");
  await expect(
    page.getByText("Keine passenden Notizen", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Notizen durchsuchen").fill("");
  await page.getByRole("button", { name: /Mosaic Ideen/ }).click();
  await page.screenshot({
    path: "test-results/cloud-notes.png",
    fullPage: true,
  });
  await page.getByLabel("Inhalt", { exact: true }).fill("Bearbeiteter Text");
  await page.getByRole("button", { name: "Speichern", exact: true }).click();
  await expect(page.getByText("Gespeichert.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Profil und Einstellungen" }).click();
  await page.getByLabel("Theme", { exact: true }).selectOption("pixel");
  await page.getByRole("button", { name: "Fertig", exact: true }).click();
  await expect(page.getByLabel("Inhalt", { exact: true })).toHaveValue(
    "Bearbeiteter Text",
  );
  await page.screenshot({
    path: "test-results/pixel-notes.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "test-results/mobile-notes.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole("button", { name: "Löschen", exact: true }).click();
  await page.getByRole("button", { name: "Abbrechen", exact: true }).click();
  await expect(page.getByLabel("Titel", { exact: true })).toHaveValue(
    "Mosaic Ideen",
  );
  await page.getByRole("link", { name: "Mosaic", exact: true }).click();
  for (const name of ["Letzte Notizen", "Schnelle Notiz", "Schnelle Notiz"]) {
    await page
      .getByRole("button", { name: "Widget hinzufügen", exact: true })
      .click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: new RegExp(name) })
      .click();
  }
  const quick = page.getByRole("article", {
    name: "Schnelle Notiz",
    exact: true,
  });
  await expect(quick).toHaveCount(2);
  await quick.nth(0).getByLabel("Titel", { exact: true }).fill("Vom Widget");
  await quick
    .nth(0)
    .getByRole("button", { name: "Notiz speichern", exact: true })
    .click();
  await expect(
    quick.nth(0).getByText("Notiz gespeichert.", { exact: true }),
  ).toBeVisible();
  await expect(quick.nth(1).getByLabel("Titel", { exact: true })).toHaveValue(
    "",
  );
  const recent = page.getByRole("article", {
    name: "Letzte Notizen",
    exact: true,
  });
  await expect(
    recent.getByRole("button", { name: /Vom Widget/ }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Dashboard bearbeiten", exact: true })
    .click();
  await recent
    .getByRole("button", {
      name: "Einstellungen für Letzte Notizen",
      exact: true,
    })
    .click();
  await page.getByLabel("Größe").selectOption("large");
  await page.getByLabel("Anzahl der Notizen", { exact: true }).fill("8");
  await page.getByLabel("Nur angeheftete Notizen", { exact: true }).check();
  await page.getByRole("button", { name: "Speichern", exact: true }).click();
  await page
    .getByRole("button", { name: "Bearbeitung beenden", exact: true })
    .click();
  await expect(recent.getByRole("button", { name: /Vom Widget/ })).toHaveCount(
    0,
  );
  await expect(
    recent.getByRole("button", { name: /Mosaic Ideen/ }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Dashboard bearbeiten", exact: true })
    .click();
  await recent
    .getByRole("button", {
      name: "Einstellungen für Letzte Notizen",
      exact: true,
    })
    .click();
  await page.getByLabel("Nur angeheftete Notizen", { exact: true }).uncheck();
  await page.getByRole("button", { name: "Speichern", exact: true }).click();
  await quick
    .nth(0)
    .getByRole("button", {
      name: "Einstellungen für Schnelle Notiz",
      exact: true,
    })
    .click();
  await page.getByLabel("Größe").selectOption("large");
  await page.getByRole("button", { name: "Speichern", exact: true }).click();
  await page
    .getByRole("button", { name: "Bearbeitung beenden", exact: true })
    .click();
  await quick.nth(0).getByLabel("Titel", { exact: true }).fill("Mit Inhalt");
  await quick
    .nth(0)
    .getByLabel("Inhalt", { exact: true })
    .fill("Geteilte Daten");
  await quick
    .nth(0)
    .getByRole("button", { name: "Notiz speichern", exact: true })
    .click();
  await expect(
    recent.getByRole("button", { name: /Mit Inhalt/ }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/pixel-widgets.png",
    fullPage: true,
  });
  await recent.getByRole("button", { name: /Vom Widget/ }).click();
  await expect(page.getByLabel("Titel", { exact: true })).toHaveValue(
    "Vom Widget",
  );
  await page.reload();
  await expect(page.getByLabel("Titel", { exact: true })).toHaveValue(
    "Vom Widget",
  );
  await page.getByRole("button", { name: "Löschen", exact: true }).click();
  await page
    .getByRole("button", { name: "Endgültig löschen", exact: true })
    .click();
  await expect(
    page.getByText("Notiz gelöscht.", { exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
  console.log(
    "PASS: CRUD, search, pinning, reload, deep links, themes, mobile, two independent quick widgets, shared query invalidation, no browser errors.",
  );
} catch (error) {
  await page.screenshot({ path: "test-results/failure.png", fullPage: true });
  console.error(await page.locator("body").ariaSnapshot());
  throw error;
} finally {
  await browser.close();
  host.kill("SIGTERM");
}
