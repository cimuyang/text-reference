const { test } = require("node:test");
const assert = require("node:assert/strict");
const { JSDOM } = require("jsdom");
const core = require("../src/core");
const { bind } = require("../src/interaction");
test("single click navigates; dragging selects and copies only visible text; one Ctrl hover source", async () => {
  const dom = new JSDOM('<a title="old">可见引文（来源）</a>'),
    doc = dom.window.document,
    a = doc.querySelector("a");
  const r = {
    source: "源.md",
    target: "目标.md",
    token: "[[源.md|省略号后面还有完整摘录（源）]]",
    quote: "原句",
    prefix: "",
    suffix: "",
  };
  const opens = [],
    hover = [];
  const p = {
    refs: [r],
    core,
    Obsidian: { Notice: class {} },
    t: (x) => x,
    run: (fn) => Promise.resolve().then(fn),
    open: () => opens.push(1),
    menu() {},
    app: {
      vault: {
        getAbstractFileByPath: () => ({}),
        read: async () => "前文\n原句\n后文",
      },
      workspace: { trigger: (type, data) => hover.push({ type, data }) },
    },
  };
  const cleanup = bind(p, a, r);
  const fire = (target, type, args = {}) =>
    target.dispatchEvent(
      new dom.window.MouseEvent(type, {
        bubbles: true,
        cancelable: true,
        ...args,
      }),
    );
  assert.equal(a.hasAttribute("title"), false);
  fire(a, "mouseover");
  await new Promise(setImmediate);
  assert.equal(hover.length, 0);
  fire(a, "mouseover", { ctrlKey: true });
  await new Promise(setImmediate);
  assert.equal(hover.length, 1);
  assert.equal(hover[0].data.state.scroll, 1);
  fire(a, "mousedown");
  fire(doc, "mouseup");
  fire(a, "click");
  await new Promise(setImmediate);
  assert.equal(opens.length, 1);
  fire(a, "mousedown", { clientX: 0 });
  fire(doc, "mousemove", { clientX: 20 });
  const range = doc.createRange();
  range.setStart(a.firstChild, 1);
  range.setEnd(a.firstChild, 3);
  dom.window.getSelection().addRange(range);
  fire(doc, "mouseup");
  fire(a, "click");
  await new Promise(setImmediate);
  assert.equal(opens.length, 1);
  assert.equal(dom.window.getSelection().toString(), "见引");
  let copied;
  const event = new dom.window.Event("copy", {
    bubbles: true,
    cancelable: true,
  });
  event.clipboardData = {
    setData: (type, text) => {
      copied = text;
    },
  };
  doc.dispatchEvent(event);
  assert.equal(copied, "见引");
  assert.equal(event.defaultPrevented, true);
  range.selectNodeContents(a);
  doc.dispatchEvent(event);
  assert.equal(copied, r.token);
  cleanup();
  dom.window.close();
});
