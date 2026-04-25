import { useState, useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { Network, type ConnectionStatus } from "@capacitor/network";

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [connectionType, setConnectionType] = useState<string>("unknown");

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      setIsOnline(navigator.onLine);
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }

    let cleanup: (() => void) | undefined;

    const init = async () => {
      try {
        const status: ConnectionStatus = await Network.getStatus();
        setIsOnline(status.connected);
        setConnectionType(status.connectionType);

        const listener = await Network.addListener(
          "networkStatusChange",
          (status: ConnectionStatus) => {
            setIsOnline(status.connected);
            setConnectionType(status.connectionType);
          },
        );

        cleanup = () => listener.remove();
      } catch {
        // Network plugin not available
      }
    };

    init();

    return () => {
      cleanup?.();
    };
  }, []);

  return { isOnline, connectionType };
}