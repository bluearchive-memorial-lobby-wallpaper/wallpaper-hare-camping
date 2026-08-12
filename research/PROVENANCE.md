# M0 资源出处记录

> 核对日期：2026-08-10
> 范围：Hare (Camping) / `CH0233_home` 记忆大厅本地研究输入
> 原则：公开可访问不等于允许再分发；原文件保存在被 Git 忽略的 `local-assets/original/`。

## 固定版本

| 来源 | 固定引用 | 本地用途 |
| --- | --- | --- |
| [kiraio-moe/Schale-Archive](https://github.com/kiraio-moe/Schale-Archive/tree/4172f080f7bef586ad5d4225891463caf44f91b9) | `4172f080f7bef586ad5d4225891463caf44f91b9` | `CH0233_home` Spine 模型、atlas 和纹理 |
| [QuetzalSidera/StuArchive](https://github.com/QuetzalSidera/StuArchive/tree/1e7142f1439ba14a2952b719c32d8d698769e91f) | `1e7142f1439ba14a2952b719c32d8d698769e91f` | 学生 340、音乐 252 元数据与仓库权利说明 |
| [arisu-archive/bluearchive-data](https://github.com/arisu-archive/bluearchive-data/tree/4ba8bd56518f55c5d4d50b324a9361279a48f808) | `4ba8bd56518f55c5d4d50b324a9361279a48f808` | 全球服客户端 `CharacterDialogExcel` 的韩文、英文记忆大厅文本 |
| [EsotericSoftware/spine-runtimes 3.8](https://github.com/EsotericSoftware/spine-runtimes/tree/8b4844bd4b193ba9e54487ed397a777993cbad56) | `8b4844bd4b193ba9e54487ed397a777993cbad56` | 与 Spine `3.8.99` 模型匹配的本地解析器 |

官方网页规则没有 Git 版本，按 2026-08-10 的公开内容核对：

- [Yostar 日服二次创作指引](https://bluearchive.jp/news/newsJump/116)
- [Yostar 日服利用规则警示](https://bluearchive.jp/news/newsJump/131)
- [Yostar Fan Kit 使用注意](https://bluearchive.jp/fankit/Precautions)
- [Spine Runtimes License Agreement](https://esotericsoftware.com/spine-runtimes-license)

## 模型与纹理

固定目录：[Schale-Archive / `Spine_Lobbies/Spr/CH0233_home`](https://github.com/kiraio-moe/Schale-Archive/tree/4172f080f7bef586ad5d4225891463caf44f91b9/Spine_Lobbies/Spr/CH0233_home)

| 文件 | 字节数 | SHA-256 |
| --- | ---: | --- |
| `CH0233_home.skel` | 724,259 | `bc808f19378fad6d186cbab0a17de166307bb5388dcfeef6401ac60e141b6517` |
| `CH0233_home.atlas` | 21,765 | `4959656490c65183143980db0d194c673649de9bb832ffeed08c3b707e113d7d` |
| `CH0233_home.png` | 2,061,533 | `b19c174392da386fd6fc79aa3cd42673c7ae4832a9bd88e51b598bb278fa9c71` |
| `CH0233_home2.png` | 696,844 | `ddb59faacf082c1b66fcb2c8e7c1e5b120943ad3f97e0348e32e39b6c076485c` |
| `CH0233_home3.png` | 251,316 | `53c9a29292feee21cefe65e7535f729d52dad6687a6514dac62845021f4a44f9` |

Schale-Archive README 明确说明这些游戏资源属于 Nexon / NEXON Games。仓库没有向下游授予游戏二进制的开源再分发许可，其“fair use”声明也不是权利方授权。

## 语音、字幕与 BGM

元数据：

- [学生 340](https://github.com/QuetzalSidera/StuArchive/blob/1e7142f1439ba14a2952b719c32d8d698769e91f/data/students/340.json)，SHA-256 `41cae5402765468cd602f302f08eec98351e469a3cf5ce10d7f871e3803840d8`；
- [音乐 252](https://github.com/QuetzalSidera/StuArchive/blob/1e7142f1439ba14a2952b719c32d8d698769e91f/data/musics/252.json)，SHA-256 `e204bf99799653ab241d0e51128b31462c2c2487154ed8a6c9f706d7627a59dd`；
- [数据许可边界](https://github.com/QuetzalSidera/StuArchive/blob/1e7142f1439ba14a2952b719c32d8d698769e91f/LICENSE-DATA.md)；
- [NOTICE](https://github.com/QuetzalSidera/StuArchive/blob/1e7142f1439ba14a2952b719c32d8d698769e91f/NOTICE.md)。

从固定元数据解析并于 `2026-08-10T04:56:01Z` 完成下载：

| 类别 | 文件数 | 总字节数 | 校验 |
| --- | ---: | ---: | --- |
| 日语记忆大厅语音 | 10 | 350,086 | 均以 `OggS` 开头；逐文件 SHA-256 已记录 |
| 简中记忆大厅语音 | 10 | 427,173 | 同上 |
| 韩语记忆大厅语音 | 10 | 358,949 | 同上 |
| `Theme_193.ogg` / `Starry Confession` | 1 | 1,135,198 | SHA-256 `8ad01e01fd50cfd04cb05ff913e3c0f5e67ea0f6a47e7d3e4af8db4e709d5433` |

完整的 31 个下载 URL、逻辑 ID、目标路径和字节数保存在本地忽略文件 `local-assets/original/manifests/m0-audio-downloads.json`。Kivo 静态文件 URL 不是提交寻址 URL，故以固定 JSON、获取时间和本地 SHA-256 共同冻结这次输入。

StuArchive 的 CC 声明仅覆盖它自己的脚本、文档和结构，不自动覆盖官方模型、语音和音乐。日文原文、简中翻译及其他字幕字段还可能分别受权利方或贡献者条款约束。

韩文与英文字幕补充自固定全球服客户端表 [`ExcelDB/CharacterDialogExcel.json`](https://github.com/arisu-archive/bluearchive-data/blob/4ba8bd56518f55c5d4d50b324a9361279a48f808/ExcelDB/CharacterDialogExcel.json)：筛选 `character_id = 10085`、`dialog_category = 8`、`display_order = 390..480` 后得到五组双段文本。10 条英文还与 [Blue Archive Wiki 的 Hare (Camping) 语音页](https://bluearchive.wiki/wiki/Hare_(Camping)/audio#Memorial_lobby)逐条交叉核对一致。两者均为游戏内容的社区镜像或转录，不改变官方文本的权利归属。

### 当前本地测试 BGM

M1 之后实际用于本地测试的 BGM 不是上述 `Theme_193.ogg`，而是项目所有者于 2026-08-10 确认手动加入的官方 OST 无损版本：

| 项目 | 记录 |
| --- | --- |
| 本地文件 | `public/assets/hare-camping/bgm/25 - Starry Confession.flac` |
| 曲名 / 作曲 | `Starry Confession` / Synthion |
| 专辑 | 《Blue Archive Original Soundtrack Vol.6～Keeping for the abiding belief～》 |
| 轨道 | Disc 2 / Track 25 |
| 音频参数 | FLAC，48,000 Hz，24 bit，双声道，5,929,848 samples（约 123.54 秒） |
| 文件大小 | 37,090,426 B |
| SHA-256 | `bbe128aad2ba5a9ce7e596f214db638d42ae9194bc6d0b91e3923b7bb64bf2f8` |
| FLAC STREAMINFO MD5 | `2519dbf81dd0c03c38f48f5f6d6d48b6` |
| 标签中的版权方 | `NEXON Games Co., Ltd.` |

专辑来源和无损格式解决了“文件是什么、从哪里来”的可追溯性问题，但购买、持有或手动加入官方 OST 不等于取得复制并随 Steam 创意工坊项目全球再分发完整录音的授权。因此该 FLAC 只允许进入私有测试包；若没有另行取得明确许可，M4 发布候选必须排除它。当前 `dist/` 仍含此文件，不能作为发布候选。

## Spine Runtime

模型二进制头和官方 3.8 Runtime 均解析出版本 `3.8.99`。本地检查使用官方分支固定提交的 `spine-ts/build/spine-webgl.js`；该文件只在 `.cache/` 中，不进入 Git。随本地构建保存的 Runtime 许可文本已按 2026-08-10 的官方页面更新为 2025-04-05 版本。

Spine Runtime 不是 MIT/BSD 等通用宽松许可证。官方许可要求集成和再分发遵守 Spine Editor License Agreement 第 2 节；在另一条路径下，每位产品用户都需要自己的 Spine Editor 许可。项目发布前必须确认制作者在集成时持有满足条款的许可，并随包保留要求的版权及许可文本。

## 发布状态

| 资源类别 | M0 结论 | 默认发布行为 |
| --- | --- | --- |
| Spine 模型、atlas、纹理 | **待权利方书面确认** | 排除 |
| 日语、简中、韩语官方语音 | **待权利方书面确认** | 排除 |
| 日文、简中、韩文、英文字幕 | **待对应权利来源确认** | 私有本地测试；公开发布前另行确认授权 |
| `Theme_193` BGM | **不包含**，除非以后取得明确许可 | 使用用户自选本地 BGM 入口 |
| Spine 3.8 Runtime | **条件式可分发，待制作者 Spine 许可确认** | 未确认前仅本地评估 |
| 本项目原创 TypeScript/CSS/配置 | **可由项目作者自行授权** | 发布前选择项目许可证 |

Yostar 日服二创指引允许特定个人、非商业、日本国内的二次创作，但同时禁止直接复制、采样游戏插画、视频、音声、乐曲等且创作性较低的使用。Steam 创意工坊是全球分发，且本项目核心会直接携带提取模型与官方音频，因此不能把该一般指引当成明确许可。若希望发布含这些内容的版本，应先向适用地区的发行方/权利方书面咨询。此记录不是法律意见。
