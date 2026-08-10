import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const inputRoot = path.join(root, "local-assets", "original");
const output = path.join(root, "research", "checksums.sha256");
const verifyOnly = process.argv.includes("--verify");

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(fullPath)));
    else if (entry.isFile() && !entry.name.endsWith(".part")) files.push(fullPath);
  }
  return files;
}

async function sha256(file) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest("hex");
}

const files = (await walk(inputRoot)).sort((a, b) => a.localeCompare(b, "en"));
const lines = [];
for (const file of files) {
  const relative = path.relative(root, file).replaceAll("\\", "/");
  lines.push(`${await sha256(file)}  ${relative}`);
}

const content = `${lines.join("\n")}\n`;
if (verifyOnly) {
  const expected = await readFile(output, "utf8");
  if (content !== expected) {
    throw new Error(
      `Checksum verification failed. Regenerate ${path.relative(root, output)}.`,
    );
  }
  console.log(`Verified ${lines.length} SHA-256 entries.`);
} else {
  await writeFile(output, content, "utf8");
  console.log(`Wrote ${lines.length} SHA-256 entries to ${path.relative(root, output)}.`);
}
