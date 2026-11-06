require("esbuild").buildSync({
  entryPoints: ["src/plugin.js"],
  outfile: "main.js",
  bundle: true,
  platform: "browser",
  format: "cjs",
  target: "es2018",
  external: ["obsidian", "@codemirror/view", "@codemirror/state"],
});
console.log("Built standalone main.js");
