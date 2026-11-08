"use strict";
const core = require("./core");

function canonicalToken(r) {
  const label = (r.snapshot ?? r.quote).replace(/\s+/g, " ").trim();
  return core.inlineLink(r.source, label, r.name);
}

function pack(settings, refs) {
  const anchors = [];
  const index = new Map();
  const bindings = refs.map((r) => {
    const { source, name, quote, prefix, suffix, locator } = r;
    const anchor = { source, name, quote, prefix, suffix, locator };
    const key = JSON.stringify(anchor);
    if (!index.has(key)) {
      index.set(key, anchors.length);
      anchors.push(anchor);
    }
    const { id, target, at, before, after, repair, originalToken, renameToken, status } = r;
    return {
      id, target, anchor: index.get(key), at,
      before: before || undefined, after: after || undefined,
      token: r.token === canonicalToken(r) ? undefined : r.token,
      snapshot: r.snapshot === quote ? undefined : r.snapshot,
      repair: repair || undefined, originalToken, renameToken, status,
    };
  });
  return { schemaVersion: 4, settings, anchors, refs: bindings };
}

function unpack(data) {
  if (!Array.isArray(data?.refs)) return [];
  const valid = (r) => r && [
    "id", "target", "source", "name", "quote", "prefix", "suffix",
  ].every((k) => typeof r[k] === "string");
  if (data.schemaVersion !== 4)
    return data.refs.filter((r) => valid(r) && typeof r.token === "string" && r.token);
  const refs = [];
  for (const binding of data.refs) {
    if (!binding || !Number.isInteger(binding.anchor) || binding.anchor < 0) continue;
    const anchor = data.anchors?.[binding.anchor];
    if (!anchor) continue;
    const { anchor: _, ...target } = binding;
    const r = { v: 1, before: "", after: "", ...anchor, ...target };
    if (!valid(r)) continue;
    r.token ??= canonicalToken(r);
    if (typeof r.token === "string" && r.token) refs.push(r);
  }
  return refs;
}

module.exports = { pack, unpack };
