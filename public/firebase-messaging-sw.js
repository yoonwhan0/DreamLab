importScripts(
  "https://www.gstatic.com/firebasejs/11.6.0/firebase-app-compat.js",
  "https://www.gstatic.com/firebasejs/11.6.0/firebase-messaging-compat.js",
);

firebase.initializeApp({
  "apiKey": "AIzaSyA57MTJol_qYwSISORpU94oIn79Yan7H6o",
  "authDomain": "dreamlab-b6a8e.firebaseapp.com",
  "projectId": "dreamlab-b6a8e",
  "storageBucket": "dreamlab-b6a8e.firebasestorage.app",
  "messagingSenderId": "522912633577",
  "appId": "1:522912633577:web:95de2ee62b03f519cbd678"
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
