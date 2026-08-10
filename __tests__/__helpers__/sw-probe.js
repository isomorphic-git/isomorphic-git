/* eslint-env serviceworker */
// Minimal service worker used by test-sw-probe.js to verify — on every browser
// and CI tunnel — that (1) a Service Worker can be *registered* (i.e. the page is
// a secure context) and (2) it can actually *intercept* the page's requests.
//
// This is only a diagnostic probe; it is NOT the fixtures-serving worker yet. It
// answers a single probe URL and lets every other request fall through to the
// network untouched, so it cannot affect the other specs in the run.
//
// Served at the origin root as `/sw-probe.js` (see the karma proxy) so its scope
// is `/`, which covers both the karma context page and the fixture URLs under
// `/base/`. A worker scoped to a sub-path could not control the context page.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', event =>
  event.waitUntil(self.clients.claim())
)
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url)
  if (url.pathname === '/__sw_probe_ping__') {
    event.respondWith(
      new Response('pong-from-sw', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      })
    )
  }
  // Any other request: do not call respondWith() -> the browser performs the
  // normal network fetch, so fixtures and karma traffic are unaffected.
})
