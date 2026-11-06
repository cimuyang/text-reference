"use strict";
const { StateField, StateEffect, Prec } = require("@codemirror/state");
const {
  EditorView,
  ViewPlugin,
  Decoration,
  WidgetType,
} = require("@codemirror/view");
function install(p, O, core) {
  p.editorViews = new Set();
  p.refreshEffect = StateEffect.define();
  class QuoteWidget extends WidgetType {
    constructor(r) {
      super();
      this.r = r;
      this.signature = JSON.stringify([
        r.id,
        p.display(r),
        r.name,
        p.fullQuotes.has(r.id) ? 0 : p.settings.limit,
        p.settings.layout,
        p.settings.style,
        p.sourceStatus?.get(r.id),
      ]);
    }
    eq(other) {
      return this.signature === other.signature;
    }
    get lineBreaks() {
      return p.settings.layout === "split" ? 1 : 0;
    }
    toDOM(view) {
      const a = view.dom.ownerDocument.createElement("a");
      a.className = "internal-link";
      a.href = this.r.source;
      a.dataset.href = this.r.source;
      a.tabIndex = 0;
      p.paint(a, this.r);
      this.cleanup = require("./interaction").bind(p, a, this.r);
      a.dataset.referenceId = this.r.id;
      return a;
    }
    destroy() {
      this.cleanup?.();
    }
    ignoreEvent() {
      return true;
    }
  }
  function build(state) {
    const ranges = [];
    if (!state.field(O.editorLivePreviewField, false)) return Decoration.none;
    const path = state.field(O.editorInfoField, false)?.file?.path,
      text = state.doc.toString();
    for (const { r, at } of core.activeBindings(p.refs, text, path)) {
      const selected = [...p.editorViews].some((v) =>
        [...v.dom.querySelectorAll("[data-reference-id]")].some(
          (a) => a.dataset.referenceId === r.id && a.trSelection?.(),
        ),
      );
      if (
        !selected &&
        state.selection.ranges.some(
          (s) => s.from <= at + r.token.length && s.to >= at,
        )
      )
        continue;
      ranges.push(
        Decoration.replace({ widget: new QuoteWidget(r) }).range(
          at,
          at + r.token.length,
        ),
      );
    }
    return Decoration.set(ranges, true);
  }
  const field = StateField.define({
    create: build,
    update: (old, tr) => {
      if (tr.docChanged) {
        require("./source-tracking").transaction(
          p,
          tr,
          tr.state.field(O.editorInfoField, false)?.file?.path,
        );
        require("./maintenance").transaction(
          p,
          tr,
          tr.state.field(O.editorInfoField, false)?.file?.path,
        );
      }
      return tr.docChanged ||
        tr.selection ||
        tr.effects.some((e) => e.is(p.refreshEffect))
        ? build(tr.state)
        : old;
    },
    provide: (f) => Prec.highest(EditorView.decorations.from(f)),
  });
  const tracking = ViewPlugin.fromClass(
    class {
      constructor(view) {
        this.view = view;
        p.editorViews.add(view);
      }
      destroy() {
        p.editorViews.delete(this.view);
      }
    },
  );
  const menus = EditorView.domEventHandlers({
    contextmenu(event, view) {
      if (event.defaultPrevented || event.target.closest?.(".tr-reference"))
        return false;
      const at =
        event.clientX || event.clientY
          ? view.posAtCoords({ x: event.clientX, y: event.clientY })
          : view.state.selection.main.head;
      if (at == null || !view.state.selection.main.empty) return false;
      const path = view.state.field(O.editorInfoField, false)?.file?.path;
      const hit = core
        .managedBindings(p.refs, view.state.doc.toString(), path)
        .filter((x) => at >= x.at && at < x.at + x.r.token.length);
      if (hit.length !== 1) return false;
      event.preventDefault();
      p.menu(hit[0].r, event, null);
      return true;
    },
  });
  p.registerEditorExtension([field, tracking, menus]);
}
module.exports = { install };
