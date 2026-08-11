import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const original = path.join(root, "local-assets", "original");
const publicAssets = path.join(root, "public", "assets", "hare-camping");
const generatedAssets = path.join(root, "generated-assets");
const checksumsText = await readFile(path.join(root, "research", "checksums.sha256"), "utf8");
const checksums = new Map(
  checksumsText
    .trim()
    .split(/\r?\n/)
    .map((line) => {
      const match = /^([a-f0-9]{64})\s{2}(.+)$/.exec(line);
      if (!match) throw new Error(`Invalid checksum line: ${line}`);
      return [match[2].replaceAll("/", path.sep), match[1]];
    }),
);

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

const bgmPath = path.join(
  publicAssets,
  "bgm",
  "25 - Starry Confession.flac",
);
const bgmBytes = await readFile(bgmPath);
if (bgmBytes.subarray(0, 4).toString("ascii") !== "fLaC") {
  throw new Error(`Invalid FLAC file: ${bgmPath}`);
}
if (sha256(bgmBytes) !== "bbe128aad2ba5a9ce7e596f214db638d42ae9194bc6d0b91e3923b7bb64bf2f8") {
  throw new Error(`BGM hash changed: ${bgmPath}`);
}

async function copyVerified(relativeSource, target) {
  const checksumKey = path.join("local-assets", "original", relativeSource);
  const expectedHash = checksums.get(checksumKey);
  if (!expectedHash) throw new Error(`No pinned checksum for ${checksumKey}`);
  const source = path.join(original, relativeSource);
  const bytes = await readFile(source);
  const actualHash = sha256(bytes);
  if (actualHash !== expectedHash) {
    throw new Error(`${relativeSource} failed SHA-256 verification: ${actualHash}`);
  }
  await mkdir(path.dirname(target), { recursive: true });
  await copyFile(source, target);
}

function pngDimensions(bytes, source) {
  if (bytes.subarray(1, 4).toString("ascii") !== "PNG") {
    throw new Error(`Invalid PNG file: ${source}`);
  }
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
    colorType: bytes[25],
  };
}

async function copyUpscaledModelPage(tier, scale, file) {
  const source = path.join(generatedAssets, `model-${tier}`, file);
  const [sourceBytes, originalBytes] = await Promise.all([
    readFile(source),
    readFile(path.join(original, "model", file)),
  ]);
  const dimensions = pngDimensions(sourceBytes, source);
  const originalDimensions = pngDimensions(originalBytes, file);
  if (
    dimensions.width !== originalDimensions.width * scale ||
    dimensions.height !== originalDimensions.height * scale ||
    dimensions.colorType !== 6
  ) {
    throw new Error(
      `${source} is not a ${scale}x RGBA upscale of ${file}: ` +
        `${dimensions.width}x${dimensions.height}, color type ${dimensions.colorType}`,
    );
  }
  const target = path.join(publicAssets, `model-${tier}`, file);
  await mkdir(path.dirname(target), { recursive: true });
  await copyFile(source, target);
}

async function writeScaledAtlas(tier, scale) {
  const relativeSource = path.join("model", "CH0233_home.atlas");
  const checksumKey = path.join("local-assets", "original", relativeSource);
  const expectedHash = checksums.get(checksumKey);
  const source = path.join(original, relativeSource);
  const bytes = await readFile(source);
  if (!expectedHash || sha256(bytes) !== expectedHash) {
    throw new Error(`${relativeSource} failed SHA-256 verification`);
  }
  const scaled = bytes.toString("utf8").replace(
    /^(\s*)(size|xy|orig|offset):\s*(\d+),\s*(\d+)\s*$/gm,
    (_, indent, key, first, second) =>
      `${indent}${key}: ${Number(first) * scale}, ${Number(second) * scale}`,
  );
  const target = path.join(publicAssets, `model-${tier}`, "CH0233_home.atlas");
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, scaled, "utf8");
}

for (const file of [
  "CH0233_home.skel",
  "CH0233_home.atlas",
  "CH0233_home.png",
  "CH0233_home2.png",
  "CH0233_home3.png",
]) {
  await copyVerified(path.join("model", file), path.join(publicAssets, "model", file));
}

for (const [tier, scale] of [["4k", 2], ["8k", 4]]) {
  await writeScaledAtlas(tier, scale);
  for (const file of ["CH0233_home.png", "CH0233_home2.png", "CH0233_home3.png"]) {
    await copyUpscaledModelPage(tier, scale, file);
  }
}

for (const locale of ["ja", "zh-cn", "ko"]) {
  for (let dialogue = 1; dialogue <= 5; dialogue += 1) {
    for (let segment = 1; segment <= 2; segment += 1) {
      const file = `ch0233_memoriallobby_${dialogue}_${segment}.ogg`;
      await copyVerified(
        path.join("audio", locale, file),
        path.join(publicAssets, "audio", locale, file),
      );
    }
  }
}

const runtimeFiles = [
  {
    source: path.join(
      root,
      ".cache",
      "spine-runtimes-3.8",
      "spine-ts",
      "build",
      "spine-webgl.js",
    ),
    target: path.join(root, "public", "vendor", "spine-webgl-3.8.js"),
    hash: "9fc89c70c1fbac1afc70161372b334070d98dd84bfd3254c3fe6c7668c015bc4",
  },
  {
    // The pinned 3.8 commit carries the superseded 2019 notice. Distribute the
    // current official notice from a tracked source so builds cannot regress it.
    source: path.join(root, "licenses", "SPINE-RUNTIMES-LICENSE.txt"),
    target: path.join(root, "public", "vendor", "SPINE-RUNTIMES-LICENSE.txt"),
    hash: "fafb07370e6a9dfd7e020263a9c3fe2f5672b60242c670d5a4d16cdc6ae8ebe0",
  },
];

for (const runtime of runtimeFiles) {
  const bytes = await readFile(runtime.source);
  if (sha256(bytes) !== runtime.hash) throw new Error(`Runtime hash changed: ${runtime.source}`);
  await mkdir(path.dirname(runtime.target), { recursive: true });
  await copyFile(runtime.source, runtime.target);
}

console.log("Prepared verified offline 1.0 model tiers, voice, BGM, and Spine 3.8 runtime assets.");
