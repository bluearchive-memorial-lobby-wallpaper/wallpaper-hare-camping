# Hare (Camping) Wallpaper

[English](README.md) | 简体中文

小钩晴（露营）Wallpaper Engine 网页壁纸项目。

当前状态：正式版 `1.0.1` 已发布至 [Steam 创意工坊](https://steamcommunity.com/sharedfiles/filedetails/?id=3785064025)。项目已具备完整交互、WE 属性、桌面调试面板、分辨率/纹理档位、配置优先级、材质无感切换、WebGL 上下文恢复、低 FPS 时间一致性、4K/8K 性能基线，以及带逐文件校验清单的可复现发行包。

## 本地运行

M0 的本地资源和固定 Spine Runtime 必须已经存在，且都不会加入 Git：

```powershell
npm install
npm run dev
```

浏览器调试面板：`http://127.0.0.1:5173/?debug=1`。普通浏览器可能阻止页面自动播放音频，此时第一次鼠标或键盘交互会自动解锁 BGM。WE 属性页和调试面板都提供统一静音、BGM 音量与对话音量控制；静音时隐藏两个音量滑块。调试面板的“面板设置”可独立选择界面语言，并通过“位置与缩放”的 `Default`/`Custom` 预设调整面板尺寸及 X/Y 偏移。每个顶层设置分组及其子分组均可由用户单击标题栏独立折叠或展开，状态不随属性值或预设切换而变化。

每次壁纸加载都会单独记录一份日志，内容包括错误、动画切换、交互点击和配置修改。日志脚本会在应用代码之前启动，并直接保存到壁纸宿主提供的持久存储中，无需首次选择目录。调试面板顶部的“打开日志”会在屏幕中央显示独立浮层窗口，打开后按钮切换为“关闭日志”；窗口可在隐藏调试面板后继续查看、切换和复制当前完整会话，并识别未正常结束的会话。日志窗口和右上调试面板切换按钮会跟随面板尺寸设置同步缩放；使用本地 Vite 开发或预览服务时，日志还会同步写入构建目录的 `log` 文件夹。日志功能不增加 WE 属性页选项。

Wallpaper Engine 中的属性标签与选项保持英文。属性按 `Visual Quality`、`Position & Scale`、`Animation & Interactions`、`Volume`、`Dialogue Playback` 和 `Debug` 的顺序排列；固定预设会隐藏所属的高级子项，选择 `Custom` 后才显示并恢复此前的自定义值。`Volume` 统一管理静音与两条音轨音量；对话音量还会在对话关闭时隐藏。`Dialogue Playback` 提供自动播放与原有语言预设；启用自动播放后，单击一次人物身体会从当前队列的下一组开始连续播放，并在第 5 组结束后停止。播放期间切换自动播放只改变当前组结束后的队列，不会重置位置。`Animation & Interactions` 中任一设置变化都会立即结束当前动作并回到待机；“对话”开关变化还会把播放队列重置为第 1 组，关闭后单击不再触发对话。`Debug` 默认为 `Off`；启用面板后，桌面右上角会显示透明底的面板切换按钮。面板内的参数调整只覆盖当前运行实例，不会改写管理页的持久设置，“恢复 WE 设置”可清除全部临时覆盖。

分辨率选项控制 WebGL 内部渲染高度，并按当前壁纸视口比例计算宽度。因此 16:9 下对应 1280×720、1920×1080、2560×1440、3840×2160；在 16:10、21:9 等屏幕上会保持屏幕宽高比，不会强行拉伸为 16:9。

默认参数为模型缩放 `0.80`、X/Y `0/0`、旋转 `0°`、关闭静音、关闭对话自动播放、BGM 音量 `50`、对话音量 `70`、项目 FPS 上限 `60`、主题色 `#819ee0`，以及 1080P 渲染配 2K 纹理的默认画质预设。自定义模型布局可在 `0–360°` 范围内旋转模型；项目 FPS 上限与 Wallpaper Engine 全局上限同时存在时取两者较低值。实机视口回归结果见 [`research/DEFAULT-PRESET-V1-REPORT.md`](research/DEFAULT-PRESET-V1-REPORT.md)。

属性页可直接加载 `Default`、`2K`、`4K` 和 `Maximum` 画质预设；选择 `Custom` 后才显示独立的渲染分辨率、模型纹理和 FPS 控件。位置、互动、对话语言和调试分组也采用相同的固定预设/自定义模式。自定义对话可同时显示上下排列的主、副字幕，并可从简体中文、日文、韩文和英文中分别选择语言，还可设置字幕对齐、底部/顶部/屏幕中心/底部左侧位置或自定义 X/Y；两种字幕语言相同时自动只显示主字幕。固定中/日/韩预设使用对应语音和字幕；英文预设按国际服组合使用日语语音和官方英文字幕。2K 纹理使用游戏资源中的原始 Atlas 页面；4K 和 8K 纹理使用 Real-CUGAN 对整张页面做 2×/4× 确定性超分。8K 档占用的显存和载入时间明显更高，只在最高预设或自定义中使用。

需要重新生成本机高清纹理时，先将 Real-CUGAN Windows 版放在脚本默认的 `.cache/realcugan/` 路径，或设置 `REALCUGAN_PATH` 与 `REALCUGAN_MODEL_PATH`，然后运行：

```powershell
npm run generate:model-textures
```

构建并验证 `dist/`：

```powershell
npm run build
```

构建结果位于 `dist/`。可将 `dist/index.html` 导入 Wallpaper Engine 编辑器进行本地测试。

生成并回验正式发行 ZIP：

```powershell
npm run package:offline
```

正式产物位于 `release/hare-camping-we-offline-v1.0.0.zip`，同目录 `.sha256` 文件记录整个 ZIP 的校验和；包内 `MANIFEST.sha256` 覆盖其余每个文件。

## 发行与版权

本仓库不跟踪游戏模型、纹理、音频或 Spine Runtime。`npm run prepare:assets` 会校验本地输入并准备完整构建；发行包包含模型、三语语音、四语字幕、BGM、三档纹理和固定 Spine 3.8 Runtime。正式版 `1.0.1` 已通过 Wallpaper Engine 编辑器发布至 [Steam 创意工坊](https://steamcommunity.com/sharedfiles/filedetails/?id=3785064025)，对应 Workshop ID 为 `3785064025`。

包内安装方法见 `OFFLINE-README.txt`，素材和 Runtime 说明见 `THIRD-PARTY-NOTICES.txt` 与 `vendor/SPINE-RUNTIMES-LICENSE.txt`。

## 版权声明

本发行包中的《蔚蓝档案》角色模型、动画、立绘、语音、字幕文本与音乐等资产，版权归其各自权利方（NEXON Games Co., Ltd.、Yostar 等《蔚蓝档案》相关权利方）所有。本项目及其资产仅用于信息与教育目的，不用于任何商业用途；本项目为粉丝自制项目，与上述公司无隶属、赞助或背书关系。若权利方要求，相关资产将被移除。

阶段记录见 [`research/M0-REPORT.md`](research/M0-REPORT.md)、[`research/M1-REPORT.md`](research/M1-REPORT.md)、[`research/M2-REPORT.md`](research/M2-REPORT.md) 与 [`research/M3-REPORT.md`](research/M3-REPORT.md)。

## 发布更新

### v1.0.1（2026-08-17）

- 已将更新发布至 Steam 创意工坊项目 `3785064025`。
- 修复创意工坊预览 GIF 仅播放一次后停止的问题，现会持续循环播放。
- 将默认主题色更新为从待机阶段代表截图采集的 `#819ee0`。

### v1.0.0（2026-08-17）

- 首次发布小钩晴（露营）记忆大厅壁纸至 Steam 创意工坊。
