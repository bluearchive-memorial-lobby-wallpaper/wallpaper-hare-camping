import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const manifestDir = path.join(root, "local-assets", "original", "manifests");
const studentPath = path.join(manifestDir, "student-340.json");
const musicPath = path.join(manifestDir, "music-252.json");

const student = JSON.parse(await readFile(studentPath, "utf8")).data;
const music = JSON.parse(await readFile(musicPath, "utf8")).data;

const voiceGroups = [
  ["voice", "ja"],
  ["voice_cn", "zh-cn"],
  ["voice_kr", "ko"],
];

const downloads = [];
for (const [field, locale] of voiceGroups) {
  const rows = student[field].filter((entry) =>
    /memoriallobby/i.test(entry.description),
  );
  if (rows.length !== 10) {
    throw new Error(`Expected 10 ${field} MemorialLobby entries, got ${rows.length}`);
  }

  for (const entry of rows) {
    const logicalName = `${entry.description.toLowerCase()}.ogg`;
    downloads.push({
      kind: "voice",
      locale,
      id: entry.description.toLowerCase(),
      url: entry.file,
      output: path.join(
        root,
        "local-assets",
        "original",
        "audio",
        locale,
        logicalName,
      ),
    });
  }
}

downloads.push({
  kind: "bgm",
  locale: null,
  id: music.original_file_name,
  url: music.file,
  output: path.join(
    root,
    "local-assets",
    "original",
    "bgm",
    `${music.original_file_name}.ogg`,
  ),
});

async function fetchWithRetry(item, attempts = 3) {
  await mkdir(path.dirname(item.output), { recursive: true });
  const temporary = `${item.output}.part`;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45_000);
    try {
      const response = await fetch(item.url, {
        signal: controller.signal,
        headers: { "user-agent": "hare-camping-m0-research/1.0" },
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }

      const bytes = Buffer.from(await response.arrayBuffer());
      if (bytes.length < 4 || bytes.subarray(0, 4).toString("ascii") !== "OggS") {
        throw new Error(`Response is not an Ogg stream (${bytes.length} bytes)`);
      }

      await writeFile(temporary, bytes);
      await rm(item.output, { force: true });
      await rename(temporary, item.output);
      return bytes.length;
    } catch (error) {
      await rm(temporary, { force: true });
      if (attempt === attempts) throw error;
      await new Promise((resolve) => setTimeout(resolve, attempt * 1_000));
    } finally {
      clearTimeout(timeout);
    }
  }
}

const result = [];
for (const [index, item] of downloads.entries()) {
  const bytes = await fetchWithRetry(item);
  const relativeOutput = path.relative(root, item.output).replaceAll("\\", "/");
  result.push({ ...item, output: relativeOutput, bytes });
  console.log(`[${index + 1}/${downloads.length}] ${relativeOutput} (${bytes} bytes)`);
}

await writeFile(
  path.join(manifestDir, "m0-audio-downloads.json"),
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      studentId: student.id,
      musicId: music.id,
      downloads: result,
    },
    null,
    2,
  )}\n`,
  "utf8",
);

console.log(`Downloaded and validated ${result.length} Ogg files.`);
