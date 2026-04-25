import { useEffect, useState, useCallback } from "react";
import { getToken, onMessage } from "firebase/messaging";
import { getFirebaseMessaging } from "@/lib/firebase";
import { saveFcmToken } from "@/lib/push-notifications";
import { useAuth } from "@/providers/auth-provider";

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

export function usePushNotification() {
  const [token, setToken] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );
  const { user } = useAuth();

  const requestPermission = useCallback(async () => {
    if (typeof Notification === "undefined") return false;
    const result = await Notification.requestPermission();
    setPermission(result);
    return result === "granted";
  }, []);

  const registerToken = useCallback(async () => {
    if (!user) return null;
    const messaging = await getFirebaseMessaging();
    if (!messaging || permission !== "granted") return null;

    try {
      const currentToken = await getToken(messaging, { vapidKey: VAPID_KEY });
      if (currentToken) {
        setToken(currentToken);
        await saveFcmToken(user.id, currentToken);
        return currentToken;
      }
    } catch (error) {
      console.error("[PUSH] Failed to get token:", error);
    }
    return null;
  }, [user, permission]);

  useEffect(() => {
    if (permission !== "granted" || !user) return;

    let unsubFn: (() => void) | null = null;

    (async () => {
      const messaging = await getFirebaseMessaging();
      if (!messaging) return;

      unsubFn = onMessage(messaging, (payload) => {
        const { title, body } = payload.notification ?? {};
        new Notification(title ?? "Fecha10", { body: body ?? "" });
      });
    })();

    return () => {
      if (unsubFn) unsubFn();
    };
  }, [permission, user]);

  return { token, permission, requestPermission, registerToken };
}