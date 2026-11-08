const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const core = require("../src/core");
const { harness } = require("./helpers.cjs");

test("send writes target only, creates readable native source link, undo removes only reference", async () => {
  const h = harness();
  await h.p.onload();
  const original = h.contents.get(h.source.path);
  const targetBefore = h.contents.get(h.target.path);
  await h.p.send(h.editor, { file: h.source });
  await h.modals.at(-1).choose({ file: h.target });
  assert.equal(h.contents.get(h.source.path), original);
  assert.deepEqual(h.writes, ["专题.md"]);
  const out = h.contents.get(h.target.path);
  assert.ok(out.startsWith(targetBefore));
  assert.ok(out.includes("[[日志.md|"));
  assert.equal(core.records(out).length, 0);
  assert.equal(h.p.refs.length, 1);
  assert.ok(!out.includes("data-text-reference"));
  const undo = h.notices.at(-1).children.find((x) => x.textContent === "撤销");
  await undo.onclick({ preventDefault() {} });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(core.records(h.contents.get(h.target.path)).length, 0);
  assert.ok(h.contents.get(h.target.path).startsWith(targetBefore));
  assert.equal(h.contents.get(h.source.path), original);
});
test("undo refuses to overwrite a subsequently edited excerpt", async () => {
  const h = harness();
  await h.p.onload();
  await h.p.send(h.editor, { file: h.source });
  await h.modals.at(-1).choose({ file: h.target });
  const text = h.contents.get(h.target.path),
    r = h.p.refs[0];
  h.contents.set(h.target.path, text.replace(r.token, "用户新写的内容"));
  const undo = h.notices.at(-1).children.find((x) => x.textContent === "撤销");
  await undo.onclick({ preventDefault() {} });
  await new Promise((resolve) => setImmediate(resolve));
  assert.ok(h.contents.get(h.target.path).includes("用户新写的内容"));
  assert.equal(h.p.refs.length, 1);
});
test("copy does not write any vault files", async () => {
  const h = harness();
  await h.p.onload();
  await h.p.copy(h.editor, { file: h.source });
  assert.equal(h.writes.length, 0);
  assert.ok(h.context.clipboard.startsWith("[["));
  assert.equal(core.records(h.context.clipboard).length, 0);
});
test("paste inserts inline at cursor, independent record for every paste", async () => {
  const h = harness();
  await h.p.onload();
  await h.p.copy(h.editor, { file: h.source });
  let text = "前文后文",
    at = 2;
  const editor = {
    getCursor: () => ({ ch: at }),
    posToOffset: (p) => p.ch,
    getValue: () => text,
    replaceSelection: (token) => {
      text = text.slice(0, at) + token + text.slice(at);
      at += token.length;
    },
  };
  let prevented = 0;
  const event = {
    clipboardData: { getData: () => h.context.clipboard },
    preventDefault() {
      prevented++;
    },
  };
  h.handlers["editor-paste"](event, editor, { file: h.target });
  h.handlers["editor-paste"](event, editor, { file: h.target });
  assert.equal(prevented, 2);
  assert.equal(h.p.refs.length, 2);
  assert.notEqual(h.p.refs[0].id, h.p.refs[1].id);
  assert.ok(text.startsWith("前文[["));
  assert.ok(text.endsWith("]]后文"));
  assert.ok(!text.includes("\n"));
  await h.p.saving;
});
test("ordinary clipboard and previously handled paste remain untouched", async () => {
  const h = harness();
  await h.p.onload();
  await h.p.copy(h.editor, { file: h.source });
  let handled = false;
  h.handlers["editor-paste"](
    {
      clipboardData: { getData: () => "normal text" },
      preventDefault() {
        handled = true;
      },
    },
    {},
    { file: h.target },
  );
  h.handlers["editor-paste"](
    {
      defaultPrevented: true,
      clipboardData: { getData: () => h.context.clipboard },
      preventDefault() {
        handled = true;
      },
    },
    {},
    { file: h.target },
  );
  assert.equal(handled, false);
  assert.equal(h.p.refs.length, 0);
});
test("language follows interface and right-click command is concise", async () => {
  const h = harness();
  await h.p.onload();
  assert.equal(h.p.t("send"), "引用到");
  h.p.zh = false;
  assert.equal(h.p.t("copy"), "Copy reference");
});

