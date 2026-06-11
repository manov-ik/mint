"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import { useApi } from "@/lib/api-client";
import { useSession } from "next-auth/react";

/**
 * Fetches the user's saved theme from the API on first load and applies it.
 * Mounted in the root layout so it runs on every page, not just settings.
 */
export function ThemeSync() {
  const { setTheme } = useTheme();
  const { fetchApi } = useApi();
  const { status } = useSession();
  const isSignedIn = status === "authenticated";

  useEffect(() => {
    if (!isSignedIn) return;

    async function syncTheme() {
      try {
        const res = await fetchApi("/settings", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data.theme) setTheme(data.theme);
        }
      } catch {
        // Silently fail — next-themes will use defaultTheme
      }
    }

    syncTheme();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn]);

  return null;
}
