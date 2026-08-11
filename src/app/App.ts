import { DIALOGUES, type VoiceLocale } from "../config";
import { BgmPlayer, type BgmStatus } from "../audio/BgmPlayer";
import { VoicePlayer } from "../audio/VoicePlayer";
import { DialoguePlaybackSequence } from "../dialogue/DialoguePlaybackSequence";
import { SubtitlePresenter } from "../dialogue/SubtitlePresenter";
import { PANEL_TEXT, type PanelText } from "../i18n/panel";
import { PointerInteractionController } from "../interaction/PointerInteractionController";
import {
  canTriggerDialogue,
  didDialogueSettingChange,
  didInteractionSettingsChange,
} from "../interaction/interactionSettings";
import {
  WallpaperEngineAdapter,
  type WallpaperSettings,
} from "../settings/WallpaperEngineAdapter";
import { RENDER_RESOLUTIONS } from "../settings/renderResolution";
import { MODEL_RESOLUTIONS } from "../settings/modelResolution";
import { resolvePropertyGroupVisibility } from "../settings/propertyGroupVisibility";
import { FrameLimiter } from "../render/FrameLimiter";
import { resolveDebugPanelExpanded } from "./debugPanelVisibility";
import {
  SpineRenderer,
  type InteractionMode,
  type SpineEventDetail,
} from "../spine/SpineRenderer";

type Phase = "booting" | "loading" | "running" | "paused" | "error";

export class App {
  private readonly root: HTMLElement;
  private readonly canvas: HTMLCanvasElement;
  private readonly interactionOverlay: HTMLCanvasElement;
  private readonly statusPanel: HTMLElement;
  private readonly debugPanelToggle: HTMLButtonElement;
  private readonly phaseLabel: HTMLElement;
  private readonly animationLabel: HTMLElement;
  private readonly interactionLabel: HTMLElement;
  private readonly lastActionLabel: HTMLElement;
  private readonly eventLabel: HTMLElement;
  private readonly bgmLabel: HTMLElement;
  private readonly fpsLabel: HTMLElement;
  private readonly viewportLabel: HTMLElement;
  private readonly renderResolutionLabel: HTMLElement;
  private readonly errorLabel: HTMLElement;
  private readonly loading: HTMLElement;
  private readonly loadingLabel: HTMLElement;
  private readonly replayIntroButton: HTMLButtonElement;
  private readonly skipIdleButton: HTMLButtonElement;
  private readonly dialogueButton: HTMLButtonElement;
  private readonly qualityPresetSelect: HTMLSelectElement;
  private readonly qualityCustomControls: HTMLElement;
  private readonly positionPresetSelect: HTMLSelectElement;
  private readonly positionCustomControls: HTMLElement;
  private readonly modelScaleSlider: HTMLInputElement;
  private readonly modelScaleOutput: HTMLOutputElement;
  private readonly modelXSlider: HTMLInputElement;
  private readonly modelXOutput: HTMLOutputElement;
  private readonly modelYSlider: HTMLInputElement;
  private readonly modelYOutput: HTMLOutputElement;
  private readonly interactionPresetSelect: HTMLSelectElement;
  private readonly interactionCustomControls: HTMLElement;
  private readonly interactionDependentControls: HTMLElement;
  private readonly introAnimationCheckbox: HTMLInputElement;
  private readonly interactionsEnabledCheckbox: HTMLInputElement;
  private readonly mouseTrackingCheckbox: HTMLInputElement;
  private readonly headPattingCheckbox: HTMLInputElement;
  private readonly voiceEnabledCheckbox: HTMLInputElement;
  private readonly mutedCheckbox: HTMLInputElement;
  private readonly voiceVolumeControl: HTMLElement;
  private readonly voiceVolumeSlider: HTMLInputElement;
  private readonly voiceVolumeOutput: HTMLOutputElement;
  private readonly dialoguePlaybackGroup: HTMLElement;
  private readonly dialogueAutoPlayCheckbox: HTMLInputElement;
  private readonly dialogueLanguagePresetSelect: HTMLSelectElement;
  private readonly dialogueCustomControls: HTMLElement;
  private readonly voiceLanguageSelect: HTMLSelectElement;
  private readonly showSubtitlesCheckbox: HTMLInputElement;
  private readonly primarySubtitleLanguageControl: HTMLElement;
  private readonly primarySubtitleLanguageSelect: HTMLSelectElement;
  private readonly showSecondarySubtitlesControl: HTMLElement;
  private readonly showSecondarySubtitlesCheckbox: HTMLInputElement;
  private readonly secondarySubtitleLanguageControl: HTMLElement;
  private readonly secondarySubtitleLanguageSelect: HTMLSelectElement;
  private readonly bgmVolumeControl: HTMLElement;
  private readonly bgmVolumeSlider: HTMLInputElement;
  private readonly bgmVolumeOutput: HTMLOutputElement;
  private readonly fpsSlider: HTMLInputElement;
  private readonly fpsOutput: HTMLOutputElement;
  private readonly renderResolutionSelect: HTMLSelectElement;
  private readonly modelResolutionSelect: HTMLSelectElement;
  private readonly panelLanguageSelect: HTMLSelectElement;
  private readonly hitboxesButton: HTMLButtonElement;
  private readonly restoreHostSettingsButton: HTMLButtonElement;
  private readonly adapter = new WallpaperEngineAdapter();
  private readonly subtitle: SubtitlePresenter;
  private readonly voice: VoicePlayer;
  private readonly bgm: BgmPlayer;
  private readonly dialoguePlayback = new DialoguePlaybackSequence(DIALOGUES.length);
  private renderer?: SpineRenderer;
  private pointerController?: PointerInteractionController;
  private settings: Readonly<WallpaperSettings> = this.adapter.current;
  private phase: Phase = "booting";
  private animation = "—";
  private interactionMode: InteractionMode = "intro";
  private lastAction = "—";
  private lastSpineEvent = "—";
  private frameRequest = 0;
  private lastFrameTime = performance.now() / 1000;
  private readonly frameLimiter = new FrameLimiter();
  private hostPaused = false;
  private rendererUnavailable = false;
  private performanceWindowStartedAt = performance.now();
  private performanceFrameCount = 0;
  private performanceRenderTotal = 0;
  private performanceRenderMaximum = 0;
  private measuredFps = 0;
  private averageRenderMilliseconds = 0;
  private maximumRenderMilliseconds = 0;
  private readonly debugFromQuery = new URLSearchParams(location.search).has("debug");
  private readonly contextLossTestFromQuery = new URLSearchParams(
    location.search,
  ).has("testContextLoss");
  private readonly contextLossTestDelay = Number(
    new URLSearchParams(location.search).get("testContextLossDelay"),
  );
  private readonly fpsTestFromQuery = Number(
    new URLSearchParams(location.search).get("testFps"),
  );
  private debugPanelExpanded = this.debugFromQuery;

