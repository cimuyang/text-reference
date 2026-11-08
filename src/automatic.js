"use strict";
const core = require("./core");
const tracking = require("./source-tracking");

function bindings(p, text, path, includeRepair = false) {
  if (!path) return [];
  const refs = p.refs.filter((r) => r.target === path);
  for (const r of refs) core.reconcile(text, r);
  const saved = core.managedBindings(refs, text, path);
  const positions = new Map(saved.map(({ r, at }) => [at, r]));
  let entry = p.automaticNotes.get(path);
  if (entry?.text !== text) {
    clearTimeout(entry?.timer);
    entry = { text, links: core.referenceLinks(text), sources: new Set() };
    p.automaticNotes.set(path, entry);
    if (p.automaticNotes.size > 32) {
      const first = p.automaticNotes.keys().next().value;
      clearTimeout(p.automaticNotes.get(first).timer);
      p.automaticNotes.delete(first);
    }
  }
  const destinations = new Map();
  const inferred = [];
  for (const link of entry.links) {
    const prior = positions.get(link.at);
    if (prior && !prior.repair) continue;
    if (!destinations.has(link.path))
      destinations.set(
        link.path,
        p.app.metadataCache.getFirstLinkpathDest(link.path, path),
      );
    const file = destinations.get(link.path);
    if (file && !/\.md$/i.test(file.path)) continue;
    const name =
      file?.basename ?? link.path.split("/").at(-1).replace(/\.md$/i, "");
    const suffix = [`（${name}）`, `(${name})`].find((ending) =>
      link.label.endsWith(ending),
    );
    const quote = suffix && link.label.slice(0, -suffix.length).trim();
    if (!quote) continue;
    positions.delete(link.at);
    inferred.push({
      at: link.at,
      r: {
        id: JSON.stringify([path, link.at, link.token]),
        automatic: true,
        at: link.at,
        target: path,
        source: file?.path ?? link.path,
        linkPath: link.path,
        token: link.token,
        quote,
        name,
        reviewId: prior && prior.source === file?.path ? prior.id : undefined,
      },
      file: prior ? undefined : file,
    });
  }
  queue(p, path, entry, inferred);
  return [
    ...saved.filter(
      ({ r, at }) => !r.repair || (includeRepair && positions.has(at)),
    ),
    ...inferred,
  ];
}

function queue(p, path, entry, inferred) {
  entry.sources = new Set(inferred.map(({ r }) => r.source));
  const links = p.settings.notifySourceChanges ? inferred.filter(({ file }) => file) : [];
  const attempt = JSON.stringify(links.map(({ at, file }) => [at, file.path]));
  if (entry.attempt === attempt) return;
  clearTimeout(entry.timer);
  entry.attempt = attempt;
  const check = {};
  entry.check = check;
  if (!links.length || p.trackingStopped) return;
  entry.timer = setTimeout(
    () => p.run(() => verify(p, path, entry, check, links)),
    250,
  );
}

async function verify(p, path, entry, check, links) {
  const isCurrent = () =>
    !p.trackingStopped &&
    p.settings.notifySourceChanges &&
    p.automaticNotes.get(path) === entry &&
    entry.check === check;
  if (!isCurrent()) return;
  const file = p.app.vault.getAbstractFileByPath(path);
  if (!file) return;
  const sources = new Map();
  const verified = [];
  for (const { r, at, file: source } of links) {
    if (!isCurrent()) return;
    if (!sources.has(source.path)) {
      const text = await tracking.read(p, source).catch(() => null);
      sources.set(source.path, { text });
    }
    const item = sources.get(source.path);
    if (typeof item.text !== "string") continue;
    const found = await tracking.resolve(p, item.text, r, item.hash);
    if (found.start === undefined) continue;
    item.hash ??= await tracking.fingerprint(item.text);
    verified.push(recordAt(r, item.text, found, item.hash, entry.text, at));
  }
  if (!verified.length || !isCurrent()) return;
  const text = await tracking.read(p, file).catch(() => null);
  if (text !== entry.text || !isCurrent()) return;
  const occupied = new Set();
  const uncertain = new Set();
  for (const r of p.refs.filter((r) => r.target === path)) {
    const at = core.binding(text, r);
    if (at < 0) uncertain.add(r.token);
    else occupied.add(at);
  }
  const added = verified.filter(
    (r) =>
      !occupied.has(r.at) &&
      !uncertain.has(r.token) &&
      core.binding(text, r) === r.at,
  );
  if (!added.length) return;
  p.refs.push(...added);
  p.schedulePersist();
  if (p.settings.notifySourceChanges)
    for (const source of new Set(added.map((r) => r.source)))
      tracking.schedule(p, source);
  await p.rebindReading();
  p.refreshDisplays();
}

function recordAt(r, source, { start, end, basis }, hash, target, at) {
  const captured = basis ?? core.capture(source, start, end, r.source);
  const { v, quote, prefix, suffix } = captured;
  return core.bind({
    v, quote, prefix, suffix,
    source: r.source,
    name: r.name,
    snapshot: r.quote,
    locator: { source: r.source, hash, start, end },
  }, r.target, r.token, target, at);
}

async function promote(p, r, source, found) {
  const file = p.app.vault.getAbstractFileByPath(r.target);
  if (!file || found.start === undefined) return null;
  const hash = await tracking.fingerprint(source);
  const text = await tracking.read(p, file);
  if (text.slice(r.at, r.at + r.token.length) !== r.token) return null;
  for (const saved of p.refs.filter((x) => x.target === r.target)) {
    const at = core.binding(text, saved);
    if (at === r.at) return saved.source === r.source ? saved : null;
    if (at < 0 && saved.token === r.token) return null;
  }
  const record = recordAt(r, source, found, hash, text, r.at);
  if (core.binding(text, record) !== r.at) return null;
  p.refs.push(record);
  p.schedulePersist();
  if (p.settings.notifySourceChanges) tracking.schedule(p, r.source);
  await p.rebindReading();
  p.refreshDisplays();
  return record;
}

function invalidate(p, path) {
  const filename = path.split("/").at(-1);
  const basename = filename.replace(/\.md$/i, "");
  let changed = false;
  for (const entry of p.automaticNotes.values()) {
    if (
      !entry.sources.has(path) &&
      !entry.sources.has(filename) &&
      !entry.sources.has(basename)
    )
      continue;
    clearTimeout(entry.timer);
    entry.attempt = null;
    entry.check = null;
    changed = true;
  }
  return changed;
}

module.exports = { bindings, invalidate, promote };
