# Hare (Camping) Wallpaper Engine 项目计划

> 状态：M0、M1、M2、M3 已完成，M4 进行中（当前禁止发布）
> 最后核对：2026-08-10
> 目标角色：小钩晴（露营） / Hare (Camping)
> 游戏内部资源标识：`CH0233`，记忆大厅资源前缀 `CH0233_home`

## 1. 项目目标与边界

本项目正在制作一个 Wallpaper Engine **网页类型（Web）**壁纸，复现小钩晴（露营）记忆大厅的 Spine 动画，并补齐现有视频版没有的交互能力：

- 首次载入时播放入场动画，之后自然衔接待机循环；
- 点击人物触发对应台词、口型/动作、语音与字幕；
- 鼠标移动时驱动人物视线或相应骨骼跟随；
- 点击或抚摸头部等指定区域时播放专用交互动画；
- 提供 Wallpaper Engine 管理页属性，控制 BGM、语音、字幕、语言、模型缩放、位置、画质和交互开关；
- 在常见宽高比及离线环境下稳定运行，并服从 Wallpaper Engine 的全局 FPS 限制。

本阶段不制作角色合集，不修改现有创意工坊订阅目录，也不把下载到的游戏二进制资源直接提交到 Git。能否把游戏素材、语音、BGM 和 Spine Runtime 随创意工坊项目再发布，必须在发布前分别完成许可确认。

## 2. 已知调研基线

### 2.1 本地参考项目

- 创意工坊缓存根目录：`D:\App\Steam\steamapps\workshop\content\431960`
- Hare (Camping) 视频版：创意工坊项目 `3124063860`
  - 入口为 `hare_camping.mp4`，另有 `preview.gif` 和 `project.json`；
  - 不含模型、动画状态机、语音、字幕或交互脚本，不能由视频反推出完整交互项目；
  - 仅适合作为构图、节奏和目标效果参考。
- 可交互网页壁纸参考：项目 `3650880224` 等
  - 采用 Spine 二进制模型：`.skel + .atlas + .png`；
  - 采用本地打包的 Spine WebGL Runtime；
  - 通过 `window.wallpaperPropertyListener` 接收 Wallpaper Engine 属性；
  - 常见动画命名包含 `Start_*`、`Idle_*`、`Talk_*`、`Pat_*`、`Look_*`；
  - 常见交互骨骼包含 `Touch_Point`、`Touch_Eye`，但 Hare 模型必须实际解析后再确定，不能照搬其他角色的坐标或名称。

对这些项目只做行为和文件结构研究。不得直接复制他人脚本、配置、预览图或创意工坊描述，除非作者明确授权且许可证允许。

### 2.2 为什么选择网页类型

| 类型 | 优点 | 限制 | 本项目结论 |
| --- | --- | --- | --- |
| 视频 | 制作和播放简单，画面结果固定 | 无模型状态、骨骼命中、鼠标跟随和台词交互 | 不采用 |
| 场景 | 原生编辑器能力和性能控制较好 | 无法直接复用现有网页 Spine 交互代码；资产导入和行为重建成本较高 | 暂不采用 |
| 网页 | 可直接用 WebGL/Canvas、HTML 音频和 Pointer Events；属性接口成熟 | 必须自行处理渲染、生命周期、性能和离线依赖 | **采用** |

## 3. 技术路线

### 3.1 技术栈

- 语言：TypeScript；
- 构建：Vite，仅作为开发和离线打包工具；
- 渲染：原生 Canvas + WebGL；
- 动画：与 `CH0233_home.skel` 匹配的 Spine 3.8.99 WebGL Runtime，本地固定打包；
- UI：轻量 DOM/CSS 字幕层，不引入完整 UI 框架；
- 音频：浏览器 `HTMLAudioElement`，语音与 BGM 分轨；
- 测试：TypeScript 类型检查、设置适配器回归脚本、离线产物校验、受控浏览器交互测试和 Wallpaper Engine 真实宿主实测。

