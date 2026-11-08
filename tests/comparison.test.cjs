const { test } = require("node:test");
const assert = require("node:assert/strict");
const { JSDOM } = require("jsdom");
const { harness } = require("./helpers.cjs");
const core = require("../src/core"),
  updates = require("../src/updates"),
  comparison = require("../src/comparison");
function dom() {
  const d = new JSDOM("<main></main>");
  const p = d.window.HTMLElement.prototype;
  p.appendText = function (text) {
    this.appendChild(this.ownerDocument.createTextNode(text));
  };
  p.createEl = function (tag, o = {}) {
    const e = this.ownerDocument.createElement(tag);
    e.textContent = o.text || "";
    e.className = o.cls || "";
    this.appendChild(e);
    return e;
  };
  p.createSpan = function (o) {
    return this.createEl("span", o);
  };
  return d;
}
test("comparison aligns removed heading with an empty right cell and retains following context", () => {
  const rows = comparison.rows(
    "首句旧词\n### 删除标题\n相同正文",
    "首句新词\n相同正文",
  );
  assert.deepEqual(rows, [
    { old: "首句旧词", next: "首句新词" },
    { old: "### 删除标题", next: null },
    { old: "相同正文", next: "相同正文" },
  ]);
  const d = dom();
  comparison.render(
    d.window.document.querySelector("main"),
    "首句旧词\n### 删除标题\n相同正文",
    "首句新词\n相同正文",
    true,
    core,
  );
  const items = d.window.document.querySelectorAll(".tr-diff-row");
  assert.equal(items.length, 3);
  assert.equal(items[1].querySelectorAll("del").length, 0);
  assert.ok(items[1].querySelector(".tr-diff-removed"));
  assert.ok(items[1].querySelector(".tr-diff-gap"));
  assert.ok(items[0].querySelector("del"));
  assert.ok(items[0].querySelector("ins"));
  d.window.close();
});
test("comparison preserves both complete versions including blank lines", () => {
  const a = "第一段\n\n保留一行\n移除",
    b = "第一段\n新行\n\n保留一行";
  const rows = comparison.rows(a, b);
  assert.equal(
    rows
      .filter((x) => x.old !== null)
      .map((x) => x.old)
      .join("\n"),
    a,
  );
  assert.equal(
    rows
      .filter((x) => x.next !== null)
      .map((x) => x.next)
      .join("\n"),
    b,
  );
});
test("render-before-metadata update restores preview and menu immediately, including repeat update and undo", async () => {
  const h = harness();
  await h.p.onload();
  const d = dom(),
    root = d.window.document.querySelector("main"),
    children = [];
  const r = {
    ...core.capture("原来的引文内容。", 0, 8, h.source.path),
    name: "日志",
  };
  const initial = h.p.token(r);
  h.p.refs = [core.bind(r, h.target.path, initial, initial, 0)];
  h.contents.set(h.target.path, initial);
  h.p.settings.limit = 3;
  const ctx = {
    sourcePath: h.target.path,
    addChild(c) {
      children.push(c);
    },
  };
  let anchor;
  h.p.app.vault.process = async (file, fn) => {
    const next = fn(h.contents.get(file.path));
    h.contents.set(file.path, next);
    root.textContent = "";
    anchor = root.createEl("a", { cls: "internal-link" });
    anchor.dataset.href = h.source.path;
    anchor.textContent = core.visibleToken(next);
    await h.p.processor(root, ctx);
  };
  let menus = 0;
  h.p.menu = () => menus++;
  try {
    const record = h.p.refs[0];
    for (const text of ["第一次更新的新文字。", "第二次更新后的文字。"]) {
      const op = await updates.apply(
        h.p,
        record,
        core.capture(text, 0, text.length, h.source.path),
        "update",
        { ...record },
      );
      assert.ok(anchor.classList.contains("tr-reference"));
      assert.equal(anchor.textContent, core.preview(text, 3) + "（日志）");
      await h.p.bindReading(root, ctx); // Reprocessing must not duplicate listeners.
      anchor.dispatchEvent(
        new d.window.MouseEvent("contextmenu", {
          bubbles: true,
          cancelable: true,
        }),
      );
      await updates.revert(h.p, op);
      assert.ok(anchor.classList.contains("tr-reference"));
      assert.equal(
        anchor.textContent,
        core.preview(core.readable(record.quote), 3) + "（日志）",
      );
    }
    assert.equal(menus, 2);
  } finally {
    for (const c of children.reverse()) c.cleanup?.();
    clearTimeout(h.p.persistTimer);
    d.window.close();
  }
});

