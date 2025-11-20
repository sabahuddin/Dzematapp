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
    readOnlyModules: [],
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
    readOnlyModules: [],
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

import { db } from "./db";
import { subscriptionPlans } from "@shared/schema";
import { eq } from "drizzle-orm";

/**
 * Seed subscription plans to the database on startup
 */
export async function seedSubscriptionPlans() {
  try {
    for (const [key, plan] of Object.entries(SUBSCRIPTION_PLANS)) {
      const existing = await db.select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.slug, plan.slug))
        .limit(1);
      
      if (existing.length === 0) {
        await db.insert(subscriptionPlans).values({
          name: plan.name,
          slug: plan.slug,
          description: plan.description,
          priceMonthly: plan.priceMonthly,
          priceYearly: plan.priceYearly,
          currency: plan.currency,
          enabledModules: plan.enabledModules,
          readOnlyModules: plan.readOnlyModules,
          maxUsers: plan.maxUsers,
          maxStorage: plan.maxStorage,
          isActive: plan.isActive
        });
        console.log(`✅ Seeded subscription plan: ${plan.name}`);
      }
    }
  } catch (error) {
    console.error('❌ Error seeding subscription plans:', error);
  }
}
