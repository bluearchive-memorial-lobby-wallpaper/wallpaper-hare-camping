import {
  assertWallpaperDefinition,
  createDialogueLineResolver,
  defineWallpaper,
} from "ba-memorylobby-wallpaper-runtime";

export type VoiceLocale = "ja" | "zh-cn" | "ko";
export type SubtitleLocale = "zh-cn" | "ja" | "ko" | "en";

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
        text: {
          "zh-cn": "天上充满了光……",
          ja: "空が、光でいっぱい……。",
          ko: "하늘에 빛이 가득해…",
          en: "The sky is so full of light...",
        },
      },
      {
        id: "CH0233_MemorialLobby_1_2",
        text: {
          "zh-cn": "这样繁星闪耀的夜空，我还是第一次见到呢。",
          ja: "こんなにキラキラした夜空は、初めてかも。",
          ko: "이렇게 반짝이는 밤하늘은 처음인 것 같아.",
          en: "I think it's the first time I've seen the night sky shine like this.",
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
          ko: "저 빛나는 점 하나하나가 방대한 정보를 담은 노드라고 생각하면",
          en: "I'm awed by the thought that every single one of those shiny dots are nodes",
        },
      },
      {
        id: "CH0233_MemorialLobby_2_2",
        text: {
          "zh-cn": "不免，让人心生敬畏呢。",
          ja: "なんか、畏敬の念すら覚えるかも",
          ko: "새삼 경외감이 느껴질 정도네.",
          en: "containing a vast amount of data.",
        },
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
          ko: "내가 알고 있는 모든 정보를 쌓는다 해도",
          en: "Even if I were to gather up everything I know,",
        },
      },
      {
        id: "CH0233_MemorialLobby_3_2",
        text: {
          "zh-cn": "也无法与那些光芒相提并论吧。",
          ja: "あの光には、届かないんだろうなぁ。",
          ko: "저 빛에는 차마 닿지 못하겠지.",
          en: "I wouldn't be able to match those lights.",
        },
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
        text: {
          "zh-cn": "……不过，我是不会放弃的。",
          ja: "……それでも私は、諦めない。",
          ko: "…하지만 나는 포기하지 않을 거야.",
          en: "...But I won't give up",
        },
      },
      {
        id: "CH0233_MemorialLobby_4_2",
        text: {
          "zh-cn": "因为，真理永远向着光明。",
          ja: "真理は必ず光を向くものだから",
          ko: "진리는 언제나 빛을 향하는 법이니까.",
          en: "Because the truth is a light that illuminates everything.",
        },
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
          ko: "하늘 위의 머나먼 별들에게 경의를 담은 인사를.",
          en: "I say salutations to all you stars shining in the skies.",
        },
      },
      {
        id: "CH0233_MemorialLobby_5_2",
        text: {
          "zh-cn": "你们好，最近过得好吗？",
          ja: "こんにちは。お元気ですか？",
          ko: "안녕하세요. 잘 지내시나요?",
          en: "Hello. How are you?",
        },
      },
    ],
  },
] as const;

export function voicePath(eventId: string, locale: VoiceLocale): string {
  return `./assets/hare-camping/audio/${locale}/${eventId.toLowerCase()}.ogg`;
}

export const WALLPAPER_DEFINITION = defineWallpaper({
  schemaVersion: 1,
  id: "blue-archive-hare-camping",
  model: {
    binary: MODEL.binary,
    atlases: MODEL.atlases,
    spineVersion: MODEL.spineVersion,
    designViewport: MODEL.designViewport,
  },
  animations: {
    intro: MODEL.introAnimation,
    idle: MODEL.idleAnimation,
    tracks: MODEL.tracks,
  },
  interactions: {
    eyeBone: MODEL.interaction.eyeBone,
    headControlBone: MODEL.interaction.headControlBone,
    headAnchorBone: MODEL.interaction.headAnchorBone,
    look: {
      animation: MODEL.interaction.lookAnimation,
      endMotionAnimation: MODEL.interaction.lookEndMotionAnimation,
      endAttachmentAnimation: MODEL.interaction.lookEndAttachmentAnimation,
    },
    pat: {
      motionAnimation: MODEL.interaction.patMotionAnimation,
      attachmentAnimation: MODEL.interaction.patAttachmentAnimation,
      endMotionAnimation: MODEL.interaction.patEndMotionAnimation,
      endAttachmentAnimation: MODEL.interaction.patEndAttachmentAnimation,
    },
    headRadius: MODEL.interaction.headRadius,
    bodyFromHead: MODEL.interaction.bodyFromHead,
    eyeClamp: MODEL.interaction.eyeClamp,
    patClamp: MODEL.interaction.patClamp,
    dragThresholdPixels: MODEL.interaction.dragThresholdPixels,
    cooldownSeconds: MODEL.interaction.cooldownSeconds,
    dialogueGraceSeconds: MODEL.interaction.dialogueGraceSeconds,
  },
  dialogues: DIALOGUES.map((dialogue) => ({
    index: dialogue.index,
    motionAnimation: dialogue.motionAnimation,
    attachmentAnimation: dialogue.attachmentAnimation,
    durationSeconds: dialogue.duration,
    lines: dialogue.lines,
  })),
  audio: {
    bgm: BGM,
    voicePath,
  },
});

assertWallpaperDefinition(WALLPAPER_DEFINITION);

export const findDialogueLine = createDialogueLineResolver(
  WALLPAPER_DEFINITION.dialogues,
);
