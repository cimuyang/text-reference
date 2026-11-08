const { test } = require("node:test");
const assert = require("node:assert/strict");
const c = require("../src/core");
test("automatic syntax ignores non-rendered links and preserves real offsets", () => {
  const wiki = "[[目录/日志.md|一段话 (日志)]]";
  const fallback = c.inlineLink("目录/日志.md", "包含 [方括号]", "日志");
  const text = [
    "---", "value: '" + wiki + "'", "---", "",
    "```md", wiki, "```", "",
    "    " + wiki, "",
    "`inline " + wiki + "`",
    "%% " + wiki, "仍在注释内 " + wiki + " %%",
    "<!-- " + wiki + " -->",
    "!" + wiki,
    "\\" + wiki,
    "[[日志#标题|一段话（日志）]]",
    "",
    "> " + wiki,
    fallback,
  ].join("\r\n");
  const links = c.referenceLinks(text);
  assert.deepEqual(links.map((r) => r.token), [wiki, fallback]);
  assert.equal(links[0].at, text.lastIndexOf(wiki));
  assert.equal(links[1].label, "包含 [方括号]（日志）");
});

const make = (text, start = 0, end = text.length) =>
  c.capture(text, start, end, "日志.md", { layout: "inline", limit: 30 });
test("capture never changes input and preserves exact selection including Unicode", () => {
  const text = "之前\n中文👨‍👩‍👧‍👦选区\n之后";
  const r = make(text, 3, text.length - 3);
  assert.equal(r.quote, text.slice(3, -3));
  assert.equal(text, "之前\n中文👨‍👩‍👧‍👦选区\n之后");
  assert.equal(c.decode(c.encode(r)).quote, r.quote);
});
test("reject empty and invalid selection", () => {
  assert.throws(() => make("", 0, 0));
  assert.throws(() => make("a", -1, 1));
});
test("unique text remains locatable after unrelated edits", () => {
  const r = make("prefix目标suffix", 6, 8);
  assert.deepEqual(c.locate("新增\nprefix目标suffix", r), {
    status: "found",
    start: 9,
    end: 11,
  });
});
test("duplicate text requires unique context, never picks first by distance", () => {
  const r = make("甲目标乙", 1, 3);
  assert.equal(c.locate("甲目标乙\n丙目标丁", r).start, 1);
  assert.equal(c.locate("甲目标乙\n甲目标乙", r).status, "ambiguous");
  assert.equal(c.locate("丙目标丁\n戊目标己", r).status, "ambiguous");
});
test("deleted or changed original is missing", () =>
  assert.equal(c.locate("改写了", make("原句")).status, "missing"));
test("grapheme preview never splits emoji and zero means full", () => {
  assert.equal(c.preview("👨‍👩‍👧‍👦甲乙", 1), "👨‍👩‍👧‍👦…");
  assert.equal(c.preview("甲乙", 0), "甲乙");
  assert.equal(c.preview("甲乙", 2), "甲乙");
});
test("readable native quote survives metadata roundtrip", () => {
  const r = make("一段\n\n第二段");
  const text = c.render(r, "[[日志|来源]]");
  const items = c.records(text);
  assert.equal(items.length, 1);
  assert.equal(items[0].body, r.quote);
  assert.equal(items[0].link, "[[日志|来源]]");
  assert.ok(text.includes(r.quote.split("\n")[0]));
});
test("metadata escaped against HTML and quotes", () => {
  const r = make('"</span><script>bad</script>');
  r.source = '文件".md';
  assert.ok(!c.encode(r).includes('"'));
  assert.deepEqual(c.decode(c.encode(r)), r);
});
test("CRLF quotes parse while preserving outside text", () => {
  const r = make("内容");
  const block = c.render(r, "[[日志]]").replaceAll("\n", "\r\n");
  const text = "前文\r\n\r\n" + block + "\r\n后文";
  assert.equal(c.records(text)[0].body, "内容");
  const out = c.replaceRecord(text, r.id, () => "replacement\r\n");
  assert.equal(out, "前文\r\n\r\nreplacement\r\n\r\n后文");
});
test("target manual edits preserved for layout update", () => {
  const r = make("原文");
  const text = c.render(r, "[[日志]]").replace("> 原文", "> 我的改写");
  const out = c.replaceRecord(text, r.id, (item) =>
    item.block.replace(item.encoded, c.encode({ ...item.r, layout: "split" })),
  );
  assert.equal(c.records(out)[0].body, "我的改写");
});
test("relocate preserves snapshot independently of location quote", () => {
  const r = { ...make("新位置"), snapshot: "旧摘录" };
  const text = c.render(r, "[[日志]]");
  assert.equal(c.records(text)[0].body, "旧摘录");
  assert.equal(c.locate("找到新位置", c.records(text)[0].r).status, "found");
});
test("duplicate copied identifiers fail closed for mutations", () => {
  const r = make("文字");
  const text = c.render(r, "[[日志]]");
  assert.throws(() => c.replaceRecord(text + text, r.id, () => ""));
});
test("malformed metadata and unrelated spans ignored", () => {
  assert.equal(c.decode("%bad"), null);
  assert.equal(c.decode(encodeURIComponent("{}")), null);
  assert.equal(
    c.records('<span data-text-reference="' + c.encode(make("a")) + '"></span>')
      .length,
    0,
  );
});
test("updating one reference preserves all neighbors", () => {
  const a = make("甲"),
    b = make("乙");
  const text =
    "序言\n\n" +
    c.render(a, "[[日志]]") +
    "\n正文\n\n" +
    c.render(b, "[[日志]]");
  const out = c.replaceRecord(text, a.id, (item) =>
    c.render({ ...item.r, quote: "新甲" }, item.link),
  );
  assert.equal(c.records(out)[1].body, "乙");
  assert.ok(out.includes("正文"));
});
test("inline reference contains only native syntax, content and source", () => {
  const token = c.inlineLink("日志.md", "引用一句话，连接想法", "日志");
  assert.equal(token, "[[日志.md|引用一句话，连接想法（日志）]]");
  assert.ok(!token.includes("span"));
});
test("unsafe wiki aliases fall back to escaped Markdown links", () => {
  const token = c.inlineLink("目录/笔记 (1).md", "a|b ]] \\ c", "来源");
  assert.ok(token.startsWith("["));
  assert.ok(!token.startsWith("[["));
  assert.ok(token.includes("%28"));
  assert.ok(token.includes("\\]\\]"));
});
test("external records match unambiguous targets and reject collisions", () => {
  const r = make("原句"),
    token = c.inlineLink("日志.md", r.quote, "日志");
  const text = "前文" + token + "后文",
    b = c.bind(r, "目标.md", token, text, 2);
  assert.equal(c.binding(text, b), 2);
  assert.equal(
    c.activeBindings([b, { ...b, id: "copy" }], text, "目标.md").length,
    0,
  );
  assert.equal(c.activeBindings([b], text, "目标.md").length, 1);
  assert.equal(c.binding("文字被改掉", b), -1);
});
