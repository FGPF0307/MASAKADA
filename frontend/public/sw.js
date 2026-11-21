// Service worker MasakAda: cangkang aplikasi tersedia offline. Panggilan /api tidak pernah disimpan
// (data pantry/resep selalu dari server); saat offline halaman menampilkan banner "Kamu sedang offline".
const VERSI = 'masakada-v1'

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSI).then((c) => c.addAll(['/', '/manifest.webmanifest', '/icon-192.png'])).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSI).map((k) => caches.delete(k)))).then(() => self.clients.claim()))
})

self.addEventListener('fetch', (e) => {
  const r = e.request
  const u = new URL(r.url)
  if (r.method !== 'GET' || u.origin !== location.origin || u.pathname.startsWith('/api')) return
  if (r.mode === 'navigate') {
    e.respondWith(fetch(r).catch(() => caches.match('/'))) // offline: tampilkan cangkang aplikasi
    return
  }
  // Aset berhash dari build: simpan saat pertama dipakai, lalu pakai dari cache.
  e.respondWith(
    caches.match(r).then(
      (hit) =>
        hit ??
        fetch(r).then((res) => {
          if (res.ok) { const salin = res.clone(); caches.open(VERSI).then((c) => c.put(r, salin)) }
          return res
        }),
    ),
  )
})
