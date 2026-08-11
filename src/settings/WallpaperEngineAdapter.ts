import type { SubtitleLocale, VoiceLocale } from "../config";
import { isPanelLocale, type PanelLocale } from "../i18n/panel";
import {
  isRenderResolution,
  type RenderResolution,
} from "./renderResolution";
import {
  isModelResolution,
  type ModelResolution,
} from "./modelResolution";
import {
  isQualityPreset,
  QUALITY_PRESETS,
  type QualityPreset,
  type QualityPresetSettings,
} from "./qualityPreset";
import {
  DEBUG_PRESETS,
  DIALOGUE_LANGUAGE_PRESETS,
  INTERACTION_PRESETS,
  isDebugPreset,
  isDialogueLanguagePreset,
  isInteractionPreset,
  isPositionPreset,
  POSITION_PRESETS,
  type DebugPreset,
  type DebugPresetSettings,
  type DialogueLanguagePreset,
  type DialogueLanguagePresetSettings,
  type InteractionPreset,
  type InteractionPresetSettings,
  type PositionPreset,
  type PositionPresetSettings,
} from "./propertyGroupPresets";

export interface WallpaperSettings {
  positionPreset: PositionPreset;
  introAnimation: boolean;
  modelScale: number;
  modelX: number;
  modelY: number;
  interactionPreset: InteractionPreset;
  interactionsEnabled: boolean;
  mouseTracking: boolean;
  headPatting: boolean;
  voiceEnabled: boolean;
  muted: boolean;
  voiceLocale: VoiceLocale;
  voiceVolume: number;
  dialogueAutoPlay: boolean;
  dialogueLanguagePreset: DialogueLanguagePreset;
  subtitlesEnabled: boolean;
  subtitleLocale: SubtitleLocale;
  bgmVolume: number;
  qualityPreset: QualityPreset;
  renderResolution: RenderResolution;
  modelResolution: ModelResolution;
  panelLocale: PanelLocale;
  debugPreset: DebugPreset;
  drawHitboxes: boolean;
  debugPanelEnabled: boolean;
  backgroundColor: [number, number, number];
  fpsLimit: number;
}

type SettingsListener = (settings: Readonly<WallpaperSettings>) => void;
type PauseListener = (paused: boolean) => void;

export const DEFAULT_SETTINGS_VERSION = 2;

export const DEFAULT_SETTINGS: Readonly<WallpaperSettings> = Object.freeze({
  positionPreset: "default",
  introAnimation: true,
  modelScale: 0.8,
  modelX: 0,
  modelY: 0,
  interactionPreset: "default",
  interactionsEnabled: true,
  mouseTracking: true,
  headPatting: true,
  voiceEnabled: true,
  muted: false,
  voiceLocale: "zh-cn",
  voiceVolume: 0.7,
  dialogueAutoPlay: false,
  dialogueLanguagePreset: "zh-cn",
  subtitlesEnabled: true,
  subtitleLocale: "zh-cn",
  bgmVolume: 0.5,
  qualityPreset: "default",
  renderResolution: "1080p",
  modelResolution: "2k",
  panelLocale: "zh-cn",
  debugPreset: "off",
  drawHitboxes: false,
  debugPanelEnabled: false,
  backgroundColor: [14 / 255, 78 / 255, 172 / 255] as [number, number, number],
  fpsLimit: 60,
});

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

function colorFromWallpaperEngine(value: string): [number, number, number] {
  const components = value.split(/\s+/).map(Number);
  if (components.length !== 3 || components.some((component) => !Number.isFinite(component))) {
    return DEFAULT_SETTINGS.backgroundColor;
  }
  return [
    clamp(components[0] ?? 0, 0, 1),
    clamp(components[1] ?? 0, 0, 1),
    clamp(components[2] ?? 0, 0, 1),
  ];
}

function isVoiceLocale(value: unknown): value is VoiceLocale {
  return value === "ja" || value === "zh-cn" || value === "ko";
}

function isSubtitleLocale(value: unknown): value is SubtitleLocale {
  return value === "zh-cn" || value === "ja";
}

