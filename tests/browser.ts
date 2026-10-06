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
  const approvals = page.getByRole("complementary", {
    name: "Context-Zuordnungen",
  });
  const newNoteApproval = approvals
    .getByRole("article")
    .filter({ hasText: "Mosaic Ideen" });
  await expect(newNoteApproval).toContainText("Noch keinem Context zugeordnet");
  await page.reload();
  await expect(newNoteApproval).toBeVisible();
  await newNoteApproval.getByRole("button", { name: "Ohne Context" }).click();
  await expect(newNoteApproval).toHaveCount(0);
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
  await expect(
    approvals.getByRole("article").filter({ hasText: "Mit Inhalt" }),
  ).toBeVisible();
  await expect(
    approvals.getByRole("article").filter({ hasText: "Vom Widget" }),
  ).toBeVisible();
  await approvals.getByRole("button", { name: /Später/ }).click();
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
  for (const theme of ["cloud", "flat", "pixel"]) {
    await page
      .getByRole("button", { name: "Profil und Einstellungen" })
      .click();
    await page.getByLabel("Theme", { exact: true }).selectOption(theme);
    await page.getByRole("button", { name: "Fertig", exact: true }).click();
    await expect(page.locator(".mosaic")).toHaveAttribute("data-theme", theme);
    await expect(
      page.getByRole("button", { name: "Neue Notiz", exact: true }),
    ).toBeVisible();
    await page.screenshot({
      path: `test-results/${theme}-context-notes.png`,
      fullPage: true,
    });
  }
  await page
    .getByRole("combobox", { name: "Aktiver Context" })
    .selectOption("new");
  const contextDialog = page.getByRole("dialog", { name: "Neuer Context" });
  await contextDialog.getByLabel("Name", { exact: true }).fill("Research");
  await contextDialog
    .getByRole("button", { name: "Erstellen", exact: true })
    .click();
  await expect(contextDialog).toHaveCount(0);
  const row = page
    .getByRole("listitem")
    .filter({ has: page.getByRole("button", { name: /Mit Inhalt/ }) });
  await row.getByRole("button", { name: "Contexts zuordnen" }).click();
  const attached = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/contexts") &&
      response.request().method() === "POST" &&
      response.request().postDataJSON()?.action === "attach",
  );
  await row.getByRole("checkbox", { name: "Research", exact: true }).click();
  expect((await attached).ok()).toBe(true);
  await page
    .getByRole("combobox", { name: "Aktiver Context" })
    .selectOption({ label: "Research" });
  await expect(page.getByRole("button", { name: /Mit Inhalt/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Mosaic Ideen/ })).toHaveCount(
    0,
  );
  await page
    .getByRole("combobox", { name: "Aktiver Context" })
    .selectOption("");
  await expect(
    page.getByRole("button", { name: /Mosaic Ideen/ }),
  ).toBeVisible();
  for (const name of ["Digant", "nourish"]) {
    await page
      .getByRole("combobox", { name: "Aktiver Context" })
      .selectOption("new");
    const dialog = page.getByRole("dialog", { name: "Neuer Context" });
    await dialog.getByLabel("Name", { exact: true }).fill(name);
    await dialog
      .getByRole("button", { name: "Erstellen", exact: true })
      .click();
    await expect(dialog).toHaveCount(0);
  }
  await page.getByRole("button", { name: "Neue Notiz", exact: true }).click();
  await page.getByLabel("Titel", { exact: true }).fill("Digant Besprechung");
  await page
    .getByLabel("Inhalt", { exact: true })
    .fill("Morgen wegen digant 8.0.1 besprechung mit achim");
  await page.getByRole("button", { name: "Speichern", exact: true }).click();
  await expect(page.getByText("Gespeichert.", { exact: true })).toBeVisible();
  const switcher = page.getByRole("combobox", { name: "Aktiver Context" });
  await switcher.selectOption({ label: "Digant" });
  await expect(
    page.getByRole("button", { name: /Digant Besprechung/ }),
  ).toHaveCount(0);
  await expect(page.getByLabel("Inhalt", { exact: true })).toHaveCount(0);
  await switcher.selectOption("");
  await expect(
    page.getByRole("button", { name: /Digant Besprechung/ }),
  ).toBeVisible();
  const digantRow = page
    .getByRole("listitem")
    .filter({ has: page.getByRole("button", { name: /Digant Besprechung/ }) });
  await digantRow.getByRole("button", { name: "Contexts zuordnen" }).click();
  await digantRow
    .getByRole("checkbox", { name: "Digant", exact: true })
    .click();
  await expect(
    digantRow.getByRole("checkbox", { name: "Digant", exact: true }),
  ).toBeChecked();
  await switcher.selectOption({ label: "Digant" });
  await expect(
    page.getByRole("button", { name: /Digant Besprechung/ }),
  ).toBeVisible();
  await switcher.selectOption({ label: "nourish" });
  await expect(
    page.getByRole("button", { name: /Digant Besprechung/ }),
  ).toHaveCount(0);
  await expect(page.getByLabel("Inhalt", { exact: true })).toHaveCount(0);
  await switcher.selectOption({ label: "Digant" });
  await page
    .getByLabel("Inhalt", { exact: true })
    .fill("Ungespeicherter Digant-Entwurf");
  await switcher.selectOption({ label: "nourish" });
  await expect(
    page.getByText(
      "Dieser ungespeicherte Entwurf liegt außerhalb des aktiven Contexts.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(page.getByLabel("Inhalt", { exact: true })).toHaveValue(
    "Ungespeicherter Digant-Entwurf",
  );
  await switcher.selectOption("");
  await page.getByRole("button", { name: "Speichern", exact: true }).click();
  await expect(page.getByText("Gespeichert.", { exact: true })).toBeVisible();
  await switcher.selectOption({ label: "nourish" });
  await expect(page.getByLabel("Inhalt", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Dashboard", exact: true }).click();
  await expect(
    page
      .getByRole("article", { name: "Letzte Notizen", exact: true })
      .getByRole("button", { name: /Digant Besprechung/ }),
  ).toHaveCount(0);
  await switcher.selectOption("");
  await expect(
    page
      .getByRole("article", { name: "Letzte Notizen", exact: true })
      .getByRole("button", { name: /Digant Besprechung/ }),
  ).toBeVisible();
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
