const { test } = require("node:test");
const assert = require("node:assert/strict");
const { JSDOM } = require("jsdom");
const { harness } = require("./helpers.cjs");
const { EditorState, StateField } = require("@codemirror/state");
const { EditorView, Decoration } = require("@codemirror/view");
const core = require("../src/core");
test("real CodeMirror: paste immediately overrides native hiding, selection reveals source, blur restores widget", async () => {
  const dom = new JSDOM('<div id="editor"></div>', { pretendToBeVisual: true });
  const previous = {};
  for (const key of [
    "window",
    "document",
    "MutationObserver",
    "HTMLElement",
    "Node",
  ]) {
    previous[key] = global[key];
    global[key] = dom.window[key];
  }
  const proto = dom.window.HTMLElement.prototype;
  proto.appendText = function (s) {
    this.appendChild(this.ownerDocument.createTextNode(s));
  };
  proto.createSpan = function (o) {
    const el = this.ownerDocument.createElement("span");
    el.textContent = o.text;
    this.appendChild(el);
    return el;
  };
  let view;
  try {
    const h = harness();
    await h.p.onload();
    await h.p.copy(h.editor, { file: h.source });
    const token = h.context.clipboard;
    const nativeBuild = (state) => {
      const at = state.doc.toString().indexOf(token);
      return at < 0 ||
        state.selection.ranges.some(
          (s) => s.from <= at + token.length && s.to >= at,
        )
        ? Decoration.none
        : Decoration.set([Decoration.replace({}).range(at, at + token.length)]);
    };
    const native = StateField.define({
      create: nativeBuild,
      update: (_, tr) => nativeBuild(tr.state),
      provide: (f) => EditorView.decorations.from(f),
    });
    view = new EditorView({
      parent: dom.window.document.querySelector("#editor"),
      state: EditorState.create({
        doc: "前文 后文",
        selection: { anchor: 3 },
        extensions: [
          h.api.editorInfoField,
          h.api.editorLivePreviewField,
          native,
          ...h.p.extension,
        ],
      }),
    });
    const editor = {
      getCursor: () => ({ ch: view.state.selection.main.from }),
      posToOffset: (p) => p.ch,
      getValue: () => view.state.doc.toString(),
      replaceSelection: (s) => {
        view.dispatch({
          changes: { from: 3, to: 3, insert: s },
          selection: { anchor: 3 + s.length + 1 },
        });
      },
    };
    h.handlers["editor-paste"](
      { clipboardData: { getData: () => token }, preventDefault() {} },
      editor,
      { file: h.target },
    );
    assert.equal(
      view.dom.querySelectorAll(".tr-reference").length,
      1,
      "must be visible without mouse movement",
    );
    assert.ok(view.dom.textContent.includes("（日志）"));
    view.dispatch({ selection: { anchor: 5 } });
    assert.equal(view.dom.querySelectorAll(".tr-reference").length, 0);
    assert.ok(
      view.dom.textContent.includes(token),
      "editing reveals the original native syntax",
    );
    const menus = [];
    h.p.menu = (r) => menus.push(r.id);
    view.dom
      .querySelector(".cm-content")
      .dispatchEvent(
        new dom.window.MouseEvent("contextmenu", {
          bubbles: true,
          cancelable: true,
        }),
      );
    assert.deepEqual(
      menus,
      [h.p.refs[0].id],
      "raw link right click resolves current reference",
    );
    view.dispatch({ selection: { anchor: view.state.doc.length } });
    assert.equal(view.dom.querySelectorAll(".tr-reference").length, 1);
    const node = view.dom.querySelector(".tr-reference");
    h.p.refreshEditors();
    assert.equal(
      view.dom.querySelector(".tr-reference"),
      node,
      "unchanged widgets should reuse DOM",
    );
    h.p.settings.limit = 2;
    h.p.settings.layout = "split";
    h.p.settings.style = "body";
    await h.p.save();
    const updated = view.dom.querySelector(".tr-reference");
    assert.ok(updated.classList.contains("tr-body"));
    assert.ok(updated.querySelector(".tr-newline"));
    assert.ok(
      updated.textContent.startsWith(core.preview(h.p.display(h.p.refs[0]), 2)),
    );
    h.p.sourceStatus.set(h.p.refs[0].id, "changed");
    h.p.refreshDisplays();
    assert.ok(
      view.dom
        .querySelector(".tr-reference")
        .textContent.includes("原文已变化"),
    );
    h.p.sourceStatus.clear();
    h.p.refreshDisplays();
    assert.equal(
      view.dom
        .querySelector(".tr-reference")
        .textContent.includes("原文已变化"),
      false,
    );
    // Status refresh replaces the widget; continue selecting its current DOM.
    const current = view.dom.querySelector(".tr-reference");
    const selection = dom.window.getSelection(),
      range = dom.window.document.createRange();
    range.setStart(current.firstChild, 0);
    range.setEnd(current.firstChild, 1);
    selection.removeAllRanges();
    selection.addRange(range);
    view.dispatch({ selection: { anchor: 5 } });
    assert.equal(
      view.dom.querySelector(".tr-reference"),
      current,
      "drag selection must keep visible DOM stable",
    );
    selection.removeAllRanges();
    await h.p.saving;
  } finally {
    view?.destroy();
    dom.window.close();
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete global[key];
      else global[key] = value;
    }
  }
});
test("display parsing removes Markdown syntax without changing source locator", () => {
  const raw = "题型 **本质答案**、[链接](文件.md) 与 `代码`";
  assert.equal(core.readable(raw), "题型 本质答案、链接 与 代码");
  const r = core.capture(raw, 0, raw.length, "日志.md");
  assert.equal(r.quote, raw);
  assert.equal(core.locate(raw, r).status, "found");
});
