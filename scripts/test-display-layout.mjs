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
  const { MODEL } = await server.ssrLoadModule("/src/config.ts");
  const { calculateViewportLayout } = await server.ssrLoadModule(
    "/src/spine/viewportLayout.ts",
  );
  const cases = [
    ["1080p 16:9", 1920, 1080, 1920, 1080, 3200, 1800],
    ["1440p 16:9", 2560, 1440, 1920, 1080, 3200, 1800],
    ["2160p 16:9", 3840, 2160, 1920, 1080, 3200, 1800],
    ["1200p 16:10", 1920, 1200, 1728, 1080, 3200, 2000],
    ["1600p 16:10", 2560, 1600, 1728, 1080, 3200, 2000],
    ["UWQHD 21:9", 3440, 1440, 2580, 1080, 3200, 1339.535],
    ["DQHD 32:9", 5120, 1440, 3840, 1080, 3200, 900],
    ["XGA 4:3", 1024, 768, 1440, 1080, 2666.667, 2000],
  ];

  for (const [name, cssWidth, cssHeight, renderWidth, renderHeight, worldWidth, worldHeight] of cases) {
    const layout = calculateViewportLayout({
      cssWidth,
      cssHeight,
      requestedHeight: 1080,
      maximumWidth: 32768,
      maximumHeight: 32768,
      modelScale: 0.8,
      modelX: 0,
      modelY: 0,
      designViewport: MODEL.designViewport,
    });
    assert.equal(layout.pixelWidth, renderWidth, `${name} render width`);
    assert.equal(layout.pixelHeight, renderHeight, `${name} render height`);
    assert.ok(Math.abs(layout.worldRect.width - worldWidth) < 0.001, `${name} world width`);
    assert.ok(Math.abs(layout.worldRect.height - worldHeight) < 0.001, `${name} world height`);
    assert.ok(
      Math.abs(layout.worldRect.left + layout.worldRect.width / 2) < 0.001,
      `${name} horizontal center`,
    );
    assert.ok(
      Math.abs(layout.worldRect.bottom + layout.worldRect.height / 2 - 900) < 0.001,
      `${name} vertical center`,
    );
  }

  console.log("Validated frozen 0.8/0/0 composition math across 4:3, 16:9, 16:10, 21:9, and 32:9 displays.");
} finally {
  await server.close();
}