export class WallpaperEngineAdapter {
  private readonly listeners = new Set<SettingsListener>();
  private readonly pauseListeners = new Set<PauseListener>();
  private hostSettings: WallpaperSettings = { ...DEFAULT_SETTINGS };
  private sessionOverrides: Partial<WallpaperSettings> = {};
  private effectiveSettings: WallpaperSettings = { ...DEFAULT_SETTINGS };
  private projectFpsLimit = DEFAULT_SETTINGS.fpsLimit;
  private engineFpsLimit = 0;
  private customQualitySettings: QualityPresetSettings = {
    renderResolution: DEFAULT_SETTINGS.renderResolution,
    modelResolution: DEFAULT_SETTINGS.modelResolution,
    fpsLimit: DEFAULT_SETTINGS.fpsLimit,
  };
  private customPositionSettings: PositionPresetSettings = {
    modelScale: DEFAULT_SETTINGS.modelScale,
    modelX: DEFAULT_SETTINGS.modelX,
    modelY: DEFAULT_SETTINGS.modelY,
  };
  private customInteractionSettings: InteractionPresetSettings = {
    introAnimation: DEFAULT_SETTINGS.introAnimation,
    interactionsEnabled: DEFAULT_SETTINGS.interactionsEnabled,
    mouseTracking: DEFAULT_SETTINGS.mouseTracking,
    headPatting: DEFAULT_SETTINGS.headPatting,
    voiceEnabled: DEFAULT_SETTINGS.voiceEnabled,
  };
  private customDialogueLanguageSettings: DialogueLanguagePresetSettings = {
    voiceLocale: DEFAULT_SETTINGS.voiceLocale,
    subtitlesEnabled: DEFAULT_SETTINGS.subtitlesEnabled,
    subtitleLocale: DEFAULT_SETTINGS.subtitleLocale,
  };
  private customDebugSettings: DebugPresetSettings = {
    debugPanelEnabled: DEFAULT_SETTINGS.debugPanelEnabled,
    drawHitboxes: DEFAULT_SETTINGS.drawHitboxes,
    panelLocale: DEFAULT_SETTINGS.panelLocale,
  };
  private sessionCustomQualitySettings: QualityPresetSettings = {
    ...this.customQualitySettings,
  };
  private sessionCustomPositionSettings: PositionPresetSettings = {
    ...this.customPositionSettings,
  };
  private sessionCustomInteractionSettings: InteractionPresetSettings = {
    ...this.customInteractionSettings,
  };
  private sessionCustomDialogueLanguageSettings: DialogueLanguagePresetSettings = {
    ...this.customDialogueLanguageSettings,
  };

  constructor() {
    window.wallpaperPropertyListener = {
      applyGeneralProperties: (properties) => this.applyGeneralProperties(properties),
      applyUserProperties: (properties) => this.applyUserProperties(properties),
      setPaused: (paused) => this.setPaused(paused),
    };
  }

  get current(): Readonly<WallpaperSettings> {
    return this.effectiveSettings;
  }

  subscribe(listener: SettingsListener) {
    this.listeners.add(listener);
    listener(this.effectiveSettings);
    return () => this.listeners.delete(listener);
  }

  subscribePaused(listener: PauseListener) {
    this.pauseListeners.add(listener);
    return () => this.pauseListeners.delete(listener);
  }

  setFpsLimitForDebug(fps: number) {
    this.setUserPropertiesForDebug({ fpslimit: clamp(fps, 15, 160) });
  }

  setUserPropertiesForDebug(
    properties: Record<string, boolean | number | string>,
  ) {
    const patch = this.parseUserProperties(
      Object.fromEntries(
        Object.entries(properties).map(([key, value]) => [key, { value }]),
      ),
    );
    this.captureSessionCustomSettings(patch);
    if (patch.positionPreset !== undefined) {
      Object.assign(
        patch,
        patch.positionPreset === "custom"
          ? this.sessionCustomPositionSettings
          : POSITION_PRESETS[patch.positionPreset],
      );
    }
    if (patch.interactionPreset !== undefined) {
      Object.assign(
        patch,
        patch.interactionPreset === "custom"
          ? this.sessionCustomInteractionSettings
          : INTERACTION_PRESETS[patch.interactionPreset],
      );
    }
    if (patch.dialogueLanguagePreset !== undefined) {
      Object.assign(
        patch,
        patch.dialogueLanguagePreset === "custom"
          ? this.sessionCustomDialogueLanguageSettings
          : DIALOGUE_LANGUAGE_PRESETS[patch.dialogueLanguagePreset],
      );
    }
    if (patch.qualityPreset !== undefined) {
      Object.assign(
        patch,
        patch.qualityPreset === "custom"
          ? this.sessionCustomQualitySettings
          : QUALITY_PRESETS[patch.qualityPreset],
      );
    }
    if (patch.fpsLimit !== undefined) {
      patch.fpsLimit = this.resolveFpsLimit(patch.fpsLimit);
    }
    this.patchSession(patch);
  }

