import { useQuery } from "@tanstack/react-query";
import i18n from "@/i18n";

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
  // Super Admin has access to everything (plan name is usually "Full" or similar for super admin)
  const isEnabled = plan.enabledModules.includes(moduleId) || plan.enabledModules.includes("*") || subscription.subscriptionTier === 'full' || plan.name?.includes('Super');
  
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
 * Get user-friendly module display name using i18n
 */
export function getModuleDisplayName(moduleId: string): string {
  const t = i18n.t.bind(i18n);
  
  const translationKeys: Record<string, string> = {
    "shop": "navigation:menu.shop",
    "marketplace": "common:entityTypes.shop_item",
    "certificates": "navigation:menu.allCertificates",
    "badges": "navigation:menu.badges",
    "livestream": "navigation:menu.livestream",
    "ask-imam": "navigation:menu.askImam",
    "tasks": "navigation:menu.tasks",
    "messages": "navigation:menu.messages",
    "finances": "navigation:menu.finances",
    "applications": "navigation:menu.applications"
  };
  
  const key = translationKeys[moduleId];
  if (key) {
    return t(key);
  }
  
  return moduleId;
}
