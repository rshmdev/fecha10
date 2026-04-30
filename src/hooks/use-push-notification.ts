import { useEffect, useState, useCallback } from "react";
import { getFirebaseMessaging } from "@/lib/firebase";
import { saveFcmToken, removeFcmToken } from "@/lib/push-notifications";
import { useAuth } from "@/providers/auth-provider";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { LocalNotifications } from "@capacitor/local-notifications";

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

const isNative = Capacitor.isNativePlatform();

export function usePushNotification() {
  const [token, setToken] = useState<string | null>(null);
  const [permission, setPermission] = useState<"granted" | "denied" | "prompt" | "unknown">(
    "unknown"
  );
  const { deviceId } = useAuth();

  const requestNativePermission = useCallback(async () => {
    if (!isNative) return false;

    const result = await PushNotifications.requestPermissions();
    const granted = result.receive === "granted";
    setPermission(granted ? "granted" : result.receive === "denied" ? "denied" : "prompt");

    if (granted) {
      await PushNotifications.register();
    }
    return granted;
  }, []);

  const requestWebPermission = useCallback(async () => {
    if (isNative || typeof Notification === "undefined") return false;

    const result = await Notification.requestPermission();
    setPermission(result);
    return result === "granted";
  }, []);

  const requestPermission = useCallback(async () => {
    if (isNative) {
      return requestNativePermission();
    }
    return requestWebPermission();
  }, [isNative, requestNativePermission, requestWebPermission]);

  const registerNativeToken = useCallback(async () => {
    if (!isNative || !deviceId) return null;

    try {
      const result = await PushNotifications.addListener("registration", (tokenResult) => {
        const fcmToken = tokenResult.value;
        setToken(fcmToken);
        saveFcmToken(deviceId, fcmToken);
      });

      return result;
    } catch (error) {
      console.error("[PUSH] Native registration failed:", error);
    }
    return null;
  }, [deviceId]);

  const registerWebToken = useCallback(async () => {
    if (isNative || !deviceId) return null;

    const messaging = await getFirebaseMessaging();
    if (!messaging || permission !== "granted") return null;

    try {
      const { getToken } = await import("firebase/messaging");
      const currentToken = await getToken(messaging, { vapidKey: VAPID_KEY });
      if (currentToken) {
        setToken(currentToken);
        await saveFcmToken(deviceId, currentToken);
        return currentToken;
      }
    } catch (error) {
      console.error("[PUSH] Web token failed:", error);
    }
    return null;
  }, [deviceId, permission]);

  const registerToken = useCallback(async () => {
    if (isNative) {
      return registerNativeToken();
    }
    return registerWebToken();
  }, [isNative, registerNativeToken, registerWebToken]);

  useEffect(() => {
    if (!isNative || !deviceId) return;

    const regListener = PushNotifications.addListener(
      "registration",
      (tokenResult) => {
        const fcmToken = tokenResult.value;
        setToken(fcmToken);
        saveFcmToken(deviceId, fcmToken);
      }
    );

    const errorListener = PushNotifications.addListener(
      "registrationError",
      (error) => {
        console.error("[PUSH] Registration error:", error);
      }
    );

    const receivedListener = PushNotifications.addListener(
      "pushNotificationReceived",
      (notification) => {
        LocalNotifications.schedule({
          notifications: [
            {
              id: Date.now(),
              title: notification.title || "Fecha10",
              body: notification.body || "",
              sound: true,
              badge: true,
              smallIcon: "ic_stat_icon_config_sample",
            },
          ],
        });
      }
    );

    return () => {
      regListener.then((h) => h.remove());
      errorListener.then((h) => h.remove());
      receivedListener.then((h) => h.remove());
    };
  }, [deviceId]);

  useEffect(() => {
    if (isNative || permission !== "granted" || !deviceId) return;

    let unsubFn: (() => void) | null = null;

    (async () => {
      const messaging = await getFirebaseMessaging();
      if (!messaging) return;

      const { onMessage } = await import("firebase/messaging");
      unsubFn = onMessage(messaging, (payload) => {
        const { title, body } = payload.notification ?? {};
        new Notification(title ?? "Fecha10", { body: body ?? "" });
      });
    })();

    return () => {
      if (unsubFn) unsubFn();
    };
  }, [permission, deviceId]);

  useEffect(() => {
    if (!isNative) return;

    PushNotifications.checkPermissions().then((result) => {
      setPermission(
        result.receive === "granted"
          ? "granted"
          : result.receive === "denied"
            ? "denied"
            : "prompt"
      );
    });
  }, []);

  const unregisterToken = useCallback(async () => {
    if (!token) return;

    if (isNative) {
      await PushNotifications.unregister();
    } else {
      await removeFcmToken(token);
    }
    setToken(null);
  }, [token, isNative]);

  return { token, permission, requestPermission, registerToken, unregisterToken };
}
