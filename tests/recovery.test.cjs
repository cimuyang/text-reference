const { test } = require("node:test");
const assert = require("node:assert/strict");
const core = require("../src/core");
const { harness } = require("./helpers.cjs");
const tracking = require("../src/source-tracking");
const before =
  "前文定位：今天的阅读记录。原句中间和结尾。后文定位：接下来继续思考。";
const start = before.indexOf("原句"),
  end = before.indexOf("后文");
const r = core.capture(before, start, end, "日志.md");
test("outer context recovers middle and tail edits after restart", () => {
  for (const q of ["原句新的中间和结尾。", "原句中间。", "完全重写的新句。"]) {
    const text = before.slice(0, start) + q + before.slice(end);
    const found = core.recover(text, r);
    assert.equal(found.status, "changed");
    assert.equal(text.slice(found.start, found.end), q);
  }
});
test("deleted passage never absorbs its following paragraph", () => {
  assert.equal(
    core.recover(before.slice(0, start) + before.slice(end), r).status,
    "missing",
  );
});
test("remaining duplicate is not accepted as original source", () => {
  const text =
    "甲段开头独有。阅读使人清醒。甲段结尾独有。\n乙段开头独有。阅读使人清醒。乙段结尾独有。";
  const a = text.indexOf("阅读"),
    record = core.capture(text, a, a + "阅读使人清醒。".length, "日志.md");
  assert.equal(
    core.recover(text.slice(text.indexOf("\n") + 1), record).status,
    "missing",
  );
});
test("separate external edits outside and inside quote can recover from stable near context", () => {
  const prefix = "A".repeat(100);
  const original = prefix + before;
  const record = core.capture(original, start + 100, end + 100, "日志.md");
  const edited = "B" + original.slice(1).replace("中间", "改过的中间");
  const range = core.recover(edited, record);
  assert.equal(range.status, "changed");
});
test("reference menu has two explicit items; source menu has no hidden repair action", async () => {
  const h = harness();
  await h.p.onload();
  const items = [];
  h.api.Menu = class {
    addItem(fn) {
      const i = {
        setTitle(v) {
          items.push(v);
          return this;
        },
        setIcon() {
          return this;
        },
        onClick() {
          return this;
        },
      };
      fn(i);
    }
    showAtMouseEvent() {}
  };
  h.p.menu({ ...r, id: "r", name: "日志" }, {}, {});
  assert.deepEqual(items, ["核对原文…", "显示全文"]);
  h.editor.somethingSelected = () => true;
  items.length = 0;
  h.handlers["editor-menu"](new h.api.Menu(), h.editor, { file: h.source });
  assert.deepEqual(items, ["引用到", "复制引用"]);
});
test("startup check recovers an edited passage without overwriting snapshot", async () => {
  const h = harness();
  await h.p.onload();
  const record = {
    ...r,
    name: "日志",
    id: "recovered",
    target: h.target.path,
    token: "old",
  };
  h.p.refs = [record];
  h.contents.set(h.source.path, before.replace("中间", "新的中间"));
  await tracking.checkAll(h.p);
  assert.equal(h.p.sourceStatus.get(record.id), "changed");
  assert.ok(h.p.sourceDrafts.get(record.id).quote.includes("新的"));
  assert.equal(record.token, "old");
  tracking.reset(h.p);
});

test('comparison renders snapshot and source with explicit update controls',async()=>{
 const {JSDOM}=require('jsdom');const dom=new JSDOM('<main></main>'),proto=dom.window.HTMLElement.prototype;
 proto.createEl=function(tag,o={}){const e=this.ownerDocument.createElement(tag);e.textContent=o.text||'';this.appendChild(e);return e;};proto.appendText=function(s){this.appendChild(this.ownerDocument.createTextNode(s));};
 const h=harness();await h.p.onload();const record={...r,name:'日志',id:'modal',target:h.target.path,token:'old'};h.p.refs=[record];const text=before.replace('中间','新中间');h.contents.set(h.source.path,text);const found=core.recover(text,r);await h.p.confirmReference(record,{source:r.source,text,quote:text.slice(found.start,found.end),prefix:r.prefix,suffix:r.suffix});
 const buttons=[];h.api.Setting=class{addButton(fn){const b={setButtonText(t){buttons.push(t);return this;},setCta(){return this;},onClick(){return this;}};fn(b);return this;}};
 const modal=h.modals[0];modal.contentEl=dom.window.document.querySelector('main');modal.onOpen();assert.ok(modal.contentEl.querySelector('ins').textContent.includes('新'));assert.deepEqual(buttons,['暂不更新','更新引文']);dom.window.close();
});
