// Package the verified dist into the identity-contract archive name using
// the real packaging time. Never fake the timestamp: the archive records
// when it was actually built.
import { createOfflinePackage } from "ba-memorial-lobby-wallpaper-toolkit";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const SLUG = "hare-camping"; // identity contract publicSlug; keep in sync
const pkg = JSON.parse(await readFile(resolve("package.json"), "utf8"));
const archivePath = resolve(`release/blue-archive-${SLUG}-wallpaper-v${pkg.version}.zip`);
const result = await createOfflinePackage({
  inputDirectory: "dist",
  archivePath,
  fixedTimestamp: new Date(),
});
console.log(`Created and verified ${result.archivePath} (${result.size} bytes).`);
console.log(`SHA-256: ${result.sha256}`);
