# M0 资源与许可可行性报告

> 结论：**M0 技术目标完成；M1 可在本地继续；含游戏资源的创意工坊发布尚未获准。**
> 执行日期：2026-08-10

## 结果摘要

- 已固定 Schale-Archive、StuArchive 和 Spine Runtime 三个上游提交；
- 已取得完整的 `.skel + .atlas + 3 × .png` 模型集，无需从游戏安装包再次解包；
- 已取得并验证 10 条日语、10 条简中、10 条韩语记忆大厅 OGG 语音；
- 已取得并验证 `Theme_193.ogg`；
- 已生成 42 个本地输入文件的 SHA-256 清单；
- 已用官方 Spine 3.8 Runtime 完整解析模型，确认交互所需动画、骨骼和事件均存在；
- 已为模型、语音、字幕、BGM 和 Runtime 分别设定发布状态；权利不清楚的内容默认不进入发布包。

本地输入共 42 个文件、6,202,964 字节。其中游戏模型 3,755,717 字节，30 条语音 1,136,208 字节，BGM 1,135,198 字节，其余为固定元数据和许可说明。

## Spine 技术检查

### 模型与 Runtime

| 项目 | 结果 |
| --- | --- |
| Skeleton hash | `FUREVAETFplpb1l1sPHmgz3K+NI` |
| Skeleton 导出版本 | `3.8.99` |
| 对应 Runtime | `spine-runtimes` 3.8 分支，提交 `8b4844bd4b193ba9e54487ed397a777993cbad56` |
| 模型边界 | x `-1735.9998`，y `-324.0006`，宽 `4631.2158`，高 `3692.1279` |
| 骨骼 / 槽位 / skin | 410 / 231 / 1 |
| 动画 / 事件定义 | 39 / 11 |
| atlas | 3 页、195 个 region |
| atlas 页尺寸 | 2048×2048、2048×2048、2048×1024 |

因此项目必须使用 3.8 Runtime。参考壁纸中的 4.2 Runtime 与此 `.skel` 不兼容，不应复制或混用。

### 生产动画映射

| 功能 | 动画 | 时长/说明 |
| --- | --- | --- |
| 入场 | `Start_Idle_01` | 15 秒 |
| 待机 | `Idle_01` | 16 秒循环 |
| 台词 1 | `Talk_01_M` + `Talk_01_A` | 15.1667 秒 |
| 台词 2 | `Talk_02_M` + `Talk_02_A` | 20 秒 |
| 台词 3 | `Talk_03_M` + `Talk_03_A` | 15.3333 秒 |
| 台词 4 | `Talk_04_M` + `Talk_04_A` | 14.6667 秒 |
| 台词 5 | `Talk_05_M` + `Talk_05_A` | 19.3333 秒 |
| 视线跟随 | `Look_01_M` | 零时长控制姿态；退出用 `LookEnd_01_M/A`，各 0.2667 秒 |
| 头部互动 | `Pat_01_M` + `Pat_01_A` | 零时长控制姿态；退出用 `PatEnd_01_M/A`，各 0.2667 秒 |

`Dev_*` 动画属于开发/调试资源，第一版生产状态机不使用。`star_00_R`、`star_01_R`、`star_02_R` 可在后续视觉检查后决定是否作为独立环境轨道循环。

### 事件时间轴

每个 `Talk_0N_M` 内含两个 `sound/...` 事件和两个同时间的 `Talk` 事件，足以驱动语音与字幕，不必手工猜测首发时点：

| 对话 | 第 1 段事件 | 第 2 段事件 |
| --- | ---: | ---: |
| `Talk_01_M` | 1.6667 s | 7.0000 s |
| `Talk_02_M` | 0.6667 s | 11.5000 s |
| `Talk_03_M` | 1.3333 s | 7.8333 s |
| `Talk_04_M` | 0.3333 s | 7.0000 s |
| `Talk_05_M` | 1.6667 s | 11.4333 s |

事件 ID 与下载语音的 `ch0233_memoriallobby_N_N` 一一对应。Skeleton 的 audioPath 写作 WAV 名称，但公开来源提供 OGG；实现时按逻辑 ID 映射扩展名，不直接使用 audioPath 拼路径。

### 交互锚点

模型明确含有：

- `Touch_Eye`、`Touch_Eye_Key`：视线/眼部控制锚点；
- `Touch_Point`、`Touch_Point_Key`：指针/头部互动锚点；
- `Head_F`、`Head`、`Head_Rot`、`Head_back`：头部层级；
- `Look_*` 与 `Pat_*` 动画组。

技术可行性已经确认。屏幕到模型坐标的变换、锚点驱动方式和实际命中半径仍需在 M2 视觉调试中确定；零时长 `Look_01_M` / `Pat_01_M/A` 不能按普通一次性动画处理。

完整的 39 个动画、全部骨骼、槽位、事件和时间轴位于 [`spine-inspection.json`](spine-inspection.json)。

## 语音、字幕和 BGM 检查

- 三个语音组各有 10 条 MemorialLobby 记录，全部下载成功并通过 `OggS` 魔数检查；
- 日语组提供日文原文与简中翻译；简中组提供简中台词；
- 韩语组音频存在，但固定元数据中的韩语文本为空；
- 没有可直接采用的英文字幕；
- `Theme_193` 元数据标题为 `Starry Confession`、作者字段为 Synthion，文件下载与 OGG 校验成功；
- 本地下载只证明技术完整性，不证明可随创意工坊再发布。

## 发布判定

| 类别 | 判定 |
| --- | --- |
| 模型与纹理 | 待权利方书面确认；默认不发布 |
| 三种官方语音 | 待权利方书面确认；默认不发布 |
| 字幕文本 | 待来源许可和署名链确认；默认不发布 |
| BGM | 默认不包含；实现用户自选本地 BGM |
| Spine Runtime | 本地评估可用；发布前确认制作者具备符合官方条款的 Spine 许可并附许可文本 |

这意味着 M0 已通过“技术完整性”检查，但没有通过 M4 的“可全球再分发”门槛。M1/M2 可以在本机、Git 忽略素材上继续开发；任何发布候选必须继续排除受限二进制，直到相应结论改变。

## 产物

- [`PROVENANCE.md`](PROVENANCE.md)：固定来源、权利边界和发布状态；
- [`checksums.sha256`](checksums.sha256)：42 个本地输入文件的 SHA-256；
- [`spine-inspection.json`](spine-inspection.json)：完整模型结构报告；
- [`../scripts/inspect-spine.mjs`](../scripts/inspect-spine.mjs)：可重复执行的 3.8 模型检查；
- [`../scripts/fetch-m0-audio.mjs`](../scripts/fetch-m0-audio.mjs)：根据固定元数据获取并验证 31 个 OGG；
- [`../scripts/generate-checksums.mjs`](../scripts/generate-checksums.mjs)：重建校验和清单。
