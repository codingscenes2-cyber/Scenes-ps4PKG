import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
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
        const publicFiles = [
          "ashen-veil.jpg",
          "soul-icon.svg",
          "manifest.webmanifest",
          "guide.html",
          ...readdirSync("public/screenshots").map((f) => "screenshots/" + f),
        ];
        const version = createHash("sha256")
          .update(files.join("-"))
          .update(
            publicFiles
              .map((f) => readFileSync("public/" + f))
              .map((b) => createHash("sha256").update(b).digest("hex"))
              .join("-"),
          )
          .digest("hex")
          .slice(0, 16);
        const precache = [
          "./",
          "./index.html",
          ...publicFiles.map((f) => "./" + f),
          ...files.map((x) => "./" + x),
        ];
        const script = `const PREFIX="soul-land:"+self.registration.scope+":";const CACHE=PREFIX+${JSON.stringify(version)};const FILES=${JSON.stringify(precache)};
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('message',event=>{if(event.data?.type!=='SOUL_CACHE_STATUS')return;event.waitUntil(caches.open(CACHE).then(cache=>cache.keys()).then(keys=>event.ports[0]?.postMessage({ready:keys.length>=FILES.length,scope:self.registration.scope})));});
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin||!url.href.startsWith(self.registration.scope))return;event.respondWith(fetch(event.request).catch(()=>caches.open(CACHE).then(cache=>cache.match(event.request,{ignoreSearch:true})).then(cached=>cached||Response.error())));});`;
        this.emitFile({ type: "asset", fileName: "sw.js", source: script });
      },
    },
  ],
});
