"use strict";
function signature(r) {
  return JSON.stringify([
    r.token,
    r.quote,
    r.snapshot,
    r.source,
    r.target,
    r.prefix,
    r.suffix,
  ]);
}
async function apply(p, r, selected, mode, expected) {
  if (!p.refs.includes(r) || signature(r) !== signature(expected))
    throw Object.assign(new Error(p.t("changed")), { code: "target-changed" });
  const next = {
    ...r,
    quote: selected.quote,
    prefix: selected.prefix,
    suffix: selected.suffix,
    locator: selected.locator,
    snapshot: mode === "update" ? selected.quote : (r.snapshot ?? r.quote),
    repair: false,
    originalToken: undefined,
  };
  if (mode === "update") next.token = p.token(next);
  const operation = {
    id: r.id,
    target: r.target,
    before: { ...r },
    after: { ...next },
  };
  p.referenceEdits ??= [];
  p.referenceEdits.push(operation);
  try {
    const result =
      mode === "update" ? await p.change(r, () => next.token) : null;
    const actual = result?.text ?? "";

    if (
      !p.refs.includes(r) ||
      ![expected.token, next.token].includes(r.token) ||
      (mode === "update" && require("./core").binding(actual, next) < 0)
    )
      throw Object.assign(new Error(p.t("changed")), {
        code: "target-changed",
      });
    Object.assign(r, next);
    p.fullQuotes?.delete(r.id);
    p.sourceAnchors?.delete(r.id);
    p.sourceStatus?.delete(r.id);
    p.sourceDrafts?.delete(r.id);
    try {
      await p.save();
    } catch (error) {
      operation.pendingSave = true;
    }
  } catch (error) {
    p.referenceEdits = p.referenceEdits.filter((x) => x !== operation);
    throw error;
  }
  if (p.referenceEdits.length > 30) p.referenceEdits.shift();
  return operation;
}
async function revert(p, op) {
  const r = p.refs.find((x) => x.id === op.id);
  if (!r || signature(r) !== signature(op.after))
    throw Object.assign(new Error(p.t("changed")), { code: "target-changed" });
  const inverse = {
    id: r.id,
    target: r.target,
    before: { ...r },
    after: { ...op.before },
  };
  p.referenceEdits.push(inverse);
  try {
    if (r.token !== op.before.token) await p.change(r, () => op.before.token);
    if (!p.refs.includes(r))
      throw Object.assign(new Error(p.t("changed")), {
        code: "target-changed",
      });
    for (const key of Object.keys(r))
      if (!Object.hasOwn(op.before, key)) delete r[key];
    Object.assign(r, op.before);
    p.sourceAnchors?.delete(r.id);
    try {
      await p.save();
    } catch (error) {
      inverse.pendingSave = true;
    }
  } catch (e) {
    p.referenceEdits = p.referenceEdits.filter((x) => x !== inverse);
    throw e;
  }
  return inverse;
}
function handleTransaction(p, tr, path) {
  const handled = new Set();
  const before = tr.startState.doc.toString(),
    after = tr.state.doc.toString();
  for (const op of [...(p.referenceEdits || [])].reverse()) {
    if (
      op.target !== path ||
      handled.has(op.id) ||
      op.before.token === op.after.token
    )
      continue;
    const undo = tr.isUserEvent("undo");
    const from = undo ? op.after : op.before,
      to = undo ? op.before : op.after;
    const at = before.indexOf(from.token);
    if (at < 0 || before.indexOf(from.token, at + 1) >= 0) continue;
    const mapped = tr.changes.mapPos(at, -1);
    if (after.slice(mapped, mapped + to.token.length) !== to.token) continue;
    let touched = false;
    tr.changes.iterChangedRanges((a, b) => {
      if (
        (a < at + from.token.length && b > at) ||
        (a === b && a >= at && a <= at + from.token.length)
      )
        touched = true;
    });
    if (!touched) continue;
    const r = p.refs.find((x) => x.id === op.id);
    if (!r) continue;
    Object.assign(r, to);
    if (!to.repair) {
      delete r.repair;
      delete r.originalToken;
    }
    r.updatedAt = Date.now();
    handled.add(r.id);
  }
  return handled;
}
module.exports = { apply, revert, signature, handleTransaction };
