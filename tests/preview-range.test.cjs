const { test } = require("node:test");
const assert = require("node:assert/strict");
const { JSDOM } = require("jsdom");
const preview = require("../src/preview-range"),
  core = require("../src/core"),
  tracking = require("../src/source-tracking");
const { bind } = require("../src/interaction");
test("mid-paragraph range spans formatting, a heading, and the exact end of the next paragraph", () => {
  const source = "前文。目标**重点**。\n\n## 新标题\n\n接下来是引文。后文。",
    start = source.indexOf("目标"),
    end = source.indexOf("后文");
  const d = new JSDOM(
    "<main><p>前文。目标<strong>重点</strong>。</p><h2>新标题</h2><p>接下来是引文。后文。</p></main>",
  );
  const ranges = preview.ranges(
    d.window.document.querySelector("main"),
    source,
    { start, end },
  );
  assert.equal(ranges.length, 1);
  assert.equal(ranges[0].startOffset, 3);
  assert.equal(
    ranges[0].toString().replace(/\s/g, ""),
    core.readable(source.slice(start, end)).replace(/\s/g, ""),
  );
  assert.ok(!ranges[0].toString().includes("前文"));
  assert.ok(!ranges[0].toString().includes("后文"));
  d.window.close();
});
test("ambiguous visible quotes and invalid ranges never get arbitrary highlights", () => {
  const source = "前文。相同句。\n\n后文。相同句。",
    start = source.indexOf("相同句");
  const d = new JSDOM(
      "<main><p>前文。相同句。</p><p>后文。相同句。</p></main>",
    ),
    root = d.window.document.querySelector("main");
  assert.equal(
    preview.ranges(root, source, { start, end: start + 4 }).length,
    0,
  );
  assert.equal(preview.ranges(root, source, { start: -1, end: 3 }).length, 0);
  d.window.close();
});

test("hard line breaks and nested formatting preserve exact quote boundaries", () => {
  const d = new JSDOM(
      "<main><p>前文。目标<strong>第一行</strong><br>第二行。后文。</p></main>",
    ),
    source = "前文。目标**第一行**  \n第二行。后文。",
    found = { start: source.indexOf("目标"), end: source.indexOf("后文") };
  const hits = preview.ranges(
    d.window.document.querySelector("main"),
    source,
    found,
  );
  assert.equal(hits.length, 1);
  assert.equal(hits[0].toString(), "目标第一行第二行。");
  d.window.close();
});
test("virtualized long preview highlights only uniquely matched visible parts", () => {
  const source =
      "前文。\n\n第一段唯一内容。\n\n## 跨段标题\n\n第三段唯一内容。\n\n后文。",
    start = source.indexOf("第一段"),
    end = source.indexOf("\n\n后文");
  const d = new JSDOM("<main><p>第一段唯一内容。</p><h2>跨段标题</h2></main>");
  const ranges = preview.ranges(
    d.window.document.querySelector("main"),
    source,
    { start, end },
  );
  assert.equal(ranges.length, 2);
  assert.equal(
    ranges.map((x) => x.toString()).join(""),
    "第一段唯一内容。跨段标题",
  );
  d.window.close();
});
test("highlight lifecycle preserves selection and clears styles, registry and observer effects", async () => {
  const d = new JSDOM(
    '<aside><div class="markdown-rendered"><p class="is-flashing">前文。目标文字。后文。</p></div></aside>',
  );
  d.window.CSS = { highlights: new Map() };
  d.window.Highlight = class {
    constructor(...ranges) {
      this.ranges = ranges;
    }
  };
  const root = d.window.document.querySelector("aside"),
    source = "前文。目标文字。后文。",
    start = source.indexOf("目标"),
    selection = d.window.getSelection(),
    range = d.window.document.createRange();
  range.selectNodeContents(root.querySelector("p"));
  selection.addRange(range);
  const selected = selection.toString();
  const cleanup = preview.watch({ zh: true }, { hoverEl: root }, source, {
    start,
    end: start + 5,
  });
  assert.equal(d.window.CSS.highlights.size, 1);
  assert.equal(root.querySelector(".is-flashing"), null);
  assert.equal(selection.toString(), selected);
  root
    .querySelector("p")
    .appendChild(d.window.document.createTextNode("新尾部"));
  await new Promise(setImmediate);
  assert.equal(d.window.CSS.highlights.size, 1);
  cleanup();
  assert.equal(d.window.CSS.highlights.size, 0);
  assert.equal(d.window.document.querySelectorAll("style").length, 0);
  d.window.close();
});
test("fallback includes whole blocks and bounds very large text", () => {
  const source =
    "前段。\n\n段落开头，目标内容，段落结尾。\n\n## 后标题\n\n后段。";
  const start = source.indexOf("目标"),
    slice = preview.context(source, { start, end: start + 4 });
  assert.ok(slice.text.includes("段落开头"));
  assert.ok(slice.text.includes("段落结尾"));
  assert.equal(
    slice.text.slice(slice.range.start, slice.range.end),
    "目标内容",
  );
  const huge = preview.context("甲".repeat(30000), { start: 100, end: 20000 });
  assert.ok(huge.text.length <= 16000);
  assert.equal(huge.truncated, true);
});
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
