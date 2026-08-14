import type { StoredLogSession } from "../logging/WallpaperLogger";

type LogViewerLocale = "zh-cn" | "en";

const VIEWER_TEXT = {
  "zh-cn": {
    title: "壁纸日志",
    session: "日志会话",
    close: "关闭",
    previousSession: "上一份日志",
    nextSession: "下一份日志",
    content: "日志内容",
    copyHint: "只读日志；可使用 Ctrl+A、Ctrl+C 复制。",
    current: "当前运行",
    cleanExit: "正常结束",
    interrupted: "异常中断",
    possiblyInterrupted: "未正常结束",
    truncated: "较早的日志已因容量限制被清理。",
  },
  en: {
    title: "Wallpaper logs",
    session: "Log session",
    close: "Close",
    previousSession: "Previous log",
    nextSession: "Next log",
    content: "Log content",
    copyHint: "Read-only log; use Ctrl+A and Ctrl+C to copy it.",
    current: "Current",
    cleanExit: "Clean exit",
    interrupted: "Interrupted",
    possiblyInterrupted: "Did not exit cleanly",
    truncated: "Older entries were removed because of the storage limit.",
  },
} as const;

interface LogSessionSnapshot {
  currentSessionId: string;
  sessions: StoredLogSession[];
}

export class LogViewerController {
  private readonly viewer: HTMLElement;
  private readonly title: HTMLElement;
  private readonly closeButton: HTMLButtonElement;
  private readonly sessionLabel: HTMLElement;
  private readonly previousSessionButton: HTMLButtonElement;
  private readonly nextSessionButton: HTMLButtonElement;
  private readonly notice: HTMLParagraphElement;
  private readonly content: HTMLPreElement;
  private readonly copyHint: HTMLParagraphElement;
  private readonly getSnapshot: () => LogSessionSnapshot;
  private readonly onLayoutChange: () => void;
  private readonly onInteraction: (
    action: "close" | "session-change",
    details?: Record<string, unknown>,
  ) => void;
  private sessions: StoredLogSession[] = [];
  private currentSessionId = "";
  private locale: LogViewerLocale = "zh-cn";
  private contentRenderTimer = 0;
  private selectedSessionIndex = 0;

  constructor(options: {
    viewer: HTMLElement;
    title: HTMLElement;
    closeButton: HTMLButtonElement;
    sessionLabel: HTMLElement;
    previousSessionButton: HTMLButtonElement;
    nextSessionButton: HTMLButtonElement;
    notice: HTMLParagraphElement;
    content: HTMLPreElement;
    copyHint: HTMLParagraphElement;
    getSnapshot: () => LogSessionSnapshot;
    onLayoutChange: () => void;
    onInteraction: (
      action: "close" | "session-change",
      details?: Record<string, unknown>,
    ) => void;
  }) {
    this.viewer = options.viewer;
    this.title = options.title;
    this.closeButton = options.closeButton;
    this.sessionLabel = options.sessionLabel;
    this.previousSessionButton = options.previousSessionButton;
    this.nextSessionButton = options.nextSessionButton;
    this.notice = options.notice;
    this.content = options.content;
    this.copyHint = options.copyHint;
    this.getSnapshot = options.getSnapshot;
    this.onLayoutChange = options.onLayoutChange;
    this.onInteraction = options.onInteraction;
    this.closeButton.addEventListener("click", this.close);
    this.previousSessionButton.addEventListener("click", this.showPreviousSession);
    this.nextSessionButton.addEventListener("click", this.showNextSession);
  }

  open(locale: LogViewerLocale) {
    this.locale = locale;
    const snapshot = this.getSnapshot();
    this.sessions = snapshot.sessions;
    this.currentSessionId = snapshot.currentSessionId;
    this.renderText();
    this.sessionLabel.textContent = VIEWER_TEXT[this.locale].session;
    this.content.textContent = "";
    this.notice.hidden = true;
    this.viewer.hidden = false;
    this.onLayoutChange();
    window.clearTimeout(this.contentRenderTimer);
    this.contentRenderTimer = window.setTimeout(() => {
      this.renderSessions();
      this.showSelectedSession();
      this.onLayoutChange();
    }, 100);
  }

  dispose() {
    window.clearTimeout(this.contentRenderTimer);
    this.closeButton.removeEventListener("click", this.close);
    this.previousSessionButton.removeEventListener("click", this.showPreviousSession);
    this.nextSessionButton.removeEventListener("click", this.showNextSession);
  }

  private renderText() {
    const text = VIEWER_TEXT[this.locale];
    this.viewer.setAttribute("aria-label", text.title);
    this.title.textContent = text.title;
    this.closeButton.textContent = text.close;
    this.previousSessionButton.setAttribute("aria-label", text.previousSession);
    this.nextSessionButton.setAttribute("aria-label", text.nextSession);
    this.content.setAttribute("aria-label", text.content);
    this.copyHint.textContent = text.copyHint;
  }

  private renderSessions() {
    const currentIndex = this.sessions.findIndex(
      (session) => session.id === this.currentSessionId,
    );
    this.selectedSessionIndex = currentIndex >= 0 ? currentIndex : 0;
    const multipleSessions = this.sessions.length > 1;
    this.previousSessionButton.disabled = !multipleSessions;
    this.nextSessionButton.disabled = !multipleSessions;
  }

  private readonly showSelectedSession = () => {
    const selected = this.sessions[this.selectedSessionIndex];
    if (!selected) {
      this.content.textContent = "";
      this.sessionLabel.textContent = VIEWER_TEXT[this.locale].session;
      this.notice.hidden = true;
      this.onLayoutChange();
      return;
    }
    const text = VIEWER_TEXT[this.locale];
    const status =
      selected.id === this.currentSessionId
        ? text.current
        : selected.status === "clean-exit"
          ? text.cleanExit
          : selected.status === "interrupted"
            ? text.interrupted
            : text.possiblyInterrupted;
    this.sessionLabel.textContent = `${selected.fileName} · ${status}`;
    this.content.textContent = `${selected.lines.join("\n")}\n`;
    this.content.scrollTop = 0;
    this.content.scrollLeft = 0;
    this.notice.textContent = selected.truncated
      ? text.truncated
      : "";
    this.notice.hidden = !selected.truncated;
    this.onLayoutChange();
  };

  private changeSession(offset: number) {
    if (this.sessions.length <= 1) return;
    this.selectedSessionIndex =
      (this.selectedSessionIndex + offset + this.sessions.length) %
      this.sessions.length;
    this.showSelectedSession();
    this.onInteraction("session-change", {
      sessionId: this.sessions[this.selectedSessionIndex]?.id,
    });
  }

  private readonly showPreviousSession = () => this.changeSession(-1);

  private readonly showNextSession = () => this.changeSession(1);

  private readonly close = () => {
    window.clearTimeout(this.contentRenderTimer);
    this.viewer.hidden = true;
    this.onLayoutChange();
    this.onInteraction("close");
  };
}
