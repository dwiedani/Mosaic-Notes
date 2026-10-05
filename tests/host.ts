// Test-only host fixture: platform internals are never imported by app entrypoints.
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  createServer,
  MosaicDatabase,
  AppInstaller,
} from "../../Mosaic/packages/core/src/server/index";
async function main() {
  const root = await mkdtemp(join(tmpdir(), "notes-host-"));
  const source = process.cwd();
  const db = new MosaicDatabase(join(root, "mosaic.sqlite"));
  const checksums = JSON.parse(
    await readFile(join(source, "release/checksums.json"), "utf8"),
  );
  await new AppInstaller(db, join(root, "installed")).install({
    repo: "https://github.com/dwiedani/Mosaic-Notes",
    tag: "v1.0.0",
    commitSha: "0".repeat(40),
    asset: "local-validation:mosaic-app.zip",
    checksum: checksums["mosaic-app.zip"],
    bytes: new Uint8Array(
      await readFile(join(source, "release/mosaic-app.zip")),
    ),
  });
  const app = createServer({
    db,
    installedRoot: join(root, "installed"),
    distRoot: join(source, "../Mosaic/apps/web/dist"),
    adminPassword: "notes-test",
    userPassword: "notes-user",
  });
  const server = app.listen(4312, "127.0.0.1", () =>
    console.info("Notes host ready"),
  );
  const stop = () =>
    server.close(() => {
      db.close();
      void rm(root, { recursive: true, force: true }).then(() =>
        process.exit(0),
      );
    });
  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);
}
main().catch((error) => {
  console.error(error);
  process.exit(1);
});
