"use strict";
const core = require("./core");
function retire(p, r) {
  p.removedRefs ??= new Map();
  p.removedRefs.set(r.id, { ...r });
  p.refs = p.refs.filter((x) => x.id !== r.id);
}
function transaction(p, tr, path) {
  const managed = require("./updates").handleTransaction(p, tr, path);
  const before = tr.startState.doc.toString(),
    after = tr.state.doc.toString();
  let changed = managed.size > 0;
  for (const r of [...p.refs].filter((r) => r.target === path)) {
    if (managed.has(r.id)) continue;
    const at = core.binding(before, r);
    if (at < 0) continue;
    const renamedAt = tr.changes.mapPos(at, -1);
    if (
      r.renameToken &&
      after.slice(renamedAt, renamedAt + r.renameToken.length) === r.renameToken
    ) {
      r.token = r.renameToken;
      delete r.renameToken;
      delete r.originalToken;
      delete r.repair;
      r.at = renamedAt;
      r.before = after.slice(Math.max(0, renamedAt - 48), renamedAt);
      r.after = after.slice(
        renamedAt + r.token.length,
        renamedAt + r.token.length + 48,
      );
      changed = true;
      continue;
    }
    const start = tr.changes.mapPos(at, 1),
      end = tr.changes.mapPos(at + r.token.length, -1);
    let fullyRemoved = false;
    tr.changes.iterChangedRanges((from, to) => {
      if (from <= at && to >= at + r.token.length) fullyRemoved = true;
    });
    if (fullyRemoved && after.slice(start, end) !== r.token) {
      retire(p, r);
      changed = true;
      continue;
    }
    const token = after.slice(start, end);
    if (token !== r.token) {
      r.originalToken ??= r.token;
      r.token = token;
      r.repair = token !== r.originalToken;
      if (!token) {
        retire(p, r);
        changed = true;
        continue;
      }
    }
    const prefix = after.slice(Math.max(0, start - 48), start),
      suffix = after.slice(end, end + 48);
    if (
      r.at !== start ||
      r.before !== prefix ||
      r.after !== suffix ||
      r.originalToken
    ) {
      Object.assign(r, {
        at: start,
        before: prefix,
        after: suffix,
        updatedAt: Date.now(),
      });
      changed = true;
    }
  }
  if (tr.isUserEvent("undo") || tr.isUserEvent("redo")) {
    const archived = [...(p.removedRefs?.values() || [])]
      .filter((r) => r.target === path)
      .reverse();
    for (const r of archived) {
      const at = core.binding(after, r);
      if (
        at < 0 ||
        p.refs.some((x) => x.target === path && core.binding(after, x) === at)
      )
        continue;
      // Restore only when this transaction actually reinserted the archived link.
      let inserted = false;
      tr.changes.iterChangedRanges((a, b, from, to) => {
        if (from <= at && to >= at + r.token.length) inserted = true;
      });
      if (!inserted) continue;
      p.refs.push({ ...r, updatedAt: Date.now() });
      p.removedRefs.delete(r.id);
      changed = true;
    }
  }
  if (changed) p.schedulePersist();
}
function register(p, r, text) {
  for (const old of [...p.refs])
    if (old.target === r.target && core.binding(text, old) === r.at)
      retire(p, old);
  r.updatedAt = Date.now();
  p.refs.push(r);
}
module.exports = { transaction, register };
