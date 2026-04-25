import { Capacitor } from "@capacitor/core";
import { Toast } from "@capacitor/toast";

export function useNativeToast() {
  const show = async (
    message: string,
    options?: { duration?: "short" | "long"; position?: "top" | "center" | "bottom" },
  ) => {
    const duration = options?.duration ?? "short";
    const position = options?.position ?? "bottom";

    if (Capacitor.isNativePlatform()) {
      try {
        await Toast.show({ text: message, duration, position });
        return;
      } catch {
        // Fallback to web
      }
    }

    // Web fallback
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Fecha10", { body: message });
    } else {
      console.log("[Toast]", message);
    }
  };

  return { show };
}