选择原生 TypeScript 和 WebGL 是为了降低壁纸常驻资源开销。M0 已确认 skeleton 为 Spine 3.8.99，因此当前固定使用匹配的 3.8 WebGL Runtime；不得在没有模型兼容性回归的情况下单独升级 Runtime。

### 3.2 运行架构

```text
Wallpaper Engine 属性
          │
          ▼
 WallpaperEngineAdapter ───────┐
          │                     │
          ▼                     ▼
       App                 BgmPlayer / VoicePlayer
          │                     │
    ┌─────┼────────┐            ├─ BGM
    ▼     ▼        ▼            └─ Voice
SpineRenderer PointerController SubtitlePresenter
    │
    ▼
 Canvas / WebGL
```

动画切换、音频、字幕和属性适配分别由独立模块负责；Hare 专属动画名、骨骼名、命中区域、台词时序和资源路径集中在 `src/config.ts`。正确性放在对应领域模块中处理，例如材质切换的动画状态迁移属于 `SpineRenderer`，而不是由应用层重播画面进行补偿。

### 3.3 动画与交互状态

当前状态机：

```text
loading → intro → idle
                    ├─ talk → idle
                    ├─ look/track → idle
                    └─ pat → pat-end → idle
```

规则：

1. 加载 atlas、全部纹理和 skeleton 后才显示首帧，避免闪烁或半加载状态。
2. 如果存在入场动画，使用 `setAnimation` 播放一次，再用 `addAnimation` 排队待机；若不存在则直接待机。
3. 交互动画优先从 skeleton 内置 event timeline 获取声音/字幕触发时点；确实没有事件时才使用角色清单中的人工时序。
4. 鼠标跟随应做坐标反变换、幅度限制、平滑插值和离开窗口时回正，避免直接写屏幕坐标。
5. 点击判定优先使用 Spine 边界/槽位或可验证的骨骼锚点；硬编码矩形仅作为模型坐标系中的显式配置，并随缩放、平移和宽高比正确换算。
6. 同一时刻只允许一个角色动作通道占用主要轨道；BGM 不因语音停止，可按设置在说话时 ducking。
7. 切换模型纹理时异步载入新 atlas，并迁移当前动画轨道、时间、对话和交互状态；不重置语音、字幕或 BGM。
8. 切换语音语言时当前句按原语言播放完毕，目标语言从下一句生效，避免重播造成时间轴错位。

## 4. 功能清单

### 4.1 第一版必须完成

- [x] 模型、atlas 多纹理页和待机动画正确加载；
- [x] 入场动画开关与“每次载入只播放一次”，完整重播也服从该开关；
- [x] 待机动画无缝循环；
- [x] 五组双段点击台词、动作、语音和字幕交互；
- [x] 头部点击/抚摸交互；
- [x] 鼠标拖动视线跟随，可单独关闭；
- [x] JP/CN/KR 语音选择；字幕支持简体中文和日文原文；
- [x] BGM、语音独立开关与音量；
- [x] 字幕显示开关；
- [x] 模型缩放及 X/Y 偏移；
- [x] Wallpaper Engine 全局 FPS 限制接入；
- [x] 16:9、16:10、21:9 与常用 720P/1080P/2K/4K 内部渲染档位；
- [x] 单屏高 DPI、双屏等效超宽视口与尺寸热切换专项验证；物理双屏留作跨电脑测试补充样本，不阻塞 M3；
- [x] 全部运行依赖本地打包，断网可用；
- [x] 当前自动构建和浏览器回归无素材缺失、未捕获异常或持续控制台报错。

### 4.2 可选增强

- [x] 2K 原始纹理与 Real-CUGAN 生成的 4K/8K 派生档，面板明确标注为纹理档位；
- [ ] 用户自选 BGM 文件，作为不随包分发游戏 BGM 的替代方案；
- [ ] 说话时 BGM 自动降低；
- [ ] 对话框主题、透明度与淡入淡出；
- [x] 默认关闭的桌面调试面板：状态、命中区域、FPS、分辨率、语言和音量实时调整；
- [ ] 动画/骨骼完整列表与实时坐标检查器；
- [x] 交互冷却与顺序轮播；
- [ ] 随机台词和避免连续重复模式；
- [x] WebGL 上下文丢失后重建 GPU/Spine 资源并恢复动画、对话和音频状态。

