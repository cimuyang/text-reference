const { test } = require("node:test");
const assert = require("node:assert/strict");
const { JSDOM } = require("jsdom");
const core = require("../src/core");
const tracking = require("../src/source-tracking");
const { bind } = require("../src/interaction");
test("click, Enter and hover use latest association after record replacement", async () => {
  const d = new JSDOM("<a>引用</a>"),
    a = d.window.document.querySelector("a"),
    old = {
      id: "r",
      source: "来源.md",
      target: "专题.md",
      quote: "旧句。",
      prefix: "",
      suffix: "",
    },
    fresh = { ...old, quote: "新原文内容。" },
    opens = [],
    calls = [];
  const p = {
    refs: [old],
    core,
    Obsidian: { Notice: class {} },
    t: (x) => x,
    run: (fn) => Promise.resolve().then(fn),
    open: (r) => opens.push(r.quote),
    menu() {},
    app: {
      vault: {
        getAbstractFileByPath: () => ({}),
        read: async () => fresh.quote,
      },
      workspace: { trigger: (event, data) => calls.push(data) },
    },
  };
  const cleanup = bind(p, a, old);
  p.refs = [fresh];
  try {
    a.dispatchEvent(
      new d.window.KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
    );
    a.dispatchEvent(
      new d.window.MouseEvent("click", { bubbles: true, cancelable: true }),
    );
    a.dispatchEvent(
      new d.window.MouseEvent("mouseover", { ctrlKey: true, bubbles: true }),
    );
    await new Promise(setImmediate);
    assert.deepEqual(opens, [fresh.quote, fresh.quote]);
    assert.equal(calls.length, 1);
    assert.deepEqual(calls[0].state.startLoc, { line: 0, col: 0 });
    assert.deepEqual(calls[0].state.endLoc, {
      line: 0,
      col: fresh.quote.length,
    });
  } finally {
    cleanup();
    d.window.close();
  }
});
test("concurrent source reads share one request without retaining a failed promise", async () => {
  let count = 0,
    release;
  const p = {
      app: {
        vault: {
          read() {
            count++;
            return new Promise((resolve) => (release = resolve));
          },
        },
      },
    },
    file = { path: "source.md" };
  const first = tracking.read(p, file),
    second = tracking.read(p, file);
  assert.equal(count, 1);
  assert.equal(first, second);
  release("text");
  assert.equal(await first, "text");
  await second;
  assert.equal(p.sourceReadRequests.size, 0);
});

test("document keyboard and copy listeners are shared, with pointer listeners idle until dragging", () => {
  const d = new JSDOM("<main></main>"),
    doc = d.window.document,
    counts = {},
    add = doc.addEventListener.bind(doc);
  doc.addEventListener = (type, ...args) => {
    counts[type] = (counts[type] || 0) + 1;
    return add(type, ...args);
  };
  const p = {
    refs: [],
    run: (fn) => Promise.resolve().then(fn),
    app: {},
    Obsidian: {},
  };
  const clean = [];
  for (let i = 0; i < 60; i++) {
    const a = doc.createElement("a"),
      r = { id: String(i) };
    doc.querySelector("main").appendChild(a);
    p.refs.push(r);
    clean.push(bind(p, a, r));
  }
  assert.equal(counts.keydown, 1);
  assert.equal(counts.keyup, 1);
  assert.equal(counts.copy, 1);
  assert.equal(counts.mousemove || 0, 0);
  for (const stop of clean) stop();
  d.window.close();
});
test("source invalidation starts a fresh read even while an earlier read is pending", async () => {
  const releases = [];
  let reads = 0;
  const p = {
      app: {
        vault: {
          read() {
            reads++;
            return new Promise((resolve) => releases.push(resolve));
          },
        },
      },
    },
    file = { path: "same.md" };
  const old = tracking.read(p, file);
  tracking.invalidate(p, file.path);
  const fresh = tracking.read(p, file);
  assert.equal(reads, 2);
  releases[0]("old");
  await old;
  assert.equal(tracking.read(p, file), fresh);
  releases[1]("new");
  assert.equal(await fresh, "new");
});

test("unrelated vault changes do not retain per-file tracking state", () => {
  const p = { refs: [{ source: "tracked.md" }] };
  tracking.init(p);
  for (let i = 0; i < 1000; i++) tracking.invalidate(p, `other-${i}.md`);
  assert.equal(p.sourceEpochs.size, 0);
  tracking.invalidate(p, "tracked.md");
  assert.equal(p.sourceEpochs.size, 1);
});

test("failed source read is released and the next hover can retry", async () => {
  let reads = 0;
  const p = {
    app: {
      vault: {
        read: async () => {
          if (++reads === 1) throw new Error("read failed");
          return "recovered";
        },
      },
    },
  };
  const file = { path: "retry.md" };
  await assert.rejects(tracking.read(p, file), /read failed/);
  assert.equal(p.sourceReadRequests.size, 0);
  assert.equal(await tracking.read(p, file), "recovered");
});
