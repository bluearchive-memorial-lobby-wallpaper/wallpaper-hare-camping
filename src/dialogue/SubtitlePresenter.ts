import { findDialogueLine, type SubtitleLocale } from "../config";

export class SubtitlePresenter {
  private readonly element: HTMLElement;
  private locale: SubtitleLocale = "zh-cn";
  private enabled = true;
  private eventId: string | null = null;

  constructor(element: HTMLElement) {
    this.element = element;
  }

  configure(enabled: boolean, locale: SubtitleLocale) {
    this.enabled = enabled;
    this.locale = locale;
    if (this.eventId) this.show(this.eventId);
    else this.element.hidden = true;
  }

  show(eventId: string) {
    this.eventId = eventId;
    const line = findDialogueLine(eventId);
    if (!this.enabled || !line) {
      this.element.hidden = true;
      return;
    }
    this.element.textContent = line.text[this.locale];
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
      text: this.element.textContent,
      visible: !this.element.hidden,
      locale: this.locale,
      enabled: this.enabled,
    };
  }
}
