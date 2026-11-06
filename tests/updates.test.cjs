const { test } = require("node:test");
const assert = require("node:assert/strict");
const { EditorState } = require("@codemirror/state");
const core = require("../src/core"),
  maintenance = require("../src/maintenance"),
  updates = require("../src/updates");
const { harness } = require("./helpers.cjs");
async function setup() {
  const h = harness();
  await h.p.onload();
  const r = {
    ...core.capture("旧原句", 0, 3, h.source.path),
    name: "日志",
    repair: true,
    originalToken: "old",
  };
  const token = h.p.token(r);
  h.p.refs = [core.bind(r, h.target.path, token, token, 0)];
  h.contents.set(h.target.path, token);
  h.p.app.vault.process = async (file, fn) => {
    const before = h.contents.get(file.path),
      after = fn(before),
      state = EditorState.create({ doc: before });
    maintenance.transaction(
      h.p,
      state.update({ changes: { from: 0, to: before.length, insert: after } }),
      file.path,
    );
    h.contents.set(file.path, after);
  };
  return {
    ...h,
    r: h.p.refs[0],
    selected: core.capture("新原句", 0, 3, h.source.path),
  };
}
test("managed update survives synchronous editor notification and clears repair state; explicit undo restores", async () => {
  const h = await setup();
  const original = h.contents.get(h.target.path),
    source = h.contents.get(h.source.path);
  h.p.fullQuotes.add(h.r.id);
  const op = await updates.apply(h.p, h.r, h.selected, "update", { ...h.r });
  assert.equal(h.p.fullQuotes.has(h.r.id), false);
  assert.equal(h.p.refs.length, 1);
  assert.equal(h.r.repair, false);
  assert.ok(h.contents.get(h.target.path).includes("新原句"));
  assert.equal(
    core.activeBindings(h.p.refs, h.contents.get(h.target.path), h.target.path)
      .length,
    1,
  );
  await updates.revert(h.p, op);
  assert.equal(h.contents.get(h.target.path), original);
  assert.equal(h.contents.get(h.source.path), source);
  clearTimeout(h.p.persistTimer);
});
test("update rejects changed confirmation and preserves user edits", async () => {
  const h = await setup(),
    expected = { ...h.r };
  h.r.token = "用户改写";
  await assert.rejects(() =>
    updates.apply(h.p, h.r, h.selected, "update", expected),
  );
  assert.equal(h.r.token, "用户改写");
});
test("source check records status without changing any note or writing data", async () => {
  const h = await setup();
  let writes = 0;
  h.p.saveData = async () => writes++;
  const before = [...h.contents];
  await h.p.checkSource(h.source);
  assert.equal(h.p.sourceStatus.get(h.r.id), "missing");
  assert.equal(writes, 0);
  assert.deepEqual([...h.contents], before);
  h.p.settings.notifySourceChanges = false;
  h.p.sourceStatus.clear();
  await h.p.checkSource(h.source);
  assert.equal(h.p.sourceStatus.size, 0);
});
test("copy command has native customizable default shortcut", async () => {
  const h = harness(),
    commands = [];
  h.p.addCommand = (c) => commands.push(c);
  await h.p.onload();
  const copy = commands.find((c) => c.id === "copy");
  assert.equal(
    JSON.stringify(copy.hotkeys),
    JSON.stringify([{ modifiers: ["Mod", "Shift"], key: "C" }]),
  );
  h.p.app.hotkeyManager = {
    getHotkeys: () => [{ modifiers: ["Alt"], key: "R" }],
  };
  assert.equal(h.p.hotkeyLabel(), "Alt+R");
});

test("editor undo of a managed update schedules metadata persistence", async () => {
  const h = await setup();
  const before = h.r.token;
  await updates.apply(h.p, h.r, h.selected, "update", { ...h.r });
  let scheduled = 0;
  h.p.schedulePersist = () => scheduled++;
  const state = EditorState.create({ doc: h.r.token });
  maintenance.transaction(
    h.p,
    state.update({
      changes: { from: 0, to: h.r.token.length, insert: before },
      userEvent: "undo",
    }),
    h.target.path,
  );
  assert.equal(h.r.token, before);
  assert.equal(scheduled, 1);
  clearTimeout(h.p.persistTimer);
});
