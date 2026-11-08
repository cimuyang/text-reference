"use strict";
const markdown = require("markdown-it")({ html: false });
function readable(text) {
  const out = [];
  function visit(tokens) {
    for (const token of tokens) {
      if (token.type === "inline") visit(token.children || []);
      else if (
        token.type === "text" ||
        token.type === "code_inline" ||
        token.type === "fence" ||
        token.type === "code_block"
      )
        out.push(token.content);
      else if (token.type === "image") out.push(token.content);
      else if (
        token.type === "softbreak" ||
        token.type === "hardbreak" ||
        (token.type.endsWith("_close") && token.block)
      )
        out.push(" ");
    }
  }
  visit(markdown.parse(text, {}));
  return out.join("").replace(/\s+/g, " ").trim();
}
const MARKER = /<span data-text-reference="([^"]+)"><\/span>/g;
function encode(record) {
  return encodeURIComponent(JSON.stringify(record)).replace(/'/g, "%27");
}
function decode(value) {
  try {
    const r = JSON.parse(decodeURIComponent(value));
    if (
      r.v !== 1 ||
      typeof r.id !== "string" ||
      typeof r.source !== "string" ||
      typeof r.quote !== "string" ||
      !r.quote ||
      typeof r.prefix !== "string" ||
      typeof r.suffix !== "string"
    )
      return null;
    return r;
  } catch {
    return null;
  }
}
function capture(text, start, end, source, settings = {}) {
  if (start < 0 || end > text.length || end <= start)
    throw new Error("请选择需要引用的文字");
  return {
    v: 1,
    id: globalThis.crypto.randomUUID(),
    source,
    quote: text.slice(start, end),
    prefix: text.slice(Math.max(0, start - 64), start),
    suffix: text.slice(end, end + 64),
    layout: settings.layout === "split" ? "split" : "inline",
    limit: limit(settings.limit),
    created: Date.now(),
  };
}
function limit(n) {
  return Number.isFinite(Number(n))
    ? Math.max(0, Math.min(10000, Math.floor(Number(n))))
    : 30;
}
function preview(text, n) {
  const chars =
    typeof Intl.Segmenter === "function"
      ? Array.from(
          new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(
            text,
          ),
          (s) => s.segment,
        )
      : Array.from(text);
  return n && chars.length > n ? chars.slice(0, n).join("") + "…" : text;
}
function locate(text, r) {
  const hits = [];
  let at = 0;
  while ((at = text.indexOf(r.quote, at)) !== -1) {
    hits.push(at);
    at += Math.max(1, r.quote.length);
  }
  if (!hits.length) return { status: "missing" };
  if (hits.length === 1)
    return { status: "found", start: hits[0], end: hits[0] + r.quote.length };
  const contextual = hits.filter(
    (i) =>
      (!r.prefix ||
        text.slice(Math.max(0, i - r.prefix.length), i) === r.prefix) &&
      (!r.suffix ||
        text.slice(i + r.quote.length, i + r.quote.length + r.suffix.length) ===
          r.suffix),
  );
  if (contextual.length === 1)
    return {
      status: "found",
      start: contextual[0],
      end: contextual[0] + r.quote.length,
    };
  return { status: "ambiguous" };
}
function render(r, link) {
  return (
    "> [!text-reference] 引用\n" +
    (r.snapshot ?? r.quote)
      .split("\n")
      .map((line) => "> " + line)
      .join("\n") +
    "\n>\n> — " +
    link +
    '\n> <span data-text-reference="' +
    encode(r) +
    '"></span>\n'
  );
}
function records(text) {
  const found = [];
  const re = new RegExp(MARKER.source, "g");
  let m;
  while ((m = re.exec(text))) {
    const r = decode(m[1]);
    if (!r) continue;
    let start = text.lastIndexOf("\n", m.index) + 1;
    while (start > 0) {
      const prevEnd = start - 1;
      const prevStart = text.lastIndexOf("\n", prevEnd - 1) + 1;
      if (!/^>/.test(text.slice(prevStart, prevEnd).replace(/\r$/, ""))) break;
      start = prevStart;
    }
    let end = text.indexOf("\n", m.index);
    if (end < 0) end = text.length;
    else end++;
    const block = text.slice(start, end);
    if (!/^> \[!text-reference\] 引用\r?\n/.test(block)) continue;
    const lines = block.replace(/\r\n/g, "\n").trimEnd().split("\n");
    if (
      lines.length < 5 ||
      !lines.at(-2).startsWith("> — ") ||
      lines.at(-3) !== ">"
    )
      continue;
    const link = lines.at(-2).slice(4);
    const body = lines
      .slice(1, -3)
      .map((l) => l.replace(/^> ?/, ""))
      .join("\n");
    found.push({ r, start, end, block, link, body, encoded: m[1] });
  }
  return found;
}
function replaceRecord(text, id, transform) {
  const matches = records(text).filter((x) => x.r.id === id);
  if (matches.length !== 1)
    throw new Error("引用已被修改或复制，请重新打开后操作");
  const item = matches[0];
  return text.slice(0, item.start) + transform(item) + text.slice(item.end);
}
module.exports = {
  encode,
  decode,
  capture,
  limit,
  preview,
  locate,
  render,
  records,
  replaceRecord,
};
function inlineLink(path, text, name) {
  const label = text.replace(/\r?\n/g, " ") + "（" + name + "）";
  if (!/[\[\]|\\*_`<>]/.test(label) && !/[\[\]|#^]/.test(path))
    return "[[" + path + "|" + label + "]]";
  const escaped = label.replace(/[\\\[\]*_`<>]/g, (c) => "\\" + c);
  const url = path
    .split("/")
    .map((part) =>
      encodeURIComponent(part).replace(
        /[()]/g,
        (c) => "%" + c.charCodeAt(0).toString(16),
      ),
    )
    .join("/");
  return "[" + escaped + "](" + url + ")";
}
function bind(r, target, token, text, at) {
  return {
    ...r,
    id: globalThis.crypto.randomUUID(),
    target,
    token,
    at,
    before: text.slice(Math.max(0, at - 48), at),
    after: text.slice(at + token.length, at + token.length + 48),
  };
}
function binding(text, r) {
  const hits = [];
  let at = 0;
  while ((at = text.indexOf(r.token, at)) >= 0) {
    hits.push(at);
    at += r.token.length || 1;
  }
  if (hits.length === 1) return hits[0];
  const scored = hits
    .map((at) => ({
      at,
      score:
        (r.before &&
        text.slice(Math.max(0, at - r.before.length), at) === r.before
          ? 1
          : 0) +
        (r.after &&
        text.slice(
          at + r.token.length,
          at + r.token.length + r.after.length,
        ) === r.after
          ? 1
          : 0),
    }))
    .sort((a, b) => b.score - a.score);
  return scored[0]?.score > 0 && scored[0].score > (scored[1]?.score || 0)
    ? scored[0].at
    : -1;
}
Object.assign(module.exports, { inlineLink, bind, binding });
function activeBindings(refs, text, path) {
  const items = refs
    .filter((r) => r.target === path && !r.repair && r.status !== "unused")
    .map((r) => {
      reconcile(text, r);
      return { r, at: binding(text, r) };
    })
    .filter((x) => x.at >= 0);
  return items.filter((x) => items.filter((y) => y.at === x.at).length === 1);
}
Object.assign(module.exports, { activeBindings });
Object.assign(module.exports, { readable });
function visibleToken(token) {
  if (token.startsWith("[[") && token.endsWith("]]")) {
    const pipe = token.indexOf("|");
    return pipe >= 0 ? token.slice(pipe + 1, -2) : token.slice(2, -2);
  }
  return readable(token);
}
Object.assign(module.exports, { visibleToken });

function referenceLinks(text) {
  if (!/[)）]\s*(?:\]\]|\]\()/.test(text)) return [];
  const starts = [0, ...Array.from(text.matchAll(/\n/g), (m) => m.index + 1)];
  const ignored = markdown.parse(text, {})
    .filter((block) => block.type === "fence" || block.type === "code_block")
    .map(({ map: [start, end] }) => [starts[start], starts[end] ?? text.length]);
  const frontmatter = /^(?:\uFEFF)?---[ \t]*\r?\n[\s\S]*?^---[ \t]*(?:\r?\n|$)/m.exec(text);
  if (frontmatter?.index === 0) ignored.unshift([0, frontmatter[0].length]);
  // Preserve offsets while hiding blocks that cannot contain live links.
  const parts = [];
  let from = 0;
  for (const [start, end] of ignored) {
    if (end <= from) continue;
    parts.push(text.slice(from, start), text.slice(Math.max(from, start), end).replace(/[^\r\n]/g, " "));
    from = end;
  }
  parts.push(text.slice(from));
  const pattern =
    /<!--[^]*?(?:-->|$)|%%[^]*?(?:%%|$)|(`+)(?:(?!\n[ \t\r]*\n)[^])*?\1(?!`)|\\[^\r\n]|!?(?:\[\[([^\[\]|\r\n]+)\|([^\[\]\r\n]+)\]\]|\[((?:\\.|[^\[\]\\\r\n])+)\]\(([^()\s]+)\))/g;
  const links = [];
  for (const match of parts.join("").matchAll(pattern)) {
    const [token, , wikiPath, wikiLabel, , markdownPath] = match;
    if ((!wikiPath && !markdownPath) || token.startsWith("!")) continue;
    let path = (wikiPath ?? markdownPath).trim();
    try {
      if (markdownPath) path = decodeURIComponent(path);
    } catch {
      continue;
    }
    if (!path || /[#^]/.test(path) || /^(?:[\w+.-]+:|\/\/)/.test(path)) continue;
    const label = (wikiLabel ?? visibleToken(token)).trimEnd();
    if (label.endsWith("）") || label.endsWith(")"))
      links.push({ at: match.index, token, path, label });
  }
  return links;
}
module.exports.referenceLinks = referenceLinks;

function recover(text, r) {
  const exact = locate(text, r);
  if (exact.status === "found") {
    const left =
      r.prefix &&
      text.slice(Math.max(0, exact.start - r.prefix.length), exact.start) ===
        r.prefix;
    const right =
      r.suffix &&
      text.slice(exact.end, exact.end + r.suffix.length) === r.suffix;
    if ((!r.prefix || left) && (!r.suffix || right)) return exact;
  }
  if (r.prefix && r.suffix)
    for (const n of [24, 48, 64]) {
      const l = r.prefix.slice(-n),
        rr = r.suffix.slice(0, n);
      if (l.trim().length < 4 || rr.trim().length < 4) continue;
      const a = text.indexOf(l),
        b = text.indexOf(rr);
      if (
        a < 0 ||
        b < 0 ||
        text.indexOf(l, a + 1) >= 0 ||
        text.indexOf(rr, b + 1) >= 0
      )
        continue;
      const start = a + l.length,
        end = b;
      if (end <= start || end - start > Math.max(512, r.quote.length * 4))
        continue;
      return {
        status: text.slice(start, end) === r.quote ? "found" : "changed",
        start,
        end,
      };
    }
  return { status: exact.status === "ambiguous" ? "ambiguous" : "missing" };
}
module.exports.recover = recover;

function same(a, b) {
  return a.replace(/\r\n/g, "\n") === b.replace(/\r\n/g, "\n");
}
function pieces(a, b) {
  const split = (s) =>
    typeof Intl.Segmenter === "function"
      ? Array.from(
          new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(s),
          (x) => x.segment,
        )
      : Array.from(s);
  const x = split(a),
    y = split(b),
    out = [];
  const add = (type, text) => {
    if (!text) return;
    const last = out.at(-1);
    if (last?.type === type) last.text += text;
    else out.push({ type, text });
  };
  if (
    x.length * y.length > 1000000 &&
    (a.slice(0, -1).includes("\n") || b.slice(0, -1).includes("\n"))
  ) {
    const aa = a.split(/(?<=\n)/),
      bb = b.split(/(?<=\n)/);
    let i = 0,
      j = 0;
    while (i < aa.length || j < bb.length) {
      if (i < aa.length && j < bb.length && aa[i] === bb[j]) {
        add("equal", aa[i++]);
        j++;
        continue;
      }
      const nextA = i < aa.length ? bb.indexOf(aa[i], j + 1) : -1;
      const nextB = j < bb.length ? aa.indexOf(bb[j], i + 1) : -1;
      if (nextA >= 0 && (nextB < 0 || nextA - j < nextB - i)) {
        while (j < nextA) add("insert", bb[j++]);
      } else if (nextB >= 0) {
        while (i < nextB) add("delete", aa[i++]);
      } else if (i < aa.length && j < bb.length) {
        for (const part of pieces(aa[i++], bb[j++])) add(part.type, part.text);
      } else if (i < aa.length) add("delete", aa[i++]);
      else add("insert", bb[j++]);
    }
    return out;
  }
  if (x.length * y.length > 1000000) {
    let i = 0,
      j = x.length,
      k = y.length;
    while (i < j && i < k && x[i] === y[i]) i++;
    while (j > i && k > i && x[j - 1] === y[k - 1]) {
      j--;
      k--;
    }
    add("equal", x.slice(0, i).join(""));
    add("delete", x.slice(i, j).join(""));
    add("insert", y.slice(i, k).join(""));
    add("equal", x.slice(j).join(""));
    return out;
  }
  const rows = Array.from(
    { length: x.length + 1 },
    () => new Uint32Array(y.length + 1),
  );
  for (let i = x.length - 1; i >= 0; i--)
    for (let j = y.length - 1; j >= 0; j--)
      rows[i][j] =
        x[i] === y[j]
          ? 1 + rows[i + 1][j + 1]
          : Math.max(rows[i + 1][j], rows[i][j + 1]);
  let i = 0,
    j = 0;
  while (i < x.length || j < y.length) {
    if (i < x.length && j < y.length && x[i] === y[j]) {
      add("equal", x[i++]);
      j++;
    } else if (
      i < x.length &&
      (j === y.length || rows[i + 1][j] >= rows[i][j + 1])
    )
      add("delete", x[i++]);
    else add("insert", y[j++]);
  }
  return out;
}
const recoverContexts = recover;
function recoverEdges(text, r) {
  if (
    text.includes("\r\n") ||
    r.quote.includes("\r\n") ||
    r.prefix.includes("\r\n") ||
    r.suffix.includes("\r\n")
  ) {
    const offsets = [];
    let normalized = "";
    for (let i = 0; i < text.length; i++) {
      if (text[i] === "\r" && text[i + 1] === "\n") continue;
      offsets.push(text[i] === "\n" && text[i - 1] === "\r" ? i - 1 : i);
      normalized += text[i];
    }
    offsets.push(text.length);
    const norm = (x) => x.replace(/\r\n/g, "\n");
    const found = recoverEdges(normalized, {
      ...r,
      quote: norm(r.quote),
      prefix: norm(r.prefix),
      suffix: norm(r.suffix),
    });
    return found.start === undefined
      ? found
      : { ...found, start: offsets[found.start], end: offsets[found.end] };
  }

  const found = recoverContexts(text, r);
  if (found.status !== "missing") return found;
  let start, end;
  if (!r.prefix) {
    start = 0;
    if (!r.suffix) end = text.length;
    else {
      end = text.indexOf(r.suffix);
      if (end < 0 || text.indexOf(r.suffix, end + 1) >= 0) return found;
    }
  } else if (!r.suffix) {
    end = text.length;
    const at = text.indexOf(r.prefix);
    if (at < 0 || text.indexOf(r.prefix, at + 1) >= 0) return found;
    start = at + r.prefix.length;
  } else return found;
  const quote = text.slice(start, end);
  if (!quote.trim() || quote.length > Math.max(512, r.quote.length * 2))
    return found;
  const old = r.quote.replace(/\r\n/g, "\n"),
    next = quote.replace(/\r\n/g, "\n");
  const matches = pieces(old, next)
    .filter((x) => x.type === "equal")
    .reduce((n, x) => n + x.text.length, 0);
  if (matches < 4 || matches / Math.max(old.length, next.length) < 0.75)
    return found;
  return { status: same(quote, r.quote) ? "found" : "changed", start, end };
}
Object.assign(module.exports, { same, pieces, recover: recoverEdges });

function reconcile(text, r) {
  if (!r.renameToken) return;
  if (binding(text, r) >= 0) return;
  const next = { ...r, token: r.renameToken };
  if (binding(text, next) >= 0) {
    r.token = r.renameToken;
    delete r.renameToken;
  }
}
Object.assign(module.exports, { reconcile });

function contentSame(a, b) {
  return same(a, b) || readable(a) === readable(b);
}
Object.assign(module.exports, { contentSame });

// A line-aligned multiline selection can also be identified by its stable
// boundary lines. Outer context must still agree; headings alone are not IDs.
const recoverBase = module.exports.recover;
function recoverBlocks(text, r) {
  const found = recoverBase(text, r);
  if (found.status !== "missing" || !r.quote.includes("\n")) return found;
  if (
    (r.prefix && !r.prefix.endsWith("\n")) ||
    (r.suffix && !r.suffix.startsWith("\n"))
  )
    return found;
  const old = r.quote.split(/\r?\n/).map(readable).filter(Boolean);
  if (old.length < 2) return found;
  const lines = text.split("\n");
  let offset = 0;
  const blocks = lines.map((line) => {
    const b = {
      text: readable(line),
      start: offset,
      end: offset + line.length,
    };
    offset += line.length + 1;
    return b;
  });
  const first = blocks.filter((x) => x.text === old[0]),
    last = blocks.filter((x) => x.text === old.at(-1));
  if (
    first.length !== 1 ||
    last.length !== 1 ||
    first[0].start >= last[0].start
  )
    return found;
  const start = first[0].start,
    end = last[0].end;
  const left = !r.prefix
    ? start === 0
    : readable(text.slice(Math.max(0, start - r.prefix.length), start)) ===
      readable(r.prefix);
  const right = !r.suffix
    ? end === text.length
    : readable(text.slice(end, end + r.suffix.length)) === readable(r.suffix);
  if (!left || !right) return found;
  return {
    status: contentSame(text.slice(start, end), r.quote) ? "found" : "changed",
    start,
    end,
  };
}
module.exports.recover = recoverBlocks;

function managedBindings(refs, text, path) {
  const items = refs
    .filter(
      (r) =>
        r.target === path &&
        r.status !== "unused" &&
        (!r.repair ||
          /^(\[\[[\s\S]*\]\]|\[[\s\S]*\]\([^\n]*\))$/.test(r.token)),
    )
    .map((r) => ({ r, at: binding(text, r) }))
    .filter((x) => x.at >= 0);
  return items.filter((x) => items.filter((y) => y.at === x.at).length === 1);
}
function referenceText(r) {
  const label = visibleToken(r.token),
    ending = "（" + r.name + "）";
  return label.endsWith(ending) ? label.slice(0, -ending.length) : label;
}
Object.assign(module.exports, { managedBindings, referenceText });
