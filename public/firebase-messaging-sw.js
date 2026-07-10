importScripts(
  "https://www.gstatic.com/firebasejs/11.6.0/firebase-app-compat.js",
  "https://www.gstatic.com/firebasejs/11.6.0/firebase-messaging-compat.js",
);

firebase.initializeApp({
  "apiKey": "PLACEHOLDER",
  "authDomain": "PLACEHOLDER",
  "projectId": "PLACEHOLDER",
  "storageBucket": "PLACEHOLDER",
  "messagingSenderId": "PLACEHOLDER",
  "appId": "PLACEHOLDER"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title ?? "꿈연구소(DreamLab)";
  const options = {
    body: payload.notification?.body,
    icon: "/pwa-192x192.png",
    data: payload.data,
  };
  self.registration.showNotification(title, options);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/";
  event.waitUntil(clients.openWindow(url));
});
