const { test } = require("node:test");
const assert = require("node:assert/strict");
const { EditorState, StateField } = require("@codemirror/state");
const core = require("../src/core");
const tracking = require("../src/source-tracking");
const updates = require("../src/updates");
const { harness } = require("./helpers.cjs");

async function setup() {
  const h = harness();
  await h.p.onload();
  const text = h.contents.get(h.source.path);
  const selected = core.capture(text, 3, 12, h.source.path);
  selected.name = h.source.basename;
  const token = h.p.token(selected);
  h.r = core.bind(selected, h.target.path, token, token, 0);
  h.p.refs.push(h.r);
  h.contents.set(h.target.path, token);
  await tracking.check(h.p, h.source, false);
  h.state = EditorState.create({ doc: text });
  h.edit = (from, to, insert) => {
    const tr = h.state.update({ changes: { from, to, insert } });
    tracking.transaction(h.p, tr, h.source.path);
    h.state = tr.state;
    h.contents.set(h.source.path, tr.state.doc.toString());
  };
  h.cleanup = () => {
    tracking.reset(h.p);
    clearTimeout(h.p.persistTimer);
  };
  return h;
}
test("source insertion/deletion/replacement keeps snapshot and offers a verified update with undo", async () => {
  const h = await setup();
  try {
    let saves = 0;
    h.p.saveData = async () => saves++;
    const oldToken = h.r.token;
    h.edit(5, 5, "新增");
    h.edit(7, 8, "");
    h.edit(8, 9, "改");
    await h.p.checkSource(h.source);
    assert.equal(h.p.sourceStatus.get(h.r.id), "changed");
    const draft = h.p.sourceDrafts.get(h.r.id);
    assert.equal(draft.quote, h.state.doc.sliceString(3, 13));
    assert.equal(h.r.token, oldToken);
    assert.equal(saves, 0);
    assert.equal(h.notices.length, 0);
    await h.p.reviewSource(h.r);
    assert.equal(
      h.modals.length,
      1,
      "opens comparison directly for tracked ranges",
    );
    await h.modals[0].action();
    assert.equal(h.r.quote, draft.quote);
    assert.equal(h.p.sourceStatus.has(h.r.id), false);
    assert.ok(h.contents.get(h.target.path).includes(draft.quote));
    assert.equal(h.contents.get(h.source.path), h.state.doc.toString());
    await updates.revert(h.p, h.p.referenceEdits[0]);
    assert.equal(h.contents.get(h.target.path), oldToken);
  } finally {
    h.cleanup();
  }
});
test("unrelated edits move anchors; repeated source events produce one actionable notice", async () => {
  const h = await setup();
  try {
    h.edit(0, 0, "无关前言。");
    await h.p.checkSource(h.source);
    assert.equal(h.p.sourceStatus.get(h.r.id), "found");
    assert.equal(h.notices.length, 0);
    h.edit(10, 10, "新");
    await h.p.checkSource(h.source);
    await h.p.checkSource(h.source);
    h.edit(11, 11, "字");
    await h.p.checkSource(h.source);
    assert.equal(h.notices.length, 0);

    const draft = h.p.sourceDrafts.get(h.r.id);
    h.edit(draft.start, draft.end, h.r.quote);
    await h.p.checkSource(h.source);
    assert.equal(h.p.sourceStatus.get(h.r.id), "found");
    assert.equal(h.p.sourceDrafts.has(h.r.id), false);
  } finally {
    h.cleanup();
  }
});
test("file modifications use a conservative range diff; crossing boundaries requires selection", async () => {
  const h = await setup();
  try {
    h.contents.set(
      h.source.path,
      h.contents.get(h.source.path).replace("引用", "摘录"),
    );
    await h.p.checkSource(h.source);
    assert.ok(h.p.sourceDrafts.get(h.r.id).quote.includes("摘录"));
    h.contents.set(h.source.path, "另一篇完全不同的笔记");
    await h.p.checkSource(h.source);
    assert.equal(h.p.sourceDrafts.has(h.r.id), false);
    assert.equal(h.p.sourceStatus.get(h.r.id), "missing");
    await h.p.reviewSource(h.r);
    assert.equal(h.p.pendingReview, undefined);
    assert.equal(h.modals.length, 1);
    assert.equal(
      h.modals[0].action,
      undefined,
      "no guessed replacement offered",
    );
  } finally {
    h.cleanup();
  }
});
test("source changed after comparison opens: confirmation rejects without touching target", async () => {
  const h = await setup();
  try {
    h.edit(5, 5, "新");
    await h.p.reviewSource(h.r);
    const token = h.r.token;
    h.edit(6, 6, "再次修改");
    await assert.rejects(() => h.modals[0].action());
    assert.equal(h.contents.get(h.target.path), token);
  } finally {
    h.cleanup();
  }
});
test("tracking toggle stops checks and resuming backfills state without persistent source history", async () => {
  const h = await setup();
  try {
    h.p.settings.notifySourceChanges = false;
    tracking.reset(h.p);
    let reads = 0;
    h.p.app.vault.read = async (f) => {
      reads++;
      return h.contents.get(f.path);
    };
    h.edit(4, 5, "新");
    await h.p.checkSource(h.source);
    await tracking.checkAll(h.p);
    assert.equal(reads, 0);
    assert.equal(h.p.sourceTimers.size, 0);
    assert.equal(h.p.sourceStatus.size, 0);
    h.p.settings.notifySourceChanges = true;
    await tracking.checkAll(h.p, true);
    assert.equal(h.p.sourceStatus.get(h.r.id), "missing");
    assert.equal(h.p.sourceDrafts.has(h.r.id), false);
    let data;
    h.p.saveData = async (value) => (data = value);
    await h.p.persist();
    assert.deepEqual(Object.keys(data).sort(), [
      "refs",
      "schemaVersion",
      "settings",
    ]);
    assert.equal(data.refs[0].quote, h.r.quote);
  } finally {
    h.cleanup();
  }
});
test("stale asynchronous checks cannot overwrite a later editor transaction", async () => {
  const h = await setup();
  try {
    let resolve;
    h.p.app.vault.read = () => new Promise((r) => (resolve = r));
    const check = h.p.checkSource(h.source);
    h.edit(5, 5, "新");
    resolve("过期文本");
    await check;
    assert.equal(h.p.sourceStatus.get(h.r.id), "changed");
    assert.equal(h.p.sourceDrafts.get(h.r.id).text, h.state.doc.toString());
  } finally {
    h.cleanup();
  }
});
test("real CodeMirror state extension tracks source transactions independently of target decorations", async () => {
  const h = await setup();
  try {
    h.p.Obsidian.editorInfoField = StateField.define({
      create: () => ({ file: h.source }),
      update: (x) => x,
    });
    h.state = EditorState.create({
      doc: h.state.doc,
      extensions: [
        h.p.Obsidian.editorInfoField,
        h.p.Obsidian.editorLivePreviewField,
        ...h.p.extension,
      ],
    });
    h.state = h.state.update({ changes: { from: 5, insert: "新增" } }).state;
    assert.equal(h.p.sourceStatus.get(h.r.id), "changed");
    assert.equal(h.p.sourceTimers.size, 1);
  } finally {
    h.cleanup();
  }
});
test("native hotkeys expose exactly copy and send; repair is contextual", async () => {
  const h = harness(),
    commands = [];
  h.p.addCommand = (c) => commands.push(c.id);
  await h.p.onload();
  assert.deepEqual(commands, ["copy", "send"]);
});
test("a tracked occurrence does not switch to an unchanged duplicate elsewhere", async () => {
  const h = await setup();
  try {
    h.edit(h.state.doc.length, h.state.doc.length, "另一处：" + h.r.quote);
    await h.p.checkSource(h.source);
    h.edit(5, 6, "改");
    await h.p.checkSource(h.source);
    assert.equal(h.p.sourceStatus.get(h.r.id), "changed");
    assert.equal(h.p.sourceDrafts.get(h.r.id).start, 3);
    assert.ok(h.p.sourceDrafts.get(h.r.id).quote.includes("改"));
  } finally {
    h.cleanup();
  }
});
test("inserting adjacent text leaves the selected passage intact; deleting it requires re-selection", async () => {
  const h = await setup();
  try {
    h.edit(3, 3, "紧邻前言");
    await h.p.checkSource(h.source);
    assert.equal(h.p.sourceStatus.get(h.r.id), "found");
    const found = tracking.locate(h.p, h.state.doc.toString(), h.r);
    h.edit(found.end, found.end, "紧邻后记");
    await h.p.checkSource(h.source);
    assert.equal(h.p.sourceStatus.get(h.r.id), "found");
    const next = tracking.locate(h.p, h.state.doc.toString(), h.r);
    h.edit(next.start, next.end, "");
    await h.p.checkSource(h.source);
    assert.equal(h.p.sourceStatus.get(h.r.id), "missing");
    assert.equal(h.p.sourceDrafts.has(h.r.id), false);
    assert.ok(h.contents.get(h.target.path).includes(h.r.quote));
  } finally {
    h.cleanup();
  }
});
test("vault modify event debounces into a visible actionable notification", async () => {
  const h = await setup();
  try {
    h.contents.set(
      h.source.path,
      h.contents.get(h.source.path).replace("引用", "摘录"),
    );
    h.handlers["vault:modify"](h.source);
    h.handlers["vault:modify"](h.source);
    assert.equal(h.notices.length, 0);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    assert.equal(h.notices.length, 0);
    assert.equal(h.p.sourceStatus.get(h.r.id), "changed");
    await h.p.reviewSource(h.r);
    assert.equal(h.modals.length, 1);
  } finally {
    h.cleanup();
  }
});
test("removing the last target record also releases session source text and pending checks", async () => {
  const h = await setup();
  try {
    h.edit(5, 5, "新");
    assert.equal(h.p.sourceDrafts.size, 1);
    h.p.refs = [];
    await h.p.persist();
    for (const name of [
      "sourceVersions",
      "sourceDrafts",
      "sourceAnchors",
      "sourceStatus",
      "sourceTimers",
    ])
      assert.equal(h.p[name].size, 0);
  } finally {
    h.cleanup();
  }
});
