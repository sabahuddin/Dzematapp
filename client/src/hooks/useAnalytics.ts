import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { getCookieConsent } from "@/components/CookieConsent";

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

let gaInitialized = false;

export function initGA() {
  if (gaInitialized) return;
  
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (!measurementId) {
    console.warn('[Analytics] Missing VITE_GA_MEASUREMENT_ID');
    return;
  }

  const script1 = document.createElement('script');
  script1.async = true;
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script1);

  const script2 = document.createElement('script');
  script2.textContent = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${measurementId}');
  `;
  document.head.appendChild(script2);
  
  gaInitialized = true;
  console.log('[Analytics] Google Analytics initialized');
}

export async function trackPageView(path?: string) {
  const consent = getCookieConsent();
  if (consent !== "accepted") {
    return;
  }

  if (!gaInitialized) {
    initGA();
  }

  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  const currentPath = path || window.location.pathname;

  if (typeof window !== 'undefined' && window.gtag && measurementId) {
    window.gtag('config', measurementId, {
      page_path: currentPath
    });
  }
}

export function trackEvent(
  action: string, 
  category?: string, 
  label?: string, 
  value?: number
) {
  if (typeof window === 'undefined' || !window.gtag) return;
  
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
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
