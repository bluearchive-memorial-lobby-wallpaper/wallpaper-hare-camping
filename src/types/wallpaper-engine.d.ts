export {};

declare global {
  interface Window {
    spine?: any;
    wallpaperPropertyListener?: {
      applyGeneralProperties?: (properties: { fps?: number }) => void;
      applyUserProperties?: (
        properties: Record<string, { value: boolean | number | string }>,
      ) => void;
      setPaused?: (paused: boolean) => void;
    };
    __hareWallpaperDebug?: {
      getSnapshot: () => Record<string, unknown>;
      replayIntro: () => void;
      skipToIdle: () => void;
      playDialogue: (index: number) => boolean;
      setFpsLimit: (fps: number) => void;
      retryBgm: () => Promise<boolean>;
      setUserProperties: (
        properties: Record<string, boolean | number | string>,
      ) => void;
      clearSessionOverrides: () => void;
    };
  }
}