  constructor(root: HTMLElement) {
    this.root = root;
    this.canvas = this.getElement("wallpaper", HTMLCanvasElement);
    this.interactionOverlay = this.getElement("interaction-overlay", HTMLCanvasElement);
    this.statusPanel = this.getElement("status-panel", HTMLElement);
    this.debugPanelToggle = this.getElement("debug-panel-toggle", HTMLButtonElement);
    this.phaseLabel = this.getElement("status-phase", HTMLElement);
    this.animationLabel = this.getElement("status-animation", HTMLElement);
    this.interactionLabel = this.getElement("status-interaction", HTMLElement);
    this.lastActionLabel = this.getElement("status-last-action", HTMLElement);
    this.eventLabel = this.getElement("status-event", HTMLElement);
    this.bgmLabel = this.getElement("status-bgm", HTMLElement);
    this.fpsLabel = this.getElement("status-fps", HTMLElement);
    this.viewportLabel = this.getElement("status-viewport", HTMLElement);
    this.renderResolutionLabel = this.getElement(
      "status-render-resolution",
      HTMLElement,
    );
    this.errorLabel = this.getElement("status-error", HTMLElement);
    this.loading = this.getElement("loading", HTMLElement);
    this.loadingLabel = this.getElement("loading-label", HTMLElement);
    this.replayIntroButton = this.getElement("debug-replay-intro", HTMLButtonElement);
    this.skipIdleButton = this.getElement("debug-skip-idle", HTMLButtonElement);
    this.dialogueButton = this.getElement("debug-dialogue", HTMLButtonElement);
    this.qualityPresetSelect = this.getElement(
      "debug-quality-preset",
      HTMLSelectElement,
    );
    this.qualityCustomControls = this.getElement("debug-quality-custom", HTMLElement);
    this.positionPresetSelect = this.getElement(
      "debug-position-preset",
      HTMLSelectElement,
    );
    this.positionCustomControls = this.getElement(
      "debug-position-custom",
      HTMLElement,
    );
    this.modelScaleSlider = this.getElement("debug-model-scale", HTMLInputElement);
    this.modelScaleOutput = this.getElement(
      "debug-model-scale-output",
      HTMLOutputElement,
    );
    this.modelXSlider = this.getElement("debug-model-x", HTMLInputElement);
    this.modelXOutput = this.getElement("debug-model-x-output", HTMLOutputElement);
    this.modelYSlider = this.getElement("debug-model-y", HTMLInputElement);
    this.modelYOutput = this.getElement("debug-model-y-output", HTMLOutputElement);
    this.interactionPresetSelect = this.getElement(
      "debug-interaction-preset",
      HTMLSelectElement,
    );
    this.interactionCustomControls = this.getElement(
      "debug-interaction-custom",
      HTMLElement,
    );
    this.interactionDependentControls = this.getElement(
      "debug-interaction-dependent",
      HTMLElement,
    );
    this.introAnimationCheckbox = this.getElement(
      "debug-intro-animation",
      HTMLInputElement,
    );
    this.interactionsEnabledCheckbox = this.getElement(
      "debug-interactions-enabled",
      HTMLInputElement,
    );
    this.mouseTrackingCheckbox = this.getElement(
      "debug-mouse-tracking",
      HTMLInputElement,
    );
    this.headPattingCheckbox = this.getElement("debug-head-patting", HTMLInputElement);
    this.voiceEnabledCheckbox = this.getElement("debug-voice-enabled", HTMLInputElement);
    this.mutedCheckbox = this.getElement("debug-muted", HTMLInputElement);
    this.voiceVolumeControl = this.getElement(
      "debug-voice-volume-control",
      HTMLElement,
    );
    this.voiceVolumeSlider = this.getElement("debug-voice-volume", HTMLInputElement);
    this.voiceVolumeOutput = this.getElement(
      "debug-voice-volume-output",
      HTMLOutputElement,
    );
    this.dialoguePlaybackGroup = this.getElement(
      "debug-dialogue-playback-group",
      HTMLElement,
    );
    this.dialogueAutoPlayCheckbox = this.getElement(
      "debug-dialogue-autoplay",
      HTMLInputElement,
    );
    this.dialogueLanguagePresetSelect = this.getElement(
      "debug-dialogue-language-preset",
      HTMLSelectElement,
    );
    this.dialogueCustomControls = this.getElement(
      "debug-dialogue-custom",
      HTMLElement,
    );
    this.voiceLanguageSelect = this.getElement(
      "debug-voice-language",
      HTMLSelectElement,
    );
    this.showSubtitlesCheckbox = this.getElement(
      "debug-show-subtitles",
      HTMLInputElement,
    );
    this.primarySubtitleLanguageControl = this.getElement(
      "debug-primary-subtitle-language-control",
      HTMLElement,
    );
    this.primarySubtitleLanguageSelect = this.getElement(
      "debug-primary-subtitle-language",
      HTMLSelectElement,
    );
    this.showSecondarySubtitlesControl = this.getElement(
      "debug-show-secondary-subtitles-control",
      HTMLElement,
    );
    this.showSecondarySubtitlesCheckbox = this.getElement(
      "debug-show-secondary-subtitles",
      HTMLInputElement,
    );
    this.secondarySubtitleLanguageControl = this.getElement(
      "debug-secondary-subtitle-language-control",
      HTMLElement,
    );
    this.secondarySubtitleLanguageSelect = this.getElement(
      "debug-secondary-subtitle-language",
      HTMLSelectElement,
    );
    this.bgmVolumeControl = this.getElement("debug-bgm-volume-control", HTMLElement);
    this.bgmVolumeSlider = this.getElement("debug-bgm-volume", HTMLInputElement);
    this.bgmVolumeOutput = this.getElement(
      "debug-bgm-volume-output",
      HTMLOutputElement,
    );
    this.fpsSlider = this.getElement("debug-fps", HTMLInputElement);
    this.fpsOutput = this.getElement("debug-fps-output", HTMLOutputElement);
    this.renderResolutionSelect = this.getElement(
      "debug-render-resolution",
      HTMLSelectElement,
    );
    this.modelResolutionSelect = this.getElement(
      "debug-model-resolution",
      HTMLSelectElement,
    );
    this.panelLanguageSelect = this.getElement(
      "debug-panel-language",
      HTMLSelectElement,
    );
    this.hitboxesButton = this.getElement("debug-hitboxes", HTMLButtonElement);
    this.restoreHostSettingsButton = this.getElement(
      "debug-restore-host-settings",
      HTMLButtonElement,
    );
    this.subtitle = new SubtitlePresenter(
      this.getElement("subtitle", HTMLElement),
      this.getElement("subtitle-primary", HTMLElement),
      this.getElement("subtitle-secondary", HTMLElement),
    );
    this.voice = new VoicePlayer({
      onEnded: (eventId) => this.subtitle.hide(eventId),
      onError: (message) => {
        console.warn(message);
        this.eventLabel.textContent = "audio-error";
      },
    });
    this.bgm = new BgmPlayer({
      onStatusChange: (status) => this.updateBgmLabel(status),
      onError: (message) => {
        console.warn(message);
        this.eventLabel.textContent = "bgm-error";
      },
    });
  }

