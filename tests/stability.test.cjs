const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  { EditorState } = require("@codemirror/state");
const core = require("../src/core"),
  updates = require("../src/updates"),
  tracking = require("../src/source-tracking"),
  maintenance = require("../src/maintenance");
const { harness } = require("./helpers.cjs");
async function setup() {
  const h = harness();
  await h.p.onload();
  const raw = h.contents.get(h.source.path),
    r = { ...core.capture(raw, 3, 12, h.source.path), name: "日志" };
  const token = h.p.token(r);
  h.r = core.bind(r, h.target.path, token, token, 0);
  h.p.refs = [h.r];
  h.contents.set(h.target.path, token);
  h.selected = core.capture("新的引用文字。", 0, 7, h.source.path);
  return h;
}
function clean(h) {
  tracking.reset(h.p);
  clearTimeout(h.p.persistTimer);
}
test("deletion during delayed update cannot resurrect Data record", async () => {
  const h = await setup();
  try {
    const process = h.p.app.vault.process;
    h.p.app.vault.process = async (file, fn) => {
      const old = h.contents.get(file.path);
      await process(file, fn);
      maintenance.transaction(
        h.p,
        EditorState.create({ doc: old }).update({
          changes: {
            from: 0,
            to: old.length,
            insert: h.contents.get(file.path),
          },
        }),
        file.path,
      );
      const before = h.contents.get(file.path);
      maintenance.transaction(
        h.p,
        EditorState.create({ doc: before }).update({
          changes: { from: 0, to: before.length, insert: "" },
        }),
        file.path,
      );
      h.contents.set(file.path, "");
    };
    await assert.rejects(() =>
      updates.apply(h.p, h.r, h.selected, "update", { ...h.r }),
    );
    assert.equal(h.p.refs.length, 0);
    assert.equal(h.contents.get(h.target.path), "");
  } finally {
    clean(h);
  }
});
test("save failure preserves undo and can retry persistence without rewriting text", async () => {
  const h = await setup();
  try {
    h.p.saveData = async () => {
      throw Error("disk");
    };
    const op = await updates.apply(h.p, h.r, h.selected, "update", { ...h.r });
    assert.equal(op.pendingSave, true);
    assert.ok(h.p.referenceEdits.includes(op));
    const value = h.contents.get(h.target.path);
    let saved;
    h.p.saveData = async (d) => (saved = d);
    await h.p.persist();
    assert.equal(require("../src/storage").unpack(saved)[0].token, h.r.token);
    assert.equal(h.contents.get(h.target.path), value);
    await updates.revert(h.p, op);
    assert.equal(h.r.quote, op.before.quote);
  } finally {
    clean(h);
  }
});
test("verified latest range survives restart after substantial expansion", async () => {
  const h = await setup();
  try {
    const original = h.contents.get(h.source.path),
      at = 6,
      extra = "\n## 新标题\n" + "新增内容。".repeat(180) + "\n";
    const tr = EditorState.create({ doc: original }).update({
      changes: { from: at, insert: extra },
    });
    tracking.transaction(h.p, tr, h.source.path);
    const next = tr.state.doc.toString();
    h.contents.set(h.source.path, next);
    await h.p.checkSource(h.source);
    assert.equal(h.r.locator.hash.length, 64);
    const saved = JSON.parse(JSON.stringify(h.r));
    tracking.reset(h.p);
    h.p.refs = [saved];
    await h.p.checkSource(h.source);
    assert.equal(h.p.sourceStatus.get(saved.id), "changed");
    assert.ok(h.p.sourceDrafts.get(saved.id).quote.includes("新标题"));
    assert.equal(saved.quote, original.slice(3, 12));
    assert.ok(!JSON.stringify(saved.locator).includes("新增内容"));
  } finally {
    clean(h);
  }
});
test("one matching side cannot silently attach a duplicate", () => {
  const right = "相同后文".repeat(20);
  const quote = "专注需要练习。";
  const text = "甲前文。" + quote + right + "乙前文。" + quote + right;
  const r = core.capture(text, 5, 5 + quote.length, "日志.md");
  assert.notEqual(core.recover("乙前文。" + quote + right, r).status, "found");
});
test("long multiline comparison keeps distant edits separate", () => {
  const text = Array.from(
    { length: 80 },
    (_, i) => "第" + i + "行保持独立内容。",
  ).join("\n");
  const next = text.replace("第0行", "首0行").replace("第79行", "尾79行");
  const parts = core.pieces(text, next);
  assert.equal(parts.filter((x) => x.type === "insert").length, 2);
  assert.ok(parts.some((x) => x.type === "equal" && x.text.includes("第30行")));
});
test("format-only source change updates location without content warning", async () => {
  const h = await setup();
  try {
    await h.p.checkSource(h.source);
    h.contents.set(
      h.source.path,
      h.contents.get(h.source.path).replace(h.r.quote, "**" + h.r.quote + "**"),
    );
    await h.p.checkSource(h.source);
    assert.equal(h.p.sourceStatus.get(h.r.id), "found");
  } finally {
    clean(h);
  }
});
test("rename keeps old binding until actual note contains rewritten link", async () => {
  const h = await setup();
  try {
    const old = h.r.token;
    h.handlers["vault:rename"](
      { path: "新名字.md", basename: "新名字" },
      h.source.path,
    );
    assert.equal(core.activeBindings(h.p.refs, old, h.target.path).length, 1);
    const rewritten = h.r.renameToken;
    assert.equal(
      core.activeBindings(h.p.refs, rewritten, h.target.path).length,
      1,
    );
    assert.equal(h.r.token, rewritten);
    await h.p.saving;
  } finally {
    clean(h);
  }
});
test("open source closes Review only after successful navigation", async () => {
  const h = await setup();
  try {
    await h.p.reviewSource(h.r);
    const modal = h.modals[0];
    let callback;
    const steps = [];
    modal.contentEl = { createEl() {} };
    modal.close = () => steps.push("close");
    h.api.Setting = class {
      addButton(fn) {
        fn({
          setButtonText() {
            return this;
          },
          onClick(fn) {
            callback = fn;
            return this;
          },
        });
        return this;
      }
    };
    modal.onOpen();
    const view = new h.api.MarkdownView();
    view.file = h.source;
    const actual = "新增一行\n" + h.contents.get(h.source.path);
    view.editor = {
      getValue: () => actual,
      offsetToPos: (offset) => offset,
      setSelection(from, to) {
        assert.equal(actual.slice(from, to), h.r.quote);
        steps.push("select");
      },
      scrollIntoView() { steps.push("scroll"); },
      focus() { steps.push("focus"); },
    };
    const leaf = {
      view: {},
      async openFile() { steps.push("open"); },
      async loadIfDeferred() { steps.push("load"); this.view = view; },
    };
    h.p.app.workspace.getLeaf = () => leaf;
    h.p.app.workspace.revealLeaf = async () => steps.push("reveal");
    await callback();
    assert.deepEqual(steps, ["open", "load", "close", "reveal", "select", "scroll", "focus"]);
  } finally {
    clean(h);
  }
});

