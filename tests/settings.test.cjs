const { test } = require("node:test");
const assert = require("node:assert/strict");
const { JSDOM } = require("jsdom");
const { harness } = require("./helpers.cjs");

test("settings prioritize display, preview updates live, restore leaves tracking and custom hotkeys alone", async () => {
  const h = harness();
  await h.p.onload();
  const dom = new JSDOM("<main></main>"),
    proto = dom.window.HTMLElement.prototype;
  proto.empty = function () {
    this.textContent = "";
  };
  proto.createEl = function (tag, o = {}) {
    const el = this.ownerDocument.createElement(tag);
    el.textContent = o.text || "";
    el.className = o.cls || "";
    this.appendChild(el);
    return el;
  };
  proto.createSpan = function (o) {
    return this.createEl("span", o);
  };
  proto.appendText = function (text) {
    this.appendChild(this.ownerDocument.createTextNode(text));
  };
  const rows = [];
  h.api.Setting = class {
    constructor() {
      rows.push(this);
    }
    setName(name) {
      this.name = name;
      return this;
    }
    setDesc() {
      return this;
    }
    control(fn) {
      const control = {
        setValue() {
          return this;
        },
        addOption() {
          return this;
        },
        setButtonText() {
          return this;
        },
        onChange(fn) {
          this.change = fn;
          return this;
        },
        onClick(fn) {
          this.click = fn;
          return this;
        },
      };
      fn(control);
      this.input = control;
      return this;
    }
    addText(fn) {
      return this.control(fn);
    }
    addDropdown(fn) {
      return this.control(fn);
    }
    addToggle(fn) {
      return this.control(fn);
    }
    addButton(fn) {
      return this.control(fn);
    }
  };
  h.p.settingsTab.containerEl = dom.window.document.querySelector("main");
  h.p.settingsTab.display();
  assert.deepEqual(
    rows.map((r) => r.name),
    [
      "来源位置",
      "引用样式",
      "引文显示长度",
      "复制引用快捷键",
      "追踪原文变化",
      "恢复默认显示",
    ],
  );
  const example = h.p.settingsTab.containerEl.querySelector(
    ".tr-settings-example",
  );
  const original = example.textContent;
  rows[2].input.change("8");
  await new Promise(setImmediate);
  assert.ok(example.textContent.length < original.length);
  rows[0].input.change("split");
  await new Promise(setImmediate);
  assert.ok(example.querySelector(".tr-newline"));
  rows[4].input.change(false);
  await new Promise(setImmediate);
  assert.equal(h.p.settings.notifySourceChanges, false);
  rows[5].input.click();
  await new Promise(setImmediate);
  assert.equal(h.p.settings.notifySourceChanges, false);
  assert.equal(h.p.settings.limit, 30);
  assert.equal(h.p.settings.layout, "inline");
  assert.equal(h.p.settings.style, "native");
  assert.equal(h.p.app.hotkeyManager, undefined);
  dom.window.close();
});
