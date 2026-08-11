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
  const { resolveSubtitlePresentation } = await server.ssrLoadModule(
    "/src/dialogue/SubtitlePresenter.ts",
  );
  const eventId = "CH0233_MemorialLobby_1_1";

  assert.equal(
    resolveSubtitlePresentation(eventId, false, "zh-cn", true, "ja"),
    null,
  );
  assert.deepEqual(
    resolveSubtitlePresentation(eventId, true, "zh-cn", false, "ja"),
    {
      primaryText: "天上充满了光……",
      secondaryText: null,
    },
  );
  assert.deepEqual(
    resolveSubtitlePresentation(eventId, true, "zh-cn", true, "ja"),
    {
      primaryText: "天上充满了光……",
      secondaryText: "空が、光でいっぱい……。",
    },
  );
  assert.deepEqual(
    resolveSubtitlePresentation(eventId, true, "ja", true, "ja"),
    {
      primaryText: "空が、光でいっぱい……。",
      secondaryText: null,
    },
  );
  assert.equal(
    resolveSubtitlePresentation("missing-event", true, "zh-cn", true, "ja"),
    null,
  );

  console.log("Validated single, dual, same-language, disabled, and missing subtitle states.");
} finally {
  await server.close();
}
