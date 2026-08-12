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

class FakeAudio {
  static instances = [];

  constructor() {
    FakeAudio.instances.push(this);
    this.src = "";
    this.paused = true;
    this.currentTime = 0;
    this.duration = Number.NaN;
    this.volume = 1;
    this.playCalls = 0;
    this.loadCalls = 0;
  }

  addEventListener() {}

  removeAttribute(name) {
    if (name === "src") this.src = "";
  }

  load() {
    this.loadCalls += 1;
  }

  pause() {
    this.paused = true;
  }

  async play() {
    this.playCalls += 1;
    this.paused = false;
  }
}

try {
  globalThis.Audio = FakeAudio;
  const { BgmPlayer } = await server.ssrLoadModule("/src/audio/BgmPlayer.ts");
  const player = new BgmPlayer({
    onStatusChange: () => {},
    onError: (message) => assert.fail(message),
  });
  const audio = FakeAudio.instances[0];

  assert.equal(audio.src, "");
  assert.equal(audio.playCalls, 0);
  player.configure(false, 0.5);
  assert.equal(audio.src, "");
  player.configure(true, 0.5);
  await Promise.resolve();
  assert.match(audio.src, /Starry Confession\.flac$/);
  assert.equal(audio.playCalls, 1);
  assert.equal(audio.volume, 0.5);
  player.dispose();
  assert.equal(audio.src, "");

  console.log("Validated lazy BGM source assignment after model startup configuration.");
} finally {
  await server.close();
  delete globalThis.Audio;
}
