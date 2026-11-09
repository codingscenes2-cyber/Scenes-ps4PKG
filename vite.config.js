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
          .update("fresh-offline-v3")
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
        const script = `const PREFIX="soul-land:"+self.registration.scope+":";const REVISION=${JSON.stringify(version)};const CACHE=PREFIX+REVISION;const FILES=${JSON.stringify(precache)};
const fresh=url=>{const u=new URL(url,self.registration.scope);u.searchParams.set('__soul_revision',REVISION);return u.href;};
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>Promise.all(FILES.map(async file=>{const canonical=new URL(file,self.registration.scope).href;const response=await fetch(fresh(canonical),{cache:'reload'});if(!response.ok)throw new Error('Precache failed');await cache.put(canonical,response);}))).then(()=>self.skipWaiting())));
self.addEventListener('message',event=>{if(event.data?.type!=='SOUL_CACHE_STATUS')return;event.waitUntil(caches.open(CACHE).then(cache=>cache.keys()).then(keys=>event.ports[0]?.postMessage({ready:keys.length>=FILES.length,scope:self.registration.scope})));});
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin||!FILES.some(f=>new URL(f,self.registration.scope).pathname===url.pathname))return;event.respondWith(fetch(fresh(url.href),{cache:'reload'}).catch(()=>caches.open(CACHE).then(cache=>cache.match(event.request,{ignoreSearch:true})).then(cached=>cached||Response.error())));});`;
        this.emitFile({ type: "asset", fileName: "sw.js", source: script });
      },
    },
  ],
});