  async start() {
    this.setPhase("loading");
    this.adapter.subscribe((settings) => this.applySettings(settings));
    this.adapter.subscribePaused((paused) => this.setHostPaused(paused));
    if (Number.isFinite(this.fpsTestFromQuery)) {
      window.wallpaperPropertyListener?.applyGeneralProperties?.({
        fps: this.fpsTestFromQuery,
      });
    }

    try {
      this.renderer = new SpineRenderer(this.canvas, {
        onAnimationChange: (animation) => {
          this.animation = animation;
          this.animationLabel.textContent = animation;
        },
        onInteractionModeChange: (mode) => {
          if (mode === "cooldown" && this.interactionMode !== "cooldown") {
            const completedMode = this.interactionMode;
            this.lastAction = completedMode;
            this.lastActionLabel.textContent = this.panelText.interactions[completedMode];
          }
          this.interactionMode = mode;
          this.interactionLabel.textContent = this.panelText.interactions[mode];
          if (mode === "idle") {
            this.subtitle.hide();
            this.finishDialogueAndContinueAutomaticPlayback();
          }
        },
        onSpineEvent: (event) => this.handleSpineEvent(event),
        onContextLost: () => this.handleRendererContextLost(),
        onContextRestored: () => this.handleRendererContextRestored(),
        onError: (error) => this.fail(error),
      });
      await this.renderer.initialize(this.settings.modelResolution);
      this.renderer.applySettings(this.settings);
      this.pointerController = new PointerInteractionController(
        this.canvas,
        this.renderer,
        { onDialogueRequested: () => this.playNextDialogue(undefined, true) },
      );
      this.pointerController.applySettings(this.settings);
      this.renderer.playInitialSequence(this.settings.introAnimation);
      this.installLifecycleHandlers();
      this.installDebugApi();
      this.setPhase(this.isPaused() ? "paused" : "running");
      this.lastFrameTime = performance.now() / 1000;
      this.frameLimiter.reset();
      this.frameRequest = requestAnimationFrame((time) => this.frame(time));
      if (this.contextLossTestFromQuery) {
        window.setTimeout(
          () => this.renderer?.simulateContextLossForDebug(),
          Number.isFinite(this.contextLossTestDelay) &&
            this.contextLossTestDelay >= 0
            ? this.contextLossTestDelay
            : 750,
        );
      }
    } catch (error) {
      this.fail(error);
    }
  }

