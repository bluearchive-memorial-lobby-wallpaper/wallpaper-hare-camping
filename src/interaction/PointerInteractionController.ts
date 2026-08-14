import type { InteractionDefinition } from "ba-memorylobby-wallpaper-runtime";
import type { WallpaperSettings } from "../settings/WallpaperEngineAdapter";
import type { SpineRenderer } from "../spine/SpineRenderer";
import {
  canTriggerDialogue,
  didInteractionSettingsChange,
} from "./interactionSettings";

type PointerIntent = "dialogue" | "look" | "pat";

interface PointerInteractionCallbacks {
  onDialogueRequested: () => boolean;
  onInteractionCompleted: (interaction: {
    intent: PointerIntent;
    accepted: boolean;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  }) => void;
}

export class PointerInteractionController {
  private readonly canvas: HTMLCanvasElement;
  private readonly renderer: SpineRenderer;
  private readonly callbacks: PointerInteractionCallbacks;
  private readonly dragThresholdPixels: number;
  private settings?: Readonly<WallpaperSettings>;
  private active?: {
    id: number;
    intent: PointerIntent;
    startX: number;
    startY: number;
    lastX: number;
    lastY: number;
  };

  constructor(
    canvas: HTMLCanvasElement,
    renderer: SpineRenderer,
    interaction: Pick<InteractionDefinition, "dragThresholdPixels"> & {
      readonly dragThresholdPixels: number;
    },
    callbacks: PointerInteractionCallbacks,
  ) {
    this.canvas = canvas;
    this.renderer = renderer;
    this.dragThresholdPixels = interaction.dragThresholdPixels;
    this.callbacks = callbacks;
    canvas.addEventListener("pointerdown", this.onPointerDown);
    canvas.addEventListener("pointermove", this.onPointerMove);
    canvas.addEventListener("pointerup", this.onPointerUp);
    canvas.addEventListener("pointercancel", this.onPointerCancel);
    canvas.addEventListener("contextmenu", this.onContextMenu);
  }

  applySettings(settings: Readonly<WallpaperSettings>) {
    const previousSettings = this.settings;
    this.settings = settings;
    if (
      !settings.interactionsEnabled ||
      (previousSettings && didInteractionSettingsChange(previousSettings, settings))
    ) {
      this.cancelActive();
    }
  }

  dispose() {
    this.cancelActive();
    this.canvas.removeEventListener("pointerdown", this.onPointerDown);
    this.canvas.removeEventListener("pointermove", this.onPointerMove);
    this.canvas.removeEventListener("pointerup", this.onPointerUp);
    this.canvas.removeEventListener("pointercancel", this.onPointerCancel);
    this.canvas.removeEventListener("contextmenu", this.onContextMenu);
  }

  getSnapshot() {
    return this.active ? { ...this.active } : null;
  }

  private readonly onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0 || !this.settings?.interactionsEnabled || this.active) return;
    const region = this.renderer.hitTest(event.clientX, event.clientY);
    if (region === "background") return;

    let intent: PointerIntent = "dialogue";
    if (region === "head" && this.settings.headPatting) intent = "pat";
    if (intent === "pat" && !this.renderer.beginPat()) return;

    this.active = {
      id: event.pointerId,
      intent,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
    };
    this.canvas.setPointerCapture(event.pointerId);
    this.canvas.dataset.pointerIntent = intent;
    event.preventDefault();
  };

  private readonly onPointerMove = (event: PointerEvent) => {
    const active = this.active;
    if (!active || active.id !== event.pointerId) {
      const region = this.settings?.interactionsEnabled
        ? this.renderer.hitTest(event.clientX, event.clientY)
        : "background";
      this.canvas.dataset.hitRegion = region;
      return;
    }

    const deltaX = event.clientX - active.lastX;
    const deltaY = event.clientY - active.lastY;
    active.lastX = event.clientX;
    active.lastY = event.clientY;

    if (active.intent === "dialogue" && this.settings?.mouseTracking) {
      const distance = Math.hypot(
        event.clientX - active.startX,
        event.clientY - active.startY,
      );
      if (distance >= this.dragThresholdPixels && this.renderer.beginLook()) {
        active.intent = "look";
        this.canvas.dataset.pointerIntent = "look";
      }
    }

    if (active.intent === "look") this.renderer.updateLook(event.clientX, event.clientY);
    else if (active.intent === "pat") this.renderer.updatePat(deltaX, deltaY);
    event.preventDefault();
  };

  private readonly onPointerUp = (event: PointerEvent) => {
    const active = this.active;
    if (!active || active.id !== event.pointerId) return;
    let accepted = true;
    if (active.intent === "look") this.renderer.endLook();
    else if (active.intent === "pat") this.renderer.endPat();
    else if (this.settings && canTriggerDialogue(this.settings)) {
      accepted = this.callbacks.onDialogueRequested();
    } else accepted = false;
    this.callbacks.onInteractionCompleted({
      intent: active.intent,
      accepted,
      startX: active.startX,
      startY: active.startY,
      endX: event.clientX,
      endY: event.clientY,
    });
    this.releaseActive(event.pointerId);
    event.preventDefault();
  };

  private readonly onPointerCancel = (event: PointerEvent) => {
    if (this.active?.id !== event.pointerId) return;
    this.renderer.cancelInteraction();
    this.releaseActive(event.pointerId);
  };

  private readonly onContextMenu = (event: MouseEvent) => event.preventDefault();

  private cancelActive() {
    if (!this.active) return;
    this.renderer.cancelInteraction();
    this.releaseActive(this.active.id);
  }

  private releaseActive(pointerId: number) {
    if (this.canvas.hasPointerCapture(pointerId)) this.canvas.releasePointerCapture(pointerId);
    this.active = undefined;
    delete this.canvas.dataset.pointerIntent;
  }
}
