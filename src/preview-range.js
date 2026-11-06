"use strict";
const core = require("./core");

// Project rendered text onto DOM offsets without changing Markdown or selecting
// text in the user's editor. Whitespace is normalized on both sides.
function project(root) {
  const doc = root.ownerDocument;
  const walker = doc.createTreeWalker(root, 5);
  let text = "",
    previous = null;
  const positions = [];
  for (let node; (node = walker.nextNode());) {
    if (node.nodeType === 1) {
      if (node.tagName === "BR" && text && !text.endsWith(" ")) {
        text += " ";
        positions.push(null);
      }
      continue;
    }
    if (
      node.parentElement?.closest("script,style,button,input,.tr-preview-note")
    )
      continue;
    const block = node.parentElement?.closest(
      "p,li,h1,h2,h3,h4,h5,h6,pre,td,th,blockquote",
    );
    if (previous && block !== previous && text && !text.endsWith(" ")) {
      text += " ";
      positions.push(null);
    }
    previous = block;
    for (let i = 0; i < node.data.length; i++) {
      const c = /\s/.test(node.data[i]) ? " " : node.data[i];
      if (c === " " && (!text || text.endsWith(" "))) continue;
      text += c;
      positions.push({ node, offset: i });
    }
  }
  return { text, positions };
}
function wholeRange(root, source, found, prepared, projection) {
  if (
    !Number.isInteger(found.start) ||
    !Number.isInteger(found.end) ||
    found.start < 0 ||
    found.end > source.length ||
    found.end <= found.start
  )
    return [];
  const quote =
    prepared?.quote ?? core.readable(source.slice(found.start, found.end));
  if (!quote) return [];
  // Repeated visible text is not enough to identify the right occurrence.
  const full = prepared?.full ?? core.readable(source),
    sourceAt = full.indexOf(quote);
  if (sourceAt < 0 || full.indexOf(quote, sourceAt + 1) >= 0) return [];
  const { text, positions } = projection || project(root);
  const at = text.indexOf(quote);
  if (at < 0 || text.indexOf(quote, at + 1) >= 0) return [];
  const first = positions[at],
    last = positions[at + quote.length - 1];
  if (!first || !last) return [];
  const range = root.ownerDocument.createRange();
  range.setStart(first.node, first.offset);
  range.setEnd(last.node, last.offset + 1);
  return [range];
}
function ranges(root, source, found, prepared) {
  prepared ??= {
    quote: core.readable(source.slice(found.start, found.end)),
    full: core.readable(source),
  };
  const projection = project(root);
  const whole = wholeRange(root, source, found, prepared, projection);
  if (whole.length) return whole;
  if (
    !Number.isInteger(found.start) ||
    !Number.isInteger(found.end) ||
    found.start < 0 ||
    found.end > source.length ||
    found.end <= found.start
  )
    return [];
  const selected = source.slice(found.start, found.end),
    parts = selected.split("\n");
  if (parts.length < 2) return [];
  let offset = found.start;
  const result = [];
  for (const part of parts) {
    if (part.trim())
      result.push(
        ...wholeRange(
          root,
          source,
          { start: offset, end: offset + part.length },
          {
            full: prepared?.full ?? core.readable(source),
            quote: core.readable(part),
          },
          projection,
        ),
      );
    offset += part.length + 1;
  }
  return result;
}

let counter = 0;
function watch(p, popover, source, found) {
  const root = popover.hoverEl;
  if (!root) return () => {};
  const win = root.ownerDocument.defaultView;
  const prepared = {
    quote: core.readable(source.slice(found.start, found.end)),
    full: core.readable(source),
  };
  const key = "tr-passage-" + ++counter;
  const style = root.ownerDocument.createElement("style");
  style.textContent =
    "::highlight(" +
    key +
    "){background-color:var(--text-highlight-bg, #f4e5b4);color:var(--text-normal);}";
  root.ownerDocument.head.appendChild(style);
  let disposed = false,
    scheduled = false,
    scrollDone = false;
  let frame = null;
  const update = () => {
    scheduled = false;
    if (disposed) return;
    const content =
      root.querySelector(".markdown-preview-view,.markdown-rendered") || root;
    const hits = ranges(content, source, found, prepared);
    if (win.CSS?.highlights && win.Highlight) {
      if (hits.length) {
        win.CSS.highlights.set(key, new win.Highlight(...hits));
        for (const block of root.querySelectorAll(".is-flashing"))
          block.classList.remove("is-flashing");
      } else win.CSS.highlights.delete(key);
    }
    if (hits.length && !scrollDone) {
      const element = hits[0].startContainer.parentElement;
      element?.scrollIntoView?.({ block: "center", inline: "nearest" });
      scrollDone = true;
    }
    const canHighlight = hits.length && win.CSS?.highlights && win.Highlight;
    let note = root.querySelector(".tr-preview-note");
    if (!canHighlight && content.textContent?.trim() && !note) {
      note = root.ownerDocument.createElement("div");
      note.className = "tr-preview-note";
      note.textContent =
        p.zh === false
          ? "Context shown; exact text highlighting is unavailable."
          : "已显示上下文，暂不能精确标记文字。";
      root.appendChild(note);
    } else if (canHighlight && note) note.remove();
  };
  const observer = new win.MutationObserver(() => {
    if (scheduled || disposed) return;
    scheduled = true;
    if (win.requestAnimationFrame) frame = win.requestAnimationFrame(update);
    else Promise.resolve().then(update);
  });
  observer.observe(root, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ["class"],
  });
  update();
  const cleanup = () => {
    disposed = true;
    observer.disconnect();
    if (frame !== null) win.cancelAnimationFrame?.(frame);
    win.CSS?.highlights?.delete(key);
    style.remove();
    root.querySelector(".tr-preview-note")?.remove();
  };
  popover.register?.(cleanup);
  return cleanup;
}
function context(source, found) {
  // Keep whole Markdown blocks around the range; do not cut a heading or fence
  // simply because it is two lines away. Bound work for very large passages.
  const max = 16000;
  const before = source.lastIndexOf("\n\n", Math.max(0, found.start - 1));
  const left = before < 0 ? 0 : before + 2;
  const after = source.indexOf("\n\n", found.end);
  const right = after < 0 ? source.length : after;
  let start = source.lastIndexOf("\n\n", Math.max(0, left - 3));
  start = start < 0 ? 0 : start + 2;
  const following = source.indexOf("\n\n", right + 2);
  let end = following < 0 ? source.length : following;
  if (end - start > max) {
    start = left;
    end = Math.min(source.length, start + max);
  }
  return {
    text: source.slice(start, end),
    range: { start: found.start - start, end: found.end - start },
    truncated: found.end > end,
  };
}
module.exports = { project, ranges, watch, context };
