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
  const { resetAndApplyPlaybackPose } = await server.ssrLoadModule(
    "ba-memorylobby-wallpaper-runtime",
  );
  const calls = [];
  const skeleton = {
    setToSetupPose: () => calls.push("setup"),
    updateWorldTransform: () => calls.push("world"),
  };
  const state = {
    clearTracks: () => calls.push("clear"),
    apply: (target) => {
      assert.equal(target, skeleton);
      calls.push("apply");
    },
  };

  resetAndApplyPlaybackPose(skeleton, state, () => calls.push("configure"));
  assert.deepEqual(calls, ["clear", "setup", "configure", "apply", "world"]);

  console.log("Validated full Spine setup-pose reset before idle/intro playback.");
} finally {
  await server.close();
}
