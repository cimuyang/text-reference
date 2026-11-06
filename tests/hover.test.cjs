const { test } = require("node:test");
const assert = require("node:assert/strict");
const { JSDOM } = require("jsdom");
const core = require("../src/core");
const { install } = require("../src/hover");
function setup(native, enabled) {
  const dom = new JSDOM("<a>引用</a>"),
    doc = dom.window.document,
    a = doc.querySelector("a");
  const calls = [],
    popups = [],
    renders = [];
  const r = {
    source: "来源.md",
    target: "目标.md",
    quote: "原句",
    prefix: "",
    suffix: "",
  };
  const p = {
    core,
    run: (fn) => Promise.resolve().then(fn),
    t: (x) => x,
    Obsidian: {
      Notice: class {},
      HoverPopover: class {
        constructor(parent) {
          this.state = 1;
          this.hoverEl = doc.createElement("div");
          this.hoverEl.createDiv = ({ cls }) => {
            const el = doc.createElement("div");
            el.className = cls;
            this.hoverEl.appendChild(el);
            return el;
          };
          doc.body.appendChild(this.hoverEl);
          parent.hoverPopover = this;
          popups.push(this);
        }
        unload() {
          this.state = 3;
          this.hoverEl.remove();
        }
      },
      MarkdownRenderer: {
        render: async (app, text, el) => {
          el.textContent = text;
          renders.push(text);
        },
      },
    },
    app: {
      internalPlugins: { getPluginById: () => ({ enabled }) },
      vault: {
        getAbstractFileByPath: () => ({}),
        read: async () => "上文\n原句\n下文",
      },
      workspace: {
        trigger: (event, data) => {
          calls.push(data);
          if (native) data.hoverParent.hoverPopover = { state: 1, unload() {} };
        },
      },
    },
  };
  const dispose = install(p, a, r, {});
  return { dom, doc, a, calls, popups, renders, dispose, p, r };
}
test("pointer already hovering then Control pressed opens one native request", async () => {
  const h = setup(true);
  h.a.dispatchEvent(
    new h.dom.window.MouseEvent("mouseover", { bubbles: true }),
  );
  h.doc.dispatchEvent(
    new h.dom.window.KeyboardEvent("keydown", {
      key: "Control",
      ctrlKey: true,
      bubbles: true,
    }),
  );
  await new Promise(setImmediate);
  assert.equal(h.calls.length, 1);
  assert.equal(h.calls[0].event.ctrlKey, true);
  assert.equal(h.calls[0].state.scroll, 1);
  h.a.dispatchEvent(
    new h.dom.window.MouseEvent("mousemove", { ctrlKey: true }),
  );
  await new Promise(setImmediate);
  assert.equal(h.calls.length, 1);
  h.dispose();
  h.dom.window.close();
});
test("native preview not created: native container fallback renders passage context once", async () => {
  const h = setup(false);
  h.a.dispatchEvent(
    new h.dom.window.MouseEvent("mouseover", { ctrlKey: true, bubbles: true }),
  );
  await new Promise((r) => setTimeout(r, 550));
  assert.equal(h.popups.length, 1);
  assert.ok(h.renders[0].includes("上文\n原句\n下文"));
  h.a.dispatchEvent(
    new h.dom.window.MouseEvent("mousemove", { ctrlKey: true }),
  );
  await new Promise(setImmediate);
  assert.equal(h.calls.length, 1);
  h.dispose();
  assert.equal(h.doc.querySelector(".tr-context-preview"), null);
  h.dom.window.close();
});
test("leaving link cancels delayed preview", async () => {
  const h = setup(false);
  h.a.dispatchEvent(
    new h.dom.window.MouseEvent("mouseover", { ctrlKey: true }),
  );
  await new Promise(setImmediate);
  h.a.dispatchEvent(
    new h.dom.window.MouseEvent("mouseout", { relatedTarget: h.doc.body }),
  );
  await new Promise((r) => setTimeout(r, 550));
  assert.equal(h.popups.length, 0);
  h.dispose();
  h.dom.window.close();
});

test("enabled core preview never races a second fallback popup", async () => {
  const h = setup(false, true);
  try {
    h.a.dispatchEvent(
      new h.dom.window.MouseEvent("mouseover", { ctrlKey: true }),
    );
    await new Promise((resolve) => setTimeout(resolve, 550));
    assert.equal(h.calls.length, 1);
    assert.equal(h.popups.length, 0);
  } finally {
    h.dispose();
    h.dom.window.close();
  }
});

test("disabled core preview uses one fallback without triggering native preview", async () => {
  const h = setup(false, false);
  try {
    h.a.dispatchEvent(
      new h.dom.window.MouseEvent("mouseover", { ctrlKey: true }),
    );
    await new Promise((resolve) => setTimeout(resolve, 30));
    assert.equal(h.calls.length, 0);
    assert.equal(h.popups.length, 1);
    assert.equal(h.renders.length, 1);
  } finally {
    h.dispose();
    h.dom.window.close();
  }
});

test("hover ignores a source result invalidated while its read is pending", async () => {
  const h = setup(false, true);
  let release;
  h.p.app.vault.read = () =>
    new Promise((resolve) => {
      release = resolve;
    });
  try {
    h.a.dispatchEvent(
      new h.dom.window.MouseEvent("mouseover", { ctrlKey: true }),
    );
    await new Promise(setImmediate);
    require("../src/source-tracking").invalidate(h.p, h.r.source);
    release("上文\n原句\n下文");
    await new Promise(setImmediate);
    assert.equal(h.calls.length, 0);
    assert.equal(h.popups.length, 0);
    h.p.app.vault.read = async () => "新上文\n原句\n新下文";
    h.a.dispatchEvent(
      new h.dom.window.MouseEvent("mousemove", { ctrlKey: true }),
    );
    await new Promise(setImmediate);
    assert.equal(h.calls.length, 1);
  } finally {
    h.dispose();
    h.dom.window.close();
  }
});