  clearSessionOverrides() {
    if (Object.keys(this.sessionOverrides).length === 0) return;
    this.sessionOverrides = {};
    this.resetSessionCustomSettings();
    this.publish();
  }

  get settingsState() {
    return {
      host: { ...this.hostSettings },
      sessionOverrides: { ...this.sessionOverrides },
      effective: { ...this.effectiveSettings },
    };
  }

  get hasSessionOverrides() {
    return Object.keys(this.sessionOverrides).length > 0;
  }

  private applyGeneralProperties(properties: { fps?: number }) {
    if (typeof properties.fps !== "number" || !Number.isFinite(properties.fps)) return;
    this.engineFpsLimit = clamp(properties.fps, 0, 240);
    this.patchHost({ fpsLimit: this.resolveFpsLimit() });
  }

  private applyUserProperties(
    properties: Record<string, { value: boolean | number | string }>,
  ) {
    const patch = this.parseUserProperties(properties);
    if (patch.modelScale !== undefined) this.customPositionSettings.modelScale = patch.modelScale;
    if (patch.modelX !== undefined) this.customPositionSettings.modelX = patch.modelX;
    if (patch.modelY !== undefined) this.customPositionSettings.modelY = patch.modelY;
    if (patch.introAnimation !== undefined) {
      this.customInteractionSettings.introAnimation = patch.introAnimation;
    }
    if (patch.interactionsEnabled !== undefined) {
      this.customInteractionSettings.interactionsEnabled = patch.interactionsEnabled;
    }
    if (patch.mouseTracking !== undefined) {
      this.customInteractionSettings.mouseTracking = patch.mouseTracking;
    }
    if (patch.headPatting !== undefined) {
      this.customInteractionSettings.headPatting = patch.headPatting;
    }
    if (patch.voiceEnabled !== undefined) {
      this.customInteractionSettings.voiceEnabled = patch.voiceEnabled;
    }
    if (patch.voiceLocale !== undefined) {
      this.customDialogueLanguageSettings.voiceLocale = patch.voiceLocale;
    }
    if (patch.subtitlesEnabled !== undefined) {
      this.customDialogueLanguageSettings.subtitlesEnabled = patch.subtitlesEnabled;
    }
    if (patch.subtitleLocale !== undefined) {
      this.customDialogueLanguageSettings.subtitleLocale = patch.subtitleLocale;
    }
    if (patch.debugPanelEnabled !== undefined) {
      this.customDebugSettings.debugPanelEnabled = patch.debugPanelEnabled;
    }
    if (patch.drawHitboxes !== undefined) {
      this.customDebugSettings.drawHitboxes = patch.drawHitboxes;
    }
    if (patch.panelLocale !== undefined) {
      this.customDebugSettings.panelLocale = patch.panelLocale;
    }
    if (patch.renderResolution !== undefined) {
      this.customQualitySettings.renderResolution = patch.renderResolution;
    }
    if (patch.modelResolution !== undefined) {
      this.customQualitySettings.modelResolution = patch.modelResolution;
    }
    if (patch.fpsLimit !== undefined) {
      this.customQualitySettings.fpsLimit = patch.fpsLimit;
    }
    this.captureSessionCustomSettings(patch);

    const positionPreset = patch.positionPreset ?? this.hostSettings.positionPreset;
    if (positionPreset === "custom") {
      if (patch.positionPreset === "custom") Object.assign(patch, this.customPositionSettings);
    } else {
      Object.assign(patch, POSITION_PRESETS[positionPreset]);
    }

    const interactionPreset =
      patch.interactionPreset ?? this.hostSettings.interactionPreset;
    if (interactionPreset === "custom") {
      if (patch.interactionPreset === "custom") {
        Object.assign(patch, this.customInteractionSettings);
      }
    } else {
      Object.assign(patch, INTERACTION_PRESETS[interactionPreset]);
    }

    const dialogueLanguagePreset =
      patch.dialogueLanguagePreset ?? this.hostSettings.dialogueLanguagePreset;
    if (dialogueLanguagePreset === "custom") {
      if (patch.dialogueLanguagePreset === "custom") {
        Object.assign(patch, this.customDialogueLanguageSettings);
      }
    } else {
      Object.assign(patch, DIALOGUE_LANGUAGE_PRESETS[dialogueLanguagePreset]);
    }

    const debugPreset = patch.debugPreset ?? this.hostSettings.debugPreset;
    if (debugPreset === "custom") {
      if (patch.debugPreset === "custom") Object.assign(patch, this.customDebugSettings);
    } else {
      Object.assign(patch, DEBUG_PRESETS[debugPreset]);
    }

    const qualityPreset = patch.qualityPreset ?? this.hostSettings.qualityPreset;
    if (qualityPreset === "custom") {
      if (patch.qualityPreset === "custom") {
        Object.assign(patch, this.customQualitySettings);
      }
    } else {
      Object.assign(patch, QUALITY_PRESETS[qualityPreset]);
    }

    if (patch.fpsLimit !== undefined) {
      this.projectFpsLimit = patch.fpsLimit;
      patch.fpsLimit = this.resolveFpsLimit();
    }
    this.patchHost(patch);
  }

