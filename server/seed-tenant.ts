/**
 * Seed Default Tenant - Kreira prvi džemat i migrira postojeće podatke
 * 
 * Koristi se prilikom prelaska na multi-tenant arhitekturu
 */

import { db } from './db';
import { 
  tenants, 
  subscriptionPlans,
  users,
  announcements,
  events,
  workGroups,
  shopProducts,
  prayerTimes,
  organizationSettings
} from '@shared/schema';
import { eq } from 'drizzle-orm';

const DEFAULT_TENANT_ID = 'default-tenant-demo';

export async function seedDefaultTenant() {
  console.log('🌱 Starting default tenant seed...\n');

  try {
    // 1. Kreiraj subscription plans ako ne postoje
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
          maxStorage: 1000, // 1GB
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
          maxStorage: 5000, // 5GB
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
          maxUsers: null, // unlimited
          maxStorage: null, // unlimited
          isActive: true,
        },
      ]);
      console.log('✅ Subscription plans created\n');
    } else {
      console.log('ℹ️  Subscription plans already exist\n');
    }

    // 2. Kreiraj default tenant
    console.log('🏢 Creating default tenant...');
    
    const existingTenant = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, DEFAULT_TENANT_ID))
      .limit(1);

    let defaultTenant;
    
    if (existingTenant.length === 0) {
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 30); // 30 days trial

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
        subscriptionTier: 'full', // Full access za demo
        subscriptionStatus: 'trial',
        trialEndsAt: trialEnd,
        locale: 'bs',
        currency: 'CHF',
        isActive: true,
      }).returning();

      console.log(`✅ Default tenant created: ${defaultTenant.name} (${defaultTenant.id})\n`);
    } else {
      defaultTenant = existingTenant[0];
      console.log(`ℹ️  Default tenant already exists: ${defaultTenant.name}\n`);
    }

    // 3. Kreiraj SuperAdmin korisnika ako ne postoji
    console.log('👤 Creating SuperAdmin user...');
    const existingSuperAdmin = await db.select().from(users).where(eq(users.tenantId, DEFAULT_TENANT_ID)).limit(1);
    
    if (existingSuperAdmin.length === 0) {
      await db.insert(users).values({
        tenantId: DEFAULT_TENANT_ID,
        firstName: 'Super',
        lastName: 'Admin',
        username: 'admin',
        email: 'superadmin@dzemat.app',
        password: 'admin123',
        status: 'aktivan',
        categories: ['Muškarci'],
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