  private applySettings(settings: Readonly<WallpaperSettings>) {
    const previousSettings = this.settings;
    const interactionSettingsChanged = didInteractionSettingsChange(
      previousSettings,
      settings,
    );
    this.debugPanelExpanded = resolveDebugPanelExpanded(
      this.debugPanelExpanded,
      previousSettings.debugPanelEnabled,
      settings.debugPanelEnabled,
      this.debugFromQuery,
    );
    this.settings = settings;
    this.syncPanelText();
    this.renderer?.applySettings(settings);
    if (
      this.renderer &&
      previousSettings.modelResolution !== settings.modelResolution
    ) {
      void this.renderer
        .setModelResolution(settings.modelResolution)
        .catch((error) => this.fail(error));
    }
    this.pointerController?.applySettings(settings);
    if (interactionSettingsChanged) {
      this.returnToIdle(didDialogueSettingChange(previousSettings, settings));
    }
    this.dialoguePlayback.setAutomaticPlaybackAfterCurrent(
      settings.dialogueAutoPlay && canTriggerDialogue(settings),
    );
    this.voice.configure(settings.voiceEnabled && !settings.muted, settings.voiceVolume);
    this.bgm.configure(!settings.muted, settings.bgmVolume);
    this.updateBgmLabel(this.bgm.getSnapshot().status);
    this.subtitle.configure(
      settings.subtitlesEnabled,
      settings.primarySubtitleLocale,
      settings.secondarySubtitlesEnabled,
      settings.secondarySubtitleLocale,
    );
    this.syncDebugControls(settings);
    this.updateViewportLabel();
    this.syncDebugPanelVisibility();
    this.interactionOverlay.hidden = !settings.drawHitboxes;
    if (!settings.drawHitboxes) this.clearInteractionOverlay();
  }

  private frame(timestampMilliseconds: number) {
    this.frameRequest = requestAnimationFrame((time) => this.frame(time));
    if (!this.renderer || this.isPaused() || this.phase === "error") return;

    const now = timestampMilliseconds / 1000;
    const elapsed = Math.min(Math.max(now - this.lastFrameTime, 0), 0.25);
    this.lastFrameTime = now;
    const delta = this.frameLimiter.advance(elapsed, this.settings.fpsLimit);
    if (delta === null) return;
    const renderStartedAt = performance.now();
    if (!this.renderer.updateAndRender(delta)) return;
    this.recordRenderPerformance(
      timestampMilliseconds,
      performance.now() - renderStartedAt,
    );
    this.updateViewportLabel();
    if (this.settings.drawHitboxes) this.drawInteractionOverlay();
  }

  private playNextDialogue(index?: number, allowAutomaticPlayback = false): boolean {
    if (!this.renderer || !canTriggerDialogue(this.settings)) return false;
    const automatic =
      allowAutomaticPlayback &&
      this.settings.dialogueAutoPlay;
    const targetIndex = index ?? this.dialoguePlayback.nextIndex;
    this.voice.stop();
    this.subtitle.hide();
    if (!this.renderer.playDialogue(targetIndex)) return false;
    this.dialoguePlayback.start(targetIndex, automatic);
    return true;
  }

  private finishDialogueAndContinueAutomaticPlayback() {
    if (!this.renderer) return;
    const index = this.dialoguePlayback.takeAutomaticContinuation();
    if (index === null) return;
    this.voice.stop();
    this.subtitle.hide();
    if (!this.renderer.playDialogue(index)) {
      this.dialoguePlayback.stop();
    }
  }

  private skipToIdle() {
    this.dialoguePlayback.stop();
    this.voice.stop();
    this.subtitle.hide();
    this.renderer?.playIdle();
  }

  private returnToIdle(resetDialogueQueue = false) {
    if (resetDialogueQueue) this.dialoguePlayback.reset();
    else this.dialoguePlayback.stop();
    this.voice.stop();
    this.subtitle.hide();
    this.renderer?.playIdle();
  }

  private handleSpineEvent(event: SpineEventDetail) {
    if (event.trackIndex !== 1) return;
    this.lastSpineEvent = event.stringValue || event.name;
    this.eventLabel.textContent = this.lastSpineEvent;
    if (event.name.startsWith("sound/")) {
      const eventId = event.name.slice("sound/".length);
      void this.voice.play(eventId, this.settings.voiceLocale);
    } else if (event.name === "Talk" && event.stringValue) {
      this.subtitle.show(event.stringValue);
    }
  }

