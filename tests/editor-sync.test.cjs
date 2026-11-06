const { test } = require("node:test");
const assert = require("node:assert/strict");
const { EditorState } = require("@codemirror/state");
const { EditorView } = require("@codemirror/view");
const { JSDOM } = require("jsdom");
const core = require("../src/core"),
  updates = require("../src/updates"),
  maintenance = require("../src/maintenance");
const { harness } = require("./helpers.cjs");
async function fixture() {
  const h = harness();
  await h.p.onload();
  const quote = "坚守价值观。\n不需要伟大构想。\n不需要伟大构想。";
  const r = {
    ...core.capture(quote, 0, quote.length, h.source.path),
    name: "日志",
  };
  const token = h.p.token(r);
  h.r = core.bind(r, h.target.path, token, "前文 " + token + " 后文", 3);
  h.p.refs = [h.r];
  h.contents.set(h.target.path, "前文 " + token + " 后文");
  return h;
}
test("file commit is not rejected by a newly opened stale editor; delayed partial and full notifications preserve association", async () => {
  for (const partial of [true, false]) {
    const h = await fixture();
    const before = h.contents.get(h.target.path);
    let state = EditorState.create({
      doc: before,
      extensions: [h.api.editorInfoField],
    });
    const stale = { state, dispatch() {} };
    const process = h.p.app.vault.process;
    h.p.app.vault.process = async (file, fn) => {
      await process(file, fn);
      h.p.editorViews.add(stale);
    };
    const text = "坚守价值观。\n不需要构想。\n不需要伟大构想。";
    try {
      await updates.apply(
        h.p,
        h.r,
        core.capture(text, 0, text.length, h.source.path),
        "update",
        { ...h.r },
      );
      const after = h.contents.get(h.target.path);
      let from = 0,
        to = before.length,
        end = after.length;
      if (partial) {
        while (from < to && from < end && before[from] === after[from]) from++;
        while (to > from && end > from && before[to - 1] === after[end - 1]) {
          to--;
          end--;
        }
      }
      const tr = state.update({
        changes: { from, to, insert: after.slice(from, end) },
      });
      maintenance.transaction(h.p, tr, h.target.path);
      assert.notEqual(h.r.repair, true);
      assert.equal(h.p.refs.length, 1);
      assert.equal(
        core.activeBindings(h.p.refs, after, h.target.path).length,
        1,
      );
    } finally {
      clearTimeout(h.p.persistTimer);
    }
  }
});
test("opened editor update button closes modal and retains preview, menu, hover, repeat update and undo with a delayed mirror", async () => {
  const d = new JSDOM(
    '<div id="editor"></div><div id="mirror"></div><div id="modal"></div>',
    { pretendToBeVisual: true },
  );
  const saved = {};
  for (const key of [
    "window",
    "document",
    "MutationObserver",
    "Window",
    "HTMLElement",
    "Node",
  ]) {
    saved[key] = global[key];
    global[key] = d.window[key];
  }
  const proto = d.window.HTMLElement.prototype;
  proto.createEl = function (tag, o = {}) {
    const e = this.ownerDocument.createElement(tag);
    e.textContent = o.text || "";
    e.className = o.cls || "";
    this.appendChild(e);
    return e;
  };
  proto.createSpan = function (o) {
    return this.createEl("span", o);
  };
  proto.appendText = function (text) {
    this.appendChild(this.ownerDocument.createTextNode(text));
  };
  d.window.Range.prototype.getClientRects = () => [];
  d.window.Range.prototype.getBoundingClientRect = () => new d.window.DOMRect();
  const h = await fixture();
  let origin, mirror;
  try {
    const before = h.contents.get(h.target.path);
    const state = () =>
      EditorState.create({
        doc: before,
        selection: { anchor: before.length },
        extensions: [
          h.api.editorInfoField,
          h.api.editorLivePreviewField,
          ...h.p.extension,
        ],
      });
    origin = new EditorView({
      parent: d.window.document.querySelector("#editor"),
      state: state(),
    });
    mirror = new EditorView({
      parent: d.window.document.querySelector("#mirror"),
      state: state(),
    });
    let click,
      closed = 0;
    h.api.Setting = class {
      addButton(fn) {
        const b = {
          setButtonText(t) {
            if (t === "更新引文") this.update = true;
            return this;
          },
          setCta() {
            return this;
          },
          setDisabled() {
            return this;
          },
          onClick(fn) {
            if (this.update) click = fn;
            return this;
          },
        };
        fn(b);
        return this;
      }
    };
    let menu = 0,
      hovers = 0;
    h.p.menu = () => menu++;
    h.p.app.workspace.trigger = (event) => {
      if (event === "hover-link") hovers++;
    };
    h.p.settings.limit = 4;
    for (const text of [
      "坚守价值观。\n不需要构想。\n不需要伟大构想。",
      "坚守价值观。\n更新第二次。\n不需要伟大构想。",
    ]) {
      h.contents.set(h.source.path, text);
      await h.p.confirmReference(
        h.r,
        core.capture(text, 0, text.length, h.source.path),
      );
      const modal = h.modals.at(-1);
      modal.contentEl = d.window.document.querySelector("#modal");
      modal.close = () => {
        closed++;
        modal.contentEl.textContent = "";
      };
      modal.onOpen();
      click();
      for (let i = 0; i < 30 && modal.contentEl.textContent; i++)
        await new Promise((resolve) => setTimeout(resolve, 2));
      assert.equal(
        modal.contentEl.textContent,
        "",
        "successful click must close without false stale-content warning",
      );
      assert.equal(h.p.refs.length, 1);
      assert.equal(h.r.repair, false);
      assert.equal(
        h.writes.length,
        0,
        "opened note is edited through its editor, not vault.process",
      );
      let a = origin.dom.querySelector(".tr-reference");
      assert.ok(a);
      assert.ok(a.textContent.startsWith(core.preview(core.readable(text), 4)));
      a.dispatchEvent(
        new d.window.MouseEvent("contextmenu", {
          bubbles: true,
          cancelable: true,
        }),
      );
      a.dispatchEvent(
        new d.window.MouseEvent("mouseover", { bubbles: true, ctrlKey: true }),
      );
      await new Promise(setImmediate);
      const old = mirror.state.doc.toString(),
        next = origin.state.doc.toString();
      let from = 0,
        to = old.length,
        end = next.length;
      while (from < to && from < end && old[from] === next[from]) from++;
      while (to > from && end > from && old[to - 1] === next[end - 1]) {
        to--;
        end--;
      }
      mirror.dispatch({ changes: { from, to, insert: next.slice(from, end) } });
      assert.ok(mirror.dom.querySelector(".tr-reference"));
      assert.notEqual(h.r.repair, true);
      // Simulate host persistence after both editor views have received the update.
      h.contents.set(h.target.path, next);
    }
    assert.equal(closed, 2);
    assert.equal(menu, 2);
    assert.equal(hovers, 2);
    // Close the passive view so the explicit undo uses the remaining authority.
    mirror.destroy();
    mirror = null;
    await updates.revert(h.p, h.p.referenceEdits.at(-1));
    assert.ok(origin.dom.querySelector(".tr-reference"));
  } finally {
    origin?.destroy();
    mirror?.destroy();
    clearTimeout(h.p.persistTimer);
    d.window.close();
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete global[key];
      else global[key] = value;
    }
  }
});

