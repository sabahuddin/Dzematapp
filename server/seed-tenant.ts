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
  users
} from '@shared/schema';
import { eq } from 'drizzle-orm';

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
          enabledModules: ['dashboard', 'users', 'announcements', 'events', 'tasks', 'messages', 'askImam', 'requests', 'shop', 'vaktija', 'finances', 'projects', 'activity', 'badges', 'points', 'certificates', 'documents', 'media', 'settings', 'guide'],
          readOnlyModules: [],
          maxUsers: null,
          maxStorage: null,
          isActive: true,
        },
      ]);
      console.log('✅ Subscription plans created\n');
    } else {
      console.log('ℹ️  Subscription plans already exist\n');
    }

    // 2. Create GLOBAL SuperAdmin tenant (hidden from regular users)
    console.log('🔐 Creating SuperAdmin global tenant...');
    
    const existingSuperAdminTenant = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, SUPERADMIN_TENANT_ID))
      .limit(1);

    if (existingSuperAdminTenant.length === 0) {
      await db.insert(tenants).values({
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
      });
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

      [defaultTenant] = await db.insert(tenants).values({
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
        isActive: true,
      }).returning();

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
        username: 'admin',
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
      console.log('✅ SuperAdmin user created (username: admin, password: admin123)\n');
    } else {
      console.log('ℹ️  SuperAdmin user already exists\n');
    }

    // 5. Create regular admin for demo tenant
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
        lastName: 'Demo',
        username: 'demo-admin',
        email: 'admin@demo.local',
        password: 'demo123',
        status: 'aktivan',
        categories: ['Muškarci'],
        roles: ['admin'],
        isAdmin: true,
        isSuperAdmin: false,
        totalPoints: 0,
        membershipDate: new Date()
      });
      console.log('✅ Demo admin user created (username: demo-admin, password: demo123)\n');
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
