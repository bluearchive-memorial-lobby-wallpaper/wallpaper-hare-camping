export type LogCategory =
  | "lifecycle"
  | "error"
  | "animation"
  | "interaction"
  | "configuration";

type LogLevel = "INFO" | "WARN" | "ERROR";
type LogViewerLocale = "zh-cn" | "en";

interface LogRecord {
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  details?: unknown;
}

interface StoredLogSession {
  id: string;
  fileName: string;
  startedAt: string;
  updatedAt: string;
  endedAt: string | null;
  status: "running" | "clean-exit" | "interrupted";
  truncated: boolean;
  lines: string[];
}

const LOG_ENDPOINT = "/__hare-log";
const MAX_MEMORY_LINES = 4000;

const VIEWER_TEXT = {
  "zh-cn": {
    title: "壁纸日志",
    session: "日志会话",
    close: "关闭",
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
    content: "Log content",
    copyHint: "Read-only log; use Ctrl+A and Ctrl+C to copy it.",
    current: "Current",
    cleanExit: "Clean exit",
    interrupted: "Interrupted",
    possiblyInterrupted: "Did not exit cleanly",
    truncated: "Older entries were removed because of the storage limit.",
  },
} as const;

function pad(value: number, width = 2) {
  return String(value).padStart(width, "0");
}

