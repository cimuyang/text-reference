"use strict";
const { ChangeSet } = require("@codemirror/state");
const core = require("./core");

// Session-only anchors. A restart or an edit across the passage boundary requires
// an explicit selection, rather than guessing which new text the author intended.
function init(p) {
  p.sourceVersions = new Map();
  p.sourceEpochs = new Map();
  p.sourceReadRequests = new Map();
  p.sourceHashes = new Map();
  p.sourceDrafts = new Map();
  p.sourceAnchors = new Map();
  p.sourceStatus = new Map();
  p.sourceTimers = new Map();
  p.sourceNotices = new Map();
  p.sourceRequests = new Map();
}
function locate(p, text, r) {
  const anchor = p.sourceAnchors?.get(r.id);
  if (
    anchor &&
    anchor.baseQuote === r.quote &&
    anchor.source === r.source &&
    anchor.text === text
  )
    return { status: "found", start: anchor.start, end: anchor.end };
  return core.recover(text, r);
}
function anchor(p, text, r, range) {
  p.sourceAnchors.set(r.id, {
    source: r.source,
    baseQuote: r.quote,
    text,
    start: range.start,
    end: range.end,
  });
}

function read(p, file) {
  for (const view of p.editorViews || [])
    if (
      view.state.field(p.Obsidian.editorInfoField, false)?.file?.path ===
      file.path
    )
      return Promise.resolve(view.state.doc.toString());
  p.sourceReadRequests ??= new Map();
  if (p.sourceReadRequests.has(file.path))
    return p.sourceReadRequests.get(file.path);
  const promise = Promise.resolve(p.app.vault.read(file));
  p.sourceReadRequests.set(file.path, promise);
  const done = () => {
    if (p.sourceReadRequests.get(file.path) === promise)
      p.sourceReadRequests.delete(file.path);
  };
  promise.then(done, done);
  return promise;
}
function diff(before, after) {
  const changes = [];
  let at = 0,
    pending = null;
  const flush = () => {
    if (pending) {
      changes.push(pending);
      pending = null;
    }
  };
  for (const part of core.pieces(before, after)) {
    if (part.type === "equal") {
      flush();
      at += part.text.length;
    } else {
      pending ??= { from: at, to: at, insert: "" };
      if (part.type === "delete") {
        at += part.text.length;
        pending.to = at;
      } else pending.insert += part.text;
    }
  }
  flush();
  return ChangeSet.of(changes, before.length);
}
function observe(p, path, before, after, changes) {
  p.sourceRequests.delete(path);
  for (const r of p.refs.filter((x) => x.source === path)) {
    const found = locate(p, before, r);
    let range;
    if (found.status === "found") {
      let unsafe = false,
        startInsertion = false,
        endInsertion = false;
      changes.iterChangedRanges((from, to) => {
        if (
          from < found.end &&
          to > found.start &&
          (from < found.start || to > found.end)
        )
          unsafe = true;
        if (from === to && from === found.start) startInsertion = true;
        if (from === to && from === found.end) endInsertion = true;
      });
      if (!unsafe) {
        const start = changes.mapPos(found.start, startInsertion ? 1 : -1);
        const end = changes.mapPos(found.end, endInsertion ? -1 : 1);
        const quote = after.slice(start, end);
        if (quote.trim()) {
          range = {
            status: core.contentSame(quote, r.quote) ? "found" : "changed",
            start,
            end,
          };
          anchor(p, after, r, range);
          if (range.status === "changed")
            p.sourceDrafts.set(r.id, {
              source: path,
              text: after,
              start,
              end,
              quote,
              prefix: after.slice(Math.max(0, start - 64), start),
              suffix: after.slice(end, end + 64),
            });
        } else range = { status: "missing" };
      }
    }
    range ??= core.recover(after, r);
    if (range.status === "changed") remember(p, after, r, range);
    if (range.status !== "changed") {
      p.sourceDrafts.delete(r.id);
      if (range.status === "found") anchor(p, after, r, range);
      else p.sourceAnchors.delete(r.id);
    }
    p.sourceStatus.set(r.id, range.status);
  }
  p.sourceVersions.set(path, after);
}
function schedule(p, path) {
  clearTimeout(p.sourceTimers.get(path));
  p.sourceTimers.set(
    path,
    setTimeout(() => {
      p.sourceTimers.delete(path);
      const file = p.app.vault.getAbstractFileByPath(path);
      if (file) p.run(() => check(p, file));
    }, 900),
  );
}
function transaction(p, tr, path) {
  if (!p.settings.notifySourceChanges || !p.refs.some((r) => r.source === path))
    return;
  observe(
    p,
    path,
    tr.startState.doc.toString(),
    tr.state.doc.toString(),
    tr.changes,
  );
  schedule(p, path);
}
async function check(p, file, notify = true) {
  if (
    p.trackingStopped ||
    !p.settings.notifySourceChanges ||
    !p.refs.some((r) => r.source === file.path)
  )
    return;
  const generation = p.trackingGeneration;
  const request = {};
  p.sourceRequests.set(file.path, request);
  const text = await read(p, file);
  const hash = await fingerprint(text);
  if (
    !p.settings.notifySourceChanges ||
    generation !== p.trackingGeneration ||
    p.sourceRequests.get(file.path) !== request
  )
    return;
  const previous = p.sourceVersions.get(file.path);
  if (previous !== undefined && previous !== text) {
    observe(p, file.path, previous, text, diff(previous, text));
    p.sourceRequests.set(file.path, request);
  } else {
    for (const r of p.refs.filter((x) => x.source === file.path)) {
      const draft = p.sourceDrafts.get(r.id);
      const valid =
        draft?.text === text &&
        draft.source === r.source &&
        !core.contentSame(draft.quote, r.quote);
      const found = await resolve(p, text, r, hash);
      if (
        generation !== p.trackingGeneration ||
        p.sourceRequests.get(file.path) !== request
      )
        return;
      p.sourceStatus.set(r.id, valid ? "changed" : found.status);
      if (!valid && found.status === "changed") remember(p, text, r, found);
      else if (!valid) {
        p.sourceDrafts.delete(r.id);
        if (found.status === "found") anchor(p, text, r, found);
        else p.sourceAnchors.delete(r.id);
      }
    }
    p.sourceVersions.set(file.path, text);
  }
  if (
    generation !== p.trackingGeneration ||
    p.sourceRequests.get(file.path) !== request
  )
    return;
  let dirty = false;
  for (const r of p.refs.filter((r) => r.source === file.path)) {
    const range = p.sourceAnchors.get(r.id);
    if (range?.text === text) {
      const locator = {
        source: r.source,
        hash,
        start: range.start,
        end: range.end,
      };
      if (JSON.stringify(r.locator) !== JSON.stringify(locator)) {
        r.locator = locator;
        dirty = true;
      }
    }
  }
  if (dirty) p.schedulePersist();
  // Read/refresh once per changed source; never save notes or plugin data here.
  p.refreshDisplays();
  const pending = p.refs.filter(
    (r) => r.source === file.path && p.sourceStatus.get(r.id) !== "found",
  );
  const key = JSON.stringify(
    pending.map((r) => [r.id, p.sourceStatus.get(r.id)]),
  );
  if (!pending.length) p.sourceNotices.delete(file.path);
  else if (notify && p.sourceNotices.get(file.path) !== key) {
    p.sourceNotices.set(file.path, key);
    // Background feedback stays beside the reference.
  }
}
async function checkAll(p, notify = false) {
  if (p.trackingStopped || !p.settings.notifySourceChanges) return;
  for (const path of new Set(p.refs.map((r) => r.source))) {
    const file = p.app.vault.getAbstractFileByPath(path);
    if (file) await check(p, file, notify);
    else
      for (const r of p.refs.filter((x) => x.source === path))
        p.sourceStatus.set(r.id, "missing");
  }
  p.refreshDisplays();
}
function reset(p) {
  p.trackingGeneration = (p.trackingGeneration || 0) + 1;
  for (const timer of p.sourceTimers.values()) clearTimeout(timer);
  for (const key of [
    "sourceEpochs",
    "sourceReadRequests",
    "sourceHashes",
    "sourceTimers",
    "sourceVersions",
    "sourceDrafts",
    "sourceAnchors",
    "sourceStatus",
    "sourceNotices",
    "sourceRequests",
  ])
    p[key].clear();
}
function prune(p) {
  const ids = new Set(p.refs.map((r) => r.id));
  const paths = new Set(p.refs.map((r) => r.source));
  for (const map of [p.sourceAnchors, p.sourceDrafts, p.sourceStatus])
    for (const id of map.keys()) if (!ids.has(id)) map.delete(id);
  for (const map of [
    p.sourceEpochs,
    p.sourceReadRequests,
    p.sourceHashes,
    p.sourceVersions,
    p.sourceRequests,
    p.sourceNotices,
    p.sourceTimers,
  ])
    for (const path of map.keys())
      if (!paths.has(path)) {
        if (map === p.sourceTimers) clearTimeout(map.get(path));
        map.delete(path);
      }
}
module.exports = {
  init,
  locate,
  read,
  observe,
  transaction,
  schedule,
  check,
  checkAll,
  reset,
  prune,
};

