export type PanelLocale = "zh-cn" | "en";

export interface PanelText {
  panelAria: string;
  controlsAria: string;
  voiceLanguageAria: string;
  showDebugPanel: string;
  hideDebugPanel: string;
  restoreHostSettings: string;
  status: string;
  animation: string;
  interaction: string;
  lastAction: string;
  event: string;
  fpsLimit: string;
  viewport: string;
  renderStatus: string;
  renderResolution: string;
  modelResolution: string;
  replay: string;
  skipToIdle: string;
  nextDialogue: string;
  showHitboxes: string;
  hideHitboxes: string;
  enableBgm: string;
  disableBgm: string;
  voiceLanguage: string;
  chinese: string;
  japanese: string;
  korean: string;
  voiceVolume: string;
  bgmVolume: string;
  frameRate: string;
  panelLanguage: string;
  simplifiedChinese: string;
  english: string;
  loadingSpine: string;
  unlimited: string;
  phases: Record<"booting" | "loading" | "running" | "paused" | "error", string>;
  bgmStates: Record<"disabled" | "loading" | "playing" | "paused" | "blocked" | "error", string>;
  interactions: Record<"intro" | "idle" | "dialogue" | "look" | "pat" | "cooldown", string>;
}

export const PANEL_TEXT: Record<PanelLocale, PanelText> = {
  "zh-cn": {
    showDebugPanel: "显示调试面板",
    hideDebugPanel: "隐藏调试面板",
    restoreHostSettings: "恢复 WE 设置",
    panelAria: "Hare（露营）状态与控制面板",
    controlsAria: "壁纸调试控制",
    voiceLanguageAria: "对话语音语言",
    status: "状态",
    animation: "动画",
    interaction: "交互",
    lastAction: "最近动作",
    event: "事件",
    fpsLimit: "FPS 上限",
    viewport: "视口",
    renderStatus: "渲染",
    renderResolution: "渲染分辨率",
    modelResolution: "模型纹理",
    replay: "完整重播",
    skipToIdle: "切到待机",
    nextDialogue: "下一组对话",
    showHitboxes: "显示命中区",
    hideHitboxes: "隐藏命中区",
    enableBgm: "开启 BGM",
    disableBgm: "关闭 BGM",
    voiceLanguage: "对话语音",
    chinese: "中文",
    japanese: "日文",
    korean: "韩文",
    voiceVolume: "对话音量",
    bgmVolume: "BGM 音量",
    frameRate: "帧率",
    panelLanguage: "面板语言",
    simplifiedChinese: "简体中文",
    english: "English",
    loadingSpine: "正在加载 Spine 资源……",
    unlimited: "无限制",
    phases: { booting: "启动中", loading: "载入中", running: "运行中", paused: "已暂停", error: "错误" },
    bgmStates: { disabled: "已关闭", loading: "载入中", playing: "播放中", paused: "已暂停", blocked: "等待点击", error: "错误" },
    interactions: { intro: "入场", idle: "待机", dialogue: "对话", look: "视线跟随", pat: "摸头", cooldown: "冷却" },
  },
  en: {
    showDebugPanel: "Show debug panel",
    hideDebugPanel: "Hide debug panel",
    restoreHostSettings: "Restore WE settings",
    panelAria: "Hare (Camping) status and controls",
    controlsAria: "Wallpaper debug controls",
    voiceLanguageAria: "Dialogue voice language",
    status: "Status",
    animation: "Animation",
    interaction: "Interaction",
    lastAction: "Last action",
    event: "Event",
    fpsLimit: "FPS limit",
    viewport: "Viewport",
    renderStatus: "Render",
    renderResolution: "Render resolution",
    modelResolution: "Model texture",
    replay: "Full replay",
    skipToIdle: "Skip to idle",
    nextDialogue: "Next dialogue",
    showHitboxes: "Show hitboxes",
    hideHitboxes: "Hide hitboxes",
    enableBgm: "Enable BGM",
    disableBgm: "Disable BGM",
    voiceLanguage: "Dialogue voice",
    chinese: "Chinese",
    japanese: "Japanese",
    korean: "Korean",
    voiceVolume: "Dialogue volume",
    bgmVolume: "BGM volume",
    frameRate: "Frame rate",
    panelLanguage: "Panel language",
    simplifiedChinese: "简体中文",
    english: "English",
    loadingSpine: "Loading Spine assets…",
    unlimited: "Unlimited",
    phases: { booting: "Booting", loading: "Loading", running: "Running", paused: "Paused", error: "Error" },
    bgmStates: { disabled: "Disabled", loading: "Loading", playing: "Playing", paused: "Paused", blocked: "Click to play", error: "Error" },
    interactions: { intro: "Intro", idle: "Idle", dialogue: "Dialogue", look: "Eye tracking", pat: "Head pat", cooldown: "Cooldown" },
  },
};

export function isPanelLocale(value: unknown): value is PanelLocale {
  return value === "zh-cn" || value === "en";
}
