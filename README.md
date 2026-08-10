# Hare (Camping) Wallpaper

小钩晴（露营）Wallpaper Engine 网页壁纸项目。

当前状态：M3 已完成，本地功能测试版为 `0.3.0`；M4 发布门槛审查进行中，当前结论为 **禁止发布（NO-GO）**。除 M1/M2 的离线渲染和完整交互外，现已完成 WE 属性、桌面调试面板、分辨率/纹理档位、配置优先级、材质无感切换、WebGL 上下文恢复、低 FPS 时间一致性及 4K/8K 性能基线。字幕位置与缩放不属于首发功能，将在发布后的更新版本提供。

## 本地运行

M0 的本地资源和固定 Spine Runtime 必须已经存在，且都不会加入 Git：

```powershell
npm install
npm run dev
```

浏览器调试面板：`http://127.0.0.1:5173/?debug=1`。普通浏览器可能阻止页面自动播放音频，此时第一次鼠标或键盘交互会自动解锁 BGM；调试面板的单一 BGM 按钮负责开启、关闭和恢复，Wallpaper Engine 内仍可通过“背景音乐”和“BGM 音量”属性测试开关与音量。

Wallpaper Engine 中的“Enable Debug Panel”属性默认关闭。开启后，桌面右上角会显示透明底的面板切换按钮；面板内的参数调整只覆盖当前运行实例，不会改写管理页的持久设置。“恢复 WE 设置”可清除全部临时覆盖，管理页对某个参数的新修改也会清除该参数对应的临时覆盖。

分辨率选项控制 WebGL 内部渲染高度，并按当前壁纸视口比例计算宽度。因此 16:9 下对应 1280×720、1920×1080、2560×1440、3840×2160；在 16:10、21:9 等屏幕上会保持屏幕宽高比，不会强行拉伸为 16:9。

“模型纹理”是独立选项。2K 档使用游戏资源中的原始 Atlas 页面；4K 和 8K 档使用 Real-CUGAN 对整张页面做 2×/4× 确定性超分，并同步缩放 Spine 3.8 Atlas 坐标。这样不会改变骨骼、槽位、UV 拓扑或透明通道。8K 档占用的显存和载入时间明显更高，通常建议先使用默认 4K 档。

需要重新生成本机高清纹理时，先将 Real-CUGAN Windows 版放在脚本默认的 `.cache/realcugan/` 路径，或设置 `REALCUGAN_PATH` 与 `REALCUGAN_MODEL_PATH`，然后运行：

```powershell
npm run generate:model-textures
```

构建并验证离线包：

```powershell
npm run build
```

构建结果位于 `dist/`。可将 `dist/index.html` 导入 Wallpaper Engine 编辑器进行本地测试。

## 资源与发布限制

本仓库不跟踪游戏模型、纹理、音频或 Spine Runtime。`npm run prepare:assets` 仅校验并准备被 Git 忽略的本地研究输入；当前 BGM 也只保留在本地资源目录和本机构建中。当前构建仅供本地验证，不是可发布的创意工坊包。

资源出处见 [`research/PROVENANCE.md`](research/PROVENANCE.md)，当前八项发布硬门槛及关闭条件见 [`research/M4-GATE-REVIEW.md`](research/M4-GATE-REVIEW.md)。游戏模型/纹理和语音的技术来源已核对，但全球再分发授权仍未取得；本地构建中的官方 OST Vol.6 无损 BGM 也仅限私有测试，不得随当前包上传创意工坊。

阶段记录见 [`research/M0-REPORT.md`](research/M0-REPORT.md)、[`research/M1-REPORT.md`](research/M1-REPORT.md)、[`research/M2-REPORT.md`](research/M2-REPORT.md) 与 [`research/M3-REPORT.md`](research/M3-REPORT.md)。
