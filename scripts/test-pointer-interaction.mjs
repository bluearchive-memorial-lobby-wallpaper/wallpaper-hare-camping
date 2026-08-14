import assert from "node:assert/strict";
import path from "node:path";
import { createServer } from "vite";

const server = await createServer({ root: path.resolve(import.meta.dirname, ".."), appType: "custom", logLevel: "silent", server: { middlewareMode: true } });
class FakeCanvas extends EventTarget {
  dataset = {}; captured = new Set();
  setPointerCapture(id) { this.captured.add(id); }
  hasPointerCapture(id) { return this.captured.has(id); }
  releasePointerCapture(id) { this.captured.delete(id); }
}
function pointer(type, x, y, id = 1) {
  const event = new Event(type, { cancelable: true });
  Object.defineProperties(event, { button: { value: 0 }, clientX: { value: x }, clientY: { value: y }, pointerId: { value: id } });
  return event;
}
function renderer() {
  const calls = [];
  return { calls, hitTest: () => "body", beginLook: () => (calls.push("beginLook"), true), updateLook: () => calls.push("updateLook"), endLook: () => calls.push("endLook"), beginPat: () => false, updatePat() {}, endPat() {}, cancelInteraction() {} };
}
try {
  const { PointerInteractionController } = await server.ssrLoadModule("/src/interaction/PointerInteractionController.ts");
  const canvas = new FakeCanvas(); const target = renderer(); const completed = [];
  const controller = new PointerInteractionController(canvas, target, { dragThresholdPixels: 20 }, {
    onDialogueRequested: () => true,
    onInteractionCompleted: (value) => completed.push(value),
  });
  controller.applySettings({ interactionsEnabled: true, mouseTracking: true, headPatting: true, voiceEnabled: true, interactionPreset: "default", introAnimation: true });
  canvas.dispatchEvent(pointer("pointerdown", 100, 100));
  canvas.dispatchEvent(pointer("pointermove", 115, 100));
  assert.deepEqual(target.calls, [], "movement below injected threshold stays a click");
  canvas.dispatchEvent(pointer("pointermove", 121, 100));
  canvas.dispatchEvent(pointer("pointerup", 121, 100));
  assert.deepEqual(target.calls, ["beginLook", "updateLook", "endLook"]);
  assert.equal(completed[0].intent, "look");
  assert.equal(canvas.captured.size, 0);
  controller.dispose();
  console.log("Validated injected pointer threshold and look interaction lifecycle.");
} finally { await server.close(); }
