import { createHash } from "node:crypto";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const dist = path.join(root, "dist");
const required = [
  "index.html",
  "project.json",
  "preview.gif",
  "OFFLINE-README.txt",
  "THIRD-PARTY-NOTICES.txt",
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
if (
  project.version !== 2 ||
  project.title !== "Blue Archive - Hare (Camping) [Offline Edition]" ||
  !project.description?.toLowerCase().includes("offline")
) {
  throw new Error("project.json does not identify the offline 1.0 edition");
}
if (project.preview !== "preview.gif") {
  throw new Error("Offline edition preview metadata is missing");
}
if (
  project.contentrating !== "Everyone" ||
  project.ratingsex !== "none" ||
  project.ratingviolence !== "none" ||
  project.visibility !== "private" ||
  !Array.isArray(project.tags) ||
  !project.tags.includes("Anime")
) {
  throw new Error("Offline edition rating, visibility, or tags are incomplete");
}
if (Object.hasOwn(project, "workshopid") || Object.hasOwn(project, "workshopurl")) {
  throw new Error("Local project.json must not contain Workshop identity fields");
}
if (project.general?.properties?.modelresolution?.value !== "2k") {
  throw new Error("Model texture default is missing");
}
const frozenDefaults = project.general?.properties;
if (
  frozenDefaults?.modelscale?.value !== 0.8 ||
  frozenDefaults?.modelx?.value !== 0 ||
  frozenDefaults?.modely?.value !== 0 ||
  frozenDefaults?.bgmvolume?.value !== 50 ||
  frozenDefaults?.voicevolume?.value !== 70 ||
  frozenDefaults?.fpslimit?.value !== 60 ||
  frozenDefaults?.qualitypreset?.value !== "default" ||
  frozenDefaults?.positionpreset?.value !== "default" ||
  frozenDefaults?.interactionpreset?.value !== "default" ||
  frozenDefaults?.muted?.value !== false ||
  frozenDefaults?.dialogueautoplay?.value !== false ||
  frozenDefaults?.dialoguelanguagepreset?.value !== "zh-cn" ||
  frozenDefaults?.showsubtitles?.value !== true ||
  frozenDefaults?.subtitlelanguage?.value !== "zh-cn" ||
  frozenDefaults?.showsecondarysubtitles?.value !== false ||
  frozenDefaults?.secondarysubtitlelanguage?.value !== "ja" ||
  frozenDefaults?.subtitlealignment?.value !== "center" ||
  frozenDefaults?.subtitleposition?.value !== "bottom-center" ||
  frozenDefaults?.subtitlex?.value !== 0 ||
  frozenDefaults?.subtitley?.value !== 0 ||
  frozenDefaults?.debugpreset?.value !== "off" ||
  frozenDefaults?.renderresolution?.value !== "1080p" ||
  frozenDefaults?.modelresolution?.value !== "2k" ||
  frozenDefaults?.schemecolor?.value !== "0.054902 0.305882 0.674510"
) {
  throw new Error("Current default settings do not match the approved values");
}
const expectedQualityPresets = [
  ["default", "Default (1080P / 2K / 60 FPS)"],
  ["2k", "2K (1440P / 4K / 60 FPS)"],
  ["4k", "4K (2160P / 4K / 60 FPS)"],
  ["maximum", "Maximum (2160P / 8K / 160 FPS)"],
  ["custom", "Custom"],
];
if (
  frozenDefaults.qualitypreset.type !== "combo" ||
  JSON.stringify(
    frozenDefaults.qualitypreset.options.map(({ value, label }) => [value, label]),
  ) !== JSON.stringify(expectedQualityPresets) ||
  frozenDefaults.renderresolution.condition !== "qualitypreset.value == 'custom'" ||
  frozenDefaults.modelresolution.condition !== "qualitypreset.value == 'custom'" ||
  frozenDefaults.fpslimit.condition !== "qualitypreset.value == 'custom'"
) {
  throw new Error("Quality preset schema or custom-property conditions are invalid");
}
const expectedPropertyOrder = [
  "qualitypreset",
  "schemecolor",
  "renderresolution",
  "modelresolution",
  "fpslimit",
  "positionpreset",
  "modelscale",
  "modelx",
  "modely",
  "interactionpreset",
  "introanimation",
  "interactions",
  "mousetracking",
  "headpatting",
  "voicelines",
  "muted",
  "bgmvolume",
  "voicevolume",
  "dialogueautoplay",
  "dialoguelanguagepreset",
  "voicelanguage",
  "showsubtitles",
  "subtitlelanguage",
  "showsecondarysubtitles",
  "secondarysubtitlelanguage",
  "subtitlealignment",
  "subtitleposition",
  "subtitlex",
  "subtitley",
  "debugpreset",
  "drawhitboxes",
  "debugpanelenabled",
  "panellanguage",
];
const actualPropertyOrder = Object.entries(frozenDefaults)
  .sort(([, left], [, right]) => left.order - right.order)
  .map(([key]) => key);
if (JSON.stringify(actualPropertyOrder) !== JSON.stringify(expectedPropertyOrder)) {
  throw new Error("Grouped property order does not match the approved layout");
}
if (
  frozenDefaults.muted.type !== "bool" ||
  frozenDefaults.dialogueautoplay.type !== "bool" ||
  Object.hasOwn(frozenDefaults, "bgmenabled")
) {
  throw new Error("Volume and dialogue playback group controls are invalid");
}
const expectedGroupOptions = {
  positionpreset: ["default", "custom"],
  interactionpreset: ["default", "custom"],
  dialoguelanguagepreset: ["zh-cn", "ja", "ko", "custom"],
  debugpreset: ["off", "panel", "all", "custom"],
  subtitlelanguage: ["zh-cn", "ja"],
  secondarysubtitlelanguage: ["zh-cn", "ja"],
  subtitlealignment: ["center", "left", "right"],
  subtitleposition: [
    "bottom-center",
    "top-center",
    "screen-center",
    "bottom-left",
    "custom",
  ],
};
for (const [key, values] of Object.entries(expectedGroupOptions)) {
  if (
    frozenDefaults[key].type !== "combo" ||
    JSON.stringify(frozenDefaults[key].options.map(({ value }) => value)) !==
      JSON.stringify(values)
  ) {
    throw new Error(`Invalid grouped property options: ${key}`);
  }
}
const expectedPropertyLabels = {
  qualitypreset: "Visual Quality",
  schemecolor: "Theme Color",
  renderresolution: "Render Resolution",
  modelresolution: "Model Texture Resolution",
  fpslimit: "FPS Limit",
  positionpreset: "Position & Scale",
  modelscale: "Model Scale",
  modelx: "Model X",
  modely: "Model Y",
  interactionpreset: "Animation & Interactions",
  introanimation: "Intro Animation",
  interactions: "Interactive Actions",
  mousetracking: "Mouse Tracking",
  headpatting: "Head Patting",
  voicelines: "Dialogue",
  muted: "Volume · Mute",
  bgmvolume: "BGM Volume",
  voicevolume: "Dialogue Volume",
  dialogueautoplay: "Dialogue Playback · Auto Play",
  dialoguelanguagepreset: "Dialogue Language",
  voicelanguage: "Voice Language",
  showsubtitles: "Show Subtitles",
  subtitlelanguage: "Primary Subtitle Language",
  showsecondarysubtitles: "Show Secondary Subtitles",
  secondarysubtitlelanguage: "Secondary Subtitle Language",
  subtitlealignment: "Subtitle Alignment",
  subtitleposition: "Subtitle Position",
  subtitlex: "Subtitle X",
  subtitley: "Subtitle Y",
  debugpreset: "Debug",
  drawhitboxes: "Show Interactive Areas",
  debugpanelenabled: "Enable Debug Panel",
  panellanguage: "Panel Language",
};
for (const [key, label] of Object.entries(expectedPropertyLabels)) {
  if (frozenDefaults[key].text !== label || /^\d/.test(frozenDefaults[key].text)) {
    throw new Error(`Invalid English property label: ${key}`);
  }
}
const expectedConditions = {
  modelscale: "positionpreset.value == 'custom'",
  modelx: "positionpreset.value == 'custom'",
  modely: "positionpreset.value == 'custom'",
  introanimation: "interactionpreset.value == 'custom'",
  interactions: "interactionpreset.value == 'custom'",
  mousetracking: "interactionpreset.value == 'custom' && interactions.value == true",
  headpatting: "interactionpreset.value == 'custom' && interactions.value == true",
  voicelines: "interactionpreset.value == 'custom' && interactions.value == true",
  bgmvolume: "muted.value == false",
  voicevolume:
    "muted.value == false && (interactionpreset.value == 'default' || (interactionpreset.value == 'custom' && interactions.value == true && voicelines.value == true))",
  dialogueautoplay:
    "interactionpreset.value == 'default' || (interactionpreset.value == 'custom' && interactions.value == true && voicelines.value == true)",
  dialoguelanguagepreset:
    "interactionpreset.value == 'default' || (interactionpreset.value == 'custom' && interactions.value == true && voicelines.value == true)",
  voicelanguage:
    "dialoguelanguagepreset.value == 'custom' && (interactionpreset.value == 'default' || (interactions.value == true && voicelines.value == true))",
  showsubtitles:
    "dialoguelanguagepreset.value == 'custom' && (interactionpreset.value == 'default' || (interactions.value == true && voicelines.value == true))",
  subtitlelanguage:
    "dialoguelanguagepreset.value == 'custom' && showsubtitles.value == true && (interactionpreset.value == 'default' || (interactions.value == true && voicelines.value == true))",
  showsecondarysubtitles:
    "dialoguelanguagepreset.value == 'custom' && showsubtitles.value == true && (interactionpreset.value == 'default' || (interactions.value == true && voicelines.value == true))",
  secondarysubtitlelanguage:
    "dialoguelanguagepreset.value == 'custom' && showsubtitles.value == true && showsecondarysubtitles.value == true && (interactionpreset.value == 'default' || (interactions.value == true && voicelines.value == true))",
  subtitlealignment:
    "dialoguelanguagepreset.value == 'custom' && (interactionpreset.value == 'default' || (interactions.value == true && voicelines.value == true))",
  subtitleposition:
    "dialoguelanguagepreset.value == 'custom' && (interactionpreset.value == 'default' || (interactions.value == true && voicelines.value == true))",
  subtitlex:
    "dialoguelanguagepreset.value == 'custom' && subtitleposition.value == 'custom' && (interactionpreset.value == 'default' || (interactions.value == true && voicelines.value == true))",
  subtitley:
    "dialoguelanguagepreset.value == 'custom' && subtitleposition.value == 'custom' && (interactionpreset.value == 'default' || (interactions.value == true && voicelines.value == true))",
  drawhitboxes: "debugpreset.value == 'custom'",
  debugpanelenabled: "debugpreset.value == 'custom'",
  panellanguage: "debugpreset.value == 'custom' && debugpanelenabled.value == true",
};
for (const [key, condition] of Object.entries(expectedConditions)) {
  if (frozenDefaults[key].condition !== condition) {
    throw new Error(`Invalid grouped property condition: ${key}`);
  }
}
if (
  frozenDefaults.fpslimit.min !== 15 ||
  frozenDefaults.fpslimit.max !== 160 ||
  frozenDefaults.fpslimit.step !== 1
) {
  throw new Error("FPS limit property range is invalid");
}
for (const key of ["subtitlex", "subtitley"]) {
  if (
    frozenDefaults[key].min !== -1000 ||
    frozenDefaults[key].max !== 1000 ||
    frozenDefaults[key].type !== "slider"
  ) {
    throw new Error(`Subtitle custom position range is invalid: ${key}`);
  }
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

function gifMetadata(bytes, relative) {
  const signature = bytes.subarray(0, 6).toString("ascii");
  if (signature !== "GIF87a" && signature !== "GIF89a") {
    throw new Error(`Invalid GIF file: ${relative}`);
  }

  const width = bytes.readUInt16LE(6);
  const height = bytes.readUInt16LE(8);
  const packed = bytes[10];
  let offset = 13 + ((packed & 0x80) ? 3 * (2 ** ((packed & 0x07) + 1)) : 0);
  let frames = 0;

  const skipSubBlocks = () => {
    while (offset < bytes.length) {
      const length = bytes[offset];
      offset += 1;
      if (length === 0) return;
      offset += length;
    }
    throw new Error(`Truncated GIF data: ${relative}`);
  };

  while (offset < bytes.length) {
    const marker = bytes[offset];
    offset += 1;
    if (marker === 0x3b) break;
    if (marker === 0x21) {
      offset += 1;
      skipSubBlocks();
      continue;
    }
    if (marker !== 0x2c || offset + 9 > bytes.length) {
      throw new Error(`Invalid GIF block: ${relative}`);
    }
    frames += 1;
    const imagePacked = bytes[offset + 8];
    offset += 9;
    if (imagePacked & 0x80) offset += 3 * (2 ** ((imagePacked & 0x07) + 1));
    offset += 1;
    skipSubBlocks();
  }

  return { width, height, frames };
}

const preview = await readFile(path.join(dist, "preview.gif"));
const previewMetadata = gifMetadata(preview, "preview.gif");
if (
  previewMetadata.width !== 256 ||
  previewMetadata.height !== 256 ||
  previewMetadata.frames < 2 ||
  preview.length > 500_000
) {
  throw new Error(
    `Preview must be an animated 256x256 GIF below 500 KB, got ` +
      `${previewMetadata.width}x${previewMetadata.height}, ${previewMetadata.frames} frames, ` +
      `and ${preview.length} bytes`,
  );
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

const [offlineReadme, thirdPartyNotices, builtHtml] = await Promise.all([
  readFile(path.join(dist, "OFFLINE-README.txt"), "utf8"),
  readFile(path.join(dist, "THIRD-PARTY-NOTICES.txt"), "utf8"),
  readFile(path.join(dist, "index.html"), "utf8"),
]);
const builtCssName = (await readdir(path.join(dist, "assets"))).find((name) =>
  name.endsWith(".css"),
);
if (!builtCssName) throw new Error("Built CSS bundle is missing");
const builtCss = await readFile(path.join(dist, "assets", builtCssName), "utf8");
if (!offlineReadme.includes("Version 1.0.0") || !offlineReadme.includes("MANIFEST.sha256")) {
  throw new Error("Offline installation and integrity instructions are incomplete");
}
if (
  !thirdPartyNotices.includes("Spine 3.8.99") ||
  !thirdPartyNotices.includes("Blue Archive assets") ||
  !thirdPartyNotices.includes("Real-CUGAN")
) {
  throw new Error("Third-party notices are incomplete");
}
if (/M3\s+LOCAL\s+TEST/i.test(builtHtml)) {
  throw new Error("Built HTML still contains M3 test labeling");
}
for (const marker of [
  "data-alignment=right",
  "data-position=top-center",
  "data-position=screen-center",
  "data-position=bottom-left",
  "data-position=custom",
  "--subtitle-x",
  "--subtitle-y",
]) {
  if (!builtCss.includes(marker)) {
    throw new Error(`Built subtitle layout CSS is missing: ${marker}`);
  }
}
const expectedDebugPanelLayout = [
  "debug-quality-preset",
  "debug-position-preset",
  "debug-interaction-preset",
  "debug-muted",
  "debug-bgm-volume-control",
  "debug-voice-volume-control",
  "debug-dialogue-autoplay",
  "debug-dialogue-language-preset",
  "debug-voice-language",
  "debug-subtitle-settings",
  "debug-primary-subtitle-language",
  "debug-show-secondary-subtitles",
  "debug-secondary-subtitle-language",
  "debug-subtitle-alignment",
  "debug-subtitle-position",
  "debug-subtitle-custom-position",
];
let previousDebugGroupIndex = -1;
for (const id of expectedDebugPanelLayout) {
  const index = builtHtml.indexOf(`id="${id}"`);
  if (index <= previousDebugGroupIndex) {
    throw new Error(`Debug panel property group is missing or out of order: ${id}`);
  }
  previousDebugGroupIndex = index;
}
if (
  builtHtml.includes('id="debug-debug-preset"') ||
  builtHtml.includes('id="debug-theme-color"') ||
  !builtHtml.includes('id="debug-hitboxes"')
) {
  throw new Error(
    "Debug panel must omit Theme Color and the WE Debug preset while retaining tools",
  );
}
if (
  !builtHtml.includes("要切换调试面板的可见性") ||
  !builtHtml.includes('data-panel-text="debugPanelVisibilityHint"')
) {
  throw new Error("Debug panel visibility hint is missing from the status area");
}
if (!builtHtml.includes('data-panel-text="subtitleSettings"')) {
  throw new Error("Debug panel subtitle subgroup title is missing");
}

console.log("Validated offline 1.0 dist: preview, metadata, notices, 2K/4K/8K model tiers, 30 voices, BGM, Runtime, and checksums.");