  private installLifecycleHandlers() {
    const resizeObserver = new ResizeObserver(() => {
      this.renderer?.resize();
      this.updateViewportLabel();
      if (this.settings.drawHitboxes) this.drawInteractionOverlay();
    });
    resizeObserver.observe(this.canvas);

    document.addEventListener("visibilitychange", this.syncPausedState);
    window.addEventListener("beforeunload", () => {
      cancelAnimationFrame(this.frameRequest);
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", this.syncPausedState);
      this.pointerController?.dispose();
      this.removeBgmUnlockListeners();
      this.voice.stop();
      this.bgm.dispose();
      this.renderer?.dispose();
    });
    window.addEventListener("pointerdown", this.unlockBgmFromGesture, true);
    window.addEventListener("keydown", this.unlockBgmFromGesture, true);
  }

  private installDebugApi() {
    window.__hareWallpaperDebug = {
      getSnapshot: () => ({
        phase: this.phase,
        animation: this.animation,
        interactionMode: this.interactionMode,
        lastAction: this.lastAction,
        lastSpineEvent: this.lastSpineEvent,
        nextDialogueIndex: this.dialoguePlayback.nextIndex,
        dialogueAutoPlayActive: this.dialoguePlayback.automaticPlaybackActive,
        fpsLimit: this.settings.fpsLimit,
        settings: { ...this.settings },
        settingsState: this.adapter.settingsState,
        renderer: this.renderer?.getSnapshot() ?? null,
        pointer: this.pointerController?.getSnapshot() ?? null,
        voice: this.voice.getSnapshot(),
        bgm: this.bgm.getSnapshot(),
        subtitle: this.subtitle.getSnapshot(),
        performance: {
          actualFps: this.measuredFps,
          averageRenderMilliseconds: this.averageRenderMilliseconds,
          maximumRenderMilliseconds: this.maximumRenderMilliseconds,
        },
      }),
      replayIntro: () => this.replaySession(),
      skipToIdle: () => this.skipToIdle(),
      playDialogue: (index) => this.playNextDialogue(index),
      setFpsLimit: (fps) => this.adapter.setFpsLimitForDebug(fps),
      retryBgm: () => this.bgm.retryFromUserGesture(),
      setUserProperties: (properties) =>
        this.adapter.setUserPropertiesForDebug(properties),
      clearSessionOverrides: () => this.adapter.clearSessionOverrides(),
    };

    this.debugPanelToggle.addEventListener("click", () => {
      if (this.debugPanelToggle.disabled) return;
      this.debugPanelExpanded = !this.debugPanelExpanded;
      this.syncDebugPanelVisibility();
    });
    this.replayIntroButton.addEventListener("click", () => this.replaySession());
    this.skipIdleButton.addEventListener("click", () => this.skipToIdle());
    this.dialogueButton.addEventListener("click", () => this.playNextDialogue());
    this.qualityPresetSelect.addEventListener("change", () =>
      this.adapter.setUserPropertiesForDebug({
        qualitypreset: this.qualityPresetSelect.value,
      }),
    );
    this.positionPresetSelect.addEventListener("change", () =>
      this.adapter.setUserPropertiesForDebug({
        positionpreset: this.positionPresetSelect.value,
      }),
    );
    this.modelScaleSlider.addEventListener("input", () =>
      this.adapter.setUserPropertiesForDebug({
        modelscale: Number(this.modelScaleSlider.value),
      }),
    );
    this.modelXSlider.addEventListener("input", () =>
      this.adapter.setUserPropertiesForDebug({ modelx: Number(this.modelXSlider.value) }),
    );
    this.modelYSlider.addEventListener("input", () =>
      this.adapter.setUserPropertiesForDebug({ modely: Number(this.modelYSlider.value) }),
    );
    this.interactionPresetSelect.addEventListener("change", () =>
      this.adapter.setUserPropertiesForDebug({
        interactionpreset: this.interactionPresetSelect.value,
      }),
    );
    this.introAnimationCheckbox.addEventListener("change", () =>
      this.adapter.setUserPropertiesForDebug({
        introanimation: this.introAnimationCheckbox.checked,
      }),
    );
    this.interactionsEnabledCheckbox.addEventListener("change", () =>
      this.adapter.setUserPropertiesForDebug({
        interactions: this.interactionsEnabledCheckbox.checked,
      }),
    );
    this.mouseTrackingCheckbox.addEventListener("change", () =>
      this.adapter.setUserPropertiesForDebug({
        mousetracking: this.mouseTrackingCheckbox.checked,
      }),
    );
    this.headPattingCheckbox.addEventListener("change", () =>
      this.adapter.setUserPropertiesForDebug({
        headpatting: this.headPattingCheckbox.checked,
      }),
    );
    this.voiceEnabledCheckbox.addEventListener("change", () =>
      this.adapter.setUserPropertiesForDebug({
        voicelines: this.voiceEnabledCheckbox.checked,
      }),
    );
    this.mutedCheckbox.addEventListener("change", () =>
      this.adapter.setUserPropertiesForDebug({ muted: this.mutedCheckbox.checked }),
    );
    this.voiceVolumeSlider.addEventListener("input", () =>
      this.adapter.setUserPropertiesForDebug({
        voicevolume: Number(this.voiceVolumeSlider.value),
      }),
    );
    this.dialogueAutoPlayCheckbox.addEventListener("change", () =>
      this.adapter.setUserPropertiesForDebug({
        dialogueautoplay: this.dialogueAutoPlayCheckbox.checked,
      }),
    );
    this.dialogueLanguagePresetSelect.addEventListener("change", () =>
      this.adapter.setUserPropertiesForDebug({
        dialoguelanguagepreset: this.dialogueLanguagePresetSelect.value,
      }),
    );
    this.voiceLanguageSelect.addEventListener("change", () =>
      this.setVoiceLocale(this.voiceLanguageSelect.value as VoiceLocale),
    );
    this.showSubtitlesCheckbox.addEventListener("change", () =>
      this.adapter.setUserPropertiesForDebug({
        showsubtitles: this.showSubtitlesCheckbox.checked,
      }),
    );
    this.primarySubtitleLanguageSelect.addEventListener("change", () =>
      this.adapter.setUserPropertiesForDebug({
        subtitlelanguage: this.primarySubtitleLanguageSelect.value,
      }),
    );
    this.showSecondarySubtitlesCheckbox.addEventListener("change", () =>
      this.adapter.setUserPropertiesForDebug({
        showsecondarysubtitles: this.showSecondarySubtitlesCheckbox.checked,
      }),
    );
    this.secondarySubtitleLanguageSelect.addEventListener("change", () =>
      this.adapter.setUserPropertiesForDebug({
        secondarysubtitlelanguage: this.secondarySubtitleLanguageSelect.value,
      }),
    );
    this.bgmVolumeSlider.addEventListener("input", () =>
      this.adapter.setUserPropertiesForDebug({
        bgmvolume: Number(this.bgmVolumeSlider.value),
      }),
    );
    this.fpsSlider.addEventListener("input", () =>
      this.adapter.setUserPropertiesForDebug({
        fpslimit: Number(this.fpsSlider.value),
      }),
    );
    this.renderResolutionSelect.addEventListener("change", () =>
      this.adapter.setUserPropertiesForDebug({
        renderresolution: this.renderResolutionSelect.value,
      }),
    );
    this.modelResolutionSelect.addEventListener("change", () =>
      this.adapter.setUserPropertiesForDebug({
        modelresolution: this.modelResolutionSelect.value,
      }),
    );
    this.panelLanguageSelect.addEventListener("change", () =>
      this.adapter.setUserPropertiesForDebug({
        panellanguage: this.panelLanguageSelect.value,
      }),
    );
    this.hitboxesButton.addEventListener("click", () =>
      this.adapter.setUserPropertiesForDebug({
        drawhitboxes: !this.settings.drawHitboxes,
      }),
    );
    this.restoreHostSettingsButton.addEventListener("click", () =>
      this.adapter.clearSessionOverrides(),
    );
  }

