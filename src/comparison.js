"use strict";
// Align source lines first, then highlight only the changed text in paired lines.
function rows(old, next) {
  const a = old.replace(/\r\n/g, "\n").split("\n");
  const b = next.replace(/\r\n/g, "\n").split("\n");
  const result = [],
    removed = [],
    added = [];
  const flush = () => {
    for (let n = 0; n < Math.max(removed.length, added.length); n++)
      result.push({ old: removed[n] ?? null, next: added[n] ?? null });
    removed.length = added.length = 0;
  };
  let dp;
  if (a.length * b.length <= 100000) {
    dp = Array.from(
      { length: a.length + 1 },
      () => new Uint32Array(b.length + 1),
    );
    for (let i = a.length - 1; i >= 0; i--)
      for (let j = b.length - 1; j >= 0; j--)
        dp[i][j] =
          a[i] === b[j]
            ? 1 + dp[i + 1][j + 1]
            : Math.max(dp[i + 1][j], dp[i][j + 1]);
  }
  let i = 0,
    j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) {
      flush();
      result.push({ old: a[i++], next: b[j++] });
    } else if (i === a.length) added.push(b[j++]);
    else if (j === b.length) removed.push(a[i++]);
    else if (dp ? dp[i + 1][j] >= dp[i][j + 1] : b.indexOf(a[i], j) < 0)
      removed.push(a[i++]);
    else added.push(b[j++]);
  }
  flush();
  return result;
}
function render(parent, old, next, zh, core) {
  const panel = parent.createEl("div", { cls: "tr-diff" });
  const header = panel.createEl("div", { cls: "tr-diff-header" });
  for (const text of zh ? ["现有摘录", "新原文"] : ["Snapshot", "New source"])
    header.createEl("div", { text });
  for (const pair of rows(old, next)) {
    const row = panel.createEl("div", { cls: "tr-diff-row" });
    const changes =
      pair.old !== null && pair.next !== null
        ? core.pieces(pair.old, pair.next)
        : null;
    for (const [side, skip, tag, label] of [
      ["old", "insert", "del", zh ? "现有摘录" : "Snapshot"],
      ["next", "delete", "ins", zh ? "新原文" : "New source"],
    ]) {
      const cell = row.createEl("div", { cls: "tr-comparison tr-diff-cell" });
      cell.setAttribute("data-label", label);
      const value = pair[side];
      if (value === null) {
        cell.classList.add("tr-diff-gap");
        cell.createEl("span", {
          text: zh
            ? side === "old"
              ? "新增段落"
              : "已删除"
            : side === "old"
              ? "Added paragraph"
              : "Removed",
          cls: "tr-muted",
        });
      } else if (!changes) {
        cell.classList.add(
          side === "old" ? "tr-diff-removed" : "tr-diff-added",
        );
        cell.appendText(value || "\u00a0");
      } else {
        for (const part of changes) {
          if (part.type === skip) continue;
          if (part.type === "equal") cell.appendText(part.text);
          else
            cell.createEl(tag, {
              text: part.text,
              cls:
                part.text.length > 24 || part.text.includes("\n")
                  ? "tr-long-change"
                  : "",
            });
        }
        if (!value) cell.appendText("\u00a0");
      }
    }
  }
  return panel;
}
module.exports = { rows, render };
