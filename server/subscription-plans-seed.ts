// Subscription Plans Configuration
export const SUBSCRIPTION_PLANS = {
  basic: {
    name: "Basic",
    slug: "basic",
    description: "Osnovne funkcionalnosti za male džemate",
    priceMonthly: "29.00",
    priceYearly: "290.00",
    currency: "EUR",
    enabledModules: [
      "dashboard",
      "announcements",
      "events",
      "users",
      "vaktija",
      "vodic"
    ],
    readOnlyModules: [
      "tasks",      // Preview only
      "messages",   // Preview only
      "shop"        // Preview only
    ],
    maxUsers: 50,
    maxStorage: 500, // MB
    isActive: true
  },
  
  standard: {
    name: "Standard",
    slug: "standard",
    description: "Proširene funkcionalnosti za srednje džemate",
    priceMonthly: "39.00",
    priceYearly: "390.00",
    currency: "EUR",
    enabledModules: [
      "dashboard",
      "announcements",
      "events",
      "users",
      "tasks",
      "messages",
      "documents",
      "vaktija",
      "vodic",
      "finances",
      "projects",
      "feed"
    ],
    readOnlyModules: [
      "shop",           // Preview only
      "certificates",   // Preview only
      "livestream"      // Preview only
    ],
    maxUsers: 200,
    maxStorage: 2000, // MB
    isActive: true
  },
  
  full: {
    name: "Full",
    slug: "full",
    description: "Sve funkcionalnosti - bez ograničenja",
    priceMonthly: "49.00",
    priceYearly: "490.00",
    currency: "EUR",
    enabledModules: [
      "dashboard",
      "announcements",
      "events",
      "users",
      "tasks",
      "messages",
      "documents",
      "shop",
      "marketplace",
      "ask-imam",
      "livestream",
      "certificates",
      "badges",
      "vaktija",
      "vodic",
      "finances",
      "projects",
      "applications",
      "feed",
      "activity-log"
    ],
    readOnlyModules: [],
    maxUsers: null, // Unlimited
    maxStorage: null, // Unlimited
    isActive: true
  }
};

// Module to feature name mapping (for user-friendly messages)
export const MODULE_DISPLAY_NAMES: Record<string, string> = {
  "shop": "DžematShop",
  "marketplace": "Marketplace",
  "certificates": "Zahvalnice",
  "badges": "Značke i priznanja",
  "livestream": "Live prijenos",
  "ask-imam": "Pitaj imama",
  "tasks": "Sekcije i zadaci",
  "messages": "Poruke",
  "finances": "Potpune finansije",
  "applications": "Pristupnice i aplikacije"
};
