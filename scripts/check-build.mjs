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
const fetched = [];
let offline = false;
const stored = new Map();
const scope = "https://example.test/game/";
vm.runInNewContext(worker, {
  URL,
  Response,
  fetch: async (url, options) => {
    if (offline) throw new Error("offline fixture");
    fetched.push({ url, options });
    return new Response("fresh-content", { status: 200 });
  },
  self: {
    registration: { scope },
    skipWaiting: () => Promise.resolve(),
    location: { origin: "https://example.test" },
    clients: { claim: () => Promise.resolve() },
    addEventListener: (type, fn) => (handlers[type] = fn),
  },
  caches: {
    open: async () => ({
      put: async (key, value) => stored.set(key, value),
      match: async (request) => stored.get(request.url)?.clone(),
      keys: async () => [...stored.keys()],
    }),
    keys: async () => [
      "soul-land:" + scope + ":old",
      "soul-land:https://example.test/other/:old",
      "unrelated",
    ],
    delete: async (key) => deleted.push(key),
  },
});
let completed;
handlers.install({ waitUntil: (p) => (completed = p) });
await completed;
assert.equal(stored.size, files.length);
for (const { url, options } of fetched) {
  assert.ok(new URL(url).searchParams.get("__soul_revision"));
  assert.equal(options.cache, "reload");
}
for (const key of stored.keys()) assert.equal(new URL(key).search, "");

let response;
handlers.fetch({
  request: new Request(scope + "guide.html"),
  respondWith: (p) => (response = p),
});
assert.equal(await (await response).text(), "fresh-content");
assert.ok(fetched.at(-1).url.includes("__soul_revision="));
offline = true;
handlers.fetch({
  request: new Request(scope + "guide.html"),
  respondWith: (p) => (response = p),
});
assert.equal(await (await response).text(), "fresh-content");
handlers.activate({ waitUntil: (p) => (completed = p) });
await completed;
assert.deepEqual(deleted, ["soul-land:" + scope + ":old"]);
console.log(
  `Verified ${files.length} precache paths, published references, worker syntax, fresh revision requests and scoped cache cleanup.`,
);
