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
  const {
    applySubtitleLayout,
    isSubtitleAlignment,
    isSubtitlePosition,
  } = await server.ssrLoadModule("/src/dialogue/subtitleLayout.ts");
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

  const properties = new Map();
  const element = {
    dataset: {},
    style: { setProperty: (key, value) => properties.set(key, value) },
  };
  applySubtitleLayout(element, {
    subtitleAlignment: "right",
    subtitlePosition: "custom",
    subtitleX: 1000,
    subtitleY: -1000,
  });
  assert.deepEqual(element.dataset, {
    alignment: "right",
    position: "custom",
  });
  assert.equal(properties.get("--subtitle-x"), "1000px");
  assert.equal(properties.get("--subtitle-y"), "-1000px");
  assert.equal(isSubtitleAlignment("left"), true);
  assert.equal(isSubtitleAlignment("invalid"), false);
  assert.equal(isSubtitlePosition("bottom-left"), true);
  assert.equal(isSubtitlePosition("invalid"), false);

  console.log("Validated subtitle text states, alignment, preset positions, and custom offsets.");
} finally {
  await server.close();
}