test("native rename edit remains an active reference instead of a manual repair", async () => {
  const h = await setup();
  try {
    const before = h.r.token;
    h.handlers["vault:rename"]({ path: "新名字.md" }, h.source.path);
    const next = h.r.renameToken;
    maintenance.transaction(
      h.p,
      EditorState.create({ doc: before }).update({
        changes: { from: 0, to: before.length, insert: next },
      }),
      h.target.path,
    );
    assert.equal(core.activeBindings(h.p.refs, next, h.target.path).length, 1);
    assert.equal(h.r.repair, undefined);
  } finally {
    clean(h);
  }
});
test("unchanged reading refresh preserves DOM text selection", async () => {
  const { JSDOM } = require("jsdom");
  const h = await setup();
  const dom = new JSDOM("<a></a>"),
    proto = dom.window.HTMLElement.prototype;
  proto.appendText = function (s) {
    this.appendChild(this.ownerDocument.createTextNode(s));
  };
  proto.createSpan = function (o) {
    const e = this.ownerDocument.createElement("span");
    e.textContent = o.text;
    this.appendChild(e);
    return e;
  };
  try {
    const a = dom.window.document.querySelector("a");
    h.p.paint(a, h.r);
    h.p.readingLinks.set(a, h.r);
    const range = dom.window.document.createRange(),
      sel = dom.window.getSelection();
    range.setStart(a.firstChild, 0);
    range.setEnd(a.firstChild, 2);
    sel.addRange(range);
    const selected = sel.toString();
    h.p.refreshDisplays();
    assert.equal(sel.toString(), selected);
  } finally {
    dom.window.close();
    clean(h);
  }
});
