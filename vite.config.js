import { defineConfig } from "vite";
export default defineConfig({
  server: { watch: { ignored: ["**/docs/**", "**/dist/**"] } },
  plugins: [
    {
      name: "published-source-entry",
      apply: "build",
      transformIndexHtml(html) {
        // This redirect belongs only to the source entry served by GitHub Pages.
        return html.replace(
          /<!-- source-pages-entry -->[\s\S]*?<!-- \/source-pages-entry -->/g,
          "",
        );
      },
      generateBundle(_, bundle) {
        const files = Object.keys(bundle).filter((x) => /\.(js|css)$/.test(x));
        const version = "soul-land-" + files.join("-");
        const precache = [
          "./",
          "./index.html",
          "./ashen-veil.jpg",
          "./soul-icon.svg",
          "./manifest.webmanifest",
          ...files.map((x) => "./" + x),
        ];
        const script = `const CACHE=${JSON.stringify(version)};const FILES=${JSON.stringify(precache)};
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('soul-land-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;event.respondWith(fetch(event.request).catch(()=>caches.match(event.request).then(cached=>cached||Response.error())));});`;
        this.emitFile({ type: "asset", fileName: "sw.js", source: script });
      },
    },
  ],
});
