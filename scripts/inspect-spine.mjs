import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";

const root = path.resolve(import.meta.dirname, "..");
const modelDir = path.join(root, "local-assets", "original", "model");
const skelPath = path.join(modelDir, "CH0233_home.skel");
const atlasPath = path.join(modelDir, "CH0233_home.atlas");
const runtimePath = path.join(
  root,
  ".cache",
  "spine-runtimes-3.8",
  "spine-ts",
  "build",
  "spine-webgl.js",
);
const outputPath = path.join(root, "research", "spine-inspection.json");

function pngDimensions(bytes) {
  if (bytes.subarray(1, 4).toString("ascii") !== "PNG") {
    throw new Error("Not a PNG file");
  }
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

function readVarint(bytes, state) {
  let result = 0;
  let shift = 0;
  let value;
  do {
    value = bytes[state.offset++];
    result |= (value & 0x7f) << shift;
    shift += 7;
  } while (value & 0x80);
  return result >>> 0;
}

function readHeaderString(bytes, state) {
  const byteCount = readVarint(bytes, state);
  if (byteCount === 0) return null;
  if (byteCount === 1) return "";
  const value = bytes.subarray(state.offset, state.offset + byteCount - 1);
  state.offset += byteCount - 1;
  return value.toString("utf8");
}

const [runtimeSource, skel, atlasText] = await Promise.all([
  readFile(runtimePath, "utf8"),
  readFile(skelPath),
  readFile(atlasPath, "utf8"),
]);

const state = { offset: 0 };
const binaryHeader = {
  hash: readHeaderString(skel, state),
  version: readHeaderString(skel, state),
};

const context = vm.createContext({ console });
vm.runInContext(runtimeSource, context, { filename: runtimePath });
const spine = context.spine;
if (!spine?.SkeletonBinary || !spine?.TextureAtlas) {
  throw new Error("The pinned Spine 3.8 WebGL runtime did not load correctly");
}

const pngs = {};
for (const pageName of [
  "CH0233_home.png",
  "CH0233_home2.png",
  "CH0233_home3.png",
]) {
  pngs[pageName] = pngDimensions(await readFile(path.join(modelDir, pageName)));
}

const atlas = new spine.TextureAtlas(atlasText, (pageName) => {
  const dimensions = pngs[pageName];
  if (!dimensions) throw new Error(`Atlas references an unknown page: ${pageName}`);
  return new spine.FakeTexture(dimensions);
});
const attachmentLoader = new spine.AtlasAttachmentLoader(atlas);
const binary = new spine.SkeletonBinary(attachmentLoader);
const data = binary.readSkeletonData(new Uint8Array(skel));

const animationReports = data.animations.map((animation) => {
  const events = [];
  const timelineTypes = {};
  const timelineTargets = [];
  for (const timeline of animation.timelines) {
    const type = timeline.constructor.name;
    timelineTypes[type] = (timelineTypes[type] ?? 0) + 1;
    if (Number.isInteger(timeline.boneIndex)) {
      timelineTargets.push({ type, targetType: "bone", target: data.bones[timeline.boneIndex].name });
    } else if (Number.isInteger(timeline.slotIndex)) {
      timelineTargets.push({ type, targetType: "slot", target: data.slots[timeline.slotIndex].name });
    }
    if (timeline instanceof spine.EventTimeline) {
      for (const event of timeline.events) {
        events.push({
          time: event.time,
          name: event.data.name,
          intValue: event.intValue,
          floatValue: event.floatValue,
          stringValue: event.stringValue,
          volume: event.volume,
          balance: event.balance,
        });
      }
    }
  }
  return {
    name: animation.name,
    duration: animation.duration,
    timelineCount: animation.timelines.length,
    timelineTypes,
    timelineTargets,
    events,
  };
});

const candidatePattern = /touch|eye|head|face|look|pat|track|mouse/i;
const report = {
  generatedAt: new Date().toISOString(),
  source: {
    skeleton: "local-assets/original/model/CH0233_home.skel",
    atlas: "local-assets/original/model/CH0233_home.atlas",
    runtimeRepository: "https://github.com/EsotericSoftware/spine-runtimes",
    runtimeBranch: "3.8",
    runtimeCommit: "8b4844bd4b193ba9e54487ed397a777993cbad56",
  },
  binaryHeader,
  skeleton: {
    hash: data.hash,
    version: data.version,
    x: data.x,
    y: data.y,
    width: data.width,
    height: data.height,
    fps: data.fps,
    imagesPath: data.imagesPath,
    audioPath: data.audioPath,
  },
  counts: {
    bones: data.bones.length,
    slots: data.slots.length,
    skins: data.skins.length,
    events: data.events.length,
    animations: data.animations.length,
    atlasPages: atlas.pages.length,
    atlasRegions: atlas.regions.length,
  },
  atlasPages: atlas.pages.map((page) => ({
    name: page.name,
    width: page.width,
    height: page.height,
  })),
  bones: data.bones.map((bone) => ({
    name: bone.name,
    parent: bone.parent?.name ?? null,
    x: bone.x,
    y: bone.y,
    rotation: bone.rotation,
    scaleX: bone.scaleX,
    scaleY: bone.scaleY,
  })),
  slots: data.slots.map((slot) => ({
    name: slot.name,
    bone: slot.boneData.name,
    attachmentName: slot.attachmentName,
    blendMode: slot.blendMode,
  })),
  skins: data.skins.map((skin) => skin.name),
  eventDefinitions: data.events.map((event) => ({
    name: event.name,
    intValue: event.intValue,
    floatValue: event.floatValue,
    stringValue: event.stringValue,
    audioPath: event.audioPath,
    volume: event.volume,
    balance: event.balance,
  })),
  animations: animationReports,
  interactionCandidates: {
    bones: data.bones.map((bone) => bone.name).filter((name) => candidatePattern.test(name)),
    slots: data.slots.map((slot) => slot.name).filter((name) => candidatePattern.test(name)),
    animations: data.animations
      .map((animation) => animation.name)
      .filter((name) => candidatePattern.test(name)),
  },
};

await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(
  JSON.stringify(
    {
      binaryHeader: report.binaryHeader,
      skeleton: report.skeleton,
      counts: report.counts,
      interactionCandidates: report.interactionCandidates,
      animations: report.animations.map(({ name, duration, events }) => ({
        name,
        duration,
        events,
      })),
    },
    null,
    2,
  ),
);
