import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import { SplashScreen } from "@capacitor/splash-screen";
import { Keyboard, KeyboardResize } from "@capacitor/keyboard";
import { App } from "@capacitor/app";

export function useNativePlugins() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const init = async () => {
      try {
        await StatusBar.setStyle({ style: Style.Light });
        await StatusBar.setBackgroundColor({ color: "#ffffff" });
      } catch {
        // StatusBar not available on this platform
      }

      try {
        await SplashScreen.hide({ fadeOutDuration: 300 });
      } catch {
        // SplashScreen not available
      }

      try {
        await Keyboard.setResizeMode({ mode: KeyboardResize.Native });
      } catch {
        // Keyboard not available
      }
    };

    init();

    const backButton = App.addListener("backButton", () => {
      // Prevents accidental app exit on Android
    });

    return () => {
      backButton.then((handle) => handle.remove());
    };
  }, []);
}

export function useDeepLinks() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const listener = App.addListener("appUrlOpen", (data: { url: string }) => {
      const url = new URL(data.url);
      const slug = url.pathname;

      if (slug) {
        window.location.href = slug;
      }
    });

    return () => {
      listener.then((handle) => handle.remove());
    };
  }, []);
}