### 4.3 发布后更新

- 字幕位置和缩放属性不属于首发及 M3/M4 门槛，不阻塞首发；
- 在首发后的更新版本中提供字幕位置与缩放，并补充超宽屏、双屏和高 DPI 下的布局回归测试。

## 5. API 与数据契约清单

### 5.1 Wallpaper Engine Web API

| 接口 | 用途 | 注意事项 |
| --- | --- | --- |
| `window.wallpaperPropertyListener.applyUserProperties(properties)` | 接收壁纸自定义属性 | 事件可能只包含本次变化的键；每个键独立判空；监听器需尽早挂到全局 |
| `window.wallpaperPropertyListener.applyGeneralProperties(properties)` | 读取应用全局配置 | 使用 `properties.fps`，优先服从 Wallpaper Engine 全局 FPS，不另造重复的 FPS 属性 |
| `window.wallpaperPropertyListener.setPaused(paused)` | 响应宿主暂停/恢复 | 同步暂停渲染、语音与 BGM；恢复时重置帧时间基准，避免动画突然加速 |
| `requestAnimationFrame(callback)` | 驱动更新和绘制 | 用时间累积器执行 FPS 限流；背景暂停后的大 `dt` 需要截断 |

当前用户属性键只使用英文和数字：

| 键 | 类型 | 默认值 | 作用 |
| --- | --- | --- | --- |
| `introanimation` | bool | `true` | 入场动画 |
| `modelscale` | slider | `1.0` | 人物/整体缩放 |
| `modelx` / `modely` | slider | `0` | 构图偏移 |
| `interactions` | bool | `true` | 交互总开关 |
| `mousetracking` | bool | `true` | 视线跟随 |
| `headpatting` | bool | `true` | 头部互动 |
| `voicelines` | bool | `true` | 角色语音 |
| `voicelanguage` | combo | `zh-cn` | 中文/日文/韩文语音 |
| `voicevolume` | slider | `70` | 语音音量 |
| `showsubtitles` | bool | `true` | 显示字幕 |
| `subtitlelanguage` | combo | `zh-cn` | 简体中文/日文字幕 |
| `bgmenabled` | bool | `true` | 本地测试构建的 BGM 开关；发布包仍受授权门槛约束 |
| `bgmvolume` | slider | `25` | BGM 音量 |
| `drawhitboxes` | bool | `false` | 显示交互命中区域 |
| `debugpanelenabled` | bool | `false` | 允许桌面调试面板及其显示/隐藏按钮；默认关闭 |
| `renderresolution` | combo | `1080p` | 720P/1080P/2K/4K WebGL 内部渲染高度 |
| `panellanguage` | combo | `zh-cn` | 桌面调试面板的简体中文/英文界面 |
| `modelresolution` | combo | `4k` | 2K/4K/8K 模型纹理档位 |
| `schemecolor` | color | `0.035 0.055 0.11` | 背景颜色 |

桌面调试面板的 FPS、分辨率、语言和音量修改只作为当前实例的临时覆盖，不写回 WE 管理页；管理页更新某个键时清除该键的临时覆盖，“恢复 WE 设置”清除全部临时覆盖。浏览器开发可用 `?debug=1` 显示面板，真实宿主必须先启用 `debugpanelenabled`。

首发前尚未加入的候选属性为视线跟随强度和用户自选 BGM 文件；字幕位置/缩放已明确移至发布后更新。实现 `file` 属性时需按 Wallpaper Engine 的本地路径规则转换为 `file:///` URL，并处理空值和不可播放格式。

### 5.2 Spine Runtime API

当前固定 Runtime 使用以下能力：

- 资源：`AssetManager`、`TextureAtlas`、`AtlasAttachmentLoader`；
- 解析：`SkeletonBinary`、`SkeletonData`；
- 播放：`AnimationStateData`、`AnimationState`、`setAnimation`、`addAnimation`、动画监听器；
- 模型：`Skeleton`、`findBone`、`findSlot`、世界变换更新；
- 绘制：WebGL `SceneRenderer` 或对应版本的批渲染接口；
- 命中：`SkeletonBounds` 或由角色配置定义的模型空间区域；
- 事件：animation start/complete/event，用于状态衔接、语音和字幕同步。

