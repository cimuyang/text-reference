"use strict";
const documents = new WeakMap();
function listen(doc, type, handler, capture = false) {
  let types = documents.get(doc);
  if (!types) documents.set(doc, (types = new Map()));
  const key = type + ":" + capture;
  let group = types.get(key);
  if (!group) {
    group = {
      handlers: new Set(),
      dispatch: (event) => {
        for (const fn of [...group.handlers]) if (fn(event) === false) break;
      },
    };
    types.set(key, group);
    doc.addEventListener(type, group.dispatch, capture);
  }
  group.handlers.add(handler);
  return () => {
    group.handlers.delete(handler);
    if (!group.handlers.size) {
      doc.removeEventListener(type, group.dispatch, capture);
      types.delete(key);
    }
  };
}
module.exports = { listen };