  private parseUserProperties(
    properties: Record<string, { value: boolean | number | string }>,
  ) {
    const patch: Partial<WallpaperSettings> = {};

    if (properties.positionpreset && isPositionPreset(properties.positionpreset.value)) {
      patch.positionPreset = properties.positionpreset.value;
    }
    if (
      properties.interactionpreset &&
      isInteractionPreset(properties.interactionpreset.value)
    ) {
      patch.interactionPreset = properties.interactionpreset.value;
    }
    if (
      properties.dialoguelanguagepreset &&
      isDialogueLanguagePreset(properties.dialoguelanguagepreset.value)
    ) {
      patch.dialogueLanguagePreset = properties.dialoguelanguagepreset.value;
    }
    if (properties.debugpreset && isDebugPreset(properties.debugpreset.value)) {
      patch.debugPreset = properties.debugpreset.value;
    }

    if (properties.introanimation) {
      patch.introAnimation = Boolean(properties.introanimation.value);
    }
    if (properties.modelscale) {
      patch.modelScale = clamp(Number(properties.modelscale.value), 0.6, 1.4);
    }
    if (properties.modelx) {
      patch.modelX = clamp(Number(properties.modelx.value), -1000, 1000);
    }
    if (properties.modely) {
      patch.modelY = clamp(Number(properties.modely.value), -1000, 1000);
    }
    if (properties.interactions) {
      patch.interactionsEnabled = Boolean(properties.interactions.value);
    }
    if (properties.mousetracking) {
      patch.mouseTracking = Boolean(properties.mousetracking.value);
    }
    if (properties.headpatting) {
      patch.headPatting = Boolean(properties.headpatting.value);
    }
    if (properties.voicelines) {
      patch.voiceEnabled = Boolean(properties.voicelines.value);
    }
    if (properties.muted) {
      patch.muted = Boolean(properties.muted.value);
    }
    if (properties.voicelanguage && isVoiceLocale(properties.voicelanguage.value)) {
      patch.voiceLocale = properties.voicelanguage.value;
    }
    if (properties.voicevolume) {
      patch.voiceVolume = clamp(Number(properties.voicevolume.value) / 100, 0, 1);
    }
    if (properties.dialogueautoplay) {
      patch.dialogueAutoPlay = Boolean(properties.dialogueautoplay.value);
    }
    if (properties.showsubtitles) {
      patch.subtitlesEnabled = Boolean(properties.showsubtitles.value);
    }
    if (properties.subtitlelanguage && isSubtitleLocale(properties.subtitlelanguage.value)) {
      patch.subtitleLocale = properties.subtitlelanguage.value;
    }
    if (properties.bgmvolume) {
      patch.bgmVolume = clamp(Number(properties.bgmvolume.value) / 100, 0, 1);
    }
    if (properties.qualitypreset && isQualityPreset(properties.qualitypreset.value)) {
      patch.qualityPreset = properties.qualitypreset.value;
    }
    if (properties.fpslimit) {
      patch.fpsLimit = clamp(Number(properties.fpslimit.value), 15, 160);
    }
    if (
      properties.renderresolution &&
      isRenderResolution(properties.renderresolution.value)
    ) {
      patch.renderResolution = properties.renderresolution.value;
    }
    if (
      properties.modelresolution &&
      isModelResolution(properties.modelresolution.value)
    ) {
      patch.modelResolution = properties.modelresolution.value;
    }
    if (properties.panellanguage && isPanelLocale(properties.panellanguage.value)) {
      patch.panelLocale = properties.panellanguage.value;
    }
    if (properties.drawhitboxes) {
      patch.drawHitboxes = Boolean(properties.drawhitboxes.value);
    }
    if (properties.debugpanelenabled) {
      patch.debugPanelEnabled = Boolean(properties.debugpanelenabled.value);
    }
    if (properties.schemecolor && typeof properties.schemecolor.value === "string") {
      patch.backgroundColor = colorFromWallpaperEngine(properties.schemecolor.value);
    }

    return patch;
  }

