export function getServiceWorkerScript(): string {
	return `
const CACHE_NAME = 'directus-pwa-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Network-only for API calls and auth
  if (
    url.pathname.startsWith('/auth/') ||
    url.pathname.startsWith('/items/') ||
    url.pathname.startsWith('/graphql') ||
    url.pathname.startsWith('/flows/') ||
    url.pathname.startsWith('/activity/') ||
    url.pathname.startsWith('/collections/') ||
    url.pathname.startsWith('/fields/') ||
    url.pathname.startsWith('/relations/') ||
    url.pathname.startsWith('/permissions/') ||
    url.pathname.startsWith('/roles/') ||
    url.pathname.startsWith('/users/') ||
    url.pathname.startsWith('/settings') ||
    url.pathname.startsWith('/files') ||
    url.pathname.startsWith('/folders') ||
    event.request.method !== 'GET'
  ) {
    return;
  }

  // Cache-first for hashed admin assets (immutable)
  if (url.pathname.startsWith('/admin/assets/')) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Network-first for navigation requests
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match(event.request)
      )
    );
    return;
  }
});
`;
}
