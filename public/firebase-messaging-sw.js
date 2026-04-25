importScripts("https://www.gstatic.com/firebasejs/11.6.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/11.6.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyCAk47bDA5swrJfY_Z1H6bpNRNt6zoHnL8",
  authDomain: "fecha10-11fcf.firebaseapp.com",
  projectId: "fecha10-11fcf",
  storageBucket: "fecha10-11fcf.firebasestorage.app",
  messagingSenderId: "976838099448",
  appId: "1:976838099448:web:414f8218d9117393ebd60d"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification ?? {};
  self.registration.showNotification(title ?? "Fecha10", {
    body: body ?? "",
    icon: icon ?? "/icons.svg",
  });
});