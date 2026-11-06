const { test } = require("node:test");
const assert = require("node:assert/strict");
const { EditorState } = require("@codemirror/state");
const core = require("../src/core");
const m = require("../src/maintenance");
const { harness } = require("./helpers.cjs");
async function setup() {
  const h = harness();
  await h.p.onload();
  h.p.schedulePersist = () => {};
  let saved;
  h.p.saveData = async (value) => {
    saved = JSON.parse(JSON.stringify(value));
  };
  const r = { ...core.capture("原句", 0, 2, h.source.path), name: "日志" };
  const token = h.p.token(r);
  h.p.refs = [core.bind(r, h.target.path, token, token, 0)];
  return {
    ...h,
    token,
    get saved() {
      return saved;
    },
  };
}
test("deleting a reference removes its persisted data, with no backup or tombstone", async () => {
  const h = await setup(),
    state = EditorState.create({ doc: h.token });
  m.transaction(
    h.p,
    state.update({ changes: { from: 0, to: h.token.length, insert: "" } }),
    h.target.path,
  );
  await h.p.persist();
  assert.equal(h.p.refs.length, 0);
  assert.equal(h.saved.refs.length, 0);
  assert.equal(h.p.removedRefs.size, 1);
  assert.equal(h.saved.maintenanceBackup, undefined);
  assert.equal(h.saved.tombstones, undefined);
  assert.ok(!JSON.stringify(h.saved).includes("原句"));
  assert.equal(h.writes.length, 0);
});
test("same-session undo and redo restore and remove metadata alongside text", async () => {
  const h = await setup();
  let state = EditorState.create({ doc: h.token });
  let tr = state.update({
    changes: { from: 0, to: h.token.length, insert: "" },
  });
  m.transaction(h.p, tr, h.target.path);
  state = tr.state;
  tr = state.update({
    changes: { from: 0, insert: h.token },
    userEvent: "undo",
  });
  m.transaction(h.p, tr, h.target.path);
  await h.p.persist();
  assert.equal(h.saved.refs.length, 1);
  state = tr.state;
  tr = state.update({
    changes: { from: 0, to: h.token.length, insert: "" },
    userEvent: "redo",
  });
  m.transaction(h.p, tr, h.target.path);
  await h.p.persist();
  assert.equal(h.saved.refs.length, 0);
});
test("fresh paste after removal has a single independent active record", async () => {
  const h = await setup(),
    state = EditorState.create({ doc: h.token });
  const old = h.p.refs[0].id;
  m.transaction(
    h.p,
    state.update({ changes: { from: 0, to: h.token.length, insert: "" } }),
    h.target.path,
  );
  const fresh = core.bind(
    { ...h.p.removedRefs.get(old) },
    h.target.path,
    h.token,
    h.token,
    0,
  );
  m.register(h.p, fresh, h.token);
  await h.p.persist();
  assert.equal(h.saved.refs.length, 1);
  assert.notEqual(h.saved.refs[0].id, old);
  assert.equal(core.activeBindings(h.p.refs, h.token, h.target.path).length, 1);
});
test("source edits and unrelated target edits preserve references", async () => {
  const h = await setup();
  const state = EditorState.create({ doc: h.token });
  m.transaction(
    h.p,
    state.update({ changes: { from: 0, to: h.token.length, insert: "" } }),
    h.source.path,
  );
  assert.equal(h.p.refs.length, 1);
  m.transaction(
    h.p,
    state.update({ changes: { from: 0, insert: "引言" } }),
    h.target.path,
  );
  await h.p.persist();
  assert.equal(h.saved.refs.length, 1);
  assert.equal(h.saved.refs[0].at, 2);
});
test("partial editing retains a repairable record and undo recovers preview", async () => {
  const h = await setup();
  let state = EditorState.create({ doc: h.token });
  const at = h.token.indexOf("原句");
  let tr = state.update({ changes: { from: at, to: at + 1, insert: "新" } });
  m.transaction(h.p, tr, h.target.path);
  assert.equal(h.p.refs.length, 1);
  assert.equal(h.p.refs[0].repair, true);
  state = tr.state;
  tr = state.update({
    changes: { from: at, to: at + 1, insert: "原" },
    userEvent: "undo",
  });
  m.transaction(h.p, tr, h.target.path);
  assert.equal(h.p.refs[0].repair, false);
});
test("no persistent cleanup API or settings remain", async () => {
  const h = await setup();
  assert.equal(h.p.cleanupReferences, undefined);
  assert.equal(h.p.checkReferences, undefined);
  assert.equal(h.p.restoreCleanup, undefined);
});
