import "./style.css";
import { App } from "./app/App";

const root = document.getElementById("app");
if (!(root instanceof HTMLElement)) throw new Error("缺少 #app 根节点。");

const app = new App(root);
void app.start();
