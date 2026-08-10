export type VoiceLocale = "ja" | "zh-cn" | "ko";
export type SubtitleLocale = "zh-cn" | "ja";

export const BGM = {
  title: "Starry Confession",
  path: "./assets/hare-camping/bgm/25 - Starry Confession.flac",
} as const;

export interface DialogueLine {
  id: string;
  text: Record<SubtitleLocale, string>;
}

export interface DialogueDefinition {
  index: number;
  motionAnimation: string;
  attachmentAnimation: string;
  duration: number;
  lines: readonly [DialogueLine, DialogueLine];
}

export const MODEL = {
  binary: "./assets/hare-camping/model/CH0233_home.skel",
  atlases: {
    "2k": "./assets/hare-camping/model/CH0233_home.atlas",
    "4k": "./assets/hare-camping/model-4k/CH0233_home.atlas",
    "8k": "./assets/hare-camping/model-8k/CH0233_home.atlas",
  },
  spineVersion: "3.8.99",
  introAnimation: "Start_Idle_01",
  idleAnimation: "Idle_01",
  designViewport: {
    width: 2560,
    height: 1600,
    centerX: 0,
    centerY: 900,
  },
  tracks: {
    base: 0,
    motion: 1,
    attachment: 2,
  },
  interaction: {
    eyeBone: "Touch_Eye",
    headControlBone: "Touch_Point",
    headAnchorBone: "Touch_Point_Key",
    lookAnimation: "Look_01_M",
    lookEndMotionAnimation: "LookEnd_01_M",
    lookEndAttachmentAnimation: "LookEnd_01_A",
    patMotionAnimation: "Pat_01_M",
    patAttachmentAnimation: "Pat_01_A",
    patEndMotionAnimation: "PatEnd_01_M",
    patEndAttachmentAnimation: "PatEnd_01_A",
    headRadius: { x: 270, y: 230 },
    bodyFromHead: { x: -70, y: -610, radiusX: 620, radiusY: 900 },
    eyeClamp: { x: 112.5, y: 200 },
    patClamp: 34,
    dragThresholdPixels: 9,
    cooldownSeconds: 0.55,
    dialogueGraceSeconds: 0.75,
  },
} as const;

export const DIALOGUES: readonly DialogueDefinition[] = [
  {
    index: 1,
    motionAnimation: "Talk_01_M",
    attachmentAnimation: "Talk_01_A",
    duration: 15.166667,
    lines: [
      {
        id: "CH0233_MemorialLobby_1_1",
        text: { "zh-cn": "天上充满了光……", ja: "空が、光でいっぱい……。" },
      },
      {
        id: "CH0233_MemorialLobby_1_2",
        text: {
          "zh-cn": "这样繁星闪耀的夜空，我还是第一次见到呢。",
          ja: "こんなにキラキラした夜空は、初めてかも。",
        },
      },
    ],
  },
  {
    index: 2,
    motionAnimation: "Talk_02_M",
    attachmentAnimation: "Talk_02_A",
    duration: 20,
    lines: [
      {
        id: "CH0233_MemorialLobby_2_1",
        text: {
          "zh-cn": "……如果把那一个个发光的点，都当成蕴含庞大信息的节点的话，",
          ja: "あの光ひとつひとつが、膨大な情報を持つノードだと思うと",
        },
      },
      {
        id: "CH0233_MemorialLobby_2_2",
        text: { "zh-cn": "不免，让人心生敬畏呢。", ja: "なんか、畏敬の念すら覚えるかも" },
      },
    ],
  },
  {
    index: 3,
    motionAnimation: "Talk_03_M",
    attachmentAnimation: "Talk_03_A",
    duration: 15.333333,
    lines: [
      {
        id: "CH0233_MemorialLobby_3_1",
        text: {
          "zh-cn": "就算把我知道的所有信息都汇集到一起，",
          ja: "私の知っている情報をすべて重ねても",
        },
      },
      {
        id: "CH0233_MemorialLobby_3_2",
        text: { "zh-cn": "也无法与那些光芒相提并论吧。", ja: "あの光には、届かないんだろうなぁ。" },
      },
    ],
  },
  {
    index: 4,
    motionAnimation: "Talk_04_M",
    attachmentAnimation: "Talk_04_A",
    duration: 14.666667,
    lines: [
      {
        id: "CH0233_MemorialLobby_4_1",
        text: { "zh-cn": "……不过，我是不会放弃的。", ja: "……それでも私は、諦めない。" },
      },
      {
        id: "CH0233_MemorialLobby_4_2",
        text: { "zh-cn": "因为，真理永远向着光明。", ja: "真理は必ず光を向くものだから" },
      },
    ],
  },
  {
    index: 5,
    motionAnimation: "Talk_05_M",
    attachmentAnimation: "Talk_05_A",
    duration: 19.333334,
    lines: [
      {
        id: "CH0233_MemorialLobby_5_1",
        text: {
          "zh-cn": "我想向天空之上的遥远群星，送去充满敬意的问候。",
          ja: "空の上にある遠くの星へ、敬意を込めた挨拶を",
        },
      },
      {
        id: "CH0233_MemorialLobby_5_2",
        text: { "zh-cn": "你们好，最近过得好吗？", ja: "こんにちは。お元気ですか？" },
      },
    ],
  },
] as const;

const dialogueLines = new Map(
  DIALOGUES.flatMap((dialogue) => dialogue.lines.map((line) => [line.id.toLowerCase(), line])),
);

export function findDialogueLine(eventId: string): DialogueLine | undefined {
  return dialogueLines.get(eventId.toLowerCase());
}

export function voicePath(eventId: string, locale: VoiceLocale): string {
  return `./assets/hare-camping/audio/${locale}/${eventId.toLowerCase()}.ogg`;
}
