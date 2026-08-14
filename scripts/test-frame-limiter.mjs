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
  const { FrameLimiter } = await import("ba-memorylobby-wallpaper-runtime");
  const sourceFps = 240;
  const seconds = 10;
  for (const fpsLimit of [15, 30, 60, 160, 0]) {
    const limiter = new FrameLimiter();
    let frames = 0;
    let animationTime = 0;
    for (let index = 0; index < sourceFps * seconds; index += 1) {
      const delta = limiter.advance(1 / sourceFps, fpsLimit);
      if (delta === null) continue;
      frames += 1;
      animationTime += delta;
    }
    const expectedFrames = fpsLimit > 0 ? fpsLimit * seconds : sourceFps * seconds;
    assert.ok(
      Math.abs(frames - expectedFrames) <= 1,
      `${fpsLimit || "unlimited"} FPS produced ${frames} frames`,
    );
    assert.ok(
      Math.abs(animationTime - seconds) < 0.001,
      `${fpsLimit || "unlimited"} FPS advanced ${animationTime} seconds`,
    );
  }

  const limiter = new FrameLimiter();
  assert.equal(limiter.advance(1 / 120, 30), null);
  limiter.reset();
  assert.equal(limiter.advance(1 / 120, 30), null);
  console.log("Validated 15/30/60/160/unlimited FPS timing and reset behavior.");
} finally {
  await server.close();
}
