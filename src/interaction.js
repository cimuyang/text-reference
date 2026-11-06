"use strict";
function bind(p, a, r) {
  const doc = a.ownerDocument,
    win = doc.defaultView;
  let down = null,
    moved = false,
    held = false;
  const parent = { hoverPopover: null };
  const current = () => p.refs.find((x) => x.id === r.id);
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
      if (current()) p.run(() => p.open(current(), e.ctrlKey || e.metaKey));
    }),
    on(a, "keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (current()) p.run(() => p.open(current(), e.ctrlKey || e.metaKey));
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
        const text = win.getSelection().toString();
        if (text && e.clipboardData) {
          e.clipboardData.setData("text/plain", text);
          e.preventDefault();
          e.stopImmediatePropagation();
          return false;
        }
      },
      true,
    ),
  ];
  const removeHover = require("./hover").install(p, a, r, parent);
  a.trSelection = () => Boolean(down) || ownsSelection();
  return () => {
    pointerOff();
    removeHover();
    for (const off of listeners) off();
    delete a.trSelection;
  };
}
module.exports = { bind };
