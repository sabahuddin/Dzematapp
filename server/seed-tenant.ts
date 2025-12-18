/**
 * Seed Default Tenant - Kreira prvi džemat i SuperAdmin korisnika
 * 
 * IMPORTANT: SuperAdmin lives in a GLOBAL tenant (tenant-superadmin-global)
 * that is NOT visible to regular users. Each regular tenant gets its OWN admin.
 */

import { db } from './db';
import { 
  tenants, 
  subscriptionPlans,
  users,
  badges
} from '@shared/schema';
import { eq, and } from 'drizzle-orm';

// Global tenant for SuperAdmin only - never shown to regular users
const SUPERADMIN_TENANT_ID = 'tenant-superadmin-global';
const DEFAULT_TENANT_ID = 'default-tenant-demo';

export async function seedDefaultTenant() {
  console.log('🌱 Starting default tenant seed...\n');

  try {
    // 1. Create subscription plans if they don't exist
    console.log('📋 Creating subscription plans...');
    
    const existingPlans = await db.select().from(subscriptionPlans);
    
    if (existingPlans.length === 0) {
      await db.insert(subscriptionPlans).values([
        {
          id: 'plan-basic',
          name: 'Basic',
          slug: 'basic',
          description: 'Osnovni paket za manje džemate',
          priceMonthly: '29.00',
          priceYearly: '290.00',
          currency: 'EUR',
          enabledModules: ['dashboard', 'announcements', 'events', 'vaktija', 'activity', 'guide', 'requests'],
          readOnlyModules: ['tasks', 'messages', 'askImam', 'shop', 'finances', 'projects', 'badges', 'points', 'certificates', 'documents', 'media'],
          maxUsers: 100,
          maxStorage: 1000,
          isActive: true,
        },
        {
          id: 'plan-standard',
          name: 'Standard',
          slug: 'standard',
          description: 'Srednji paket sa većinom funkcija',
          priceMonthly: '79.00',
          priceYearly: '790.00',
          currency: 'EUR',
          enabledModules: ['dashboard', 'users', 'announcements', 'events', 'tasks', 'messages', 'askImam', 'requests', 'vaktija', 'activity', 'documents', 'guide', 'settings'],
          readOnlyModules: ['shop', 'finances', 'projects', 'badges', 'points', 'certificates', 'media'],
          maxUsers: 500,
          maxStorage: 5000,
          isActive: true,
        },
        {
          id: 'plan-full',
          name: 'Full',
          slug: 'full',
          description: 'Kompletan paket sa svim funkcijama',
          priceMonthly: '149.00',
          priceYearly: '1490.00',
          currency: 'EUR',
          enabledModules: ['dashboard', 'users', 'announcements', 'events', 'tasks', 'workgroups', 'membership', 'messages', 'askImam', 'requests', 'shop', 'marketplace', 'vaktija', 'finances', 'projects', 'activity', 'activity-log', 'badges', 'points', 'certificates', 'documents', 'media', 'livestream', 'settings', 'guide', 'sponsors', 'applications'],
          readOnlyModules: [],
          maxUsers: null,
          maxStorage: null,
          isActive: true,
        },
      ]);
      console.log('✅ Subscription plans created\n');
    } else {
      // UPDATE existing plans with latest modules
      console.log('📋 Updating existing subscription plans with latest modules...');
      
      const fullPlanModules = ['dashboard', 'users', 'announcements', 'events', 'tasks', 'workgroups', 'membership', 'messages', 'askImam', 'requests', 'shop', 'marketplace', 'vaktija', 'finances', 'projects', 'activity', 'activity-log', 'badges', 'points', 'certificates', 'documents', 'media', 'livestream', 'settings', 'guide', 'sponsors', 'applications'];
      
      await db
        .update(subscriptionPlans)
        .set({ enabledModules: fullPlanModules })
        .where(eq(subscriptionPlans.slug, 'full'));
      
      console.log('✅ Full plan modules updated\n');
    }

    // 2. Create GLOBAL SuperAdmin tenant (hidden from regular users)
    console.log('🔐 Creating SuperAdmin global tenant...');
    
    const existingSuperAdminTenant = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, SUPERADMIN_TENANT_ID))
      .limit(1);

    if (existingSuperAdminTenant.length === 0) {
      const superAdminTenantData: any = {
        id: SUPERADMIN_TENANT_ID,
        name: 'SuperAdmin Global',
        slug: 'superadmin-global',
        subdomain: 'superadmin',
        email: 'superadmin@dzematapp.com',
        tenantCode: 'SUPERADMIN_ONLY',
        subscriptionTier: 'full',
        subscriptionStatus: 'active',
        locale: 'bs',
        currency: 'CHF',
        isActive: false, // NOT active for regular access
      };
      
      // Only add defaultCurrency if it's being used (it might not exist in older databases)
      try {
        superAdminTenantData.defaultCurrency = 'CHF';
      } catch (error) {
        // Column might not exist yet - that's OK, it will be created by migration
      }
      
      await db.insert(tenants).values(superAdminTenantData);
      console.log('✅ SuperAdmin global tenant created\n');
    } else {
      console.log('ℹ️  SuperAdmin global tenant already exists\n');
    }

    // 3. Create default demo tenant
    console.log('🏢 Creating default tenant...');
    
    const existingTenant = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, DEFAULT_TENANT_ID))
      .limit(1);

    let defaultTenant;
    
    if (existingTenant.length === 0) {
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 30);

      const fullModules = ['dashboard', 'users', 'announcements', 'events', 'tasks', 'workgroups', 'membership', 'messages', 'askImam', 'requests', 'shop', 'marketplace', 'vaktija', 'finances', 'projects', 'activity', 'activity-log', 'badges', 'points', 'certificates', 'documents', 'media', 'livestream', 'settings', 'guide', 'sponsors', 'applications'];
      
      const defaultTenantData: any = {
        id: DEFAULT_TENANT_ID,
        name: 'Demo Džemat',
        slug: 'demo-dzemat',
        subdomain: 'demo',
        email: 'info@demo-dzemat.com',
        phone: '+387 33 123 456',
        address: 'Džematlijska ulica 123',
        city: 'Sarajevo',
        country: 'Bosnia and Herzegovina',
        tenantCode: 'DEMO2025',
        subscriptionTier: 'full',
        subscriptionStatus: 'trial',
        trialEndsAt: trialEnd,
        locale: 'bs',
        currency: 'CHF',
        enabledModules: fullModules,
        isActive: true,
      };
      
      // Only add defaultCurrency if it's being used (it might not exist in older databases)
      try {
        defaultTenantData.defaultCurrency = 'CHF';
      } catch (error) {
        // Column might not exist yet - that's OK, it will be created by migration
      }
      
      [defaultTenant] = await db.insert(tenants).values(defaultTenantData).returning();

      console.log(`✅ Default tenant created: ${defaultTenant.name}\n`);
    } else {
      defaultTenant = existingTenant[0];
      console.log(`ℹ️  Default tenant already exists: ${defaultTenant.name}\n`);
    }

    // 4. Create SuperAdmin user in GLOBAL tenant (NOT in demo tenant!)
    console.log('👤 Creating SuperAdmin user...');
    
    const existingSuperAdmin = await db
      .select()
      .from(users)
      .where(eq(users.tenantId, SUPERADMIN_TENANT_ID))
      .limit(1);
    
    if (existingSuperAdmin.length === 0) {
      await db.insert(users).values({
        tenantId: SUPERADMIN_TENANT_ID, // GLOBAL tenant, not demo!
        firstName: 'Super',
        lastName: 'Admin',
        username: 'superadmin',
        email: 'superadmin@dzematapp.com',
        password: 'admin123',
        status: 'aktivan',
        categories: ['Admin'],
        roles: ['admin'],
        isAdmin: true,
        isSuperAdmin: true,
        totalPoints: 0,
        membershipDate: new Date()
      });
      console.log('✅ SuperAdmin user created (username: superadmin, password: admin123)\n');
    } else {
      console.log('ℹ️  SuperAdmin user already exists\n');
    }

    // 5. Create regular admin for demo tenant (each tenant gets admin/admin123)
    console.log('👤 Creating demo tenant admin...');
    
    const existingDemoAdmin = await db
      .select()
      .from(users)
      .where(eq(users.tenantId, DEFAULT_TENANT_ID))
      .limit(1);
    
    if (existingDemoAdmin.length === 0) {
      await db.insert(users).values({
        tenantId: DEFAULT_TENANT_ID,
        firstName: 'Admin',
        lastName: 'Džemat',
        username: 'admin',
        email: 'admin@demo.local',
        password: 'admin123',
        status: 'aktivan',
        categories: ['Muškarci'],
        roles: ['admin'],
        isAdmin: true,
        isSuperAdmin: false,
        totalPoints: 0,
        membershipDate: new Date()
      });
      console.log('✅ Demo admin user created (username: admin, password: admin123)\n');
    } else {
      console.log('ℹ️  Demo admin user already exists\n');
    }

    console.log('✅ Seed completed successfully!');
    console.log(`\n📊 Default Tenant ID: ${defaultTenant.id}`);
    console.log(`   Name: ${defaultTenant.name}`);
    console.log(`   Tier: ${defaultTenant.subscriptionTier}`);
    console.log(`   Status: ${defaultTenant.subscriptionStatus}`);
    
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  }
}

