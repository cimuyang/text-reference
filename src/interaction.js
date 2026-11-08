"use strict";
function bind(p, a, r) {
  const doc = a.ownerDocument,
    win = doc.defaultView;
  let down = null,
    moved = false,
    held = false;
  const current = () => r.automatic ? r : p.refs.find((x) => x.id === r.id);
  const open = (e) => {
    const reference = current();
    if (!reference) return;
    const newTab = e.ctrlKey || e.metaKey;
    p.run(() => p.open(reference, newTab));
  };
  a.removeAttribute("title");
  a.draggable = false;
  a.setAttribute("contenteditable", "false");
  const on = (target, type, fn, options) => {
    target.addEventListener(type, fn, options);
    return () => target.removeEventListener(type, fn, options);
  };
  const ownsSelection = () => {
    const s = win.getSelection();
    if (!s || s.isCollapsed || !s.rangeCount) return false;
    try {
      return s.getRangeAt(0).intersectsNode(a);
    } catch {
      return false;
    }
  };
  let pointerOff = () => {};
  const startPointer = () => {
    pointerOff();
    const move = require("./document-events").listen(
      doc,
      "mousemove",
      (e) => {
        if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 4)
          moved = true;
      },
      true,
    );
    const up = require("./document-events").listen(doc, "mouseup", () => {
      down = null;
      held = ownsSelection();
      pointerOff();
    });
    pointerOff = () => {
      move();
      up();
    };
  };
  const listeners = [
    on(a, "mousedown", (e) => {
      if (e.button !== 0) return;
      down = { x: e.clientX, y: e.clientY };
      moved = false;
      held = true;
      startPointer();
    }),
    on(a, "click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (moved || held || e.shiftKey || ownsSelection()) {
        moved = false;
        return;
      }
      open(e);
    }),
    on(a, "keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        open(e);
      }
    }),
    on(a, "contextmenu", (e) => {
      if (ownsSelection()) return;
      e.preventDefault();
      e.stopPropagation();
      if (current()) p.menu(current(), e, a);
    }),
    require("./document-events").listen(
      doc,
      "copy",
      (e) => {
        if (!ownsSelection()) return;
        const selection = win.getSelection();
        const text = selection.toString();
        const reference = current();
        const whole = text === a.textContent;
        if (!whole && !(a.contains(selection.anchorNode) && a.contains(selection.focusNode)))
          return;
        if (text && e.clipboardData) {
          p.pending = whole && reference && !reference.automatic && !reference.repair
            ? p.referenceClipboard?.(reference) ?? null
            : null;
          e.clipboardData.setData("text/plain", whole && reference?.token ? reference.token : text);
          e.preventDefault();
          e.stopImmediatePropagation();
          return false;
        }
      },
      true,
    ),
  ];
  const removeHover = require("./hover").install(p, a, r);
  a.trDragging = () => Boolean(down);
  a.trSelection = () => Boolean(down) || ownsSelection();
  return () => {
    pointerOff();
    removeHover();
    for (const off of listeners) off();
    delete a.trDragging;
    delete a.trSelection;
  };
}
module.exports = { bind };
