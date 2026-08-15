/* 通学の電車や地下鉄など、通信の届かない場所でも開けるようにする。
   一問一答を回したい場面と、圏外になる場面はほとんど重なっている。

   問題を直したときは、必ず下の版を1つ上げること。
   上げ忘れると、古い問題が端末に貼りついたまま新しいものに入れ替わらない。 */
const VERSION = 'v1';
const CACHE = `gassen-${VERSION}`;

// 起動に要るものは先に取っておく。これが揃っていれば圏外でも出陣できる
const CORE = [
  './',
  './index.html',
  './boss.png',
  './sounds/slash.mp3',
  './history.json',
  './math.json',
  './science.json',
  './geography.json',
  './english.json',
  './english_order.json',
  './civics.json',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      // 1つでも失敗すると全部やり直しになるので、1件ずつ入れる
      .then(cache => Promise.all(CORE.map(url => cache.add(url).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(names => Promise.all(names.filter(n => n !== CACHE).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // 先に手元のものを返して待たせない。裏で新しいものに入れ替えておき、
  // 次に開いたときには最新になっている
  e.respondWith(
    caches.match(req).then(hit => {
      const fresh = fetch(req).then(res => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(cache => cache.put(req, copy));
        }
        return res;
      }).catch(() => hit);
      return hit || fresh;
    })
  );
});