`CH0233_home.skel` 已确认为 3.8.99。Runtime 来自固定版本并随许可证文件进入本地测试包，不从其他创意工坊项目复制；升级、降级或替换前必须重新验证二进制解析、动画事件、混合模式和材质渲染。

### 5.3 项目内部 API

当前模块契约：

- `WallpaperEngineAdapter`：维护宿主持久设置、当前实例临时覆盖和最终有效设置；WE 更新某个键时只清除对应临时覆盖；
- `SpineRenderer`：模型载入、动画状态机、绘制、命中几何和材质档位切换；材质切换必须迁移动画轨道与交互状态；
- `PointerInteractionController`：Pointer Events 意图识别、拖动阈值和手势生命周期；
- `VoicePlayer` / `BgmPlayer`：独立音轨、音量、宿主暂停和浏览器自动播放恢复；
- `SubtitlePresenter`：字幕 ID、语言、显示状态和当前文本；
- `App`：模块编排、Spine event 路由、桌面调试面板和完整重播语义；
- `src/config.ts`：Hare 专属资源路径、动画/骨骼名、命中参数、对话和字幕清单。

应用层不通过重播或静音掩盖领域模块错误。例如画质切换的连续性由渲染层保证，语音语言切换由音频生命周期保证。

## 6. 当前项目结构

```text
Hare(Camping)/
├─ .gitignore
├─ PLAN.md
├─ README.md
├─ package.json
├─ package-lock.json
├─ tsconfig.json
├─ vite.config.ts
├─ index.html
├─ public/
│  ├─ project.json
│  ├─ vendor/                      # 固定 Spine 3.8 Runtime 与许可证，本地忽略
│  └─ assets/hare-camping/
│     ├─ model/                    # 原始 2K atlas、纹理与 skeleton，本地忽略
│     ├─ model-4k/                 # Real-CUGAN 2× 派生纹理与 atlas
│     ├─ model-8k/                 # Real-CUGAN 4× 派生纹理与 atlas
│     ├─ audio/{ja,zh-cn,ko}/      # 三语语音，本地忽略
│     └─ bgm/                      # 本地测试 BGM，本地忽略
├─ src/
│  ├─ main.ts
│  ├─ app/App.ts
│  ├─ spine/SpineRenderer.ts
│  ├─ interaction/PointerInteractionController.ts
│  ├─ audio/BgmPlayer.ts
│  ├─ audio/VoicePlayer.ts
│  ├─ dialogue/SubtitlePresenter.ts
│  ├─ settings/WallpaperEngineAdapter.ts
│  ├─ settings/{renderResolution,modelResolution}.ts
│  ├─ i18n/panel.ts
│  ├─ config.ts
│  ├─ style.css
│  └─ types/wallpaper-engine.d.ts
├─ scripts/
│  ├─ fetch-m0-audio.mjs
│  ├─ inspect-spine.mjs
│  ├─ generate-model-textures.mjs
│  ├─ generate-checksums.mjs
│  ├─ prepare-assets.mjs
│  ├─ test-settings-adapter.mjs
│  └─ validate-dist.mjs
├─ research/
│  ├─ M0-REPORT.md
│  ├─ M1-REPORT.md
│  ├─ M2-REPORT.md
│  ├─ PROVENANCE.md
│  ├─ checksums.sha256
│  └─ spine-inspection.json
├─ dist/                           # WE 可直接加载的离线构建，Git 忽略
├─ release/                        # 跨电脑测试压缩包，Git 忽略
└─ local-assets/                    # 原始下载区，永不自动提交
   ├─ manifests/
   └─ original/
```

`dist/` 是给 Wallpaper Engine 载入的最小离线产物，不作为唯一备份。`release/hare-camping-we-offline-test-v0.3.0-m3.zip` 只封装 `dist/` 内容，压缩包根目录直接包含 `project.json` 和 `index.html`，用于跨电脑私有测试，不是创意工坊发布包。

