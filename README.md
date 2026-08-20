# Hare (Camping) Wallpaper

English | [简体中文](README.zh-CN.md)

A Blue Archive memorial-lobby-style web wallpaper for Wallpaper Engine,
featuring Hare (Camping).

Current status: release `1.0.1` is published on the [Steam Workshop](https://steamcommunity.com/sharedfiles/filedetails/?id=3785064025).
The project includes full interactions, Wallpaper Engine properties,
a desktop debug panel, resolution/texture tiers, configuration priority,
seamless material switching, WebGL context recovery, low-FPS time consistency,
4K/8K performance baselines, and a reproducible package with a per-file
checksum manifest.

## Local Development

M0 local assets and the pinned Spine Runtime must exist locally, and neither is
committed to Git:

```powershell
npm install
npm run dev
```

Browser debug panel: `http://127.0.0.1:5173/?debug=1`. Browsers may block
autoplaying audio; the first mouse or keyboard interaction unlocks the BGM
automatically. Both the Wallpaper Engine properties page and the debug panel
provide unified mute and BGM/dialogue volume controls; the volume sliders are
hidden while muted. The debug panel's "Panel Settings" can select the UI
language independently and adjust panel size and X/Y offset through the
`Default`/`Custom` presets under "Position & Scale". Every top-level settings
group and its subgroups can be collapsed or expanded independently by clicking
its title bar; the state is not affected by property values or preset
switches.

Each wallpaper load records a separate log session including errors, animation
switches, interaction clicks, and configuration changes. The logging script
starts before the application code and saves directly to the persistent
storage provided by the wallpaper host, without requiring a first-time
directory selection. The "Open Log" button at the top of the debug panel shows
an independent floating window in the center of the screen; once open, the
button switches to "Close Log". The window keeps working after the debug panel
is hidden and can view, switch, and copy the full current session, detecting
sessions that did not end normally. The log window and the debug-panel toggle
button in the top-right corner scale with the panel size setting; when using
the local Vite dev or preview server, logs are also written to the `log`
folder in the build directory. The logging feature adds no Wallpaper Engine
property options.

Wallpaper Engine property labels and options stay in English. Properties are
ordered `Visual Quality`, `Position & Scale`, `Animation & Interactions`,
`Volume`, `Dialogue Playback`, and `Debug`; fixed presets hide their advanced
sub-items, and selecting `Custom` shows and restores the previously customized
values. `Volume` manages mute and the two track volumes together; the dialogue
volume slider is also hidden when dialogue is off. `Dialogue Playback` offers
auto play and language presets; with auto play enabled, a single click on the
character's body starts continuous playback from the next group in the queue
and stops after group 5. Switching auto play during playback only changes the
queue after the current group, without resetting the position. Any change in
`Animation & Interactions` immediately ends the current action and returns to
idle; toggling "Dialogue" also resets the playback queue to group 1, and
clicking no longer triggers dialogue while it is off. `Debug` defaults to
`Off`; enabling the panel shows a translucent toggle button in the top-right
corner of the desktop. Adjustments made in the panel only override the current
running instance and never rewrite the persistent settings on the properties
page; "Restore WE Settings" clears all temporary overrides.

The resolution option controls the WebGL internal render height and computes
the width from the current wallpaper viewport aspect ratio. Thus at 16:9 it
maps to 1280×720, 1920×1080, 2560×1440, 3840×2160; on 16:10, 21:9, and other
screens it keeps the screen aspect ratio without force-stretching to 16:9.

Default parameters: model scale `0.80`, X/Y `0/0`, rotation `0°`, unmuted,
dialogue auto play off, BGM volume `50`, dialogue volume `70`, project FPS
cap `60`, theme color `#819ee0`, and the default quality preset of 1080P
rendering with 2K textures. Custom model layouts can rotate the model within
`0–360°`; when both the project FPS cap and the Wallpaper Engine global cap
exist, the lower of the two applies. On-device viewport regression results are
in [`research/DEFAULT-PRESET-V1-REPORT.md`](research/DEFAULT-PRESET-V1-REPORT.md).

The properties page can load the `Default`, `2K`, `4K`, and `Maximum` quality
presets directly; selecting `Custom` shows the independent render resolution,
model texture, and FPS controls. Position, interaction, dialogue language, and
debug groups use the same fixed-preset/custom pattern. Custom dialogue can show
primary and secondary subtitles stacked vertically, with each chosen
independently from Simplified Chinese, Japanese, Korean, and English, plus
subtitle alignment, bottom/top/screen-center/bottom-left position, or custom
X/Y; when both subtitle languages are identical, only the primary subtitle is
shown. The fixed Chinese/Japanese/Korean presets use the matching voice and
subtitles; the English preset uses Japanese voices with official English
subtitles per the global server. 2K textures use the original atlas pages from
the game assets; 4K and 8K textures use deterministic 2×/4× Real-CUGAN
upscaling of the whole pages. The 8K tier uses noticeably more VRAM and load
time and is only available in the highest preset or Custom.

To regenerate local high-resolution textures, place the Real-CUGAN Windows
build at the default `.cache/realcugan/` path or set `REALCUGAN_PATH` and
`REALCUGAN_MODEL_PATH`, then run:

```powershell
npm run generate:model-textures
```

Build and validate `dist/`:

```powershell
npm run build
```

The build output is in `dist/`. You can import `dist/index.html` into the
Wallpaper Engine editor for local testing.

Generate and verify the release ZIP:

```powershell
npm run package:offline
```

The official artifact is `release/hare-camping-we-offline-v1.0.0.zip`; the
`.sha256` file next to it records the whole-ZIP checksum, and the embedded
`MANIFEST.sha256` covers every other file.

## Distribution and Copyright

This repository does not track game models, textures, audio, or the Spine
Runtime. `npm run prepare:assets` validates the local inputs and prepares the
complete build; the release package contains the model, three-language voices,
four-language subtitles, BGM, three texture tiers, and the pinned Spine 3.8
Runtime. Release `1.0.1` is published to the [Steam Workshop](https://steamcommunity.com/sharedfiles/filedetails/?id=3785064025)
through the Wallpaper Engine editor. The published project uses Workshop ID
`3785064025`.

Installation instructions are in `OFFLINE-README.txt`; asset and Runtime
notices are in `THIRD-PARTY-NOTICES.txt` and
`vendor/SPINE-RUNTIMES-LICENSE.txt`.

The Blue Archive character models, animations, artwork, voices, subtitle text,
and music in this package belong to their respective rights holders, including
NEXON Games Co., Ltd., Yostar, and other Blue Archive rightsholders. This
project and its assets are provided for informational and educational purposes
only, without any commercial intent. This project is an unofficial fan project
and is not affiliated with, sponsored by, or endorsed by those companies. The
affected assets will be removed upon request from the rights holders.

Stage reports: [`research/M0-REPORT.md`](research/M0-REPORT.md),
[`research/M1-REPORT.md`](research/M1-REPORT.md),
[`research/M2-REPORT.md`](research/M2-REPORT.md), and
[`research/M3-REPORT.md`](research/M3-REPORT.md).
