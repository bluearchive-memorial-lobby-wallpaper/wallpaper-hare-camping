import type { WallpaperSettings } from "./WallpaperEngineAdapter";

export interface PropertyGroupVisibility {
  qualityCustom: boolean;
  positionCustom: boolean;
  interactionCustom: boolean;
  interactionChildren: boolean;
  dialogueControls: boolean;
  voiceVolume: boolean;
  dialogueCustom: boolean;
  primarySubtitleLanguage: boolean;
  secondarySubtitles: boolean;
  secondarySubtitleLanguage: boolean;
  subtitleCustomPosition: boolean;
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
    primarySubtitleLanguage: dialogueCustom && settings.subtitlesEnabled,
    secondarySubtitles: dialogueCustom && settings.subtitlesEnabled,
    secondarySubtitleLanguage:
      dialogueCustom &&
      settings.subtitlesEnabled &&
      settings.secondarySubtitlesEnabled,
    subtitleCustomPosition:
      dialogueCustom && settings.subtitlePosition === "custom",
    bgmVolume: !settings.muted,
  };
}
