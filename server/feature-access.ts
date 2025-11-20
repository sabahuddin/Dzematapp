import type { Request, Response, NextFunction } from "express";
import { db } from "./db";
import { tenants, subscriptionPlans } from "@shared/schema";
import { eq, and } from "drizzle-orm";

/**
 * Middleware to check if a tenant has access to a specific module/feature
 * Usage: app.get("/api/shop/products", requireFeature("shop"), handler)
 */
export function requireFeature(moduleId: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = req.session as any;
      const tenantId = session.tenantId;
      
      // Super Admin bypass - has access to everything
      if (session.isSuperAdmin) {
        return next();
      }
      
      if (!tenantId) {
        return res.status(401).json({ 
          message: "Authentication required",
          upgradeRequired: false
        });
      }
      
      // Get tenant subscription tier
      const [tenant] = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, tenantId))
        .limit(1);
      
      if (!tenant) {
        return res.status(404).json({ message: "Tenant not found" });
      }
      
      // Check if subscription is active
      if (tenant.subscriptionStatus !== 'active' && tenant.subscriptionStatus !== 'trial') {
        return res.status(403).json({ 
          message: "Subscription inactive. Please contact support.",
          upgradeRequired: false,
          subscriptionStatus: tenant.subscriptionStatus
        });
      }
      
      // Get plan configuration from database
      const [plan] = await db
        .select()
        .from(subscriptionPlans)
        .where(and(
          eq(subscriptionPlans.slug, tenant.subscriptionTier),
          eq(subscriptionPlans.isActive, true)
        ))
        .limit(1);
      
      if (!plan) {
        return res.status(500).json({ message: "Invalid subscription plan" });
      }
      
      // Check if module is enabled in the plan
      const hasAccess = plan.enabledModules?.includes(moduleId) || false;
      
      if (!hasAccess) {
        const requiredPlan = await getRequiredPlan(moduleId);
        return res.status(403).json({ 
          message: `Feature "${moduleId}" not available in your ${plan.name} plan`,
          upgradeRequired: true,
          currentPlan: tenant.subscriptionTier,
          requiredPlan
        });
      }
      
      next();
    } catch (error) {
      console.error('[FEATURE ACCESS] Error checking feature access:', error);
      res.status(500).json({ message: "Failed to verify feature access" });
    }
  };
}

/**
 * Helper function to determine which plan includes a specific module
 */
async function getRequiredPlan(moduleId: string): Promise<string> {
  // Query plans in order from lowest to highest tier
  const plans = await db
    .select()
    .from(subscriptionPlans)
    .where(eq(subscriptionPlans.isActive, true))
    .orderBy(subscriptionPlans.priceMonthly);
  
  for (const plan of plans) {
    if (plan.enabledModules?.includes(moduleId)) {
      return plan.slug;
    }
  }
  
  return "full"; // Default to full if not found
}

/**
 * Get tenant's current subscription info with feature access details
 */
export async function getTenantSubscriptionInfo(tenantId: string) {
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);
  
  if (!tenant) {
    return null;
  }
  
  // Get plan from database instead of in-memory constant
  const [plan] = await db
    .select()
    .from(subscriptionPlans)
    .where(and(
      eq(subscriptionPlans.slug, tenant.subscriptionTier),
      eq(subscriptionPlans.isActive, true)
    ))
    .limit(1);
  
  return {
    tenantId: tenant.id,
    tenantName: tenant.name,
    subscriptionTier: tenant.subscriptionTier,
    subscriptionStatus: tenant.subscriptionStatus,
    plan: plan ? {
      name: plan.name,
      slug: plan.slug,
      description: plan.description,
      priceMonthly: plan.priceMonthly,
      priceYearly: plan.priceYearly,
      currency: plan.currency,
      enabledModules: plan.enabledModules || [],
      readOnlyModules: plan.readOnlyModules || [],
      maxUsers: plan.maxUsers,
      maxStorage: plan.maxStorage
    } : null,
    trialEndsAt: tenant.trialEndsAt,
    isActive: tenant.isActive
  };
}
