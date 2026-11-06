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
  children[0].cleanup();
  assert.equal(a.textContent, full);
  assert.ok(!a.classList.contains("tr-reference"));
  dom.window.close();
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