  private setHostPaused(paused: boolean) {
    this.hostPaused = paused;
    this.syncPausedState();
    this.syncDebugControls(this.settings);
  }

  private readonly unlockBgmFromGesture = (event: Event) => {
    const target = event.target;
    if (
      target instanceof Element &&
      target.closest("#debug-muted, #debug-replay-intro")
    ) {
      return;
    }
    if (this.settings.muted || this.isPaused()) return;
    void this.bgm.retryFromUserGesture().then((playing) => {
      if (playing) this.removeBgmUnlockListeners();
    });
  };

  private removeBgmUnlockListeners() {
    window.removeEventListener("pointerdown", this.unlockBgmFromGesture, true);
    window.removeEventListener("keydown", this.unlockBgmFromGesture, true);
  }

  private replaySession(): boolean {
    if (!this.renderer) return false;
    this.voice.stop();
    this.subtitle.hide();
    this.dialoguePlayback.reset();
    this.lastSpineEvent = "—";
    this.eventLabel.textContent = "—";
    this.lastAction = "—";
    this.lastActionLabel.textContent = "—";
    this.renderer.playInitialSequence(this.settings.introAnimation);
    if (!this.settings.muted) {
      void this.bgm.restartFromUserGesture();
    } else {
      this.bgm.rewind();
    }
    return true;
  }

  private setVoiceLocale(locale: VoiceLocale) {
    this.adapter.setUserPropertiesForDebug({ voicelanguage: locale });
  }

