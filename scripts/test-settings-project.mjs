import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { DEFAULT_SETTINGS } from "ba-memorylobby-wallpaper-runtime";

const root = path.resolve(import.meta.dirname, "..");
const project = JSON.parse(await readFile(path.join(root, "public", "project.json"), "utf8"));
const properties = project.general.properties;
const projectDefaults = {
  modelScale: properties.modelscale.value,
  modelX: properties.modelx.value,
  modelY: properties.modely.value,
  modelRotation: properties.modelrotation.value,
  positionPreset: properties.positionpreset.value,
  panelPositionPreset: properties.panelpositionpreset.value,
  panelScale: properties.panelscale.value,
  panelX: properties.panelx.value,
  panelY: properties.panely.value,
  interactionPreset: properties.interactionpreset.value,
  dialogueLanguagePreset: properties.dialoguelanguagepreset.value,
  muted: properties.muted.value,
  dialogueAutoPlay: properties.dialogueautoplay.value,
  subtitlesEnabled: properties.showsubtitles.value,
  primarySubtitleLocale: properties.subtitlelanguage.value,
  secondarySubtitlesEnabled: properties.showsecondarysubtitles.value,
  secondarySubtitleLocale: properties.secondarysubtitlelanguage.value,
  subtitleAlignment: properties.subtitlealignment.value,
  subtitlePosition: properties.subtitleposition.value,
  subtitleX: properties.subtitlex.value,
  subtitleY: properties.subtitley.value,
  debugPreset: properties.debugpreset.value,
  bgmVolume: properties.bgmvolume.value / 100,
  voiceVolume: properties.voicevolume.value / 100,
  qualityPreset: properties.qualitypreset.value,
  renderResolution: properties.renderresolution.value,
  modelResolution: properties.modelresolution.value,
  fpsLimit: properties.fpslimit.value,
};
const runtimeDefaults = Object.fromEntries(
  Object.keys(projectDefaults).map((key) => [key, DEFAULT_SETTINGS[key]]),
);

assert.deepEqual(projectDefaults, runtimeDefaults);
console.log("Validated Wallpaper Engine project defaults against runtime defaults.");
