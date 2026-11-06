# Text Reference

## Scenario · 场景

A sentence in your journal belongs in a topic note. Obsidian's native links target notes, headings, or blocks; referencing just that sentence is awkward, and block references add identifiers such as `^abc123` to the source file. A small connection becomes extra markup to maintain. **Text Reference lets you reference the words you choose while keeping the source untouched.**

日志里的一句话，值得放进专题笔记。Obsidian 原生链接面向笔记、标题或块，难以直接引用段落中的某句话；块引用还会在源文件留下 `^abc123` 这样的标识符。原本只想关联一个想法，却多了一串需要维护的标记。**Text Reference 让你只引用需要的文字，来源笔记保持原样。**

## Features · 功能

**Select, copy, paste.** Select text and press **Ctrl/Cmd+Shift+C**, or right-click → **Copy reference**, then paste at any cursor position in another note. Choose **Reference to** to append it directly to a chosen note. Customize the shortcut in Obsidian's Hotkeys settings.

**选中、复制、粘贴**选中文字，按 **Ctrl/Cmd+Shift+C**，或右键选择「复制引用」，在另一篇笔记的任意位置粘贴；选择「引用到」可直接追加到目标笔记。快捷键可在 Obsidian 的快捷键设置中自定义。

**Part of your writing.** Quote and source appear together as an inline link. Click to return to the source, Ctrl/Cmd+hover to preview context, or drag to select text. Adjust length, source position, and style for existing references; the default shows 30 characters. Exact preview highlighting depends on a reliable text match.

**自然融入正文**引文与来源合为一个行内链接。单击回到出处，Ctrl/Cmd＋悬停预览上下文，拖动选择文字。长度、来源位置和样式即时应用于已有引用，默认显示 30 字；预览只精确标记能可靠匹配的文字。

**Connected, with control.** Native file-level backlinks remain available. Source-change tracking is on by default: snapshots stay intact until you right-click → **Review source…**, compare changes, and confirm an update. Uncertain matches keep the snapshot. Disabling the plugin still leaves the full readable excerpt and ordinary link.

**保留联系，也保留决定权**支持原生文件级反向链接。默认追踪原文变化，保留摘录并提示核对；右键「核对原文…」，对比后确认更新。无法可靠定位时保留摘录。关闭插件后，完整引文和普通链接依然可读。

**Install & data.** Requires Obsidian 1.8.7+. Put `main.js`, `manifest.json`, and `styles.css` in `.obsidian/plugins/text-reference/`, then enable the plugin. Keep `data.json` when upgrading and sync it for precise associations across devices. No added network requests or telemetry; references stay in your vault. The interface follows Obsidian's language, in English or Chinese.

**安装与数据**需要 Obsidian 1.8.7 或以上版本。将 `main.js`、`manifest.json`、`styles.css` 放入 `.obsidian/plugins/text-reference/`，然后启用插件。升级时保留 `data.json`；跨设备使用请同步它以保留精确关联。插件不额外发送网络请求，不采集遥测，引用数据保存在笔记库内。界面跟随 Obsidian 语言，支持中英文。

## Updates · 更新

**0.12.0** — Improved context-preview range highlighting, refreshed navigation after updates, and reduced duplicate reads and listeners. **101 automated checks pass**; real Obsidian, mobile, and third-party theme validation remains outstanding. See [Changelog](CHANGELOG.md) for details. For development: `npm ci`, then `npm run check`.

**0.12.0** — 改进上下文预览的范围标记与更新后的跳转，减少重复读取和事件监听。**101 项自动检查通过**；真实 Obsidian、移动端和第三方主题仍待实机验证。详情见[更新记录](CHANGELOG.md)。开发验证：先运行 `npm ci`，再运行 `npm run check`。
