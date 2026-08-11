import type { WallpaperSettings } from "./WallpaperEngineAdapter";

export interface PropertyGroupVisibility {
  qualityCustom: boolean;
  positionCustom: boolean;
  interactionCustom: boolean;
  interactionChildren: boolean;
  dialogueControls: boolean;
  voiceVolume: boolean;
  dialogueCustom: boolean;
  subtitleLanguage: boolean;
  bgmVolume: boolean;
}

export function resolvePropertyGroupVisibility(
  settings: Readonly<WallpaperSettings>,
): PropertyGroupVisibility {
  const dialogueControls =
    settings.interactionPreset === "default" ||
    (settings.interactionsEnabled && settings.voiceEnabled);
  const dialogueCustom =
    dialogueControls && settings.dialogueLanguagePreset === "custom";

  return {
    qualityCustom: settings.qualityPreset === "custom",
    positionCustom: settings.positionPreset === "custom",
    interactionCustom: settings.interactionPreset === "custom",
    interactionChildren:
      settings.interactionPreset === "custom" && settings.interactionsEnabled,
    dialogueControls,
    voiceVolume: !settings.muted && dialogueControls,
    dialogueCustom,
    subtitleLanguage: dialogueCustom && settings.subtitlesEnabled,
    bgmVolume: !settings.muted,
  };
}
