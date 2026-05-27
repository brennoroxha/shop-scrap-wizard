import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const CACHE_KEY = "logo_protection_enabled";
const SETTING_KEY = "logo_protection_enabled";

function readCache(): boolean | null {
  if (typeof window === "undefined") return null;
  try {
    const v = sessionStorage.getItem(CACHE_KEY);
    if (v === "true") return true;
    if (v === "false") return false;
    return null;
  } catch {
    return null;
  }
}

export function useLogoProtectionSetting(): boolean {
  // Default to false (disabled) — protection is opt-in via admin panel.
  const [enabled, setEnabled] = useState<boolean>(() => {
    const cached = readCache();
    return cached === null ? false : cached;
  });

  useEffect(() => {
    let cancelled = false;
    const cached = readCache();
    if (cached !== null) return;

    supabase
      .from("site_settings")
      .select("value")
      .eq("key", SETTING_KEY)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        const isEnabled = data?.value === "true";
        try {
          sessionStorage.setItem(CACHE_KEY, isEnabled ? "true" : "false");
        } catch {}
        setEnabled(isEnabled);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return enabled;
}

export function clearLogoProtectionCache() {
  try {
    sessionStorage.removeItem(CACHE_KEY);
  } catch {}
}
