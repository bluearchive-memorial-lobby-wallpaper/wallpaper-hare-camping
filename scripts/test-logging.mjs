import assert from "node:assert/strict";
import { createServer as createHttpServer } from "node:http";
import { readFile, unlink } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { createServer as createViteServer } from "vite";

class MemoryStorage {
  values = new Map();

  getItem(key) {
    return this.values.get(key) ?? null;
  }

  setItem(key, value) {
    this.values.set(key, String(value));
  }

  removeItem(key) {
    this.values.delete(key);
  }
}

const bootstrapSource = await readFile(
  path.resolve("public", "logging-bootstrap.js"),
  "utf8",
);

function launchBootstrap(localStorage, sessionStorage) {
  const listeners = new Map();
  const window = {
    localStorage,
    sessionStorage,
    location: { href: "file:///wallpaper/index.html" },
    addEventListener(type, listener) {
      const registered = listeners.get(type) ?? [];
      registered.push(listener);
      listeners.set(type, registered);
    },
  };
  window.window = window;
  vm.runInNewContext(bootstrapSource, { window }, { filename: "logging-bootstrap.js" });
  return { window, listeners };
}

const persistentStorage = new MemoryStorage();
const viewStorage = new MemoryStorage();
const crashedLoad = launchBootstrap(persistentStorage, viewStorage);
const crashedSessionId = crashedLoad.window.__hareLogBootstrap.sessionId;
for (const listener of crashedLoad.listeners.get("error") ?? []) {
  listener({
    message: "failure before application startup",
    filename: "early-runtime.js",
    lineno: 7,
    colno: 3,
    error: new Error("early crash"),
  });
}

const recoveredLoad = launchBootstrap(persistentStorage, viewStorage);
const recoveredSessions = recoveredLoad.window.__hareLogBootstrap.getSessions();
const crashedSession = recoveredSessions.find(
  (session) => session.id === crashedSessionId,
);
assert(crashedSession, "The previous load must remain available after a crash");
assert.equal(crashedSession.status, "interrupted");
assert(
  crashedSession.lines.some((line) =>
    line.includes("failure before application startup"),
  ),
  "An early global error must be persisted before the application starts",
);
for (const listener of recoveredLoad.listeners.get("beforeunload") ?? []) listener();
const cleanSession = recoveredLoad.window.__hareLogBootstrap
  .getSessions()
  .find((session) => session.id === recoveredLoad.window.__hareLogBootstrap.sessionId);
assert.equal(cleanSession?.status, "clean-exit");

const loggerSource = await readFile(
  path.resolve("..", "ba-memorylobby-wallpaper-runtime", "src", "logging", "WallpaperLogger.ts"),
  "utf8",
);
assert.equal(loggerSource.includes("window.alert("), false);
assert.equal(loggerSource.includes("showDirectoryPicker"), false);
assert.equal(loggerSource.includes("selectLogDirectory"), false);
assert.equal(loggerSource.includes('createElement("dialog")'), false);
assert.equal(loggerSource.includes("showModal()"), false);
assert.equal(loggerSource.includes("scrollHeight"), false);
assert.equal(loggerSource.includes("createObjectURL"), false);
assert.equal(loggerSource.includes("new Blob"), false);
assert.equal(loggerSource.includes("document.getElementById"), false);
assert(loggerSource.includes("getSessionSnapshot"));
const viewerControllerSource = await readFile(
  path.resolve("..", "ba-memorylobby-wallpaper-runtime", "src", "debug-ui", "LogViewerController.ts"),
  "utf8",
);
assert(viewerControllerSource.includes("class LogViewerController"));
assert(viewerControllerSource.includes("viewer.hidden = false"));
assert(viewerControllerSource.includes('document.execCommand("copy")'));
assert(viewerControllerSource.includes("onVisibilityChange"));
const sourceHtml = await readFile(path.resolve("index.html"), "utf8");
assert(sourceHtml.includes('id="wallpaper-log-viewer"'));
assert(sourceHtml.includes('id="wallpaper-log-viewer-content"'));
assert(sourceHtml.includes('<pre id="wallpaper-log-viewer-content"'));
assert.equal(sourceHtml.includes('<textarea id="wallpaper-log-viewer-content"'), false);
assert.equal(sourceHtml.includes('<select id="wallpaper-log-viewer-session"'), false);
assert(sourceHtml.includes('id="wallpaper-log-viewer-copy"'));
assert(sourceHtml.includes('class="wallpaper-log-viewer__close"'));
assert.equal(sourceHtml.includes('id="wallpaper-log-viewer-copy-hint"'), false);
assert(sourceHtml.includes("wallpaper-log-viewer--independent"));
assert(
  sourceHtml.indexOf('id="wallpaper-log-viewer"') >
    sourceHtml.indexOf('id="status-error"'),
  "The log viewer must be outside the debug panel surface",
);
const sourceCss = await readFile(path.resolve("src", "style.css"), "utf8");
const independentViewerRule = sourceCss.match(/\.wallpaper-log-viewer\s*\{([^}]*)\}/)?.[1];
assert(independentViewerRule?.includes("position: absolute"));
assert(independentViewerRule?.includes("top: 50%"));
assert(independentViewerRule?.includes("left: 50%"));
assert(independentViewerRule?.includes("zoom: var(--debug-panel-scale)"));
assert.equal(independentViewerRule?.includes("backdrop-filter"), false);

const sessionFile = "2026-08-14_12-34-56-789_test01.log";
const output = path.resolve("dist", "log", sessionFile);
const vite = await createViteServer({
  logLevel: "silent",
  server: { middlewareMode: true },
});
const server = createHttpServer(vite.middlewares);

try {
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  assert(address && typeof address === "object");
  const endpoint = `http://127.0.0.1:${address.port}/__hare-log/append`;

  const malformedResponse = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{not-json",
  });
  assert.equal(malformedResponse.status, 400);
  assert.equal(await malformedResponse.text(), "Invalid JSON payload");

  const oversizedResponse = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "x".repeat(1024 * 1024 + 1),
  });
  assert.equal(oversizedResponse.status, 413);
  assert.equal(await oversizedResponse.text(), "Log payload too large");

  const invalidResponse = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionFile: "../outside.log", lines: ["blocked"] }),
  });
  assert.equal(invalidResponse.status, 400);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionFile,
      lines: ["first log line", "second log line"],
    }),
  });
  assert.equal(response.status, 204);
  assert.equal(
    await readFile(output, "utf8"),
    "first log line\nsecond log line\n",
  );
  console.log(
    "Validated early crash recovery, persistent sessions, and the dist/log development mirror.",
  );
} finally {
  await new Promise((resolve) => server.close(resolve));
  await vite.close();
  await unlink(output).catch(() => undefined);
}

const pointerControllerSource = await readFile(
  path.resolve("..", "ba-memorylobby-wallpaper-runtime", "src", "debug-ui", "DebugPanelPointerController.ts"),
  "utf8",
);
assert(pointerControllerSource.includes("trackPointerHandlers"));
assert(pointerControllerSource.includes('removeEventListener("pointerdown", handler)'));
