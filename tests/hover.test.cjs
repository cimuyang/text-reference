const { test } = require("node:test");
const assert = require("node:assert/strict");
const { JSDOM } = require("jsdom");
const tracking = require("../src/source-tracking");
const { install } = require("../src/hover");

function setup() {
  const dom = new JSDOM("<a>引用</a>");
  const doc = dom.window.document;
  const anchor = doc.querySelector("a");
  const calls = [];
  const r = { source: "来源.md", target: "目标.md", quote: "原句", prefix: "", suffix: "" };
  const p = {
    run: (fn) => Promise.resolve().then(fn),
    app: {
      vault: {
        getAbstractFileByPath: () => ({ path: r.source }),
        read: async () => "上文\n原句\n下文",
      },
      workspace: { trigger: (event, data) => calls.push(data) },
    },
  };
  const dispose = install(p, anchor, r, {});
  const move = (ctrlKey = true) =>
    anchor.dispatchEvent(new dom.window.MouseEvent("mouseover", { ctrlKey, clientX: 23 }));
  const key = (type, ctrlKey) =>
    doc.dispatchEvent(new dom.window.KeyboardEvent(type, { key: "Control", ctrlKey }));
  return { dom, doc, anchor, calls, p, r, move, key, close() { dispose(); dom.window.close(); } };
}

function publish(h, request, nativeHide = true) {
  const hoverEl = h.doc.createElement("div");
  hoverEl.className = "hover-popover";
  hoverEl.textContent = "原文上下文";
  h.doc.body.appendChild(hoverEl);
  const popup = {
    hoverEl,
    hidden: 0,
    unload() { hoverEl.textContent = ""; },
  };
  if (nativeHide)
    popup.hide = () => {
      popup.hidden++;
      hoverEl.remove();
      request.hoverParent.hoverPopover = null;
    };
  request.hoverParent.hoverPopover = popup;
  return popup;
}

test("leaving a shown reference leaves closing and animation to Obsidian", async () => {
  const h = setup();
  try {
    h.move();
    await new Promise(setImmediate);
    const popup = publish(h, h.calls[0]);
    h.anchor.dispatchEvent(new h.dom.window.MouseEvent("mouseout", {
      ctrlKey: true, relatedTarget: h.doc.body,
    }));
    assert.equal(popup.hidden, 0);
    assert.ok(popup.hoverEl.isConnected);
    popup.hide();
    assert.equal(popup.hidden, 1);
    assert.equal(h.doc.querySelector(".hover-popover"), null);
    assert.equal(h.p.previewClose, null);
  } finally {
    h.close();
  }
});

test("entering a native popup and releasing Ctrl do not forcibly unload it", async () => {
  const h = setup();
  try {
    h.move();
    await new Promise(setImmediate);
    const popup = publish(h, h.calls[0]);
    h.anchor.dispatchEvent(new h.dom.window.MouseEvent("mouseout", {
      ctrlKey: true, relatedTarget: popup.hoverEl,
    }));
    popup.hoverEl.dispatchEvent(new h.dom.window.MouseEvent("mouseenter", { ctrlKey: true }));
    h.key("keyup", false);
    assert.equal(popup.hoverEl.textContent, "原文上下文");
    popup.hoverEl.dispatchEvent(new h.dom.window.MouseEvent("mouseleave", {
      ctrlKey: true, relatedTarget: h.doc.body,
    }));
    assert.equal(popup.hidden, 0);
    popup.hide();
    assert.equal(h.doc.querySelector(".hover-popover"), null);
  } finally {
    h.close();
  }
});

test("a late native popup cannot replace or close a newer reference preview", async () => {
  const h = setup();
  const other = h.doc.createElement("a");
  h.doc.body.appendChild(other);
  const dispose = install(h.p, other, h.r);
  try {
    h.move();
    await new Promise(setImmediate);
    h.anchor.dispatchEvent(new h.dom.window.MouseEvent("mouseout", {
      ctrlKey: true, relatedTarget: other,
    }));
    other.dispatchEvent(new h.dom.window.MouseEvent("mouseover", { ctrlKey: true }));
    await new Promise(setImmediate);
    const current = publish(h, h.calls[1]);
    const old = publish(h, h.calls[0]);
    await new Promise(setImmediate);
    assert.equal(old.hoverEl.isConnected, false);
    assert.equal(current.hoverEl.isConnected, true);
    h.key("keyup", false);
    assert.equal(current.hoverEl.isConnected, true);
    current.hide();
  } finally {
    dispose();
    h.close();
  }
});

test("disposing a reference removes its popup shell even if unload only clears contents", async () => {
  const h = setup();
  h.move();
  await new Promise(setImmediate);
  const popup = publish(h, h.calls[0], false);
  h.close();
  assert.equal(popup.hoverEl.isConnected, false);
});

test("holding Ctrl before entering a reference sends one native request with passage coordinates", async () => {
  const h = setup();
  try {
    h.move();
    h.move();
    await new Promise(setImmediate);
    assert.equal(h.calls.length, 1);
    assert.deepEqual(h.calls[0].state.startLoc, { line: 1, col: 0 });
    assert.deepEqual(h.calls[0].state.endLoc, { line: 1, col: 2 });
  } finally {
    h.close();
  }
});

test("pressing Ctrl with a stationary pointer gives native preview a modified mouse event", async () => {
  const h = setup();
  try {
    h.move(false);
    h.key("keydown", true);
    await new Promise(setImmediate);
    assert.equal(h.calls.length, 1);
    assert.ok(h.calls[0].event instanceof h.dom.window.MouseEvent);
    assert.equal(h.calls[0].event.ctrlKey, true);
    assert.equal(h.calls[0].event.clientX, 23);
  } finally {
    h.close();
  }
});

test("leaving before the read completes cancels a native preview request", async () => {
  const h = setup();
  let finish;
  h.p.app.vault.read = () => new Promise((resolve) => { finish = resolve; });
  try {
    h.move();
    await new Promise(setImmediate);
    h.anchor.dispatchEvent(new h.dom.window.MouseEvent("mouseout", { relatedTarget: h.doc.body }));
    finish("上文\n原句\n下文");
    await new Promise(setImmediate);
    assert.equal(h.calls.length, 0);
  } finally {
    h.close();
  }
});

test("repeated native previews reuse the source read until invalidated", async () => {
  const h = setup();
  const source = "前文填充\n".repeat(30000) + "原句\n";
  let reads = 0;
  h.p.app.vault.read = async () => { reads++; return source; };
  try {
    h.move();
    await new Promise(setImmediate);
    assert.equal(h.calls[0].state.startLoc.line, 30000);
    h.key("keyup", false);
    h.move();
    await new Promise(setImmediate);
    assert.equal(reads, 1);
    h.key("keyup", false);
    tracking.invalidate(h.p, h.r.source);
    h.move();
    await new Promise(setImmediate);
    assert.equal(reads, 2);
  } finally {
    h.close();
  }
});
