import { useQuery } from "@tanstack/react-query";

interface SubscriptionPlan {
  name: string;
  slug: string;
  description: string;
  priceMonthly: string;
  priceYearly: string;
  currency: string;
  enabledModules: string[];
  readOnlyModules: string[];
  maxUsers: number | null;
  maxStorage: number | null;
}

interface SubscriptionInfo {
  tenantId: string | null;
  tenantName: string;
  subscriptionTier: string;
  subscriptionStatus: string;
  plan: SubscriptionPlan | null;
  trialEndsAt: string | null;
  isActive: boolean;
}

/**
 * Hook to check if current tenant has access to a specific feature/module
 * @param moduleId - Module identifier (e.g., "shop", "certificates", "livestream")
 * @returns Feature access information with upgrade requirements
 */
export function useFeatureAccess(moduleId: string) {
  const { data: subscription, isLoading } = useQuery<SubscriptionInfo>({
    queryKey: ['/api/subscription/current'],
    staleTime: 60000, // Cache for 1 minute
  });

  if (isLoading || !subscription || !subscription.plan) {
    return {
      isLoading,
      isEnabled: false,
      isReadOnly: false,
      upgradeRequired: false,
      currentPlan: null,
      requiredPlan: null,
      subscription: null
    };
  }

  const { plan } = subscription;
  const isEnabled = plan.enabledModules.includes(moduleId);
  
  return {
    isLoading: false,
    isEnabled,
    isReadOnly: false, // Simplified: no read-only mode
    upgradeRequired: !isEnabled,
    currentPlan: subscription.subscriptionTier,
    requiredPlan: getRequiredPlan(moduleId),
    subscription
  };
}

/**
 * Get current tenant's subscription information
 */
export function useSubscription() {
  return useQuery<SubscriptionInfo>({
    queryKey: ['/api/subscription/current'],
    staleTime: 60000,
  });
}

/**
 * Helper to determine which plan is required for a module
 */
function getRequiredPlan(moduleId: string): string {
  // Basic plan modules
  const basicModules = ["dashboard", "announcements", "events", "users", "vaktija", "vodic"];
  if (basicModules.includes(moduleId)) {
    return "basic";
  }
  
  // Standard plan modules
  const standardModules = [
    ...basicModules,
    "tasks", "messages", "documents", "finances", "projects", "feed"
  ];
  if (standardModules.includes(moduleId)) {
    return "standard";
  }
  
  // Full plan modules
  return "full";
}

/**
 * Get user-friendly module display name
 */
export function getModuleDisplayName(moduleId: string): string {
  const displayNames: Record<string, string> = {
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
  
  return displayNames[moduleId] || moduleId;
}
