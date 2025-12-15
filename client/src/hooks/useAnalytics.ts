import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { getCookieConsent } from "@/components/CookieConsent";

const API_URL = window.location.origin;

function generateVisitorId(): string {
  let visitorId = localStorage.getItem('dzematapp_visitor_id');
  if (!visitorId) {
    visitorId = 'v_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem('dzematapp_visitor_id', visitorId);
  }
  return visitorId;
}

function generateSessionId(): string {
  let sessionId = sessionStorage.getItem('dzematapp_session_id');
  if (!sessionId) {
    sessionId = 's_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    sessionStorage.setItem('dzematapp_session_id', sessionId);
  }
  return sessionId;
}

export async function trackPageView(path?: string) {
  const consent = getCookieConsent();
  if (consent !== "accepted") {
    return;
  }

  const currentPath = path || window.location.pathname;
  const site = window.location.hostname.includes('app.') ? 'app' : 'marketing';

  try {
    await fetch(`${API_URL}/api/analytics/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        site,
        path: currentPath,
        visitorId: generateVisitorId(),
        sessionId: generateSessionId(),
        referrer: document.referrer || null,
      }),
    });
  } catch (error) {
    // Silently fail - analytics should not break the app
    console.debug('[Analytics] Track failed:', error);
  }
}

export function trackEvent(
  action: string, 
  category?: string, 
  label?: string, 
  value?: number
) {
  // Simple event tracking - logs to console for now
  // Can be extended to POST to backend if needed
  console.debug('[Analytics] Event:', { action, category, label, value });
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
    trackEvent,
  };
}