## 7. 公开资源清单

公开可访问不等于获得再分发授权。以下清单用于研究和构建输入，发布状态均需单独复核。

### 7.1 Hare (Camping) Spine 记忆大厅

来源：[Schale-Archive / `Spine_Lobbies/Spr/CH0233_home`](https://github.com/kiraio-moe/Schale-Archive/tree/main/Spine_Lobbies/Spr/CH0233_home)

| 文件 | 已知大小 | 用途 |
| --- | ---: | --- |
| `CH0233_home.skel` | 724,259 B | Spine 二进制骨骼、动画和事件 |
| `CH0233_home.atlas` | 21,765 B | 纹理图集映射 |
| `CH0233_home.png` | 2,061,533 B | atlas 第 1 页 |
| `CH0233_home2.png` | 696,844 B | atlas 第 2 页 |
| `CH0233_home3.png` | 251,316 B | atlas 第 3 页 |

许可状态：该仓库公开提供提取素材，但未声明覆盖游戏资产的开源许可证；其 README 将相应资产版权归于游戏权利方。因此它是“公开镜像来源”，不是“自由再发布授权”。

### 7.2 台词、语音与字幕元数据

来源：[StuArchive / `data/students/340.json`](https://github.com/QuetzalSidera/StuArchive/blob/main/data/students/340.json)

- `voice`：10 条日语记忆大厅语音；
- `voice_cn`：10 条中文语音；
- `voice_kr`：10 条韩语语音；
- 日语条目含日文原文与简体中文文本，可生成第一版字幕清单；
- 当前数据未提供可直接采用的英文字幕，不能假定机器翻译可作为正式文本；
- 入场动画是否有独立语音尚未证实，应先检查 skeleton 事件，不能用其他角色文件补齐。

许可和归属说明：

- [StuArchive 数据许可说明](https://github.com/QuetzalSidera/StuArchive/blob/main/LICENSE-DATA.md)
- [StuArchive NOTICE](https://github.com/QuetzalSidera/StuArchive/blob/main/NOTICE.md)

StuArchive 对自有脚本、文档和结构的许可不自动覆盖其镜像的官方图片、音频、视频或模型。

### 7.3 记忆大厅 BGM

来源：[StuArchive / `data/musics/252.json`](https://github.com/QuetzalSidera/StuArchive/blob/main/data/musics/252.json)

- 内部名：`Theme_193`；
- 标题：`Starry Confession`；
- 作者字段：Synthion；
- 数据中给出的文件：`https://static.kivo.wiki/musics/Theme_193.ogg`；
- 用途字段包含 Hare (Camping) 记忆大厅。

BGM 权利风险高于单纯的代码依赖。架构必须允许“不随包附带 BGM”和“用户自选本地 BGM”两种发布方案，最终取决于权利确认。

### 7.4 Spine Web Runtime

- 官方仓库：[EsotericSoftware/spine-runtimes](https://github.com/EsotericSoftware/spine-runtimes)
- 官方许可：[Spine Runtimes License Agreement](https://esotericsoftware.com/spine-runtimes-license)
- 官方说明要求 Runtime 与 Spine 导出版本匹配；把 Runtime 随应用分发也有特定 Spine 许可条件。

不得直接从另一个创意工坊项目复制 `spine-webgl*.js` 并发布。先识别 skeleton 版本，再从官方对应版本构建或安装 Runtime，并确认制作者在集成时满足其分发许可。

### 7.5 官方规则与 Wallpaper Engine 文档

- [Wallpaper Engine：创建网页壁纸](https://docs.wallpaperengine.io/en/web/first/gettingstarted.html)
- [Wallpaper Engine：用户属性](https://docs.wallpaperengine.io/en/web/customization/properties.html)
- [Wallpaper Engine：FPS 限制](https://docs.wallpaperengine.io/en/web/performance/fps.html)
- [Wallpaper Engine：发布](https://docs.wallpaperengine.io/scene/first/publishing)
- [《蔚蓝档案》日服二次创作指引](https://bluearchive.jp/news/newsJump/116)
- [《蔚蓝档案》日服禁止不当获取及逆向工程公告](https://bluearchive.jp/news/newsJump/131)
- [官方 Fan Kit 使用注意](https://bluearchive.jp/fankit/Precautions)

日服二创指引面向个人非商业创作并带有地域和内容限制，同时明确限制低创作性的直接复制/采样。创意工坊发布是否落入允许范围、Steam/Wallpaper Engine 的全球分发是否满足地域条件，以及解包来源是否合法，不能仅凭“免费发布”推定。必要时应向对应发行地区客服或权利方书面询问。此处是项目风险记录，不构成法律意见。

## 8. 资源获取与处理流程

### 8.1 获取原则

1. 优先使用权利方明确发布的资源；其次使用可验证出处的公开镜像；不从来历不明的整包或他人创意工坊项目抽取再发布素材。
2. 下载命令必须由开发者显式运行，生产构建不得联网，也不得依赖 CDN。
3. 原始文件进入 `local-assets/original/`，保持文件名和字节不变；任何转换产物进入 `generated-assets/` 或 `public/assets/`。
4. 每个输入记录：来源 URL、上游仓库和提交 SHA、获取日期、原始文件名、字节数、SHA-256、权利/许可说明、处理工具和参数。
5. 权利状态不明确的二进制默认不进入 Git，也不进入创意工坊包。

### 8.2 模型处理

1. 从固定 Git 提交下载 `.skel`、`.atlas` 和三个 PNG 页面，不使用随时间变化但未记录提交号的裸地址。
2. 校验 atlas 引用的所有纹理页都存在，生成 SHA-256 清单。
3. 用只读检查脚本确定 skeleton 导出版本，并列出：animations、skins、slots、bones、events、bounds 和默认尺寸。
4. 重点查找并人工预览 `Start`、`Idle`、`Talk`、`Pat`、`Look` 及其 `M/A/End` 变体，形成 Hare 专属映射，不依赖模糊猜名进入正式版。
5. 检查 `Touch_Point`、`Touch_Eye` 或等价锚点；在调试覆盖层里验证头部和人物点击区域。
6. 原始纹理作为 `original` 档。只有在性能确有需要时才生成降采样档；放大档属于派生资源，必须记录算法、倍率和质量检查结果。

### 8.3 语音和字幕处理

1. 固定 StuArchive 提交 SHA，保存 `340.json` 为来源清单。
2. 只读取三组 `MemorialLobby` 条目，下载其明确列出的 OGG；按来源 ID 映射，不靠文件顺序猜台词。
3. 生成统一 `dialogue.json`：`id`、动画名、语言、音频路径、字幕、起止时点、来源字段。
4. 首选 skeleton event 作为同步点；无事件时，通过波形和实机预览人工标注，标记 `timingSource: manual`。
5. 保留原始 OGG。若需要响度标准化，在派生文件上处理并记录 ffmpeg 版本、滤镜参数和前后校验和。
6. 某语言缺少字幕时明确回退至已授权文本，不静默生成或冒充官方翻译。

### 8.4 BGM 处理

1. 固定 `252.json` 的提交 SHA并核对 `Theme_193` 元数据。
2. 默认先实现 BGM 控制能力，用开发者本地占位音频测试。
3. 只有发布许可确认后才把官方 BGM 加入最终公开发布包；否则发布候选移除随包 BGM，并评估加入 `bgmfile` 用户自选入口。
4. BGM 循环点需通过音频内容实测，不任意裁剪原始文件覆盖保存。

### 8.5 构建与导入

1. `npm ci` 后构建到干净的 `dist/`；
2. 验证 `dist/` 不包含网络 URL、source map、缓存、原始研究文件或秘密路径；
3. 验证所有运行时脚本、模型、纹理、语音和字体均可相对路径离线加载；
4. `dist/project.json` 与 `dist/index.html` 保持在同一项目根目录；将整个 `dist/` 内容复制到 WE 的 `projects/myprojects/<项目目录>/`；
5. 新 `project.json` 不预填或复制任何现有 `workshopid`；
6. 在 Wallpaper Engine 真实宿主里核对用户属性、暂停/恢复、自动播放和多显示器行为，并把属性定义维护在 `public/project.json`；
7. 跨电脑测试包仅包含 `dist/` 的 50 个运行文件，创建后必须解压回验逐文件 SHA-256；
8. 创意工坊发布前另存源代码和素材出处记录，不能把创意工坊上传当备份。

## 9. 验证清单

### 9.1 自动检查

- TypeScript 类型检查和设置适配器回归测试通过；
- 角色清单引用的动画、骨骼、语音和字幕 ID 全部存在；
- atlas 页面、文件路径和大小写完全匹配；
- `dist/` 无远程运行依赖；
- `project.json` 可解析、入口存在、属性键唯一且只含英文/数字；
- 资源出处记录和 SHA-256 无缺项；
- 离线压缩包解压后与 `dist/` 的相对路径、文件数量、字节数和逐文件哈希一致。

### 9.2 视觉与交互检查

- 入场只播放一次，结束后无跳帧地进入待机；
- 连续点击、交互动画中点击、鼠标离窗和快速移动均不会卡死状态机；
- 头部命中只在视觉合理范围触发；缩放和偏移后命中仍准确；
- 语音、动画和字幕同步；切换语言时当前句保持原语言播放，下一句使用目标语言；
- 切换模型纹理只替换材质，不重置动画、对话、语音、字幕或 BGM；
- 取消“播放开场动画”后，当前开场立即结束，后续完整重播和重新载入直接进入待机；
- 音量为 0、无 BGM、无对应语言文件时都有明确回退；
- 1920×1080、2560×1440、3840×2160、1920×1200、3440×1440 和高 DPI 下检查裁切；
- 全局 FPS 15/30/60/无限制下检查速度一致性和资源占用；
- 断网、壁纸暂停/恢复、显示器尺寸切换和 WebGL context lost 恢复后行为可接受。

### 9.3 发布前硬门槛

- [ ] 游戏模型/纹理可在 Steam 创意工坊全球再分发；
- [ ] 每种语音和字幕文本可再分发；
- [ ] BGM 可再分发，或最终包不含 BGM；
- [ ] Spine Runtime 版本匹配且集成/分发许可满足；
- [x] 未复制无授权的第三方壁纸代码、预览或描述；
- [ ] 预览图、标题、说明、标签、分级和署名完整；
- [x] 无旧 `workshopid`，首次发布会创建新项目；
- [ ] 最终 diff、离线构建、文件清单、校验和与 Wallpaper Engine 实测全部通过。

2026-08-10 首轮逐项审查结果见 [`research/M4-GATE-REVIEW.md`](research/M4-GATE-REVIEW.md)：通过 2 项、待补证 1 项、阻塞发布 3 项、未完成 2 项。模型/纹理、语音与字幕的技术来源符合计划，但这不等于取得全球再分发授权；当前 `dist/` 还包含手动加入的官方 OST Vol.6 无损 BGM，因此不得上传创意工坊。

## 10. 实施里程碑

### M0：资源与许可可行性

- [x] 固定所有公开来源的提交 SHA；
- [x] 生成出处和校验和清单；
- [x] 识别 skeleton/Runtime 版本；
- [x] 导出动画、骨骼和事件报告；
- [x] 决定模型、语音、BGM 分别是否允许进入发布包。

完成标准：无需从游戏解包即可证明资源技术上完整，并且对每类发布资产有明确的“允许 / 不包含 / 待书面确认”结论。若公开镜像缺文件，只能在适用条款允许且来源合法的前提下另行研究解包；解包不是当前默认路线。

执行结果见 [`research/M0-REPORT.md`](research/M0-REPORT.md)、[`research/PROVENANCE.md`](research/PROVENANCE.md)、[`research/spine-inspection.json`](research/spine-inspection.json) 和 [`research/checksums.sha256`](research/checksums.sha256)。M0 已证明公开镜像在技术上足够，不需要从游戏包再次解包；但游戏素材的创意工坊再分发授权仍未获得，因此公开发布候选默认排除这些二进制。当前含本地素材的离线压缩包只用于私有跨电脑测试。

### M1：最小可运行原型

- [x] 模型离线加载、渲染、入场和待机；
- [x] 响应式布局与全局 FPS；
- [x] 浏览器和 Wallpaper Engine 均能运行。

执行结果见 [`research/M1-REPORT.md`](research/M1-REPORT.md)。浏览器实测覆盖入场到待机衔接、16:10、21:9、30 FPS 属性更新和控制台检查；`dist/index.html` 也已通过 Wallpaper Engine 官方命令行接口在 1280×720 弹出窗口中载入并正常关闭。

### M2：完整交互

- [x] 点击对话、语音、字幕；
- [x] 视线跟随和头部互动；
- [x] 状态冲突、冷却和回退处理。

执行结果见 [`research/M2-REPORT.md`](research/M2-REPORT.md)。五组双轨对话、10 组 skeleton event、三语语音、双语字幕、身体轻点、拖动视线和头部抚摸均已接入；浏览器覆盖 16:10、21:9 与 30 FPS，最终构建也已在 Wallpaper Engine 网页宿主中载入。

### M3：配置与质量

- [x] WE 属性：入场、构图、交互、三语语音、双语字幕、BGM、命中区、渲染/纹理分辨率和面板语言；
- [x] 默认禁用的桌面调试面板、透明角落开关、当前实例临时覆盖和“恢复 WE 设置”；
- [x] 语音/BGM 音量、30–160 FPS 调试滑块、720P–4K 渲染档与 2K/4K/8K 纹理档；
- [x] 材质切换保持动画/对话/音频状态，语音语言切换从下一句生效；
- [x] 入场开关在启动、运行中关闭和完整重播路径一致生效；
- [x] TypeScript、设置优先级和离线产物自动校验；
- [x] 生成并逐文件回验跨电脑离线测试压缩包；
- [x] 15/30/60/无限制 FPS、16:10/21:9/双宽视口、1.75× 高 DPI 与尺寸热切换矩阵；
- [x] 4K 渲染与 8K 纹理性能/显存基线；
- [x] WebGL 上下文丢失恢复，并覆盖入场和对话/音频进行中两种状态。

执行结果见 [`research/M3-REPORT.md`](research/M3-REPORT.md)。本机只有一块实际显示器，因此物理双屏作为跨电脑测试的补充样本；渲染层已通过双宽等效视口和动态尺寸切换，M3 不因此继续阻塞。

### M4：发布候选

- [ ] 权利与 Runtime 许可复核；技术出处已核对，游戏素材/语音授权和制作者 Spine 许可仍待补证；
- [ ] 预览、说明、署名和第三方通知；当前仍为 M3 本地测试元数据且无预览；
- [ ] 干净离线包实测；当前 M3 包和 `dist/` 含不可作为发布证据的官方 OST 无损文件；
- [ ] 通过 Wallpaper Engine 编辑器首次发布，不沿用任何已有项目 ID；已确认无旧 ID，但仅在其余硬门槛全部通过后执行。

M4 首轮门槛审查已完成并维持 **NO-GO**。审查记录、证据和每项关闭条件见 [`research/M4-GATE-REVIEW.md`](research/M4-GATE-REVIEW.md)。

## 11. 下一步

M4 已开始，当前优先关闭发布权利门槛：取得游戏模型/纹理、三语语音和字幕的全球再分发确认；决定 BGM 不随包分发或取得明确许可；确认制作者在集成 Runtime 时持有有效 Spine Editor 许可。字幕位置与缩放不属于首发前工作，仍移至发布后更新。

当前 `release/hare-camping-we-offline-test-v0.3.0-m3.zip` 及 `dist/` 仅用于私有跨电脑测试，其中的官方 OST Vol.6 无损 BGM 不得作为创意工坊发布资产。完成授权、Git 基线、预览、正式元数据、署名和第三方通知后，才能生成与 M3 测试包明确区分的 M4 发布候选并执行最终实测；在全部八项硬门槛通过前不得上传创意工坊。
