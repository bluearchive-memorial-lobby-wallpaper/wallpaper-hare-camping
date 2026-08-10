import { createHash } from "node:crypto";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const dist = path.join(root, "dist");
const required = [
  "index.html",
  "project.json",
  "vendor/spine-webgl-3.8.js",
  "vendor/SPINE-RUNTIMES-LICENSE.txt",
  "assets/hare-camping/model/CH0233_home.skel",
  "assets/hare-camping/model/CH0233_home.atlas",
  "assets/hare-camping/model/CH0233_home.png",
  "assets/hare-camping/model/CH0233_home2.png",
  "assets/hare-camping/model/CH0233_home3.png",
  "assets/hare-camping/bgm/25 - Starry Confession.flac",
];

for (const tier of ["4k", "8k"]) {
  required.push(`assets/hare-camping/model-${tier}/CH0233_home.atlas`);
  for (const page of ["CH0233_home.png", "CH0233_home2.png", "CH0233_home3.png"]) {
    required.push(`assets/hare-camping/model-${tier}/${page}`);
  }
}

for (const locale of ["ja", "zh-cn", "ko"]) {
  for (let dialogue = 1; dialogue <= 5; dialogue += 1) {
    for (let segment = 1; segment <= 2; segment += 1) {
      required.push(
        `assets/hare-camping/audio/${locale}/ch0233_memoriallobby_${dialogue}_${segment}.ogg`,
      );
    }
  }
}

for (const relative of required) {
  const info = await stat(path.join(dist, relative));
  if (!info.isFile() || info.size === 0) throw new Error(`Invalid dist file: ${relative}`);
}

const project = JSON.parse(await readFile(path.join(dist, "project.json"), "utf8"));
if (project.type !== "web" || project.file !== "index.html") {
  throw new Error("project.json is not a web wallpaper with index.html entry");
}
if (project.version !== 2 || !project.title.includes("M3 Local Test")) {
  throw new Error("project.json does not identify the M3 local test build");
}
if (Object.hasOwn(project, "workshopid") || Object.hasOwn(project, "workshopurl")) {
  throw new Error("Local project.json must not contain Workshop identity fields");
}
if (project.general?.properties?.modelresolution?.value !== "4k") {
  throw new Error("Model texture default is missing");
}
if (project.general?.properties?.debugpanelenabled?.value !== false) {
  throw new Error("Debug panel must be disabled by default");
}
if (Object.hasOwn(project.general?.properties ?? {}, "debugoverlay")) {
  throw new Error("Legacy debug overlay property must not be present");
}
if (Object.hasOwn(project.general?.properties ?? {}, "eyereflection")) {
  throw new Error("Eye reflection correction must not be user-configurable");
}

function pngDimensions(bytes, relative) {
  if (bytes.subarray(1, 4).toString("ascii") !== "PNG") {
    throw new Error(`Invalid PNG file: ${relative}`);
  }
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

for (const [tier, scale] of [["model-4k", 2], ["model-8k", 4]]) {
  const atlasText = await readFile(
    path.join(dist, "assets", "hare-camping", tier, "CH0233_home.atlas"),
    "utf8",
  );
  if (!atlasText.includes(`size: ${2048 * scale}, ${2048 * scale}`)) {
    throw new Error(`Atlas page dimensions were not scaled for ${tier}`);
  }
  for (const [page, width, height] of [
    ["CH0233_home.png", 2048, 2048],
    ["CH0233_home2.png", 2048, 2048],
    ["CH0233_home3.png", 2048, 1024],
  ]) {
    const relative = `assets/hare-camping/${tier}/${page}`;
    const dimensions = pngDimensions(await readFile(path.join(dist, relative)), relative);
    if (dimensions.width !== width * scale || dimensions.height !== height * scale) {
      throw new Error(`Unexpected ${tier} dimensions for ${page}`);
    }
  }
}

const expectedSkeletonHash =
  "bc808f19378fad6d186cbab0a17de166307bb5388dcfeef6401ac60e141b6517";
const skeleton = await readFile(
  path.join(dist, "assets", "hare-camping", "model", "CH0233_home.skel"),
);
const skeletonHash = createHash("sha256").update(skeleton).digest("hex");
if (skeletonHash !== expectedSkeletonHash) throw new Error("Built skeleton hash changed");

const runtimeLicense = await readFile(
  path.join(dist, "vendor", "SPINE-RUNTIMES-LICENSE.txt"),
);
const runtimeLicenseHash = createHash("sha256").update(runtimeLicense).digest("hex");
if (runtimeLicenseHash !== "fafb07370e6a9dfd7e020263a9c3fe2f5672b60242c670d5a4d16cdc6ae8ebe0") {
  throw new Error("Built Spine Runtime license is not the pinned 2025-04-05 notice");
}

const bgm = await readFile(
  path.join(dist, "assets", "hare-camping", "bgm", "25 - Starry Confession.flac"),
);
if (bgm.subarray(0, 4).toString("ascii") !== "fLaC") {
  throw new Error("Built BGM is not a FLAC file");
}
const bgmHash = createHash("sha256").update(bgm).digest("hex");
if (bgmHash !== "bbe128aad2ba5a9ce7e596f214db638d42ae9194bc6d0b91e3923b7bb64bf2f8") {
  throw new Error("Built BGM hash changed");
}

for (const relative of required.filter((file) => file.endsWith(".ogg"))) {
  const bytes = await readFile(path.join(dist, relative));
  if (bytes.subarray(0, 4).toString("ascii") !== "OggS") {
    throw new Error(`Invalid OGG file: ${relative}`);
  }
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((entry) => {
        const fullPath = path.join(directory, entry.name);
        return entry.isDirectory() ? walk(fullPath) : [fullPath];
      }),
    )
  ).flat();
}

const textExtensions = new Set([".html", ".js", ".css", ".json"]);
for (const file of await walk(dist)) {
  if (!textExtensions.has(path.extname(file))) continue;
  const content = await readFile(file, "utf8");
  if (/https?:\/\//i.test(content)) {
    throw new Error(`Remote runtime dependency found in ${path.relative(dist, file)}`);
  }
}

console.log("Validated M3 dist: offline 2K/4K/8K model tiers, 30 voices, BGM, project identity, and checksums.");
