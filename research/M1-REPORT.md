# M1 最小可运行原型报告

> 结论：**M1 完成；离线网页构建、浏览器运行和 Wallpaper Engine 弹出窗口运行均已通过。**
> 执行日期：2026-08-10

## 已实现

- Vite 8.2.1 + TypeScript 7.0.2 工程；
- 固定 Spine 3.8 Runtime 的本地准备流程；
- 模型五个输入文件复制前逐项 SHA-256 校验；
- `CH0233_home.skel`、atlas 和三张纹理页离线载入；
- Runtime 与 skeleton `3.8.99` 版本检查；
- WebGL 双染色 Spine 渲染；
- `Start_Idle_01 → Idle_01` 入场/待机状态机；
- 基于 2560×1600 设计视口的 cover 构图、模型缩放与 X/Y 偏移；
- Canvas 高 DPI 处理，像素比最高限制为 2；
- `ResizeObserver` 响应式更新；
- `window.wallpaperPropertyListener.applyGeneralProperties` 全局 FPS 接入；
- `applyUserProperties` 接入入场开关、模型比例、位置、背景色和调试面板；
- 页面隐藏时暂停更新并在恢复时重置计时，避免大 `delta`；
- 本地调试状态面板及入场、待机、30 FPS 控制；
- 无 `workshopid` 的私有本地 `project.json`；
- 离线包结构、远程 URL、模型哈希与项目身份自动验证。

## 资源边界

当前的 `scripts/prepare-assets.mjs` 延续 M1 的资源边界，从以下被忽略目录读取：

- `local-assets/original/model/`
- `.cache/spine-runtimes-3.8/`

它只向同样被忽略的 `public/assets/hare-camping/model/` 和 `public/vendor/` 复制已校验文件。`dist/` 也被忽略。因此 Git 跟踪源码、脚本、项目配置和报告，但不跟踪模型、纹理、Runtime 或构建包。

## 自动构建验证

执行：

```powershell
npm run build
```

结果：

- 资源准备通过；
- TypeScript 严格类型检查通过；
- Vite 生产构建通过；
- 当前的 `validate-dist.mjs` 通过；
- `dist/project.json` 是 `web` 类型、入口为 `index.html`，且没有 `workshopid` / `workshopurl`；
- 构建后的 skeleton SHA-256 仍为 `bc808f19378fad6d186cbab0a17de166307bb5388dcfeef6401ac60e141b6517`；
- HTML、JS、CSS、JSON 中未发现 HTTP(S) 运行依赖；
- `npm install` 审计结果为 0 个已知漏洞。

Vite 会提示经典全局脚本 `spine-webgl-3.8.js` 不参与模块打包；这是预期行为。Runtime 作为本地 `script` 先于应用模块执行，并由离线验证器确认实际存在于 `dist/vendor/`。

## 浏览器验收

本地地址：`http://127.0.0.1:4173/?debug=1`

| 检查 | 结果 |
| --- | --- |
| 首次模型加载 | 通过；状态为“运行中”，版本 `3.8.99` |
| 入场动画 | 首帧轨道为 `Start_Idle_01` |
| 自动衔接 | 15.5 秒后轨道变为 `Idle_01` |
| 手动重播/待机 | `Start_Idle_01` 与 `Idle_01` 双向验证通过 |
| FPS 设置 | 调试入口调用同一设置适配层后从 60 更新为 30 |
| 16:10 | 构图覆盖视口，人物和背景正常 |
| 21:9 | 构图覆盖视口，人物和背景正常 |
| 浏览器控制台 | 0 条 error / warning |

测试完成后已恢复浏览器默认视口并关闭测试页面和本地服务器。

## Wallpaper Engine 验收

本机 Wallpaper Engine 已在运行。使用官方 `openWallpaper` 命令将 `dist/index.html` 作为名为 `Hare Camping M1 Test` 的 1280×720 弹出壁纸载入：

```text
wallpaper64.exe -control openWallpaper -file <dist/index.html> \
  -playInWindow "Hare Camping M1 Test" -width 1280 -height 720
```

Wallpaper Engine 创建了新的 `webwallpaper32` 主进程及 GPU/renderer/utility 子进程组，进程保持响应。验收后通过 `closeWallpaper -location "Hare Camping M1 Test"` 正常关闭，该测试进程组全部退出，没有替换桌面当前壁纸，也没有把项目复制进 `projects/myprojects/`。

## M2 接口基线

M2 可直接复用：

- `SpineRenderer` 的模型、状态、布局和绘制生命周期；
- `WallpaperEngineAdapter` 的增量属性更新；
- `requestAnimationFrame` FPS 累积器；
- 调试状态与浏览器验收方式。

该基线已在 M2 中扩展为角色配置、指针交互控制器、语音层和字幕层；Hare 专属动画名、骨骼名、台词 ID 与命中参数集中在角色配置中。