  private captureSessionCustomSettings(patch: Partial<WallpaperSettings>) {
    if (patch.modelScale !== undefined) {
      this.sessionCustomPositionSettings.modelScale = patch.modelScale;
    }
    if (patch.modelX !== undefined) this.sessionCustomPositionSettings.modelX = patch.modelX;
    if (patch.modelY !== undefined) this.sessionCustomPositionSettings.modelY = patch.modelY;
    if (patch.introAnimation !== undefined) {
      this.sessionCustomInteractionSettings.introAnimation = patch.introAnimation;
    }
    if (patch.interactionsEnabled !== undefined) {
      this.sessionCustomInteractionSettings.interactionsEnabled =
        patch.interactionsEnabled;
    }
    if (patch.mouseTracking !== undefined) {
      this.sessionCustomInteractionSettings.mouseTracking = patch.mouseTracking;
    }
    if (patch.headPatting !== undefined) {
      this.sessionCustomInteractionSettings.headPatting = patch.headPatting;
    }
    if (patch.voiceEnabled !== undefined) {
      this.sessionCustomInteractionSettings.voiceEnabled = patch.voiceEnabled;
    }
    if (patch.voiceLocale !== undefined) {
      this.sessionCustomDialogueLanguageSettings.voiceLocale = patch.voiceLocale;
    }
    if (patch.subtitlesEnabled !== undefined) {
      this.sessionCustomDialogueLanguageSettings.subtitlesEnabled =
        patch.subtitlesEnabled;
    }
    if (patch.subtitleLocale !== undefined) {
      this.sessionCustomDialogueLanguageSettings.subtitleLocale = patch.subtitleLocale;
    }
    if (patch.renderResolution !== undefined) {
      this.sessionCustomQualitySettings.renderResolution = patch.renderResolution;
    }
    if (patch.modelResolution !== undefined) {
      this.sessionCustomQualitySettings.modelResolution = patch.modelResolution;
    }
    if (patch.fpsLimit !== undefined) {
      this.sessionCustomQualitySettings.fpsLimit = patch.fpsLimit;
    }
  }

  private resetSessionCustomSettings() {
    this.sessionCustomQualitySettings = { ...this.customQualitySettings };
    this.sessionCustomPositionSettings = { ...this.customPositionSettings };
    this.sessionCustomInteractionSettings = { ...this.customInteractionSettings };
    this.sessionCustomDialogueLanguageSettings = {
      ...this.customDialogueLanguageSettings,
    };
  }

  private resolveFpsLimit(projectFpsLimit = this.projectFpsLimit) {
    if (this.engineFpsLimit <= 0) return projectFpsLimit;
    return Math.min(projectFpsLimit, this.engineFpsLimit);
  }

  private setPaused(paused: boolean) {
    for (const listener of this.pauseListeners) listener(paused);
  }

  private patchHost(patch: Partial<WallpaperSettings>) {
    for (const key of Object.keys(patch) as (keyof WallpaperSettings)[]) {
      delete this.sessionOverrides[key];
    }
    this.hostSettings = { ...this.hostSettings, ...patch };
    this.publish();
  }

  private patchSession(patch: Partial<WallpaperSettings>) {
    this.sessionOverrides = { ...this.sessionOverrides, ...patch };
    this.publish();
  }

  private publish() {
    this.effectiveSettings = { ...this.hostSettings, ...this.sessionOverrides };
    for (const listener of this.listeners) listener(this.effectiveSettings);
  }
}
