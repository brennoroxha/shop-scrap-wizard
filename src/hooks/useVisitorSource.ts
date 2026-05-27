import { useEffect, useState } from "react";

const STORAGE_KEY = "from_google_ad";
const AD_PARAMS = ["gad_source", "gad_campaignid", "gbraid", "gclid", "utm_source"];

function detect(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (sessionStorage.getItem(STORAGE_KEY) === "true") return true;
    const params = new URLSearchParams(window.location.search);
    const hit = AD_PARAMS.some((p) => params.has(p));
    if (hit) {
      sessionStorage.setItem(STORAGE_KEY, "true");
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

export function useVisitorSource() {
  const [fromGoogleAd, setFromGoogleAd] = useState<boolean>(() => detect());

  useEffect(() => {
    if (!fromGoogleAd) {
      const v = detect();
      if (v) setFromGoogleAd(true);
    }
  }, [fromGoogleAd]);

  return { fromGoogleAd };
}

export default useVisitorSource;