function remember(p, text, r, range) {
  anchor(p, text, r, range);
  p.sourceDrafts.set(r.id, {
    source: r.source,
    text,
    start: range.start,
    end: range.end,
    quote: text.slice(range.start, range.end),
    prefix: text.slice(Math.max(0, range.start - 64), range.start),
    suffix: text.slice(range.end, range.end + 64),
  });
}

async function fingerprint(text) {
  const bytes = await globalThis.crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text),
  );
  return Array.from(new Uint8Array(bytes), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}
async function resolve(p, text, r, hash) {
  const anchored = p.sourceAnchors?.get(r.id);
  if (
    anchored &&
    anchored.source === r.source &&
    anchored.baseQuote === r.quote &&
    anchored.text === text
  )
    return {
      status: core.contentSame(
        text.slice(anchored.start, anchored.end),
        r.quote,
      )
        ? "found"
        : "changed",
      start: anchored.start,
      end: anchored.end,
    };
  p.sourceHashes ??= new Map();
  const cached = p.sourceHashes.get(r.source);
  const getHash = () => {
    if (cached?.text === text) return cached.promise;
    const promise = fingerprint(text);
    p.sourceHashes.set(r.source, { text, promise });
    return promise;
  };
  const saved = r.locator;
  if (
    saved &&
    saved.source === r.source &&
    Number.isInteger(saved.start) &&
    Number.isInteger(saved.end) &&
    saved.start >= 0 &&
    saved.end <= text.length &&
    saved.end > saved.start &&
    saved.hash === (hash ?? (await getHash()))
  ) {
    return {
      status: core.contentSame(text.slice(saved.start, saved.end), r.quote)
        ? "found"
        : "changed",
      start: saved.start,
      end: saved.end,
    };
  }
  const found = locate(p, text, r);
  return found.start !== undefined &&
    core.contentSame(text.slice(found.start, found.end), r.quote)
    ? { ...found, status: "found" }
    : found;
}
module.exports.resolve = resolve;

function invalidate(p, path) {
  if (
    p.refs &&
    !p.refs.some((r) => r.source === path) &&
    !p.sourceReadRequests?.has(path) &&
    !p.sourceHashes?.has(path) &&
    !p.sourceEpochs?.has(path)
  )
    return;
  p.sourceReadRequests?.delete(path);
  p.sourceHashes?.delete(path);
  p.sourceRequests?.delete(path);
  p.sourceEpochs ??= new Map();
  p.sourceEpochs.set(path, (p.sourceEpochs.get(path) || 0) + 1);
}
module.exports.invalidate = invalidate;
