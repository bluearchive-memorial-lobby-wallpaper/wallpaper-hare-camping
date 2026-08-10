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

export interface WallpaperSettings {
  introAnimation: boolean;
  modelScale: number;
  modelX: number;
  modelY: number;
  interactionsEnabled: boolean;
  mouseTracking: boolean;
  headPatting: boolean;
  voiceEnabled: boolean;
  voiceLocale: VoiceLocale;
  voiceVolume: number;
  subtitlesEnabled: boolean;
  subtitleLocale: SubtitleLocale;
  bgmEnabled: boolean;
  bgmVolume: number;
  renderResolution: RenderResolution;
  modelResolution: ModelResolution;
  panelLocale: PanelLocale;
  drawHitboxes: boolean;
  debugPanelEnabled: boolean;
  backgroundColor: [number, number, number];
  fpsLimit: number;
}

type SettingsListener = (settings: Readonly<WallpaperSettings>) => void;
type PauseListener = (paused: boolean) => void;

const DEFAULT_SETTINGS: WallpaperSettings = {
  introAnimation: true,
  modelScale: 1,
  modelX: 0,
  modelY: 0,
  interactionsEnabled: true,
  mouseTracking: true,
  headPatting: true,
  voiceEnabled: true,
  voiceLocale: "zh-cn",
  voiceVolume: 0.7,
  subtitlesEnabled: true,
  subtitleLocale: "zh-cn",
  bgmEnabled: true,
  bgmVolume: 0.25,
  renderResolution: "1080p",
  modelResolution: "4k",
  panelLocale: "zh-cn",
  drawHitboxes: false,
  debugPanelEnabled: false,
  backgroundColor: [0.035, 0.055, 0.11],
  fpsLimit: 60,
};

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
    this.patchSession({ fpsLimit: clamp(fps, 30, 160) });
  }

  setUserPropertiesForDebug(
    properties: Record<string, boolean | number | string>,
  ) {
    this.patchSession(
      this.parseUserProperties(
        Object.fromEntries(
          Object.entries(properties).map(([key, value]) => [key, { value }]),
        ),
      ),
    );
  }

  clearSessionOverrides() {
    if (Object.keys(this.sessionOverrides).length === 0) return;
    this.sessionOverrides = {};
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
    this.patchHost({ fpsLimit: clamp(properties.fps, 0, 240) });
  }

  private applyUserProperties(
    properties: Record<string, { value: boolean | number | string }>,
  ) {
    this.patchHost(this.parseUserProperties(properties));
  }

  private parseUserProperties(
    properties: Record<string, { value: boolean | number | string }>,
  ) {
    const patch: Partial<WallpaperSettings> = {};

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
    if (properties.voicelanguage && isVoiceLocale(properties.voicelanguage.value)) {
      patch.voiceLocale = properties.voicelanguage.value;
    }
    if (properties.voicevolume) {
      patch.voiceVolume = clamp(Number(properties.voicevolume.value) / 100, 0, 1);
    }
    if (properties.showsubtitles) {
      patch.subtitlesEnabled = Boolean(properties.showsubtitles.value);
    }
    if (properties.subtitlelanguage && isSubtitleLocale(properties.subtitlelanguage.value)) {
      patch.subtitleLocale = properties.subtitlelanguage.value;
    }
    if (properties.bgmenabled) {
      patch.bgmEnabled = Boolean(properties.bgmenabled.value);
    }
    if (properties.bgmvolume) {
      patch.bgmVolume = clamp(Number(properties.bgmvolume.value) / 100, 0, 1);
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
