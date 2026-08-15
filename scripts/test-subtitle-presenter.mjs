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
  const { DIALOGUES, WALLPAPER_DEFINITION } = await server.ssrLoadModule(
    "/src/config.ts",
  );
  const {
    applySubtitleLayout,
    isSubtitleAlignment,
    isSubtitlePosition,
    resolveSubtitlePresentation,
  } = await import("ba-memorial-lobby-wallpaper-runtime");
  const eventId = "CH0233_MemorialLobby_1_1";
  assert.equal(WALLPAPER_DEFINITION.id, "blue-archive-hare-camping");
  assert.equal(WALLPAPER_DEFINITION.dialogues.length, DIALOGUES.length);
  assert.equal(WALLPAPER_DEFINITION.audio.bgm.title, "Starry Confession");
  const linesById = new Map(
    DIALOGUES.flatMap((dialogue) =>
      dialogue.lines.map((line) => [line.id.toLowerCase(), line]),
    ),
  );
  const resolveLine = (id) => linesById.get(id.toLowerCase());

  assert.equal(
    resolveSubtitlePresentation(resolveLine, eventId, false, "zh-cn", true, "ja"),
    null,
  );
  assert.deepEqual(
    resolveSubtitlePresentation(resolveLine, eventId, true, "zh-cn", false, "ja"),
    {
      primaryText: "天上充满了光……",
      secondaryText: null,
    },
  );
  assert.deepEqual(
    resolveSubtitlePresentation(resolveLine, eventId, true, "zh-cn", true, "ja"),
    {
      primaryText: "天上充满了光……",
      secondaryText: "空が、光でいっぱい……。",
    },
  );
  assert.deepEqual(
    resolveSubtitlePresentation(resolveLine, eventId, true, "ja", true, "ja"),
    {
      primaryText: "空が、光でいっぱい……。",
      secondaryText: null,
    },
  );
  assert.deepEqual(
    resolveSubtitlePresentation(resolveLine, eventId, true, "ko", true, "en"),
    {
      primaryText: "하늘에 빛이 가득해…",
      secondaryText: "The sky is so full of light...",
    },
  );
  const officialKorean = [
    "하늘에 빛이 가득해…",
    "이렇게 반짝이는 밤하늘은 처음인 것 같아.",
    "저 빛나는 점 하나하나가 방대한 정보를 담은 노드라고 생각하면",
    "새삼 경외감이 느껴질 정도네.",
    "내가 알고 있는 모든 정보를 쌓는다 해도",
    "저 빛에는 차마 닿지 못하겠지.",
    "…하지만 나는 포기하지 않을 거야.",
    "진리는 언제나 빛을 향하는 법이니까.",
    "하늘 위의 머나먼 별들에게 경의를 담은 인사를.",
    "안녕하세요. 잘 지내시나요?",
  ];
  const officialEnglish = [
    "The sky is so full of light...",
    "I think it's the first time I've seen the night sky shine like this.",
    "I'm awed by the thought that every single one of those shiny dots are nodes",
    "containing a vast amount of data.",
    "Even if I were to gather up everything I know,",
    "I wouldn't be able to match those lights.",
    "...But I won't give up",
    "Because the truth is a light that illuminates everything.",
    "I say salutations to all you stars shining in the skies.",
    "Hello. How are you?",
  ];
  const dialogueLines = DIALOGUES.flatMap((dialogue) => dialogue.lines);
  assert.deepEqual(
    dialogueLines.map((line) => line.text.ko),
    officialKorean,
  );
  assert.deepEqual(
    dialogueLines.map((line) => line.text.en),
    officialEnglish,
  );
  for (const line of dialogueLines) {
    assert.deepEqual(Object.keys(line.text).sort(), ["en", "ja", "ko", "zh-cn"]);
  }
  assert.equal(
    resolveSubtitlePresentation(resolveLine, "missing-event", true, "zh-cn", true, "ja"),
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

  console.log("Validated four-locale subtitle text, dual-language states, layout presets, and custom offsets.");
} finally {
  await server.close();
}
