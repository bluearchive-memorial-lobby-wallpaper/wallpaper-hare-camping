import { findDialogueLine, type SubtitleLocale } from "../config";
import {
  applySubtitleLayout,
  type SubtitleAlignment,
  type SubtitlePosition,
} from "ba-memorylobby-wallpaper-runtime";

export interface SubtitlePresentation {
  primaryText: string;
  secondaryText: string | null;
}

export function resolveSubtitlePresentation(
  eventId: string,
  enabled: boolean,
  primaryLocale: SubtitleLocale,
  secondaryEnabled: boolean,
  secondaryLocale: SubtitleLocale,
): SubtitlePresentation | null {
  const line = findDialogueLine(eventId);
  if (!enabled || !line) return null;
  return {
    primaryText: line.text[primaryLocale],
    secondaryText:
      secondaryEnabled && secondaryLocale !== primaryLocale
        ? line.text[secondaryLocale]
        : null,
  };
}

export class SubtitlePresenter {
  private readonly element: HTMLElement;
  private readonly primaryElement: HTMLElement;
  private readonly secondaryElement: HTMLElement;
  private primaryLocale: SubtitleLocale = "zh-cn";
  private secondaryEnabled = false;
  private secondaryLocale: SubtitleLocale = "ja";
  private subtitleAlignment: SubtitleAlignment = "center";
  private subtitlePosition: SubtitlePosition = "bottom-center";
  private subtitleX = 0;
  private subtitleY = 0;
  private enabled = true;
  private eventId: string | null = null;

  constructor(
    element: HTMLElement,
    primaryElement: HTMLElement,
    secondaryElement: HTMLElement,
  ) {
    this.element = element;
    this.primaryElement = primaryElement;
    this.secondaryElement = secondaryElement;
  }

  configure(
    enabled: boolean,
    primaryLocale: SubtitleLocale,
    secondaryEnabled: boolean,
    secondaryLocale: SubtitleLocale,
    subtitleAlignment: SubtitleAlignment,
    subtitlePosition: SubtitlePosition,
    subtitleX: number,
    subtitleY: number,
  ) {
    this.enabled = enabled;
    this.primaryLocale = primaryLocale;
    this.secondaryEnabled = secondaryEnabled;
    this.secondaryLocale = secondaryLocale;
    this.subtitleAlignment = subtitleAlignment;
    this.subtitlePosition = subtitlePosition;
    this.subtitleX = subtitleX;
    this.subtitleY = subtitleY;
    applySubtitleLayout(this.element, {
      subtitleAlignment: this.subtitleAlignment,
      subtitlePosition: this.subtitlePosition,
      subtitleX: this.subtitleX,
      subtitleY: this.subtitleY,
    });
    if (this.eventId) this.show(this.eventId);
    else this.element.hidden = true;
  }

  show(eventId: string) {
    this.eventId = eventId;
    const presentation = resolveSubtitlePresentation(
      eventId,
      this.enabled,
      this.primaryLocale,
      this.secondaryEnabled,
      this.secondaryLocale,
    );
    if (!presentation) {
      this.element.hidden = true;
      return;
    }
    this.primaryElement.textContent = presentation.primaryText;
    this.secondaryElement.textContent = presentation.secondaryText ?? "";
    this.secondaryElement.hidden = presentation.secondaryText === null;
    this.element.hidden = false;
  }

  hide(eventId?: string) {
    if (eventId && this.eventId?.toLowerCase() !== eventId.toLowerCase()) return;
    this.eventId = null;
    this.element.hidden = true;
  }

  getSnapshot() {
    return {
      eventId: this.eventId,
      primaryText: this.primaryElement.textContent,
      secondaryText: this.secondaryElement.hidden
        ? null
        : this.secondaryElement.textContent,
      visible: !this.element.hidden,
      primaryLocale: this.primaryLocale,
      secondaryLocale: this.secondaryLocale,
      enabled: this.enabled,
      secondaryEnabled: this.secondaryEnabled,
      subtitleAlignment: this.subtitleAlignment,
      subtitlePosition: this.subtitlePosition,
      subtitleX: this.subtitleX,
      subtitleY: this.subtitleY,
    };
  }
}
