const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  core = require("../src/core"),
  tracking = require("../src/source-tracking");
const { harness } = require("./helpers.cjs");
const body = "第一行：记录目标。\n第二行：减少无谓切换。\n第三行：复盘行动。";
test("multi-line edits recover at file start, end, and whole-file boundaries", () => {
  for (const [left, right] of [
    ["", ""],
    ["前文定位：今天继续阅读。", ""],
    ["", "后文定位：整理下一步。"],
  ]) {
    const text = left + body + right,
      r = core.capture(text, left.length, left.length + body.length, "日志.md");
    const next = text.replace("无谓", "频繁").replace("行动", "计划");
    const found = core.recover(next, r);
    assert.equal(found.status, "changed");
    assert.equal(
      next.slice(found.start, found.end),
      body.replace("无谓", "频繁").replace("行动", "计划"),
    );
  }
});
test("independent changes do not highlight unchanged text and preserve grapheme clusters", () => {
  const parts = core.pieces("甲词之间保持一致乙词👨‍👩‍👧", "新词之间保持一致另词👨‍👩‍👧");
  assert.equal(parts.filter((x) => x.type === "insert").length, 2);
  assert.ok(
    parts.some((x) => x.type === "equal" && x.text.includes("之间保持一致")),
  );
  assert.ok(parts.some((x) => x.type === "equal" && x.text.includes("👨‍👩‍👧")));
});
test("line ending conversion retains exact raw offsets without a content-change warning", () => {
  const text = "前文定位：今天继续阅读。\n" + body + "\n后文定位：整理下一步。",
    start = text.indexOf("第一行"),
    r = core.capture(text, start, start + body.length, "日志.md");
  const next = text.replace(/\n/g, "\r\n");
  const found = core.recover(next, r);
  assert.equal(found.status, "found");
  assert.equal(next.slice(found.start, found.end), body.replace(/\n/g, "\r\n"));
});
test("restart tracking recovers multi-line candidate, and confirmation updates only target", async () => {
  const h = harness();
  await h.p.onload();
  const r = {
    ...core.capture(body, 0, body.length, h.source.path),
    name: "日志",
  };
  const token = h.p.token(r);
  const record = core.bind(r, h.target.path, token, token, 0);
  h.p.refs = [record];
  h.contents.set(h.target.path, token);
  const next = body.replace("无谓", "频繁").replace("行动", "计划");
  h.contents.set(h.source.path, next);
  await tracking.checkAll(h.p);
  assert.equal(h.p.sourceStatus.get(record.id), "changed");
  await h.p.reviewSource(record);
  assert.equal(h.modals[0].review.old, body);
  assert.equal(h.modals[0].review.next, next);
  await h.modals[0].action();
  assert.equal(record.quote, next);
  assert.equal(h.contents.get(h.source.path), next);
  assert.ok(h.contents.get(h.target.path).includes("频繁"));
  tracking.reset(h.p);
});
