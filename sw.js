/* Alto Andino: only for notifications (nothing is cached here, the app always loads fresh from the site). */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));
self.addEventListener("push", e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (x) { d = { body: e.data ? e.data.text() : "" }; }
  e.waitUntil(self.registration.showNotification(d.title || "Alto Andino", {
    body: d.body || "", tag: d.tag || undefined, icon: "assets/icons/icon-192.png?v=2", badge: "assets/icons/icon-192.png?v=2", data: { url: d.url || "./" }
  }));
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || "./", self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
    const w = list.find(c => c.url.indexOf(self.registration.scope) === 0 && "focus" in c);
    if (w) return w.focus().then(c => (c && "navigate" in c ? c.navigate(url) : null)).catch(() => self.clients.openWindow(url));
    return self.clients.openWindow(url);
  }));
});
