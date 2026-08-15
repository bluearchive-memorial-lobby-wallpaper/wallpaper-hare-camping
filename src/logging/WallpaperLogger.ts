import { WallpaperLogger } from "ba-memorial-lobby-wallpaper-runtime";

export const wallpaperLogger = new WallpaperLogger({
  bootstrap: window.__wallpaperLogBootstrap,
  developmentEndpoint: "/__hare-log",
});
