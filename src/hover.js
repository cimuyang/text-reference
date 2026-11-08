"use strict";
const tracking = require("./source-tracking");
const { listen } = require("./document-events");

function position(text, offset) {
  const prefix = text.slice(0, offset);
  return { line: prefix.split("\n").length - 1, col: offset - prefix.lastIndexOf("\n") - 1 };
}

function closePopover(popover) {
  if (!popover) return;
  try {
    if (typeof popover.hide === "function") popover.hide();
    else popover.unload?.();
  } finally {
    popover.hoverEl?.remove();
  }
}

function install(p, anchor, r) {
  const doc = anchor.ownerDocument;
  const win = doc.defaultView;
  const current = () => r.automatic || !p.refs ? r : p.refs.find((x) => x.id === r.id);
  let pointer = null, pending = false, generation = 0;
  let releaseSource, visiblePopup;
  const contains = (element, target) => Boolean(target?.nodeType && element?.contains(target));
  const blur = () => {
    pointer = null;
    cancel();
  };
  function cancel(dispose = false) {
    generation++;
    pending = false;
    if (p.previewClose === cancel) p.previewClose = null;
    win.removeEventListener("blur", blur);
    releaseSource?.();
    releaseSource = undefined;
    if (dispose) {
      const popup = visiblePopup;
      visiblePopup = undefined;
      closePopover(popup);
    }
  }

  function popupOwner(turn) {
    let popup;
    return {
      get hoverPopover() { return popup ?? null; },
      set hoverPopover(next) {
        if (next === popup) return;
        if (visiblePopup === popup) visiblePopup = undefined;
        popup = next;
        if (turn !== generation) {
          // Native preview publishes from inside show(). Let it finish first.
          if (next) queueMicrotask(() => closePopover(next));
          return;
        }
        visiblePopup = next ?? undefined;
      },
    };
  }

  function request(event) {
    if (!pointer || pending || visiblePopup?.hoverEl?.isConnected || anchor.trDragging?.()) return;
    p.previewClose?.();
    p.previewClose = cancel;
    pending = true;
    win.addEventListener("blur", blur, { once: true });
    const turn = ++generation;
    p.run(async () => {
      if (turn !== generation) return;
      const reference = current();
      const file = reference && tracking.sourceFile(p, reference);
      if (!file) {
        cancel();
        return;
      }
      const source = file.path ?? reference.source;
      const entry = tracking.previewSource(p, file, source);
      entry.users++;
      releaseSource = entry.release;
      let text, found;
      try {
        text = await entry.text;
        if (turn !== generation) return;
        const latest = current();
        if (latest && latest.source === reference.source) {
          const key = JSON.stringify([latest.id, latest.quote, latest.prefix, latest.suffix, latest.locator]);
          found = await tracking.previewRange(p, entry, text, { ...latest, source }, key);
        }
      } catch {
        // The source can still be opened in native preview without a passage range.
      }
      if (turn !== generation) return;
      const latest = current();
      if (!anchor.isConnected || !latest || latest.source !== reference.source) {
        cancel();
        return;
      }
      const startLoc = entry.current() && latest.quote === reference.quote && found?.start !== undefined
        ? position(text, found.start)
        : undefined;
      p.app.workspace.trigger("hover-link", {
        event, source: "text-reference", hoverParent: popupOwner(turn), targetEl: anchor,
        linktext: source, sourcePath: latest.target,
        state: startLoc ? { scroll: startLoc.line, startLoc, endLoc: position(text, found.end) } : undefined,
      });
    });
  }

  const move = (event) => {
    pointer = event;
    event.stopPropagation();
    if (event.ctrlKey || event.metaKey) request(event);
  };
  const leave = (event) => {
    if (contains(anchor, event.relatedTarget)) return;
    pointer = null;
    // A published popup follows Obsidian's native transition and hover timing.
    cancel();
  };
  anchor.addEventListener("mouseover", move);
  anchor.addEventListener("mousemove", move);
  anchor.addEventListener("mouseout", leave);
  const offDown = listen(doc, "keydown", (event) => {
    if (!pointer || !(event.ctrlKey || event.metaKey || event.key === "Control" || event.key === "Meta"))
      return;
    request(new doc.defaultView.MouseEvent("mouseover", {
      clientX: pointer.clientX, clientY: pointer.clientY,
      ctrlKey: event.ctrlKey || event.key === "Control",
      metaKey: event.metaKey || event.key === "Meta",
    }));
  }, true);
  const offUp = listen(doc, "keyup", (event) => {
    if (!event.ctrlKey && !event.metaKey && p.previewClose === cancel) cancel();
  }, true);
  return () => {
    cancel(true);
    offDown();
    offUp();
    anchor.removeEventListener("mouseover", move);
    anchor.removeEventListener("mousemove", move);
    anchor.removeEventListener("mouseout", leave);
  };
}
module.exports = { install };
