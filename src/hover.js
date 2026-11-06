"use strict";
const tracking = require("./source-tracking");
const preview = require("./preview-range");
function install(p, a, r, parent) {
  const doc = a.ownerDocument;
  let inside = false,
    mod = false,
    version = 0,
    busy = false,
    requested = false,
    timer = null;
  let stopHighlight = () => {},
    watchTimer = null;
  const current = () => (p.refs ? p.refs.find((x) => x.id === r.id) : r);
  const listen = (target, type, fn) => {
    if (target === doc)
      return require("./document-events").listen(doc, type, fn);
    target.addEventListener(type, fn);
    return () => target.removeEventListener(type, fn);
  };
  const live = () => parent.hoverPopover && parent.hoverPopover.state !== 3;
  function request(event) {
    if (!inside || !mod || busy || requested || live() || a.trSelection?.())
      return;
    const turn = ++version;
    busy = true;
    requested = true;
    p.run(async () => {
      try {
        const reference = current();
        if (!reference) return;
        const stamp = JSON.stringify([
          reference.source,
          reference.quote,
          reference.snapshot,
          reference.locator,
        ]);
        const epoch = p.sourceEpochs?.get(reference.source) || 0;
        const file = p.app.vault.getAbstractFileByPath(reference.source);
        if (!file) {
          // Hover does not emit global warnings.
          return;
        }
        const text = await tracking.read(p, file),
          found = await tracking.resolve(p, text, reference);
        if (turn !== version || !inside || !mod || !a.isConnected) return;
        const latest = current();
        if (
          !latest ||
          stamp !==
            JSON.stringify([
              latest.source,
              latest.quote,
              latest.snapshot,
              latest.locator,
            ]) ||
          epoch !== (p.sourceEpochs?.get(reference.source) || 0)
        ) {
          requested = false;
          return;
        }
        if (!["found", "changed"].includes(found.status)) {
          // Hover does not emit global warnings.
          return;
        }
        let attempts = 0;
        const watchNative = () => {
          if (turn !== version || !inside || !mod || !a.isConnected) return;
          if (parent.hoverPopover?.hoverEl) {
            stopHighlight();
            stopHighlight = preview.watch(p, parent.hoverPopover, text, found);
            return;
          }
          if (++attempts < 40) watchTimer = setTimeout(watchNative, 40);
        };
        const position = (offset) => {
          const prefix = text.slice(0, offset),
            line = prefix.split("\n").length - 1;
          return { line, col: offset - (prefix.lastIndexOf("\n") + 1) };
        };
        const line = text.slice(0, found.start).split("\n").length - 1;
        const previewEnabled =
          p.app.internalPlugins?.getPluginById?.("page-preview")?.enabled;
        if (previewEnabled !== false)
          p.app.workspace.trigger("hover-link", {
            event,
            source: "text-reference",
            hoverParent: parent,
            targetEl: a,
            linktext: reference.source,
            sourcePath: reference.target,
            state: {
              scroll: line,
              startLoc: position(found.start),
              endLoc: position(found.end),
            },
          });
        watchNative();
        // Core preview may be disabled or reject a stale event. Keep one native container as a fallback.
        timer =
          previewEnabled === true
            ? null
            : setTimeout(
                () => {
                  if (
                    turn !== version ||
                    !inside ||
                    !mod ||
                    !a.isConnected ||
                    live() ||
                    !p.Obsidian.HoverPopover
                  )
                    return;
                  const popover = new p.Obsidian.HoverPopover(parent, a, 100);
                  parent.hoverPopover = popover;
                  const body = popover.hoverEl.createDiv({
                    cls: "markdown-rendered tr-context-preview",
                  });
                  clearTimeout(watchTimer);
                  const context = preview.context(text, found);
                  p.run(async () => {
                    await p.Obsidian.MarkdownRenderer.render(
                      p.app,
                      context.text,
                      body,
                      reference.source,
                      popover,
                    );
                    if (
                      turn !== version ||
                      !inside ||
                      !mod ||
                      popover.state === 3
                    )
                      return;
                    stopHighlight();
                    stopHighlight = preview.watch(
                      p,
                      popover,
                      context.text,
                      context.range,
                    );
                  });
                },
                previewEnabled === false ? 0 : 500,
              );
      } finally {
        busy = false;
      }
    });
  }
  const enter = (e) => {
    inside = true;
    mod = e.ctrlKey || e.metaKey;
    e.stopPropagation();
    request(e);
  };
  const offs = [
    listen(a, "mouseover", enter),
    listen(a, "mousemove", enter),
    listen(a, "mouseout", (e) => {
      if (a.contains(e.relatedTarget)) return;
      inside = false;
      requested = false;
      version++;
      busy = false;
      clearTimeout(timer);
      clearTimeout(watchTimer);
      e.stopPropagation();
    }),
    listen(doc, "keydown", (e) => {
      if (
        !inside ||
        !(e.key === "Control" || e.key === "Meta" || e.ctrlKey || e.metaKey)
      )
        return;
      mod = true;
      request(e);
    }),
    listen(doc, "keyup", (e) => {
      mod = e.ctrlKey || e.metaKey;
      if (!mod) {
        requested = false;
        version++;
        busy = false;
        clearTimeout(timer);
        clearTimeout(watchTimer);
      }
    }),
  ];
  return () => {
    version++;
    clearTimeout(timer);
    clearTimeout(watchTimer);
    for (const off of offs) off();
    stopHighlight();
    parent.hoverPopover?.unload();
  };
}
module.exports = { install };
