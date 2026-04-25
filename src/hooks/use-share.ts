import { useCallback } from "react";
import { Capacitor } from "@capacitor/core";
import { Share } from "@capacitor/share";

export function useShare() {
  const share = useCallback(
    async (options: { title?: string; text?: string; url?: string }) => {
      if (Capacitor.isNativePlatform()) {
        try {
          await Share.share({
            title: options.title,
            text: options.text,
            url: options.url,
          });
        } catch (e) {
          // User cancelled or share failed - fall back to clipboard
          if ((e as Error)?.message !== "User cancelled") {
            await fallbackCopyToClipboard(options.url ?? options.text ?? "");
          }
        }
      } else {
        // Web fallback
        if (navigator.share) {
          try {
            await navigator.share({
              title: options.title,
              text: options.text,
              url: options.url,
            });
          } catch {
            await fallbackCopyToClipboard(options.url ?? options.text ?? "");
          }
        } else {
          await fallbackCopyToClipboard(options.url ?? options.text ?? "");
        }
      }
    },
    [],
  );

  return { share };
}

async function fallbackCopyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }
}