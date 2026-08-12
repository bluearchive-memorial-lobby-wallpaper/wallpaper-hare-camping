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

function deferred() {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

try {
  const { initializeStableModelResolution } = await server.ssrLoadModule(
    "/src/app/initializeModelResolution.ts",
  );

  const directCalls = [];
  const direct = await initializeStableModelResolution({
    getTargetResolution: () => "8k",
    initialize: async (resolution) => directCalls.push(["initialize", resolution]),
    switchResolution: async (resolution) => directCalls.push(["switch", resolution]),
  });
  assert.deepEqual(directCalls, [["initialize", "8k"]]);
  assert.deepEqual(direct, { resolution: "8k", loadPasses: 1 });

  let targetResolution = "2k";
  let activeLoads = 0;
  let maximumConcurrentLoads = 0;
  const initializationGate = deferred();
  const raceCalls = [];
  const race = initializeStableModelResolution({
    getTargetResolution: () => targetResolution,
    initialize: async (resolution) => {
      raceCalls.push(["initialize-start", resolution]);
      activeLoads += 1;
      maximumConcurrentLoads = Math.max(maximumConcurrentLoads, activeLoads);
      await initializationGate.promise;
      activeLoads -= 1;
      raceCalls.push(["initialize-end", resolution]);
    },
    switchResolution: async (resolution) => {
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
  assert.deepEqual(racedResult, { resolution: "8k", loadPasses: 2 });

  console.log("Validated single-pass final-resolution startup and sequential fallback when WE settings change during initialization.");
} finally {
  await server.close();
}
