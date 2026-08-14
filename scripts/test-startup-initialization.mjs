import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createServer } from "vite";

const root = path.resolve(import.meta.dirname, "..");
const server = await createServer({
  root,
  appType: "custom",
  logLevel: "silent",
  server: { middlewareMode: true },
});

function deferred() {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

try {
  const { initializeStableResourceVariant } = await server.ssrLoadModule(
    "ba-memorylobby-wallpaper-runtime",
  );

  const directCalls = [];
  const direct = await initializeStableResourceVariant({
    getTargetVariant: () => "8k",
    initialize: async (resolution) => directCalls.push(["initialize", resolution]),
    switchVariant: async (resolution) => directCalls.push(["switch", resolution]),
  });
  assert.deepEqual(directCalls, [["initialize", "8k"]]);
  assert.deepEqual(direct, { variant: "8k", loadPasses: 1 });

  let targetResolution = "2k";
  let activeLoads = 0;
  let maximumConcurrentLoads = 0;
  const initializationGate = deferred();
  const raceCalls = [];
  const race = initializeStableResourceVariant({
    getTargetVariant: () => targetResolution,
    initialize: async (resolution) => {
      raceCalls.push(["initialize-start", resolution]);
      activeLoads += 1;
      maximumConcurrentLoads = Math.max(maximumConcurrentLoads, activeLoads);
      await initializationGate.promise;
      activeLoads -= 1;
      raceCalls.push(["initialize-end", resolution]);
    },
    switchVariant: async (resolution) => {
      raceCalls.push(["switch", resolution]);
      activeLoads += 1;
      maximumConcurrentLoads = Math.max(maximumConcurrentLoads, activeLoads);
      activeLoads -= 1;
    },
  });
  await Promise.resolve();
  targetResolution = "8k";
  assert.deepEqual(raceCalls, [["initialize-start", "2k"]]);
  initializationGate.resolve();
  const racedResult = await race;
  assert.deepEqual(raceCalls, [
    ["initialize-start", "2k"],
    ["initialize-end", "2k"],
    ["switch", "8k"],
  ]);
  assert.equal(maximumConcurrentLoads, 1);
  assert.deepEqual(racedResult, { variant: "8k", loadPasses: 2 });

  const appSource = await readFile(path.join(root, "..", "ba-memorylobby-wallpaper-runtime", "src", "app", "App.ts"), "utf8");
  assert(appSource.includes('has("testWeInterfaces")'));
  assert(appSource.includes("value === null ? Number.NaN : Number(value)"));
  assert(appSource.includes("weInterfaceGeneral"));
  assert(appSource.includes("weInterfaceUser"));
  assert(appSource.includes("weInterfacePause"));

  console.log("Validated single-pass final-resolution startup and sequential fallback when WE settings change during initialization.");
} finally {
  await server.close();
}