  private syncDebugControls(settings: Readonly<WallpaperSettings>) {
    const visibility = resolvePropertyGroupVisibility(settings);
    const voiceVolume = Math.round(settings.voiceVolume * 100);
    const bgmVolume = Math.round(settings.bgmVolume * 100);
    const panelFps = Math.min(Math.max(settings.fpsLimit || 15, 15), 160);
    this.qualityPresetSelect.value = settings.qualityPreset;
    this.qualityCustomControls.hidden = !visibility.qualityCustom;
    this.positionPresetSelect.value = settings.positionPreset;
    this.positionCustomControls.hidden = !visibility.positionCustom;
    this.modelScaleSlider.value = String(settings.modelScale);
    this.modelScaleOutput.value = settings.modelScale.toFixed(2);
    this.modelXSlider.value = String(settings.modelX);
    this.modelXOutput.value = String(settings.modelX);
    this.modelYSlider.value = String(settings.modelY);
    this.modelYOutput.value = String(settings.modelY);
    this.interactionPresetSelect.value = settings.interactionPreset;
    this.interactionCustomControls.hidden = !visibility.interactionCustom;
    this.introAnimationCheckbox.checked = settings.introAnimation;
    this.interactionsEnabledCheckbox.checked = settings.interactionsEnabled;
    this.mouseTrackingCheckbox.checked = settings.mouseTracking;
    this.headPattingCheckbox.checked = settings.headPatting;
    this.voiceEnabledCheckbox.checked = settings.voiceEnabled;
    this.interactionDependentControls.hidden = !visibility.interactionChildren;
    this.mutedCheckbox.checked = settings.muted;
    this.voiceVolumeControl.hidden = !visibility.voiceVolume;
    this.voiceVolumeSlider.value = String(voiceVolume);
    this.voiceVolumeOutput.value = `${voiceVolume}%`;
    this.dialoguePlaybackGroup.hidden = !visibility.dialogueControls;
    this.dialogueAutoPlayCheckbox.checked = settings.dialogueAutoPlay;
    this.dialogueLanguagePresetSelect.value = settings.dialogueLanguagePreset;
    this.dialogueCustomControls.hidden = !visibility.dialogueCustom;
    this.voiceLanguageSelect.value = settings.voiceLocale;
    this.showSubtitlesCheckbox.checked = settings.subtitlesEnabled;
    this.primarySubtitleLanguageControl.hidden =
      !visibility.primarySubtitleLanguage;
    this.primarySubtitleLanguageSelect.value = settings.primarySubtitleLocale;
    this.showSecondarySubtitlesControl.hidden = !visibility.secondarySubtitles;
    this.showSecondarySubtitlesCheckbox.checked =
      settings.secondarySubtitlesEnabled;
    this.secondarySubtitleLanguageControl.hidden =
      !visibility.secondarySubtitleLanguage;
    this.secondarySubtitleLanguageSelect.value = settings.secondarySubtitleLocale;
    this.bgmVolumeControl.hidden = !visibility.bgmVolume;
    this.bgmVolumeSlider.value = String(bgmVolume);
    this.bgmVolumeOutput.value = `${bgmVolume}%`;
    this.fpsSlider.value = String(panelFps);
    this.fpsOutput.value = `${panelFps} FPS`;
    this.renderResolutionSelect.value = settings.renderResolution;
    this.modelResolutionSelect.value = settings.modelResolution;
    this.panelLanguageSelect.value = settings.panelLocale;
    this.updateFpsLabel();
    const text = this.panelText;
    this.hitboxesButton.textContent = settings.drawHitboxes
      ? text.hideHitboxes
      : text.showHitboxes;
    this.restoreHostSettingsButton.disabled = !this.adapter.hasSessionOverrides;
  }

  private readonly syncPausedState = () => {
    this.lastFrameTime = performance.now() / 1000;
    this.frameLimiter.reset();
    this.resetPerformanceWindow();
    const paused = this.isPaused();
    if (paused) this.measuredFps = 0;
    this.updateFpsLabel();
    this.voice.setPaused(paused);
    this.bgm.setPaused(paused);
    if (paused) this.setPhase("paused");
    else if (this.phase !== "error") this.setPhase("running");
  };

  private isPaused() {
    return this.hostPaused || this.rendererUnavailable || document.hidden;
  }

  private handleRendererContextLost() {
    this.rendererUnavailable = true;
    this.lastFrameTime = performance.now() / 1000;
    this.frameLimiter.reset();
    this.resetPerformanceWindow();
    this.measuredFps = 0;
    this.updateFpsLabel();
    this.voice.setPaused(true);
    this.bgm.setPaused(true);
    this.setPhase("loading");
  }

  private handleRendererContextRestored() {
    this.rendererUnavailable = false;
    this.syncPausedState();
    this.updateViewportLabel();
  }

  private recordRenderPerformance(
    timestampMilliseconds: number,
    renderMilliseconds: number,
  ) {
    this.performanceFrameCount += 1;
    this.performanceRenderTotal += renderMilliseconds;
    this.performanceRenderMaximum = Math.max(
      this.performanceRenderMaximum,
      renderMilliseconds,
    );
    const elapsed = timestampMilliseconds - this.performanceWindowStartedAt;
    if (elapsed < 1000) return;
    this.measuredFps = Number(
      ((this.performanceFrameCount * 1000) / elapsed).toFixed(1),
    );
    this.averageRenderMilliseconds = Number(
      (this.performanceRenderTotal / this.performanceFrameCount).toFixed(3),
    );
    this.maximumRenderMilliseconds = Number(
      this.performanceRenderMaximum.toFixed(3),
    );
    this.root.dataset.actualFps = String(this.measuredFps);
    this.root.dataset.averageRenderMs = String(this.averageRenderMilliseconds);
    this.root.dataset.maximumRenderMs = String(this.maximumRenderMilliseconds);
    this.updateFpsLabel();
    this.resetPerformanceWindow(timestampMilliseconds);
  }

  private updateFpsLabel() {
    const currentFps = this.measuredFps.toFixed(1).replace(/\.0$/, "");
    const limit =
      this.settings.fpsLimit === 0
        ? this.panelText.unlimited
        : String(this.settings.fpsLimit);
    this.fpsLabel.textContent = `${currentFps}/${limit}`;
  }

  private resetPerformanceWindow(startedAt = performance.now()) {
    this.performanceWindowStartedAt = startedAt;
    this.performanceFrameCount = 0;
    this.performanceRenderTotal = 0;
    this.performanceRenderMaximum = 0;
  }

  private setPhase(phase: Phase) {
    this.phase = phase;
    this.root.dataset.phase = phase;
    this.phaseLabel.textContent = this.panelText.phases[phase];
    this.loadingLabel.textContent = this.panelText.loadingSpine;
    this.loading.hidden = phase === "running" || phase === "paused" || phase === "error";
  }

