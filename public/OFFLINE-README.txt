Blue Archive - Hare (Camping) [Offline Edition]
Version 1.0.0

安装 / Installation
-------------------
1. 完整解压 ZIP，保留所有目录结构。
2. 在 Wallpaper Engine 中选择“创建壁纸”，导入本目录根部的 index.html。
3. 不要只复制 index.html；模型、语音、BGM、Runtime 和纹理目录都是运行依赖。

Unzip the complete archive, then import the root index.html through Wallpaper
Engine's Create Wallpaper flow. Keep every directory and file together.

主要功能 / Features
-------------------
- 入场与待机动画，五组双段对话
- 简体中文、日语、韩语语音；简体中文、日语、韩语、英语字幕
- 点击对话、拖动视线、摸头互动
- 独立 BGM/语音开关与音量
- 720P 至 4K 内部渲染，2K/4K/8K 模型纹理
- 全英文 WE 属性标签；画质、位置、互动、对话语言与调试分组预设
- 超宽屏、高 DPI、暂停恢复和 WebGL 上下文恢复

画质提示 / Quality note
-----------------------
默认 1080P 渲染与 2K 纹理适配主流 1080P@60Hz 设备。8K 纹理解码后约占 640 MiB，
在显存有限的设备上建议使用 2K 或 4K 档。

默认参数 / Default preset
-----------------------
模型缩放 0.80，X/Y 位置 0/0，BGM 音量 50，对话音量 70，
项目 FPS 上限 60，主题色 #0e4eac。实际帧率不会超过 Wallpaper Engine 的全局上限。
属性页提供 Default、2K、4K、Maximum 与 Custom 画质；Maximum 为 2160P 渲染、8K 纹理和 160 FPS。
其他固定分组会隐藏高级子项，选择 Custom 后显示并恢复自定义值；韩语预设使用韩语语音和字幕，英语预设使用日语语音和官方英语字幕。

完整性 / Integrity
------------------
MANIFEST.sha256 列出包内每个文件的 SHA-256。第三方与素材说明见
THIRD-PARTY-NOTICES.txt。本包不包含 workshopid，不依赖网络资源。