test("divergent editor buffers stop before any write rather than overwriting a later edit", async () => {
  const h = await fixture();
  const original = h.contents.get(h.target.path);
  for (const doc of [original, original + "另一次编辑"])
    h.p.editorViews.add({
      state: EditorState.create({ doc, extensions: [h.api.editorInfoField] }),
      dispatch() {
        throw Error("must not dispatch");
      },
    });
  await assert.rejects(
    () =>
      updates.apply(
        h.p,
        h.r,
        core.capture("新文字。", 0, 4, h.source.path),
        "update",
        { ...h.r },
      ),
    (e) => e.code === "editor-sync",
  );
  assert.equal(h.contents.get(h.target.path), original);
  assert.equal(h.p.refs.length, 1);
});
test("previously flagged valid reference remains reviewable and requires confirmation before restoring display", async () => {
  const h = await fixture();
  const original = h.r.token,
    text = h.r.quote.replace("伟大构想", "构想");
  h.r.token = h.p.token({ ...h.r, snapshot: text });
  h.r.repair = true;
  h.r.originalToken = original;
  h.contents.set(h.source.path, text);
  h.contents.set(h.target.path, h.r.token);
  assert.equal(
    core.activeBindings(h.p.refs, h.r.token, h.target.path).length,
    0,
  );
  assert.equal(
    core.managedBindings(h.p.refs, h.r.token, h.target.path).length,
    1,
  );
  await h.p.reviewSource(h.r);
  assert.equal(h.modals.length, 1);
  assert.equal(h.modals[0].review.old, core.readable(text));
  await h.modals[0].action();
  assert.equal(h.r.repair, false);
  assert.equal(
    core.activeBindings(h.p.refs, h.contents.get(h.target.path), h.target.path)
      .length,
    1,
  );
  clearTimeout(h.p.persistTimer);
});
