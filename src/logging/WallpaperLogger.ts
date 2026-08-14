import { WallpaperLogger } from "ba-memorylobby-wallpaper-runtime";

export const wallpaperLogger = new WallpaperLogger({
  bootstrap: window.__hareLogBootstrap,
  developmentEndpoint: "/__hare-log",
});