// Export tenant IDs for use elsewhere
export const TENANT_IDS = {
  SUPERADMIN_GLOBAL: SUPERADMIN_TENANT_ID,
  DEFAULT_DEMO: DEFAULT_TENANT_ID
};

// Default badge definitions - will be seeded for all tenants
const DEFAULT_BADGES = [
  // Vakif (contributions)
  { name: 'Bronzani Vakif', description: 'Ostvaren za ukupne donacije od 100 ili više', icon: '/uploads/badges/bronze_vakif.png', criteriaType: 'contributions_amount', criteriaValue: 100 },
  { name: 'Srebreni Vakif', description: 'Ostvaren za ukupne donacije od 500 ili više', icon: '/uploads/badges/silver_vakif.png', criteriaType: 'contributions_amount', criteriaValue: 500 },
  { name: 'Zlatni Vakif', description: 'Ostvaren za ukupne donacije od 1000 ili više', icon: '/uploads/badges/gold_vakif.png', criteriaType: 'contributions_amount', criteriaValue: 1000 },
  { name: 'Dijamantni Vakif', description: 'Ostvaren za ukupne donacije od 5000 ili više', icon: '/uploads/badges/diamond_vakif.png', criteriaType: 'contributions_amount', criteriaValue: 5000 },
  // Sponzor (contributions - higher tiers)
  { name: 'Bronzani Sponzor', description: 'Ostvaren za sponzorstvo od 200 ili više', icon: '/uploads/badges/bronze_sponzor.png', criteriaType: 'contributions_amount', criteriaValue: 200 },
  { name: 'Srebreni Sponzor', description: 'Ostvaren za sponzorstvo od 1000 ili više', icon: '/uploads/badges/silver_sponzor.png', criteriaType: 'contributions_amount', criteriaValue: 1000 },
  { name: 'Zlatni Sponzor', description: 'Ostvaren za sponzorstvo od 3000 ili više', icon: '/uploads/badges/gold_sponzor.png', criteriaType: 'contributions_amount', criteriaValue: 3000 },
  { name: 'Dijamantni Sponzor', description: 'Ostvaren za sponzorstvo od 10000 ili više', icon: '/uploads/badges/diamond_sponzor.png', criteriaType: 'contributions_amount', criteriaValue: 10000 },
  // Volonter (tasks completed)
  { name: 'Bronzani Volonter', description: 'Ostvaren za 5 završenih zadataka', icon: '/uploads/badges/bronze_volonter.png', criteriaType: 'tasks_completed', criteriaValue: 5 },
  { name: 'Srebreni Volonter', description: 'Ostvaren za 20 završenih zadataka', icon: '/uploads/badges/silver_volonter.png', criteriaType: 'tasks_completed', criteriaValue: 20 },
  { name: 'Zlatni Volonter', description: 'Ostvaren za 50 završenih zadataka', icon: '/uploads/badges/gold_volonter.png', criteriaType: 'tasks_completed', criteriaValue: 50 },
  { name: 'Dijamantni Volonter', description: 'Ostvaren za 100 završenih zadataka', icon: '/uploads/badges/diamond_volonter.png', criteriaType: 'tasks_completed', criteriaValue: 100 },
  // Aktivista (events attended)
  { name: 'Bronzani Aktivista', description: 'Ostvaren za prisustvo na 5 događaja', icon: '/uploads/badges/bronze_aktivista.png', criteriaType: 'events_attended', criteriaValue: 5 },
  { name: 'Srebreni Aktivista', description: 'Ostvaren za prisustvo na 20 događaja', icon: '/uploads/badges/silver_aktivista.png', criteriaType: 'events_attended', criteriaValue: 20 },
  { name: 'Zlatni Aktivista', description: 'Ostvaren za prisustvo na 50 događaja', icon: '/uploads/badges/gold_aktivista.png', criteriaType: 'events_attended', criteriaValue: 50 },
  { name: 'Dijamantni Aktivista', description: 'Ostvaren za prisustvo na 100 događaja', icon: '/uploads/badges/diamond_aktivista.png', criteriaType: 'events_attended', criteriaValue: 100 },
];

export async function seedBadgesForTenant(tenantId: string) {
  console.log(`🏅 Seeding badges for tenant: ${tenantId}...`);
  
  try {
    // Check if badges already exist for this tenant
    const existingBadges = await db
      .select()
      .from(badges)
      .where(eq(badges.tenantId, tenantId));
    
    if (existingBadges.length >= 16) {
      console.log(`ℹ️  Badges already exist for tenant ${tenantId} (${existingBadges.length} badges)`);
      return;
    }
    
    // Get names of existing badges to avoid duplicates
    const existingNames = new Set(existingBadges.map(b => b.name));
    
    // Insert missing badges
    let inserted = 0;
    for (const badge of DEFAULT_BADGES) {
      if (!existingNames.has(badge.name)) {
        await db.insert(badges).values({
          tenantId,
          ...badge
        });
        inserted++;
      }
    }
    
    console.log(`✅ Seeded ${inserted} new badges for tenant ${tenantId}`);
  } catch (error) {
    console.error(`❌ Failed to seed badges for tenant ${tenantId}:`, error);
  }
}
