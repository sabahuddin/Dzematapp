import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { getCookieConsent } from "@/components/CookieConsent";

const VISITOR_ID_KEY = "dzematapp_visitor_id";
const SESSION_ID_KEY = "dzematapp_session_id";

function getOrCreateId(key: string, isSession = false): string {
  const storage = isSession ? sessionStorage : localStorage;
  let id = storage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    storage.setItem(key, id);
  }
  return id;
}

function getSite(): string {
  const hostname = window.location.hostname;
  if (hostname === "dzematapp.com" || hostname === "www.dzematapp.com") {
    return "marketing";
  }
  if (hostname.includes("app.dzematapp") || hostname.includes("app.")) {
    return "app";
  }
  return "app";
}

export async function trackPageView(path?: string) {
  const consent = getCookieConsent();
  if (consent !== "accepted") {
    return;
  }

  try {
    const visitorId = getOrCreateId(VISITOR_ID_KEY);
    const sessionId = getOrCreateId(SESSION_ID_KEY, true);
    const site = getSite();
    const currentPath = path || window.location.pathname;

    await fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        site,
        path: currentPath,
        visitorId,
        sessionId,
        referrer: document.referrer || null,
      }),
    });
  } catch (error) {
    console.error("[Analytics] Failed to track page view:", error);
  }
}

export function usePageTracking() {
  const [location] = useLocation();
  const tracked = useRef<Set<string>>(new Set());

  useEffect(() => {
    const consent = getCookieConsent();
    if (consent !== "accepted") return;

    if (!tracked.current.has(location)) {
      tracked.current.add(location);
      trackPageView(location);
    }
  }, [location]);
}

export function useAnalytics() {
  const hasConsent = getCookieConsent() === "accepted";
  
  return {
    hasConsent,
    trackPageView,
  };
}
