// Remparts Fantasy — Push Notification Service Worker

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(clients.claim()));

self.addEventListener('push', event => {
  if (!event.data) return;
  let payload;
  try { payload = event.data.json(); } catch { payload = { title: 'Remparts Fantasy', body: event.data.text() }; }

  const { title, body, url } = payload;
  event.waitUntil(
    self.registration.showNotification(title ?? 'Remparts Fantasy', {
      body:    body ?? '',
      icon:    '/favicon.svg',
      badge:   '/favicon.svg',
      vibrate: [100, 50, 100],
      tag:     'remparts-fantasy',      // replace old notifications of same type
      renotify: true,
      data:    { url: url ?? '/' },
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url ?? '/';
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(list => {
        const existing = list.find(c => c.url.includes(self.location.origin) && 'focus' in c);
        return existing ? existing.focus() : clients.openWindow(url);
      })
  );
});