function createFallbackSessionIdentity(now: Date) {
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}-${pad(now.getMilliseconds(), 3)}`;
  const random = Math.random().toString(36).slice(2).padEnd(6, "0").slice(0, 6);
  const id = `${date}_${time}_${random}`;
  return { id, fileName: `${id}.log`, startedAt: now.toISOString() };
}

function normalizeDetails(details: unknown): unknown {
  if (details instanceof Error) {
    return {
      name: details.name,
      message: details.message,
      stack: details.stack,
    };
  }
  return details;
}

function safeStringify(value: unknown) {
  const seen = new WeakSet<object>();
  try {
    return JSON.stringify(value, (_key, nestedValue: unknown) => {
      if (typeof nestedValue === "bigint") return String(nestedValue);
      if (typeof nestedValue !== "object" || nestedValue === null) return nestedValue;
      if (seen.has(nestedValue)) return "[Circular]";
      seen.add(nestedValue);
      return nestedValue;
    });
  } catch {
    return JSON.stringify(String(value));
  }
}

function formatRecord(record: LogRecord) {
  const details =
    record.details === undefined
      ? ""
      : ` ${safeStringify(normalizeDetails(record.details))}`;
  return `[${record.timestamp}] [${record.level}] [${record.category}] ${record.message}${details}`;
}

function renderLogViewer(
  sessions: StoredLogSession[],
  currentSessionId: string,
  locale: LogViewerLocale,
) {
  const text = VIEWER_TEXT[locale];
  const viewer = document.getElementById("wallpaper-log-viewer");
  const title = document.getElementById("wallpaper-log-viewer-title");
  const closeButton = document.getElementById("wallpaper-log-viewer-close");
  const sessionLabel = document.getElementById(
    "wallpaper-log-viewer-session-label",
  );
  const sessionSelect = document.getElementById("wallpaper-log-viewer-session");
  const notice = document.getElementById("wallpaper-log-viewer-notice");
  const content = document.getElementById("wallpaper-log-viewer-content");
  const copyHint = document.getElementById("wallpaper-log-viewer-copy-hint");
  if (
    !(viewer instanceof HTMLElement) ||
    !(title instanceof HTMLElement) ||
    !(closeButton instanceof HTMLButtonElement) ||
    !(sessionLabel instanceof HTMLElement) ||
    !(sessionSelect instanceof HTMLSelectElement) ||
    !(notice instanceof HTMLParagraphElement) ||
    !(content instanceof HTMLTextAreaElement) ||
    !(copyHint instanceof HTMLParagraphElement)
  ) {
    throw new Error("Log viewer markup is incomplete");
  }

  viewer.setAttribute("aria-label", text.title);
  title.textContent = text.title;
  sessionLabel.textContent = text.session;
  closeButton.textContent = text.close;
  content.setAttribute("aria-label", text.content);
  copyHint.textContent = text.copyHint;
  sessionSelect.replaceChildren();

  for (const session of sessions) {
    const option = document.createElement("option");
    option.value = session.id;
    const status =
      session.id === currentSessionId
        ? text.current
        : session.status === "clean-exit"
          ? text.cleanExit
          : session.status === "interrupted"
            ? text.interrupted
            : text.possiblyInterrupted;
    option.textContent = `${session.fileName} · ${status}`;
    option.selected = session.id === currentSessionId;
    sessionSelect.append(option);
  }

  const getSelectedSession = () =>
    sessions.find((session) => session.id === sessionSelect.value) ?? sessions[0];
  const showSelectedSession = () => {
    const selected = getSelectedSession();
    if (!selected) {
      content.value = "";
      return;
    }
    content.value = `${selected.lines.join("\n")}\n`;
    notice.textContent = selected.truncated ? text.truncated : "";
    notice.hidden = !selected.truncated;
  };
  sessionSelect.onchange = showSelectedSession;
  closeButton.onclick = () => {
    viewer.hidden = true;
  };
  showSelectedSession();
  viewer.hidden = false;
}

export class WallpaperLogger {
  readonly sessionFileName: string;

  private readonly sessionId: string;
  private readonly fallbackSessionStartedAt: string;
  private readonly lines: string[] = [];
  private backend: "probing" | "http" | "persistent" = "probing";
  private writeChain = Promise.resolve();
  private globalHandlersInstalled = false;

  constructor() {
    const fallback = createFallbackSessionIdentity(new Date());
    const bootstrap = typeof window === "undefined" ? undefined : window.__hareLogBootstrap;
    this.sessionId = bootstrap?.sessionId ?? fallback.id;
    this.sessionFileName = bootstrap?.sessionFileName ?? fallback.fileName;
    this.fallbackSessionStartedAt = fallback.startedAt;
    const currentSession = bootstrap
      ?.getSessions()
      .find((session) => session.id === this.sessionId);
    if (currentSession) this.lines.push(...currentSession.lines);
  }

  start() {
    if (!window.__hareLogBootstrap?.handlesGlobalErrors) {
      this.installGlobalErrorHandlers();
    }
    this.info("lifecycle", "wallpaper application load started", {
      sessionFile: this.sessionFileName,
      userAgent: navigator.userAgent,
    });
    void this.resolveBackend();
  }

  info(category: LogCategory, message: string, details?: unknown) {
    this.append("INFO", category, message, details);
  }

  warn(category: LogCategory, message: string, details?: unknown) {
    this.append("WARN", category, message, details);
  }

  error(category: LogCategory, message: string, details?: unknown) {
    this.append("ERROR", category, message, details);
  }

  openLogs(locale: LogViewerLocale) {
    this.info("interaction", "debug panel open logs clicked");
    const sessions = this.getStoredSessions();
    renderLogViewer(sessions, this.sessionId, locale);
  }

  private append(
    level: LogLevel,
    category: LogCategory,
    message: string,
    details?: unknown,
  ) {
    const line = formatRecord({
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      details,
    });
    this.lines.push(line);
    if (this.lines.length > MAX_MEMORY_LINES) this.lines.shift();
    window.__hareLogBootstrap?.append(line);
    if (this.backend === "http") this.queueHttpAppend(line);
  }

  private getStoredSessions(): StoredLogSession[] {
    const sessions = window.__hareLogBootstrap?.getSessions() ?? [];
    if (sessions.length > 0) return sessions;
    return [
      {
        id: this.sessionId,
        fileName: this.sessionFileName,
        startedAt: this.fallbackSessionStartedAt,
        updatedAt: new Date().toISOString(),
        endedAt: null,
        status: "running",
        truncated: this.lines.length >= MAX_MEMORY_LINES,
        lines: [...this.lines],
      },
    ];
  }

  private async resolveBackend() {
    if (location.protocol === "http:" || location.protocol === "https:") {
      try {
        const initialLines = [...this.lines];
        const response = await fetch(`${LOG_ENDPOINT}/append`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionFile: this.sessionFileName,
            lines: initialLines,
          }),
        });
        if (response.ok) {
          this.backend = "http";
          for (const line of this.lines.slice(initialLines.length)) {
            this.queueHttpAppend(line);
          }
          return;
        }
      } catch {
        // Static servers do not provide the optional development log bridge.
      }
    }
    this.backend = "persistent";
  }

  private queueHttpAppend(line: string) {
    this.writeChain = this.writeChain
      .then(async () => {
        const response = await fetch(`${LOG_ENDPOINT}/append`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionFile: this.sessionFileName, lines: [line] }),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
      })
      .catch((error) => {
        this.backend = "persistent";
        console.warn("开发日志文件桥接不可用，日志仍保存在壁纸持久存储中。", error);
      });
  }

  private installGlobalErrorHandlers() {
    if (this.globalHandlersInstalled) return;
    this.globalHandlersInstalled = true;
    window.addEventListener("error", (event) => {
      this.error("error", "uncaught runtime error", {
        message: event.message,
        file: event.filename,
        line: event.lineno,
        column: event.colno,
        error: normalizeDetails(event.error),
      });
    });
    window.addEventListener("unhandledrejection", (event) => {
      this.error("error", "unhandled promise rejection", normalizeDetails(event.reason));
    });
  }
}

export const wallpaperLogger = new WallpaperLogger();
