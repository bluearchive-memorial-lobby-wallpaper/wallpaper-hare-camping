import "ba-memorial-lobby-wallpaper-runtime/style.css";
import { App, createWallpaperShell } from "ba-memorial-lobby-wallpaper-runtime";
import { findDialogueLine, WALLPAPER_DEFINITION } from "./config";
import { wallpaperLogger } from "./logging/WallpaperLogger";

wallpaperLogger.start();

const root = document.getElementById("app");
if (!(root instanceof HTMLElement)) throw new Error("缺少 #app 根节点。");

createWallpaperShell(root, {
  title: "Hare (Camping)",
  canvasLabel: "Hare Camping animated wallpaper",
  editionLabel: "PUBLIC EDITION · 1.0",
});

const app = new App(root, {
  definition: WALLPAPER_DEFINITION,
  findDialogueLine,
  logger: wallpaperLogger,
});
void app.start();