test("reading view binds identical references separately when records arrive after render", async () => {
  const h = harness();
  await h.p.onload();
  h.p.settings.notifySourceChanges = false;
  const d = dom();
  const root = d.window.document.querySelector("main");
  const children = [];
  try {
    const r = { ...h.p.selection(h.editor, { file: h.source }), name: "日志" };
    const token = h.p.token(r);
    const text = "第一条 " + token + " 和第二条 " + token;
    h.contents.set(h.target.path, text);
    const anchors = [0, 1].map(() => {
      const a = root.createEl("a", { cls: "internal-link", text: core.visibleToken(token) });
      a.dataset.href = h.source.path;
      return a;
    });
    await h.p.processor(root, {
      sourcePath: h.target.path,
      getSectionInfo: () => ({ lineStart: 0, lineEnd: 0 }),
      addChild: (c) => children.push(c),
    });
    assert.ok(anchors.every((a) => a.classList.contains("tr-reference")));
    assert.ok(anchors.every((a) => h.p.readingLinks.get(a)?.automatic));
    const first = core.bind(r, h.target.path, token, text, text.indexOf(token));
    const second = core.bind(r, h.target.path, token, text, text.lastIndexOf(token));
    h.p.loadData = async () => ({ refs: [first, second] });
    await h.p.onExternalSettingsChange();
    assert.deepEqual(anchors.map((a) => h.p.readingLinks.get(a)?.id), [first.id, second.id]);
    h.p.loadData = async () => ({ refs: [second] });
    await h.p.onExternalSettingsChange();
    assert.ok(anchors[0].classList.contains("tr-reference"));
    assert.ok(h.p.readingLinks.get(anchors[0])?.automatic);
    assert.equal(h.p.readingLinks.get(anchors[1])?.id, second.id);
  } finally {
    for (const c of children.reverse()) c.cleanup?.();
    h.p.onunload();
    d.window.close();
  }
});

test("a pasted reading reference opens, previews, and reviews before background verification", async () => {
  const h = harness();
  await h.p.onload();
  h.p.settings.notifySourceChanges = false;
  const d = dom();
  const root = d.window.document.querySelector("main");
  const children = [];
  const pending = [];
  const selected = [];
  const hover = [];
  const menu = new Map();
  h.p.run = (fn) => {
    const action = Promise.resolve().then(fn);
    pending.push(action);
    return action;
  };
  h.api.Menu = class {
    addItem(build) {
      const item = {
        setTitle(title) { this.title = title; return this; },
        setIcon() { return this; },
        onClick(action) { menu.set(this.title, action); return this; },
      };
      build(item);
    }
    showAtMouseEvent() {}
  };
  const view = new h.api.MarkdownView();
  view.file = h.source;
  view.editor = {
    getValue: () => h.contents.get(h.source.path),
    offsetToPos: (offset) => offset,
    setSelection: (...range) => selected.push(range),
    scrollIntoView() {},
    focus() {},
  };
  h.p.app.workspace.getLeaf = () => ({ view, openFile: async () => {} });
  h.p.app.workspace.trigger = (type, event) => hover.push(event);
  h.p.app.internalPlugins = { getPluginById: () => ({ enabled: true }) };
  const token = "[[日志.md|第一行 第二行（日志）]]";
  const source = "上文\n第一行\r\n第二行\n下文";
  h.contents.set(h.source.path, source);
  // The same token in code must not displace the actual anchor.
  h.contents.set(h.target.path, "`" + token + "` " + token);
  const a = root.createEl("a", { cls: "internal-link", text: core.visibleToken(token) });
  a.dataset.href = h.source.path;
  try {
    await h.p.processor(root, {
      sourcePath: h.target.path,
      addChild: (child) => children.push(child),
    });
    assert.ok(a.classList.contains("tr-reference"));
    assert.equal(h.p.refs.length, 0);
    const fire = (type, options = {}) => a.dispatchEvent(
      new d.window.MouseEvent(type, { bubbles: true, cancelable: true, ...options }),
    );
    fire("click");
    await pending.at(-1);
    assert.deepEqual(selected, [[3, 11]]);
    fire("mouseover", { ctrlKey: true });
    await pending.at(-1);
    assert.equal(hover[0].state.startLoc.line, 1);
    assert.equal(hover[0].state.endLoc.line, 2);
    fire("contextmenu");
    assert.ok(menu.has("显示全文"));
    await menu.get("核对原文…")();
    assert.equal(h.modals[0].text, "原文未变化。");
    assert.equal(h.p.refs.length, 0);
  } finally {
    for (const child of children.reverse()) child.cleanup?.();
    h.p.onunload();
    d.window.close();
  }
});

