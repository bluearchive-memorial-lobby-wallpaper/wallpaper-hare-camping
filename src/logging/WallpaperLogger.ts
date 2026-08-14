import { WallpaperLogger } from "ba-memorylobby-wallpaper-runtime";

export const wallpaperLogger = new WallpaperLogger({
  bootstrap: window.__wallpaperLogBootstrap,
  developmentEndpoint: "/__hare-log",
});
