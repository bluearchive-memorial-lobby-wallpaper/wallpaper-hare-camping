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
  const { DialoguePlaybackSequence } = await import(
    "ba-memorylobby-wallpaper-runtime"
  );
  const {
    canTriggerDialogue,
    didDialogueSettingChange,
    didInteractionSettingsChange,
  } = await server.ssrLoadModule("ba-memorylobby-wallpaper-runtime");

  const sequence = new DialoguePlaybackSequence(5);
  assert.equal(sequence.nextIndex, 1);
  assert.equal(sequence.automaticPlaybackActive, false);

  sequence.start(1, false);
  assert.equal(sequence.nextIndex, 2);
  assert.equal(sequence.takeAutomaticContinuation(), null);

  sequence.start(1, true);
  assert.equal(sequence.automaticPlaybackActive, true);
  assert.deepEqual(
    [
      sequence.takeAutomaticContinuation(),
      sequence.takeAutomaticContinuation(),
      sequence.takeAutomaticContinuation(),
      sequence.takeAutomaticContinuation(),
      sequence.takeAutomaticContinuation(),
    ],
    [2, 3, 4, 5, null],
  );
  assert.equal(sequence.nextIndex, 1);
  assert.equal(sequence.automaticPlaybackActive, false);

  sequence.start(3, true);
  sequence.cancelAutomaticPlayback();
  assert.equal(sequence.takeAutomaticContinuation(), null);
  assert.equal(sequence.nextIndex, 4);

  sequence.start(2, false);
  sequence.setAutomaticPlaybackAfterCurrent(true);
  assert.deepEqual(
    [
      sequence.takeAutomaticContinuation(),
      sequence.takeAutomaticContinuation(),
      sequence.takeAutomaticContinuation(),
      sequence.takeAutomaticContinuation(),
    ],
    [3, 4, 5, null],
  );

  sequence.start(2, true);
  sequence.setAutomaticPlaybackAfterCurrent(false);
  assert.equal(sequence.takeAutomaticContinuation(), null);
  assert.equal(sequence.nextIndex, 3);

  sequence.start(5, false);
  sequence.setAutomaticPlaybackAfterCurrent(true);
  assert.equal(sequence.takeAutomaticContinuation(), null);
  assert.equal(sequence.nextIndex, 1);

  sequence.start(4, true);
  sequence.stop();
  assert.equal(sequence.takeAutomaticContinuation(), null);
  assert.equal(sequence.nextIndex, 5);

  sequence.reset();
  sequence.start(2, false);
  assert.equal(sequence.takeAutomaticContinuation(), null);
  sequence.setAutomaticPlaybackAfterCurrent(true);
  assert.equal(sequence.nextIndex, 3);
  sequence.start(sequence.nextIndex, true);
  assert.deepEqual(
    [
      sequence.takeAutomaticContinuation(),
      sequence.takeAutomaticContinuation(),
      sequence.takeAutomaticContinuation(),
    ],
    [4, 5, null],
  );

  const interactionSettings = {
    interactionPreset: "custom",
    introAnimation: true,
    interactionsEnabled: true,
    mouseTracking: true,
    headPatting: true,
    voiceEnabled: true,
    dialogueAutoPlay: false,
  };
  assert.equal(canTriggerDialogue(interactionSettings), true);
  assert.equal(
    canTriggerDialogue({ ...interactionSettings, voiceEnabled: false }),
    false,
  );
  assert.equal(
    didInteractionSettingsChange(interactionSettings, {
      ...interactionSettings,
      dialogueAutoPlay: true,
    }),
    false,
  );
  assert.equal(
    didInteractionSettingsChange(interactionSettings, {
      ...interactionSettings,
      interactionPreset: "default",
    }),
    false,
  );
  assert.equal(
    didInteractionSettingsChange(interactionSettings, {
      ...interactionSettings,
      interactionPreset: "default",
      introAnimation: false,
    }),
    true,
  );
  assert.equal(
    didInteractionSettingsChange(interactionSettings, {
      ...interactionSettings,
      voiceEnabled: false,
    }),
    true,
  );
  assert.equal(
    didDialogueSettingChange(interactionSettings, {
      ...interactionSettings,
      mouseTracking: false,
    }),
    false,
  );
  assert.equal(
    didDialogueSettingChange(interactionSettings, {
      ...interactionSettings,
      voiceEnabled: false,
    }),
    true,
  );

  sequence.reset();
  assert.equal(sequence.nextIndex, 1);
  assert.throws(() => sequence.start(0, true), RangeError);
  assert.throws(() => new DialoguePlaybackSequence(0), RangeError);

  console.log("Validated dialogue gating, interaction resets, and queue-preserving auto play.");
} finally {
  await server.close();
}
