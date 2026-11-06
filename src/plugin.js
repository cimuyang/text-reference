"use strict";
const O = require("obsidian");
const core = require("./core");
const tracking = require("./source-tracking");
const words = {
  send: ["引用到", "Reference to"],
  copy: ["复制引用", "Copy reference"],
  copied: ["已复制引用", "Reference copied"],
  choose: ["选择笔记", "Choose a note"],
  empty: ["请选择文字", "Select text first"],
  missing: [
    "无法确定原句，请重新定位。摘录已保留。",
    "Cannot locate passage. Snapshot preserved.",
  ],
  full: ["全文／预览", "Full text / Preview"],
  split: ["切换全局来源位置", "Toggle global source position"],
  unlink: ["取消文字关联", "Remove text association"],
  update: ["用选区更新引文", "Update reference from selection"],
  relocate: ["用选区重新定位", "Relocate reference from selection"],
  confirm: ["确认", "Confirm"],
  cancel: ["取消", "Cancel"],
  changed: ["笔记已变化，请重新操作", "Note changed. Please try again."],
  migrate: ["备份并迁移旧版引用", "Back up and migrate legacy references"],
  done: ["已完成", "Done"],
  style: ["引用样式", "Reference style"],
  native: ["原生链接", "Native link"],
  body: ["跟随正文", "Inherit paragraph"],
  layout: ["来源位置", "Source position"],
  inline: ["跟随引文", "Inline"],
  separate: ["另起一行", "New line"],
  length: ["引文显示长度", "Preview length"],
  help: [
    "0 为全文。完整摘录保存在笔记中；精准定位需要备份、同步插件数据。",
    "0 shows all. Full text stays in your note; back up and sync plugin data for passage navigation.",
  ],
  review: [
    "请核对现有摘录与新选区：",
    "Review the existing text and new selection:",
  ],
  undo: ["撤销", "Undo"],
  open: ["打开", "Open"],
  error: ["操作失败", "Operation failed"],
};
class Picker extends O.SuggestModal {
  constructor(p, items, choose) {
    super(p.app);
    this.p = p;
    this.items = items;
    this.choose = choose;
    this.setPlaceholder(p.t("choose"));
  }
  getSuggestions(q) {
    return this.items.filter((x) =>
      x.label.toLowerCase().includes(q.toLowerCase()),
    );
  }
  renderSuggestion(x, el) {
    el.createDiv({ text: x.label });
    if (x.detail) el.createDiv({ text: x.detail, cls: "tr-muted" });
  }
  onChooseSuggestion(x) {
    this.p.run(() => this.choose(x));
  }
}
class Confirm extends O.Modal {
  constructor(p, text, action, review = false) {
    super(p.app);
    this.p = p;
    this.text = text;
    this.action = action;
    this.review = review;
  }
  onOpen() {
    if (this.review) {
      const old = this.review.old ?? this.text.split("\n\n")[1] ?? "";
      const next =
        this.review.next ??
        this.text.split("\n\n").slice(2).join("\n\n").replace(/^→ /, "");
      this.modalEl?.classList.add("tr-review-modal");
      this.contentEl.createEl("h2", {
        text: this.p.zh ? "核对引文" : "Review reference",
      });
      require("./comparison").render(
        this.contentEl,
        old,
        next,
        this.p.zh,
        core,
      );
    } else
      this.contentEl.createEl("p", { text: this.text, cls: "tr-confirm-text" });
    this.errorEl = this.contentEl.createEl("p", { cls: "tr-inline-error" });
    this.errorEl.hidden = true;
    new O.Setting(this.contentEl)
      .addButton((b) =>
        b
          .setButtonText(
            this.review
              ? this.p.zh
                ? "暂不更新"
                : "Not now"
              : this.p.t("cancel"),
          )
          .onClick(() => this.close()),
      )
      .addButton((b) =>
        b
          .setButtonText(
            this.review
              ? this.p.zh
                ? "更新引文"
                : "Update reference"
              : this.p.t("confirm"),
          )
          .setCta()
          .onClick(() => {
            b.setDisabled(true);
            b.setButtonText(this.p.zh ? "更新中…" : "Updating…");
            this.errorEl.hidden = true;
            this.p.run(async () => {
              try {
                await this.action();
                this.close();
              } catch (error) {
                console.error("Text Reference update", error);
                const messages = {
                  "source-changed": [
                    "原文再次变化，请关闭后重新核对。",
                    "Source changed. Close and review again.",
                  ],
                  "target-changed": [
                    "目标引文已被改动，已停止更新。",
                    "Target reference changed. Update stopped.",
                  ],
                  "editor-sync": [
                    "编辑器正在同步，请稍后重试。",
                    "Editors are synchronizing. Please retry shortly.",
                  ],
                  "write-failed": [
                    "无法写入笔记，请检查后重试。",
                    "Could not write the note. Please retry.",
                  ],
                };
                this.errorEl.textContent = (messages[error.code] || [
                  "更新未完成，请重试。",
                  "Update did not complete. Please retry.",
                ])[this.p.zh ? 0 : 1];
                this.errorEl.hidden = false;
              } finally {
                b.setDisabled(false);
                b.setButtonText(this.p.zh ? "更新引文" : "Update reference");
              }
            });
          }),
      );
  }
  onClose() {
    this.contentEl.empty();
  }
}
class Review extends O.Modal {
  constructor(p, r, text) {
    super(p.app);
    this.p = p;
    this.r = r;
    this.text = text;
  }
  onOpen() {
    this.contentEl.createEl("p", { text: this.text });
    new O.Setting(this.contentEl).addButton((b) =>
      b.setButtonText(this.p.zh ? "打开来源" : "Open source").onClick(() =>
        this.p.run(async () => {
          const opened = await this.p.open(this.r, false, true);
          if (opened) {
            this.close();
            opened.view?.editor?.focus();
          }
        }),
      ),
    );
  }
  onClose() {
    this.contentEl.empty();
  }
}
module.exports = class TextReference extends O.Plugin {
  t(key) {
    return words[key]?.[this.zh ? 0 : 1] || key;
  }
  run(fn) {
    return Promise.resolve()
      .then(fn)
      .catch((e) => {
        console.error("Text Reference", e);
        new O.Notice(this.t("error") + ": " + e.message);
      });
  }
  async onload() {
    this.core = core;
    this.Obsidian = O;
    this.fullQuotes = new Set();
    this.readingLinks = new Map();
    this.readingRoots = new Map();
    this.registerHoverLinkSource?.("text-reference", {
      display: "Text Reference",
      defaultMod: true,
    });
    this.zh = (O.getLanguage?.() || "en").startsWith("zh");
    const data = (await this.loadData()) || {};
    this.settings = {
      layout: "inline",
      limit: 30,
      style: "native",
      notifySourceChanges: true,
      recent: [],
      ...(data.settings || {
        layout: data.layout || "inline",
        limit: data.limit ?? 30,
      }),
    };
    this.refs = Array.isArray(data.refs)
      ? data.refs.filter(
          (r) =>
            r &&
            typeof r.token === "string" &&
            r.token.length &&
            typeof r.target === "string" &&
            typeof r.source === "string" &&
            typeof r.quote === "string" &&
            typeof r.name === "string" &&
            typeof r.prefix === "string" &&
            typeof r.suffix === "string",
        )
      : [];
    this.removedRefs = new Map();
    tracking.init(this);
    this.saving = Promise.resolve();
    this.settingsTab = new Settings(this.app, this);
    this.addSettingTab(this.settingsTab);
    for (const id of ["copy", "send"])
      this.addCommand({
        id,
        name: this.t(id),
        ...(id === "copy"
          ? { hotkeys: [{ modifiers: ["Mod", "Shift"], key: "C" }] }
          : {}),
        editorCallback: (editor, view) =>
          this.run(() =>
            id === "copy" ? this.copy(editor, view) : this.send(editor, view),
          ),
      });
    this.registerEvent(
      this.app.workspace.on("editor-menu", (menu, editor, view) => {
        if (editor.somethingSelected())
          for (const id of ["send", "copy"])
            menu.addItem((i) =>
              i
                .setTitle(this.t(id))
                .setIcon(id === "copy" ? "copy" : "link")
                .onClick(() =>
                  this.run(() =>
                    id === "copy"
                      ? this.copy(editor, view)
                      : this.send(editor, view),
                  ),
                ),
            );
      }),
    );
    this.registerEvent(
      this.app.workspace.on("editor-paste", (event, editor, view) => {
        if (
          event.defaultPrevented ||
          (editor.listSelections?.().length || 1) > 1 ||
          !view.file ||
          !this.pending ||
          event.clipboardData?.getData("text/plain") !== this.pending.token
        )
          return;
        event.preventDefault();
        const r = { ...this.pending.r },
          token = this.token(r),
          at = editor.posToOffset(editor.getCursor("from"));
        editor.replaceSelection(token);
        require("./maintenance").register(
          this,
          core.bind(r, view.file.path, token, editor.getValue(), at),
          editor.getValue(),
        );
        this.refreshEditors();
        this.run(() => this.save());
      }),
    );
    this.registerEvent(
      this.app.vault.on("rename", (file, old) => {
        tracking.invalidate(this, old);
        tracking.invalidate(this, file.path);
        clearTimeout(this.sourceTimers.get(old));
        this.sourceTimers.delete(old);
        this.sourceRequests.delete(old);
        if (this.sourceVersions.has(old)) {
          this.sourceVersions.set(file.path, this.sourceVersions.get(old));
          this.sourceVersions.delete(old);
        }
        for (const r of this.refs) {
          if (r.source === old) {
            r.source = file.path;
            r.renameToken = this.token(r);
            for (const map of [this.sourceDrafts, this.sourceAnchors]) {
              const item = map.get(r.id);
              if (item) item.source = file.path;
            }
          }
          if (r.target === old) r.target = file.path;
        }
        this.run(() => this.save());
      }),
    );
    this.registerEvent(
      this.app.vault.on("delete", (file) => {
        tracking.invalidate(this, file.path);
        for (const r of [...this.refs])
          if (r.target === file.path) {
            this.removedRefs.set(r.id, r);
            this.refs = this.refs.filter((x) => x.id !== r.id);
          }
        clearTimeout(this.sourceTimers.get(file.path));
        this.sourceTimers.delete(file.path);
        this.sourceRequests.delete(file.path);
        this.sourceVersions.delete(file.path);
        const missing = this.refs.filter((r) => r.source === file.path);
        for (const r of missing) {
          this.sourceDrafts.delete(r.id);
          this.sourceAnchors.delete(r.id);
          if (this.settings.notifySourceChanges)
            this.sourceStatus.set(r.id, "missing");
        }

        this.run(() => this.save());
      }),
    );
    this.registerEvent(
      this.app.vault.on("modify", (file) => {
        tracking.invalidate(this, file.path);
        if (
          this.settings.notifySourceChanges &&
          this.refs.some((r) => r.source === file.path)
        )
          tracking.schedule(this, file.path);
      }),
    );
    this.registerEvent(
      this.app.workspace.on("file-open", (file) => {
        if (!file || !this.settings.notifySourceChanges) return;
        for (const path of new Set(
          this.refs
            .filter((r) => r.target === file.path || r.source === file.path)
            .map((r) => r.source),
        ))
          tracking.schedule(this, path);
      }),
    );
    this.registerMarkdownPostProcessor((el, ctx) => this.bindReading(el, ctx));
    this.installEditor();
    await tracking.checkAll(this);
    this.registerDomEvent(document, "copy", () => {
      this.pending = null;
    });
    this.registerDomEvent(document, "cut", () => {
      this.pending = null;
    });
  }
  async bindReading(el, ctx) {
    if (!el.querySelector("a.internal-link")) return;
    const file = this.app.vault.getAbstractFileByPath(ctx.sourcePath);
    if (!file) return;
    const text = await tracking.read(this, file);
    for (const a of el.querySelectorAll("a.internal-link")) {
      if (this.readingLinks.has(a)) continue;
      const source = this.app.metadataCache.getFirstLinkpathDest(
        a.getAttribute("data-href"),
        ctx.sourcePath,
      );
      for (const r of this.refs.filter((r) => r.target === ctx.sourcePath))
        core.reconcile(text, r);
      const candidates = this.refs.filter(
        (r) =>
          r.status !== "unused" &&
          r.target === ctx.sourcePath &&
          r.source === source?.path &&
          core.binding(text, r) >= 0 &&
          [
            ...(r.repair ? [core.referenceText(r)] : []),
            this.display(r),
            (r.snapshot ?? r.quote).replace(/\r?\n/g, " "),
          ].some((label) => a.textContent === label + "（" + r.name + "）"),
      );
      if (candidates.length !== 1) continue;
      const r = candidates[0],
        child = new O.MarkdownRenderChild(a),
        original = a.textContent;
      ctx.addChild(child);
      if (!r.repair) this.paint(a, r);
      const cleanup = require("./interaction").bind(this, a, r);
      this.readingLinks.set(a, r);
      child.register(() => {
        cleanup();
        this.readingLinks.delete(a);
        a.textContent = original;
        a.classList.remove("tr-reference", "tr-body");
      });
    }
    if (!this.readingRoots.has(el)) {
      this.readingRoots.set(el, ctx);
      const owner = new O.MarkdownRenderChild(el);
      ctx.addChild(owner);
      const retry = setTimeout(() => {
        if (this.readingRoots.has(el) && el.isConnected)
          this.run(() => this.bindReading(el, ctx));
      }, 0);
      owner.register(() => {
        clearTimeout(retry);
        this.readingRoots.delete(el);
      });
    }
  }
  refreshDisplays() {
    this.refreshEditors();
    for (const [a, r] of this.readingLinks || [])
      if (a.isConnected && !a.trSelection?.()) {
        const current = !r.target ? r : this.refs.find((x) => x.id === r.id);
        if (current && !current.repair) this.paint(a, current);
      }
  }
  schedulePersist() {
    clearTimeout(this.persistTimer);
    this.persistTimer = setTimeout(() => this.run(() => this.persist()), 250);
  }
  onunload() {
    clearTimeout(this.persistTimer);
    this.trackingStopped = true;
    tracking.reset(this);
    this.persist();
  }
  async save() {
    for (const [el, ctx] of this.readingRoots)
      if (el.isConnected) await this.bindReading(el, ctx);
    this.refreshDisplays();
    return this.persist();
  }
  persist() {
    tracking.prune(this);
    const value = JSON.parse(
      JSON.stringify({
        schemaVersion: 3,
        settings: this.settings,
        refs: this.refs.map((r) => {
          const out = { ...r };
          delete out.limit;
          delete out.layout;
          if (out.snapshot === out.quote) delete out.snapshot;
          return out;
        }),
      }),
    );
    this.saving = this.saving.catch(() => {}).then(() => this.saveData(value));
    return this.saving;
  }
  selection(editor, view) {
    if (!view.file) throw Error(this.t("empty"));
    if (!editor.getSelection?.().trim()) throw Error(this.t("empty"));
    const r = core.capture(
      editor.getValue(),
      editor.posToOffset(editor.getCursor("from")),
      editor.posToOffset(editor.getCursor("to")),
      view.file.path,
      this.settings,
    );
    if (!r.quote.trim()) throw Error(this.t("empty"));
    r.name = view.file.basename;
    if (this.settings.notifySourceChanges && !this.sourceVersions.has(r.source))
      this.sourceVersions.set(r.source, editor.getValue());
    return r;
  }
  token(r) {
    return core.inlineLink(r.source, this.display(r), r.name);
  }
  display(r) {
    return core.readable(r.snapshot ?? r.quote);
  }
  refreshEditors() {
    for (const view of this.editorViews || [])
      view.dispatch({ effects: this.refreshEffect.of(null) });
  }
  async copy(editor, view) {
    const r = this.selection(editor, view),
      token = this.token(r);
    await navigator.clipboard.writeText(token);
    this.pending = { r, token };
    new O.Notice(this.t("copied"), 1500);
  }
  async send(editor, view) {
    const r = this.selection(editor, view);
    new Picker(
      this,
      this.app.vault
        .getMarkdownFiles()
        .filter((f) => f.path !== r.source)
        .map((file) => ({ label: file.basename, detail: file.path, file })),
      async ({ file }) => {
        const token = this.token(r);
        let at, after;
        await this.app.vault.process(file, (text) => {
          at = text.length + (text.endsWith("\n") ? 0 : 1);
          after = text + (text.endsWith("\n") ? "" : "\n") + token;
          return after;
        });
        const record = core.bind(r, file.path, token, after, at);
        require("./maintenance").register(this, record, after);
        this.refreshEditors();
        await this.save();
        const message = document.createDocumentFragment();
        message.append(this.t("done") + " ");
        for (const [key, fn] of [
          ["open", () => this.app.workspace.getLeaf("tab").openFile(file)],
          [
            "undo",
            async () => {
              await this.change(record, () => "");

              this.refs = this.refs.filter((x) => x.id !== record.id);
              await this.save();
            },
          ],
        ]) {
          const a = document.createElement("a");
          a.textContent = this.t(key);
          a.href = "#";
          a.onclick = (e) => {
            e.preventDefault();
            this.run(fn);
          };
          message.append(a, " ");
        }
        new O.Notice(message, 4000);
      },
    ).open();
  }
  paint(a, r) {
    const signature = JSON.stringify([
      this.display(r),
      r.name,
      this.settings.style,
      this.settings.layout,
      this.settings.limit,
      this.fullQuotes.has(r.id),
      this.sourceStatus?.get(r.id),
    ]);
    if (a.trPaint === signature) return;
    a.trPaint = signature;
    a.classList.add("tr-reference");
    a.classList.toggle("tr-body", this.settings.style === "body");
    a.removeAttribute("title");
    a.textContent = "";
    a.appendText(
      core.preview(
        this.display(r),
        core.limit(this.fullQuotes.has(r.id) ? 0 : this.settings.limit),
      ),
    );
    const source = a.createSpan({ text: "（" + r.name + "）" });
    if (this.settings.layout === "split") source.classList.add("tr-newline");
    const status = this.sourceStatus?.get(r.id);
    if (this.settings.notifySourceChanges && status && status !== "found")
      source.createSpan({
        text: this.zh
          ? status === "changed"
            ? " · 原文已变化"
            : " · 待核对"
          : status === "changed"
            ? " · Source changed"
            : " · Review",
        cls: "tr-review-hint",
      });
  }
  menu(r, event, a) {
    const menu = new O.Menu();
    menu.addItem((i) =>
      i
        .setTitle(this.zh ? "核对原文…" : "Review source…")
        .setIcon("scan-text")
        .onClick(() => this.run(() => this.reviewSource(r))),
    );
    menu.addItem((i) =>
      i
        .setTitle(
          this.zh
            ? this.fullQuotes.has(r.id)
              ? "收起全文"
              : "显示全文"
            : this.fullQuotes.has(r.id)
              ? "Collapse text"
              : "Show full text",
        )
        .onClick(() => {
          if (this.fullQuotes.has(r.id)) this.fullQuotes.delete(r.id);
          else this.fullQuotes.add(r.id);
          if (a) this.paint(a, r);
          this.refreshDisplays();
        }),
    );
    menu.showAtMouseEvent(event);
  }
  async open(r, newTab, quiet = false) {
    const file = this.app.vault.getAbstractFileByPath(r.source);
    if (!file) {
      new O.Notice(this.t("missing"));
      return;
    }
    const found = await tracking.resolve(
        this,
        await tracking.read(this, file),
        r,
      ),
      leaf =
        (!newTab &&
          this.app.workspace
            .getLeavesOfType?.("markdown")
            .find((l) => l.view?.file?.path === r.source)) ||
        this.app.workspace.getLeaf(newTab ? "tab" : false);
    await leaf.openFile(file, { state: { mode: "source" } });
    if (!["found", "changed"].includes(found.status)) {
      if (!quiet) new O.Notice(this.t("missing"));
      return leaf;
    }
    if (leaf.view instanceof O.MarkdownView) {
      const e = leaf.view.editor,
        from = e.offsetToPos(found.start),
        to = e.offsetToPos(found.end);
      e.setSelection(from, to);
      e.scrollIntoView({ from, to }, true);
      e.focus();
    }
    return leaf;
  }
  async change(r, fn) {
    const fail = () =>
      Object.assign(new Error(this.t("changed")), { code: "target-changed" });
    const file = this.app.vault.getAbstractFileByPath(r.target);
    if (!file) throw fail();
    const opened = [...(this.editorViews || [])].filter(
      (v) => v.state.field(O.editorInfoField, false)?.file?.path === r.target,
    );
    const originalToken = r.token;
    const replacement = fn();
    if (opened.length) {
      const view = opened.find((v) => v.hasFocus) || opened[0],
        text = view.state.doc.toString();
      if (opened.some((v) => v.state.doc.toString() !== text))
        throw Object.assign(fail(), { code: "editor-sync" });
      const at = core.binding(text, r);
      if (at < 0) throw fail();
      view.dispatch({
        changes: {
          from: at,
          to: at + originalToken.length,
          insert: replacement,
        },
      });
      const result = view.state.doc.toString();
      if (
        result !==
        text.slice(0, at) + replacement + text.slice(at + originalToken.length)
      )
        throw fail();
      return { text: result, kind: "editor" };
    }
    try {
      await this.app.vault.process(file, (text) => {
        const at = core.binding(text, r);
        if (at < 0) throw fail();
        return (
          text.slice(0, at) +
          replacement +
          text.slice(at + originalToken.length)
        );
      });
      return { text: await this.app.vault.read(file), kind: "file" };
    } catch (error) {
      if (error.code === "target-changed") throw error;
      throw Object.assign(new Error("Cannot write reference"), {
        code: "write-failed",
        cause: error,
      });
    }
  }
  hotkeyLabel() {
    const id = "text-reference:copy";
    const keys =
      this.app.hotkeyManager?.getHotkeys?.(id) ??
      this.app.hotkeyManager?.getDefaultHotkeys?.(id);
    if (keys)
      return keys.length
        ? keys
            .map(
              (k) =>
                k.modifiers
                  .map((m) =>
                    m === "Mod" ? (O.Platform?.isMacOS ? "Cmd" : "Ctrl") : m,
                  )
                  .join("+") +
                "+" +
                k.key,
            )
            .join(" / ")
        : this.zh
          ? "未设置"
          : "Unassigned";
    return O.Platform?.isMacOS ? "Cmd+Shift+C" : "Ctrl+Shift+C";
  }
  customizeHotkey() {
    this.app.setting?.open?.();
    const tab = this.app.setting?.openTabById?.("hotkeys");
    const target = tab || this.app.setting?.activeTab;
    if (target?.setQuery) target.setQuery("Text Reference");
    else
      new O.Notice(
        this.zh
          ? "请在设置→快捷键中搜索 Text Reference"
          : "Search Text Reference in Settings → Hotkeys",
      );
  }
  checkSource(file) {
    return tracking.check(this, file);
  }
  async reviewSource(r) {
    if (!this.refs.includes(r)) throw Error(this.t("changed"));
    const file = this.app.vault.getAbstractFileByPath(r.source);
    if (!file) {
      new O.Notice(this.t("missing"));
      return;
    }
    const text = await tracking.read(this, file);
    const draft = this.sourceDrafts.get(r.id);
    if (
      draft?.source === r.source &&
      draft.text === text &&
      draft.quote !== r.quote
    ) {
      await this.confirmReference(r, draft, "update");
      return;
    }
    const found = await tracking.resolve(this, text, r);
    if (found.status === "changed" || (r.repair && found.status === "found")) {
      await this.confirmReference(
        r,
        {
          source: r.source,
          text,
          quote: text.slice(found.start, found.end),
          prefix: text.slice(Math.max(0, found.start - 64), found.start),
          suffix: text.slice(found.end, found.end + 64),
        },
        "update",
      );
      return;
    }
    new Review(
      this,
      r,
      found.status === "found"
        ? this.zh
          ? "原文未变化。"
          : "Source is unchanged."
        : this.zh
          ? "暂时无法确定原文范围，已保留摘录。需要更换时，请重新复制引用。"
          : "Cannot determine passage. Snapshot preserved. Copy a new reference to replace it.",
    ).open();
  }
  async confirmReference(r, selected, mode = "update") {
    const file = this.app.vault.getAbstractFileByPath(r.source);
    if (!file || selected.source !== r.source) throw Error(this.t("changed"));
    const sourceText = await tracking.read(this, file);
    if (
      selected.text !== undefined
        ? selected.text !== sourceText
        : core.locate(sourceText, selected).status !== "found"
    )
      throw Error(this.t("changed"));
    const expected = { ...r };
    new Confirm(
      this,
      (this.zh
        ? mode === "update"
          ? "更新此处引文？"
          : "仅修复位置，保留现有摘录？"
        : mode === "update"
          ? "Update this reference?"
          : "Repair location and keep the snapshot?") +
        "\n\n" +
        this.display(r) +
        "\n\n→ " +
        core.readable(selected.quote),
      async () => {
        if ((await tracking.read(this, file)) !== sourceText)
          throw Object.assign(new Error(this.t("changed")), {
            code: "source-changed",
          });
        const op = await require("./updates").apply(
          this,
          r,
          selected,
          mode,
          expected,
        );

        const message = document.createDocumentFragment();
        message.append(
          op.pendingSave
            ? this.zh
              ? "正文已更新，关联数据尚未保存。 "
              : "Text updated; association save pending. "
            : this.t("done") + " ",
        );
        if (op.pendingSave) {
          const retry = document.createElement("a");
          retry.textContent = this.zh ? "重试保存" : "Retry save";
          retry.href = "#";
          retry.onclick = (e) => {
            e.preventDefault();
            this.run(async () => {
              await this.persist();
              op.pendingSave = false;
              retry.textContent = this.zh ? "已保存" : "Saved";
            });
          };
          message.append(retry, " ");
        }
        const undo = document.createElement("a");
        undo.textContent = this.t("undo");
        undo.href = "#";
        undo.onclick = (e) => {
          e.preventDefault();
          this.run(async () => {
            await require("./updates").revert(this, op);
            if (this.settings.notifySourceChanges) await this.checkSource(file);
          });
        };
        message.append(undo);
        new O.Notice(message, op.pendingSave ? 0 : 4000);
      },
      {
        old: r.repair ? core.referenceText(r) : (r.snapshot ?? r.quote),
        next: selected.quote,
      },
    ).open();
  }
  async migrate() {
    for (const file of this.app.vault.getMarkdownFiles()) {
      if (file.path.startsWith("Text Reference Backups/")) continue;
      const original = await this.app.vault.read(file),
        old = core.records(original);
      if (!old.length) continue;
      const folder = "Text Reference Backups";
      if (!this.app.vault.getAbstractFileByPath(folder))
        await this.app.vault.createFolder(folder);
      await this.app.vault.create(
        folder +
          "/" +
          Date.now() +
          "-" +
          globalThis.crypto.randomUUID() +
          ".txt",
        original,
      );
      let text = original;
      const added = [];
      for (const item of [...old].reverse()) {
        const wiki = item.link.match(/\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/);
        const markdown = item.link.match(/\]\((.+)\)$/);
        let path = wiki?.[1] || markdown?.[1] || item.r.source;
        if (markdown) {
          try {
            path = decodeURIComponent(path.replace(/^<|>$/g, ""));
          } catch {}
        }
        const source = this.app.metadataCache.getFirstLinkpathDest(
          path,
          file.path,
        );
        if (!source) throw Error(this.t("missing"));
        const r = {
            ...item.r,
            source: source.path,
            snapshot: item.body,
            name: source.basename,
          },
          token = this.token(r);
        text = text.slice(0, item.start) + token + text.slice(item.end);
        added.push({ r, token });
      }
      await this.app.vault.process(file, (current) => {
        if (current !== original) throw Error(this.t("changed"));
        return text;
      });
      for (const { r, token } of added)
        this.refs.push(
          core.bind(r, file.path, token, text, text.indexOf(token)),
        );
      await this.save();
    }
    new O.Notice(this.t("done"));
  }
  installEditor() {
    require("./editor").install(this, O, core);
  }
  async onExternalSettingsChange() {
    await this.saving;
    const data = await this.loadData();
    if (!data || !Array.isArray(data.refs)) return;
    this.refs = data.refs.filter(
      (r) =>
        r &&
        typeof r.id === "string" &&
        !this.removedRefs.has(r.id) &&
        [
          "token",
          "source",
          "target",
          "quote",
          "name",
          "prefix",
          "suffix",
        ].every((k) => typeof r[k] === "string"),
    );
    tracking.reset(this);
    this.refreshDisplays();
    if (this.settings.notifySourceChanges) await tracking.checkAll(this);
  }
};
class Settings extends O.PluginSettingTab {
  constructor(app, p) {
    super(app, p);
    this.p = p;
  }
  display() {
    const p = this.p,
      e = this.containerEl;
    for (const a of p.readingLinks.keys())
      if (e.contains(a)) p.readingLinks.delete(a);
    e.empty();
    e.createEl("h2", { text: "Text Reference" });
    for (const [key, options] of [
      ["layout", ["inline", "split"]],
      ["style", ["native", "body"]],
    ])
      new O.Setting(e).setName(p.t(key)).addDropdown((d) => {
        for (const option of options)
          d.addOption(option, p.t(option === "split" ? "separate" : option));
        d.setValue(p.settings[key]).onChange((value) => {
          p.fullQuotes.clear();
          p.settings[key] = value;
          p.run(() => p.save());
        });
      });
    new O.Setting(e)
      .setName(p.t("length"))
      .setDesc(
        p.zh
          ? "0 为全文，仅影响显示。"
          : "0 shows the full text. Presentation only.",
      )
      .addText((t) =>
        t.setValue(String(p.settings.limit)).onChange((value) => {
          if (/^\d+$/.test(value)) {
            p.fullQuotes.clear();
            p.settings.limit = core.limit(value);
            p.run(() => p.save());
          }
        }),
      );
    e.createEl("div", {
      text: p.zh ? "显示示例" : "Display example",
      cls: "tr-muted",
    });
    const example = e.createEl("p", { cls: "tr-settings-example" });
    const sample = {
      id: "settings-example",
      quote: p.zh
        ? "引用一句话，让想法自然融入文章；来源笔记保持原样，随时回到出处查看上下文。"
        : "Text Reference brings passages into your writing while preserving source notes and linking back to their context.",
      name: p.zh ? "使用指南" : "User guide",
    };
    p.paint(example, sample);
    p.readingLinks.set(example, sample);
    e.createEl("p", {
      cls: "tr-help",
      text: p.zh
        ? "选中文字，右键复制引用后粘贴；或用引用到直接添加。\nCtrl（Mac 用 Cmd）＋悬停预览上下文；单击跳转，拖动选字。\n右键引文→核对原文，对比后确认更新。\n显示设置即时应用于已有引用。来源笔记保持不变；跨设备请同步插件数据。"
        : "Select text, copy a reference and paste; or use Reference to.\nCtrl/Cmd + hover previews context; click navigates; drag selects text.\nRight-click a reference → Review source to compare and update.\nDisplay settings apply to existing references. Source notes stay untouched; sync plugin data across devices.",
    });
    new O.Setting(e)
      .setName(p.zh ? "复制引用快捷键" : "Copy reference shortcut")
      .setDesc(p.hotkeyLabel())
      .addButton((b) =>
        b
          .setButtonText(p.zh ? "自定义" : "Customize")
          .onClick(() => p.customizeHotkey()),
      );
    new O.Setting(e)
      .setName(p.zh ? "追踪原文变化" : "Track source changes")
      .setDesc(
        p.zh
          ? "自动检查被引用的原文；变化时在引文旁标记，核对后更新。"
          : "Review source changes before updating snapshots. Checks referenced notes only.",
      )
      .addToggle((t) =>
        t
          .setValue(p.settings.notifySourceChanges !== false)
          .onChange((value) => {
            p.settings.notifySourceChanges = value;
            tracking.reset(p);
            p.refreshDisplays();
            p.run(async () => {
              await p.persist();
              if (value) await tracking.checkAll(p, true);
            });
          }),
      );
    new O.Setting(e)
      .setName(p.zh ? "恢复默认显示" : "Restore display defaults")
      .addButton((b) =>
        b.setButtonText(p.zh ? "恢复" : "Restore").onClick(() => {
          Object.assign(p.settings, {
            style: "native",
            layout: "inline",
            limit: 30,
          });
          p.fullQuotes.clear();
          p.run(() => p.save());
          this.display();
        }),
      );
  }
}
