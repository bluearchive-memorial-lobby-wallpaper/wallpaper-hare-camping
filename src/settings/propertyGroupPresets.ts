import type { SubtitleLocale, VoiceLocale } from "../config";
import type { PanelLocale } from "../i18n/panel";
import type {
  SubtitleAlignment,
  SubtitlePosition,
} from "../dialogue/subtitleLayout";

export type PositionPreset = "default" | "custom";
export type InteractionPreset = "default" | "custom";
export type DialogueLanguagePreset = "zh-cn" | "ja" | "ko" | "custom";
export type DebugPreset = "off" | "panel" | "all" | "custom";

export interface PositionPresetSettings {
  modelScale: number;
  modelX: number;
  modelY: number;
}

export interface InteractionPresetSettings {
  introAnimation: boolean;
  interactionsEnabled: boolean;
  mouseTracking: boolean;
  headPatting: boolean;
  voiceEnabled: boolean;
}

export interface DialogueLanguagePresetSettings {
  voiceLocale: VoiceLocale;
  subtitlesEnabled: boolean;
  primarySubtitleLocale: SubtitleLocale;
  secondarySubtitlesEnabled: boolean;
  secondarySubtitleLocale: SubtitleLocale;
  subtitleAlignment: SubtitleAlignment;
  subtitlePosition: SubtitlePosition;
  subtitleX: number;
  subtitleY: number;
}

export interface DebugPresetSettings {
  debugPanelEnabled: boolean;
  drawHitboxes: boolean;
  panelLocale: PanelLocale;
}

export const POSITION_PRESETS: Record<"default", PositionPresetSettings> = {
  default: { modelScale: 0.8, modelX: 0, modelY: 0 },
};

export const INTERACTION_PRESETS: Record<"default", InteractionPresetSettings> = {
  default: {
    introAnimation: true,
    interactionsEnabled: true,
    mouseTracking: true,
    headPatting: true,
    voiceEnabled: true,
  },
};

export const DIALOGUE_LANGUAGE_PRESETS: Record<
  Exclude<DialogueLanguagePreset, "custom">,
  DialogueLanguagePresetSettings
> = {
  "zh-cn": {
    voiceLocale: "zh-cn",
    subtitlesEnabled: true,
    primarySubtitleLocale: "zh-cn",
    secondarySubtitlesEnabled: false,
    secondarySubtitleLocale: "ja",
    subtitleAlignment: "center",
    subtitlePosition: "bottom-center",
    subtitleX: 0,
    subtitleY: 0,
  },
  ja: {
    voiceLocale: "ja",
    subtitlesEnabled: true,
    primarySubtitleLocale: "ja",
    secondarySubtitlesEnabled: false,
    secondarySubtitleLocale: "zh-cn",
    subtitleAlignment: "center",
    subtitlePosition: "bottom-center",
    subtitleX: 0,
    subtitleY: 0,
  },
  ko: {
    voiceLocale: "ko",
    subtitlesEnabled: true,
    primarySubtitleLocale: "zh-cn",
    secondarySubtitlesEnabled: false,
    secondarySubtitleLocale: "ja",
    subtitleAlignment: "center",
    subtitlePosition: "bottom-center",
    subtitleX: 0,
    subtitleY: 0,
  },
};

export const DEBUG_PRESETS: Record<
  Exclude<DebugPreset, "custom">,
  DebugPresetSettings
> = {
  off: {
    debugPanelEnabled: false,
    drawHitboxes: false,
    panelLocale: "zh-cn",
  },
  panel: {
    debugPanelEnabled: true,
    drawHitboxes: false,
    panelLocale: "zh-cn",
  },
  all: {
    debugPanelEnabled: true,
    drawHitboxes: true,
    panelLocale: "zh-cn",
  },
};

export function isPositionPreset(value: unknown): value is PositionPreset {
  return value === "default" || value === "custom";
}

export function isInteractionPreset(value: unknown): value is InteractionPreset {
  return value === "default" || value === "custom";
}

export function isDialogueLanguagePreset(
  value: unknown,
): value is DialogueLanguagePreset {
  return value === "zh-cn" || value === "ja" || value === "ko" || value === "custom";
}

export function isDebugPreset(value: unknown): value is DebugPreset {
  return value === "off" || value === "panel" || value === "all" || value === "custom";
}
