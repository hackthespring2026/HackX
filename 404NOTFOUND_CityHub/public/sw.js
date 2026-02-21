/// <reference lib="webworker" />

// CityHub Service Worker for Web Push Notifications
self.addEventListener("install", (event) => {
  self.skipWaiting();
});
self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();

    const options = {
      body: data.body || data.message || "You have a new notification",
      icon: "/icons/cityhub-192.png",
      badge: "/icons/cityhub-badge.png",
      tag: data.tag || "cityhub-notification",
      renotify: true,
      data: {
        url: data.url || "/",
        groupId: data.groupId,
        type: data.type,
      },
      actions: [
        { action: "open", title: "Open" },
        { action: "dismiss", title: "Dismiss" },
      ],
    };

    event.waitUntil(
      self.registration.showNotification(data.title || "CityHub", options)
    );
  } catch {
    // Fallback for plain text
    event.waitUntil(
      self.registration.showNotification("CityHub", {
        body: event.data.text(),
        icon: "/icons/cityhub-192.png",
      })
    );
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") return;

  const url = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Focus existing tab if available
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      // Open new tab
      return clients.openWindow(url);
    })
  );
});

// Activate immediately
self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});
