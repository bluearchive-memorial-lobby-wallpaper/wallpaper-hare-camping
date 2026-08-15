import type {
  WallpaperEngineGeneralProperties,
  WallpaperProperties,
} from "ba-memorial-lobby-wallpaper-runtime/wallpaper-engine";

export {};

declare global {
  interface Window {
    spine?: any;
    __wallpaperLogBootstrap?: {
      sessionId: string;
      sessionFileName: string;
      handlesGlobalErrors: boolean;
      append: (line: string) => void;
      getSessions: () => Array<{
        id: string;
        fileName: string;
        startedAt: string;
        updatedAt: string;
        endedAt: string | null;
        status: "running" | "clean-exit" | "interrupted";
        truncated: boolean;
        lines: string[];
      }>;
      markCleanExit: () => void;
    };
    wallpaperPropertyListener?: {
      applyGeneralProperties?: (properties: WallpaperEngineGeneralProperties) => void;
      applyUserProperties?: (properties: WallpaperProperties) => void;
      setPaused?: (paused: boolean) => void;
    };
    __memoryLobbyWallpaperDebug?: {
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