test("ordinary whole-reference copy preserves the selected occurrence of repeated text", async () => {
  const h = harness();
  await h.p.onload();
  h.p.settings.notifySourceChanges = false;
  const d = dom();
  const root = d.window.document.querySelector("main");
  const children = [];
  const quote = "重复原句。";
  const source = "第一处 " + quote + " 第二处 " + quote + " 结束";
  const at = source.lastIndexOf(quote);
  const r = { ...core.capture(source, at, at + quote.length, h.source.path), name: h.source.basename };
  const token = h.p.token(r);
  h.contents.set(h.source.path, source);
  h.contents.set(h.target.path, token);
  h.p.refs.push(core.bind(r, h.target.path, token, token, 0));
  const a = root.createEl("a", { cls: "internal-link", text: core.visibleToken(token) });
  a.dataset.href = h.source.path;
  try {
    await h.p.processor(root, {
      sourcePath: h.target.path,
      addChild: (child) => children.push(child),
    });
    const range = d.window.document.createRange();
    range.selectNodeContents(a);
    d.window.getSelection().addRange(range);
    const copy = new d.window.Event("copy", { bubbles: true, cancelable: true });
    let clipboard;
    copy.clipboardData = { setData: (_, text) => { clipboard = text; } };
    a.dispatchEvent(copy);
    assert.equal(clipboard, token);
    const paste = { clipboardData: { getData: () => clipboard }, preventDefault() {} };
    h.handlers["editor-paste"](paste, {
      getCursor: () => 0,
      posToOffset: () => 0,
      replaceSelection: () => {},
      getValue: () => clipboard,
    }, { file: { path: "C.md" } });
    const copied = h.p.refs.find((x) => x.target === "C.md");
    const located = await require("../src/source-tracking").resolve(h.p, source, copied);
    assert.equal(located.start, at);
  } finally {
    for (const child of children.reverse()) child.cleanup?.();
    h.p.onunload();
    d.window.close();
  }
});

test("metadata-before-render binds the latest record and uses current identity after record reload", async () => {
  const h = harness();
  await h.p.onload();
  const d = dom(),
    root = d.window.document.querySelector("main"),
    children = [];
  const r = { ...core.capture("旧引文。", 0, 4, h.source.path), name: "日志" },
    token = h.p.token(r);
  h.p.refs = [core.bind(r, h.target.path, token, token, 0)];
  h.contents.set(h.target.path, token);
  try {
    const text = "更新后完整的新引文。";
    await updates.apply(
      h.p,
      h.p.refs[0],
      core.capture(text, 0, text.length, h.source.path),
      "update",
      { ...h.p.refs[0] },
    );
    const a = root.createEl("a", {
      cls: "internal-link",
      text: core.visibleToken(h.p.refs[0].token),
    });
    a.dataset.href = h.source.path;
    h.p.settings.limit = 2;
    await h.p.processor(root, {
      sourcePath: h.target.path,
      addChild(c) {
        children.push(c);
      },
    });
    assert.equal(a.textContent, core.preview(text, 2) + "（日志）");
    const reloaded = { ...h.p.refs[0] };
    h.p.refs = [reloaded];
    let menuRecord;
    h.p.menu = (r) => (menuRecord = r);
    a.dispatchEvent(
      new d.window.MouseEvent("contextmenu", {
        bubbles: true,
        cancelable: true,
      }),
    );
    assert.equal(menuRecord, reloaded);
  } finally {
    for (const c of children.reverse()) c.cleanup?.();
    d.window.close();
  }
});
test("line alignment never loses either version with repeated or empty lines", () => {
  let seed = 7;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed;
  };
  for (let n = 0; n < 100; n++) {
    const a = Array.from(
        { length: rand() % 15 },
        () => ["", "重复行", "甲段", "乙段"][rand() % 4],
      ).join("\n"),
      b = Array.from(
        { length: rand() % 15 },
        () => ["", "重复行", "甲段", "新段"][rand() % 4],
      ).join("\n");
    const pairs = comparison.rows(a, b);
    assert.equal(
      pairs
        .filter((x) => x.old !== null)
        .map((x) => x.old)
        .join("\n"),
      a,
    );
    assert.equal(
      pairs
        .filter((x) => x.next !== null)
        .map((x) => x.next)
        .join("\n"),
      b,
    );
  }
});
