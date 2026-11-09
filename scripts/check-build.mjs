import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import vm from "node:vm";
const root = path.resolve(process.argv[2] || "docs");
const worker = fs.readFileSync(path.join(root, "sw.js"), "utf8");
new vm.Script(worker);
const files = JSON.parse(worker.match(/const FILES=(\[.*?\]);/)[1]);
for (const f of files)
  assert.ok(fs.existsSync(path.join(root, f)), `Missing precache file ${f}`);
for (const file of ["index.html", "guide.html"]) {
  const html = fs.readFileSync(path.join(root, file), "utf8");
  for (const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
    const url = match[1];
    if (/^(https?:|data:)/.test(url)) continue;
    assert.ok(
      fs.existsSync(path.join(root, url)),
      `Missing ${file} target ${url}`,
    );
  }
  if (file === "index.html")
    assert.ok(
      !html.includes("source-pages-entry"),
      "Source redirect leaked into build",
    );
}
const manifest = JSON.parse(
  fs.readFileSync(path.join(root, "manifest.webmanifest")),
);
assert.equal(manifest.start_url, "./");
const handlers = {};
const deleted = [];
const scope = "https://example.test/game/";
vm.runInNewContext(worker, {
  self: {
    registration: { scope },
    location: { origin: "https://example.test" },
    clients: { claim: () => Promise.resolve() },
    addEventListener: (type, fn) => (handlers[type] = fn),
  },
  caches: {
    keys: async () => [
      "soul-land:" + scope + ":old",
      "soul-land:https://example.test/other/:old",
      "unrelated",
    ],
    delete: async (key) => deleted.push(key),
  },
});
let completed;
handlers.activate({ waitUntil: (p) => (completed = p) });
await completed;
assert.deepEqual(deleted, ["soul-land:" + scope + ":old"]);
console.log(
  `Verified ${files.length} precache paths, published references, worker syntax and scoped cache cleanup.`,
);
