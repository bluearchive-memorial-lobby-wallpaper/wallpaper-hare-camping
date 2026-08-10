import assert from "node:assert/strict";
import path from "node:path";
import { createServer } from "vite";

const root = path.resolve(import.meta.dirname, "..");
const server = await createServer({
  root,
  appType: "custom",
  logLevel: "silent",
  server: { middlewareMode: true },
});

try {
  globalThis.window = {};
  const { WallpaperEngineAdapter } = await server.ssrLoadModule(
    "/src/settings/WallpaperEngineAdapter.ts",
  );
  const adapter = new WallpaperEngineAdapter();
  const listener = window.wallpaperPropertyListener;

  assert.equal(adapter.current.debugPanelEnabled, false);
  listener.applyGeneralProperties({ fps: 60 });
  listener.applyUserProperties({
    debugpanelenabled: { value: true },
    bgmvolume: { value: 25 },
  });
  assert.equal(adapter.current.debugPanelEnabled, true);

  adapter.setFpsLimitForDebug(120);
  adapter.setUserPropertiesForDebug({ bgmvolume: 63 });
  assert.equal(adapter.current.fpsLimit, 120);
  assert.equal(adapter.current.bgmVolume, 0.63);
  assert.equal(adapter.settingsState.host.bgmVolume, 0.25);

  listener.applyUserProperties({ bgmvolume: { value: 40 } });
  assert.equal(adapter.current.bgmVolume, 0.4);
  assert.equal(adapter.current.fpsLimit, 120);
  assert.equal(adapter.settingsState.sessionOverrides.bgmVolume, undefined);
  assert.equal(adapter.settingsState.sessionOverrides.fpsLimit, 120);

  adapter.clearSessionOverrides();
  assert.equal(adapter.current.fpsLimit, 60);
  assert.deepEqual(adapter.settingsState.sessionOverrides, {});

  listener.applyUserProperties({ debugpanelenabled: { value: false } });
  assert.equal(adapter.current.debugPanelEnabled, false);

  listener.applyUserProperties({ introanimation: { value: false } });
  assert.equal(adapter.current.introAnimation, false);

  listener.applyUserProperties({ voicelanguage: { value: "ja" } });
  assert.equal(adapter.current.voiceLocale, "ja");
  console.log("Validated host settings and session override precedence.");
} finally {
  await server.close();
  delete globalThis.window;
}
