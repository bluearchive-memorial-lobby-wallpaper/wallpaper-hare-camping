import type { WallpaperSettings } from "../settings/WallpaperEngineAdapter";

const INTERACTION_SETTING_KEYS = [
  "introAnimation",
  "interactionsEnabled",
  "mouseTracking",
  "headPatting",
  "voiceEnabled",
] as const satisfies readonly (keyof WallpaperSettings)[];

export function didInteractionSettingsChange(
  previous: Readonly<WallpaperSettings>,
  current: Readonly<WallpaperSettings>,
) {
  return INTERACTION_SETTING_KEYS.some((key) => previous[key] !== current[key]);
}

export function canTriggerDialogue(settings: Readonly<WallpaperSettings>) {
  return settings.interactionsEnabled && settings.voiceEnabled;
}

export function didDialogueSettingChange(
  previous: Readonly<WallpaperSettings>,
  current: Readonly<WallpaperSettings>,
) {
  return previous.voiceEnabled !== current.voiceEnabled;
}