  private fail(error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(error);
    this.setPhase("error");
    this.errorLabel.hidden = false;
    this.errorLabel.textContent = message;
    this.debugPanelExpanded = true;
    this.syncDebugPanelVisibility();
  }

  private updateViewportLabel() {
    const snapshot = this.renderer?.getSnapshot();
    const viewport = snapshot?.viewport;
    if (!viewport || !snapshot) return;
    this.viewportLabel.textContent = `${Math.round(viewport.width)}×${Math.round(viewport.height)}`;
    const preset = RENDER_RESOLUTIONS[viewport.preset];
    const modelResolution = MODEL_RESOLUTIONS[snapshot.modelResolution];
    this.renderResolutionLabel.textContent =
      `${preset.label} · ${viewport.renderWidth}×${viewport.renderHeight}` +
      ` · ${modelResolution.label} texture`;
  }

  private updateBgmLabel(status: BgmStatus) {
    const snapshot = this.bgm.getSnapshot();
    this.bgmLabel.textContent = this.settings.muted
      ? this.panelText.muted
      : `${this.panelText.bgmStates[status]} · ${Math.round(this.settings.bgmVolume * 100)}%`;
    this.bgmLabel.dataset.currentTime = String(snapshot.currentTime);
  }

  private syncPanelText() {
    const text = this.panelText;
    document.documentElement.lang = this.settings.panelLocale === "en" ? "en" : "zh-CN";
    this.statusPanel.setAttribute("aria-label", text.panelAria);
    for (const element of this.statusPanel.querySelectorAll<HTMLElement>("[data-panel-text]")) {
      const key = element.dataset.panelText as keyof PanelText | undefined;
      const value = key ? text[key] : undefined;
      if (typeof value === "string") element.textContent = value;
    }
    for (const element of this.statusPanel.querySelectorAll<HTMLElement>("[data-panel-aria]")) {
      const key = element.dataset.panelAria as keyof PanelText | undefined;
      const value = key ? text[key] : undefined;
      if (typeof value === "string") element.setAttribute("aria-label", value);
    }
    this.phaseLabel.textContent = text.phases[this.phase];
    this.interactionLabel.textContent = text.interactions[this.interactionMode];
    this.lastActionLabel.textContent =
      this.lastAction === "—"
        ? "—"
        : text.interactions[this.lastAction as InteractionMode];
    this.loadingLabel.textContent = text.loadingSpine;
    this.syncDebugPanelVisibility();
  }

  private syncDebugPanelVisibility() {
    const available = this.debugFromQuery || this.settings.debugPanelEnabled;
    if (!available) this.debugPanelExpanded = false;
    const expanded = available && this.debugPanelExpanded;

    this.debugPanelToggle.hidden = !available;
    this.debugPanelToggle.disabled = !available;
    this.debugPanelToggle.setAttribute("aria-expanded", String(expanded));
    this.debugPanelToggle.textContent = expanded
      ? this.panelText.hideDebugPanel
      : this.panelText.showDebugPanel;
    this.debugPanelToggle.setAttribute("aria-label", this.debugPanelToggle.textContent);
    this.statusPanel.classList.toggle("status-panel--visible", expanded);
    this.statusPanel.setAttribute("aria-hidden", String(!expanded));
  }

  private get panelText(): PanelText {
    return PANEL_TEXT[this.settings.panelLocale];
  }

  private drawInteractionOverlay() {
    const geometry = this.renderer?.getInteractionGeometry();
    if (!geometry) return;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(Math.round(this.interactionOverlay.clientWidth * pixelRatio), 1);
    const height = Math.max(Math.round(this.interactionOverlay.clientHeight * pixelRatio), 1);
    if (this.interactionOverlay.width !== width) this.interactionOverlay.width = width;
    if (this.interactionOverlay.height !== height) this.interactionOverlay.height = height;
    const context = this.interactionOverlay.getContext("2d");
    if (!context) return;
    context.clearRect(0, 0, width, height);
    context.save();
    context.scale(pixelRatio, pixelRatio);
    context.lineWidth = 2;
    context.setLineDash([7, 5]);
    context.strokeStyle = "rgba(255, 126, 158, 0.85)";
    context.beginPath();
    context.ellipse(
      geometry.head.x,
      geometry.head.y,
      geometry.head.radiusX,
      geometry.head.radiusY,
      0,
      0,
      Math.PI * 2,
    );
    context.stroke();
    context.strokeStyle = "rgba(111, 202, 255, 0.75)";
    context.beginPath();
    context.ellipse(
      geometry.body.x,
      geometry.body.y,
      geometry.body.radiusX,
      geometry.body.radiusY,
      0,
      0,
      Math.PI * 2,
    );
    context.stroke();
    context.restore();
  }

  private clearInteractionOverlay() {
    const context = this.interactionOverlay.getContext("2d");
    context?.clearRect(0, 0, this.interactionOverlay.width, this.interactionOverlay.height);
  }

  private getElement<T extends typeof Element>(id: string, constructor: T): InstanceType<T> {
    const element = document.getElementById(id);
    if (!(element instanceof constructor)) throw new Error(`缺少页面元素 #${id}`);
    return element as InstanceType<T>;
  }
}