test("reading DOM renders one inline native link, complete source and unload restores content", async () => {
  const { JSDOM } = require("jsdom");
  const dom = new JSDOM(
    '<p>before <a class="internal-link" data-href="日志.md"></a> after</p>',
  );
  const proto = dom.window.HTMLElement.prototype;
  proto.appendText = function (text) {
    this.appendChild(this.ownerDocument.createTextNode(text));
  };
  proto.createSpan = function (options) {
    const span = this.ownerDocument.createElement("span");
    span.textContent = options.text;
    this.appendChild(span);
    return span;
  };
  const h = harness();
  await h.p.onload();
  await h.p.copy(h.editor, { file: h.source });
  const token = h.context.clipboard,
    r = h.p.pending.r;
  h.contents.set(h.target.path, token);
  h.p.refs = [core.bind(r, h.target.path, token, token, 0)];
  h.p.settings.limit = 2;
  const a = dom.window.document.querySelector("a");
  const full = r.quote + "（" + r.name + "）";
  a.textContent = full;
  const children = [];
  await h.p.processor(dom.window.document.body, {
    sourcePath: h.target.path,
    addChild: (c) => children.push(c),
  });
  assert.equal(dom.window.document.querySelectorAll("a").length, 1);
  assert.equal(a.textContent, core.preview(r.quote, 2) + "（日志）");
  assert.ok(a.classList.contains("tr-reference"));
  assert.equal(
    dom.window.document.querySelectorAll(".callout,[data-text-reference]")
      .length,
    0,
  );
  assert.ok(dom.window.document.body.textContent.startsWith("before "));
  h.p.settings.limit = 4;
  h.p.settings.layout = "split";
  h.p.settings.style = "body";
  await h.p.save();
  assert.equal(a.textContent, core.preview(r.quote, 4) + "（日志）");
  assert.ok(a.querySelector(".tr-newline"));
  assert.ok(a.classList.contains("tr-body"));
  assert.equal(h.contents.get(h.target.path), token);
  for (const child of children.reverse()) child.cleanup();
  assert.equal(a.textContent, full);
  assert.ok(!a.classList.contains("tr-reference"));
  dom.window.close();
});

test("automatic links render immediately and only a unique original is registered", { timeout: 3000 }, async () => {
  const h = harness();
  await h.p.onload();
  h.contents.set(h.source.path, "重复句。唯一原句。重复句。");
  const unique = "[[日志.md|唯一原句。(日志)]]";
  const ambiguous = "[[日志.md|重复句。（日志）]]";
  const missing = "[[其他笔记|保留的摘录（其他笔记）]]";
  const ordinary = "[[日志.md|普通别名（别处）]]";
  const text = [unique, ambiguous, missing, ordinary].join("\n");
  h.contents.set(h.target.path, text);
  const saved = new Promise((resolve) => { h.p.schedulePersist = resolve; });
  const rendered = h.p.referenceBindings(text, h.target.path);
  assert.deepEqual(rendered.map(({ r }) => r.token), [unique, ambiguous, missing]);
  assert.ok(rendered.every(({ r }) => r.automatic));
  assert.equal(h.p.refs.length, 0);
  await saved;
  assert.equal(h.p.refs.length, 1);
  assert.equal(h.p.refs[0].token, unique);
  assert.equal(h.p.refs[0].locator.start, 4);
  assert.equal(h.contents.get(h.target.path), text);
  assert.equal(h.writes.length, 0);
  h.p.onunload();
});

