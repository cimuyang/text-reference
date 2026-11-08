const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const core = require("../src/core");
function harness(entry = "src/plugin.js") {
  const modals = [],
    notices = [],
    writes = [],
    handlers = {};
  const source = { path: "日志.md", basename: "日志" },
    target = { path: "专题.md", basename: "专题" };
  const contents = new Map([
    [source.path, "开头。要引用的一句话。结尾。"],
    [target.path, "我的专题正文\n"],
  ]);
  class Plugin {
    async loadData() {
      return null;
    }
    async saveData() {}
    addSettingTab() {}
    addCommand() {}
    registerEvent() {}
    registerDomEvent() {}
    registerEditorExtension(e) {
      this.extension = e;
    }
    registerMarkdownPostProcessor(fn) {
      this.processor = fn;
    }
  }
  class SuggestModal {
    constructor() {}
    setPlaceholder() {}
    open() {
      modals.push(this);
    }
  }
  class Modal {
    constructor() {}
    open() {
      modals.push(this);
    }
  }
  class Notice {
    constructor(content) {
      notices.push(content);
    }
    hide() {}
  }
  const document = {
    createDocumentFragment() {
      return {
        children: [],
        append(...nodes) {
          this.children.push(...nodes);
        },
      };
    },
    createElement() {
      return {};
    },
  };
  const api = {
    getLanguage: () => "zh",
    editorInfoField: require("@codemirror/state").StateField.define({
      create: () => ({ file: target }),
      update: (v) => v,
    }),
    editorLivePreviewField: require("@codemirror/state").StateField.define({
      create: () => true,
      update: (v) => v,
    }),
    Plugin,
    SuggestModal,
    Modal,
    Notice,
    PluginSettingTab: class {},
    MarkdownView: class {},
    Menu: class {},
    MarkdownRenderChild: class {
      registerDomEvent(el, type, fn) {
        el.addEventListener(type, fn);
      }
      register(fn) {
        this.cleanup = fn;
      }
    },
  };
  const cm = {
    ViewPlugin: { fromClass: (type, spec) => ({ type, spec }) },
    Decoration: {
      replace: () => ({ range: (from, to) => ({ from, to }) }),
      set: (r) => r,
    },
    WidgetType: class {},
  };
  const context = {
    module: { exports: {} },
    setTimeout,
    clearTimeout,
    require: (name) => {
      if (name === "obsidian") return api;
      if (name === "@codemirror/view") return require("@codemirror/view");
      if (name === "./core") return core;
      if (name === "./automatic") return require("../src/automatic");
      if (name === "./storage") return require("../src/storage");
      if (name === "./comparison") return require("../src/comparison");
      if (name === "./updates") return require("../src/updates");
      if (name === "./source-tracking")
        return require("../src/source-tracking");
      if (name === "./maintenance") return require("../src/maintenance");
      if (name === "./hover") return require("../src/hover");
      if (name === "./interaction") return require("../src/interaction");
      if (name === "./editor") return require("../src/editor");
      if (name === "@codemirror/state") return require("@codemirror/state");
      throw Error(name);
    },
    document,
    crypto: globalThis.crypto,
    navigator: {
      clipboard: {
        writeText: async (text) => {
          context.clipboard = text;
        },
      },
    },
    console: { error() {}, warn() {} },
  };
  vm.runInNewContext(fs.readFileSync(entry, "utf8"), context);
  const p = new context.module.exports();
  p.app = {
    vault: {
      on(name, fn) {
        handlers["vault:" + name] = fn;
      },
      getMarkdownFiles: () => [source, target],
      getAbstractFileByPath: (path) =>
        [source, target].find((f) => f.path === path),
      process: async (file, fn) => {
        writes.push(file.path);
        contents.set(file.path, fn(contents.get(file.path)));
      },
      read: async (f) => contents.get(f.path),
      cachedRead: async (f) => contents.get(f.path),
    },
    workspace: {
      on(name, fn) {
        handlers[name] = fn;
      },
      getLeaf() {
        return { openFile: async () => {} };
      },
    },
    metadataCache: {
      getFileCache: () => ({ headings: [] }),
      getFirstLinkpathDest: (path) =>
        [source, target].find((f) => f.path === path),
    },
    fileManager: {
      generateMarkdownLink: (file) =>
        "[[" + file.path + "|" + file.basename + "]]",
    },
  };
  const editor = {
    getSelection: () => contents.get(source.path).slice(3, 12),
    getCursor: (which) =>
      which === "from" ? { line: 0, ch: 3 } : { line: 0, ch: 12 },
    posToOffset: (pos) => pos.ch,
    getValue: () => contents.get(source.path),
  };
  return {
    p,
    api,
    source,
    target,
    editor,
    contents,
    writes,
    modals,
    notices,
    context,
    handlers,
  };
}
module.exports = { harness };
