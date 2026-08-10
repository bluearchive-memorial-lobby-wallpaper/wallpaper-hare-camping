import { DIALOGUES, type VoiceLocale } from "../config";
import { BgmPlayer, type BgmStatus } from "../audio/BgmPlayer";
import { VoicePlayer } from "../audio/VoicePlayer";
import { SubtitlePresenter } from "../dialogue/SubtitlePresenter";
import { PANEL_TEXT, type PanelText } from "../i18n/panel";
import { PointerInteractionController } from "../interaction/PointerInteractionController";
import {
  WallpaperEngineAdapter,
  type WallpaperSettings,
} from "../settings/WallpaperEngineAdapter";
import { RENDER_RESOLUTIONS } from "../settings/renderResolution";
import { MODEL_RESOLUTIONS } from "../settings/modelResolution";
import { FrameLimiter } from "../render/FrameLimiter";
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
  private readonly chineseButton: HTMLButtonElement;
  private readonly japaneseButton: HTMLButtonElement;
  private readonly koreanButton: HTMLButtonElement;
  private readonly voiceVolumeSlider: HTMLInputElement;
  private readonly voiceVolumeOutput: HTMLOutputElement;
  private readonly bgmVolumeSlider: HTMLInputElement;
  private readonly bgmVolumeOutput: HTMLOutputElement;
  private readonly fpsSlider: HTMLInputElement;
  private readonly fpsOutput: HTMLOutputElement;
  private readonly renderResolutionSelect: HTMLSelectElement;
  private readonly modelResolutionSelect: HTMLSelectElement;
  private readonly panelLanguageSelect: HTMLSelectElement;
  private readonly hitboxesButton: HTMLButtonElement;
  private readonly bgmToggleButton: HTMLButtonElement;
  private readonly restoreHostSettingsButton: HTMLButtonElement;
  private readonly adapter = new WallpaperEngineAdapter();
  private readonly subtitle: SubtitlePresenter;
  private readonly voice: VoicePlayer;
  private readonly bgm: BgmPlayer;
  private renderer?: SpineRenderer;
  private pointerController?: PointerInteractionController;
  private settings: Readonly<WallpaperSettings> = this.adapter.current;
  private phase: Phase = "booting";
  private animation = "—";
  private interactionMode: InteractionMode = "intro";
  private lastAction = "—";
  private lastSpineEvent = "—";
  private nextDialogueIndex = 1;
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
    this.chineseButton = this.getElement("debug-language-zh", HTMLButtonElement);
    this.japaneseButton = this.getElement("debug-language-ja", HTMLButtonElement);
    this.koreanButton = this.getElement("debug-language-ko", HTMLButtonElement);
    this.voiceVolumeSlider = this.getElement("debug-voice-volume", HTMLInputElement);
    this.voiceVolumeOutput = this.getElement(
      "debug-voice-volume-output",
      HTMLOutputElement,
    );
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
    this.bgmToggleButton = this.getElement("debug-bgm-toggle", HTMLButtonElement);
    this.restoreHostSettingsButton = this.getElement(
      "debug-restore-host-settings",
      HTMLButtonElement,
    );
    this.subtitle = new SubtitlePresenter(this.getElement("subtitle", HTMLElement));
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
          if (mode === "idle") this.subtitle.hide();
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
        { onDialogueRequested: () => this.playNextDialogue() },
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
    this.settings = settings;
    this.syncPanelText();
    this.renderer?.applySettings(settings);
    if (
      this.renderer &&
      previousSettings.introAnimation &&
      !settings.introAnimation
    ) {
      this.renderer.skipIntro();
    }
    if (
      this.renderer &&
      previousSettings.modelResolution !== settings.modelResolution
    ) {
      void this.renderer
        .setModelResolution(settings.modelResolution)
        .catch((error) => this.fail(error));
    }
    this.pointerController?.applySettings(settings);
    this.voice.configure(settings.voiceEnabled, settings.voiceVolume);
    this.bgm.configure(settings.bgmEnabled, settings.bgmVolume);
    this.updateBgmLabel(this.bgm.getSnapshot().status);
    this.subtitle.configure(settings.subtitlesEnabled, settings.subtitleLocale);
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

  private playNextDialogue(index = this.nextDialogueIndex): boolean {
    if (!this.renderer) return false;
    this.voice.stop();
    this.subtitle.hide();
    if (!this.renderer.playDialogue(index)) return false;
    this.nextDialogueIndex = (index % DIALOGUES.length) + 1;
    return true;
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
        nextDialogueIndex: this.nextDialogueIndex,
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
      skipToIdle: () => this.renderer?.playIdle(),
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
    this.skipIdleButton.addEventListener("click", () => this.renderer?.playIdle());
    this.dialogueButton.addEventListener("click", () => this.playNextDialogue());
    this.chineseButton.addEventListener("click", () => this.setVoiceLocale("zh-cn"));
    this.japaneseButton.addEventListener("click", () => this.setVoiceLocale("ja"));
    this.koreanButton.addEventListener("click", () => this.setVoiceLocale("ko"));
    this.voiceVolumeSlider.addEventListener("input", () =>
      this.adapter.setUserPropertiesForDebug({
        voicevolume: Number(this.voiceVolumeSlider.value),
      }),
    );
    this.bgmVolumeSlider.addEventListener("input", () =>
      this.adapter.setUserPropertiesForDebug({
        bgmvolume: Number(this.bgmVolumeSlider.value),
      }),
    );
    this.fpsSlider.addEventListener("input", () =>
      this.adapter.setFpsLimitForDebug(Number(this.fpsSlider.value)),
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
    this.bgmToggleButton.addEventListener("click", () =>
      this.adapter.setUserPropertiesForDebug({
        bgmenabled: !this.settings.bgmEnabled,
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
      target.closest("#debug-bgm-toggle, #debug-replay-intro")
    ) {
      return;
    }
    if (!this.settings.bgmEnabled || this.isPaused()) return;
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
    this.nextDialogueIndex = 1;
    this.lastSpineEvent = "—";
    this.eventLabel.textContent = "—";
    this.lastAction = "—";
    this.lastActionLabel.textContent = "—";
    this.renderer.playInitialSequence(this.settings.introAnimation);
    if (this.settings.bgmEnabled) {
      void this.bgm.restartFromUserGesture();
    } else {
      this.bgm.rewind();
      this.adapter.setUserPropertiesForDebug({ bgmenabled: true });
      void this.bgm.retryFromUserGesture();
    }
    return true;
  }

  private setVoiceLocale(locale: VoiceLocale) {
    this.adapter.setUserPropertiesForDebug({ voicelanguage: locale });
  }

  private syncDebugControls(settings: Readonly<WallpaperSettings>) {
    const voiceVolume = Math.round(settings.voiceVolume * 100);
    const bgmVolume = Math.round(settings.bgmVolume * 100);
    const panelFps = Math.min(Math.max(settings.fpsLimit || 30, 30), 160);
    this.voiceVolumeSlider.value = String(voiceVolume);
    this.voiceVolumeOutput.value = `${voiceVolume}%`;
    this.bgmVolumeSlider.value = String(bgmVolume);
    this.bgmVolumeOutput.value = `${bgmVolume}%`;
    this.fpsSlider.value = String(panelFps);
    this.fpsOutput.value = `${panelFps} FPS`;
    this.renderResolutionSelect.value = settings.renderResolution;
    this.modelResolutionSelect.value = settings.modelResolution;
    this.panelLanguageSelect.value = settings.panelLocale;
    this.chineseButton.setAttribute(
      "aria-pressed",
      String(settings.voiceLocale === "zh-cn"),
    );
    this.japaneseButton.setAttribute(
      "aria-pressed",
      String(settings.voiceLocale === "ja"),
    );
    this.koreanButton.setAttribute(
      "aria-pressed",
      String(settings.voiceLocale === "ko"),
    );
    const text = this.panelText;
    this.fpsLabel.textContent =
      settings.fpsLimit === 0 ? text.unlimited : String(settings.fpsLimit);
    this.hitboxesButton.textContent = settings.drawHitboxes
      ? text.hideHitboxes
      : text.showHitboxes;
    this.bgmToggleButton.textContent = settings.bgmEnabled
      ? text.disableBgm
      : text.enableBgm;
    this.restoreHostSettingsButton.disabled = !this.adapter.hasSessionOverrides;
  }

  private readonly syncPausedState = () => {
    this.lastFrameTime = performance.now() / 1000;
    this.frameLimiter.reset();
    this.resetPerformanceWindow();
    const paused = this.isPaused();
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
    this.resetPerformanceWindow(timestampMilliseconds);
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
    this.bgmLabel.textContent = `${this.panelText.bgmStates[status]} · ${Math.round(this.settings.bgmVolume * 100)}%`;
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