test("with tracking disabled, a syntax link locates its source without a stored record", async () => {
  const h = harness();
  await h.p.onload();
  h.p.settings.notifySourceChanges = false;
  const quote = "要引用的一句话。";
  const token = "[[日志.md|" + quote + "（日志）]]";
  h.contents.set(h.target.path, token);
  const [{ r }] = h.p.referenceBindings(token, h.target.path);
  assert.ok(r.automatic);
  const source = h.contents.get(h.source.path);
  const found = await require("../src/source-tracking").resolve(h.p, source, r);
  assert.equal(found.start, source.indexOf(quote));
  assert.equal(h.p.automaticNotes.get(h.target.path).timer, undefined);
  assert.equal(h.p.refs.length, 0);
  h.p.onunload();
});

test("a pasted copy of an already changed source can be compared and updated independently", async () => {
  const h = harness();
  await h.p.onload();
  h.p.settings.notifySourceChanges = false;
  const original = "固定的前文。原来的句子。固定的后文。";
  const old = "原来的句子。";
  const changed = "后来改过的句子。";
  const captured = {
    ...core.capture(original, original.indexOf(old), original.indexOf(old) + old.length, h.source.path),
    name: h.source.basename,
  };
  const token = h.p.token(captured);
  const previous = core.bind(captured, "B.md", token, token, 0);
  h.p.refs.push(previous);
  h.contents.set(h.source.path, original.replace(old, changed));
  h.contents.set(h.target.path, token);
  const [{ r }] = h.p.referenceBindings(token, h.target.path);
  await h.p.reviewSource(r);
  const modal = h.modals.at(-1);
  assert.equal(modal.review.old, old);
  assert.equal(modal.review.next, changed);
  await modal.action();
  assert.equal(h.contents.get(h.target.path), h.p.token({ ...captured, snapshot: changed }));
  assert.equal(previous.token, token);
  assert.equal(h.contents.get(h.source.path), original.replace(old, changed));
  h.p.onunload();
});

test("stale automatic verification cannot register a removed link", async () => {
  const h = harness();
  await h.p.onload();
  const token = "[[日志.md|要引用的一句话。（日志）]]";
  h.contents.set(h.target.path, token);
  h.p.referenceBindings(token, h.target.path);
  h.contents.set(h.target.path, "已经删除");
  const check = h.p.automaticNotes.get(h.target.path);
  await new Promise((resolve) => {
    h.p.run = async (fn) => {
      await fn();
      resolve();
    };
    assert.ok(check.timer);
  });
  assert.equal(h.p.refs.length, 0);
  h.p.onunload();
});

test("release bundle loads without local source files and copies clean reference", async () => {
  const h = harness("main.js");
  await h.p.onload();
  await h.p.copy(h.editor, { file: h.source });
  assert.ok(h.context.clipboard.startsWith("[["));
  assert.ok(!fs.readFileSync("main.js", "utf8").includes('require("./core")'));
});
test("legacy migration backs up before replacement and keeps manual edits", async () => {
  const h = harness();
  await h.p.onload();
  const r = { ...core.capture("original", 0, 8, h.source.path), name: "日志" };
  const original = core
    .render(r, "[[日志.md|日志]]")
    .replace("> original", "> manually edited");
  h.contents.set(h.target.path, original);
  const backups = [];
  h.p.app.vault.read = async (f) => h.contents.get(f.path);
  h.p.app.vault.createFolder = async () => {};
  h.p.app.vault.create = async (path, text) => backups.push({ path, text });
  await h.p.migrate();
  assert.equal(backups[0].text, original);
  assert.ok(backups[0].path.endsWith(".txt"));
  assert.ok(h.contents.get(h.target.path).includes("manually edited"));
  assert.ok(!h.contents.get(h.target.path).includes("data-text-reference"));
  assert.equal(h.writes.filter((p) => p === h.source.path).length, 0);
  assert.equal(h.p.refs.length, 1);
});
