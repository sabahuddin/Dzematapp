/**
 * Seed Demo Data - Kreira demo sekcije i taskove SAMO za Demo Džemat
 * 
 * IMPORTANT: This ONLY seeds data for the default demo tenant.
 * New tenants should NOT get any demo data - they start empty.
 */

import { db } from './db';
import { workGroups, workGroupMembers, tasks, users, tenants } from '@shared/schema';
import { eq, and, or } from 'drizzle-orm';
import { storage } from './storage';

const DEFAULT_TENANT_ID = 'default-tenant-demo';

export async function seedDemoData() {
  // Non-blocking seed - don't await, just start the process
  (async () => {
    try {
      console.log('\n🌱 Seeding demo data for Demo Džemat...');
      
      // Only seed for the default demo tenant - never for other tenants
      const existingUsers = await db.select().from(users).where(
        and(
          eq(users.tenantId, DEFAULT_TENANT_ID),
          eq(users.isSuperAdmin, false) // Exclude SuperAdmin from count
        )
      );
    
      // Check if demo admin already exists (not the SuperAdmin)
      const demoAdminExists = existingUsers.some(u => u.username === 'demo-admin');
      
      let adminUser;
      if (!demoAdminExists && existingUsers.length === 0) {
        // This shouldn't happen as seed-tenant.ts creates the demo admin
        // But as a fallback, create demo admin here
        [adminUser] = await db.insert(users).values({
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
        }).returning();
        console.log('✅ Demo admin user created');
      } else {
        adminUser = existingUsers.find(u => u.username === 'demo-admin') || existingUsers[0];
        console.log('ℹ️ Demo users already exist');
      }

      if (!adminUser) {
        console.log('⚠️ No admin user found for demo data seeding');
        return;
      }

      // 2. Create demo work groups (only for demo tenant)
      const existingWorkGroups = await db.select().from(workGroups).where(eq(workGroups.tenantId, DEFAULT_TENANT_ID));
      
      if (existingWorkGroups.length === 0) {
        const demoGroups = [
          {
            tenantId: DEFAULT_TENANT_ID,
            name: 'Priprem Iftar-a',
            description: 'Sekcija zadužena za pripremu iftar-a tijekom Ramazana',
            visibility: 'javna' as const,
            archived: false
          },
          {
            tenantId: DEFAULT_TENANT_ID,
            name: 'Održavanje Džemata',
            description: 'Održavanje zgrada i prostora džemata',
            visibility: 'javna' as const,
            archived: false
          },
          {
            tenantId: DEFAULT_TENANT_ID,
            name: 'Edukacija',
            description: 'Obrazovne aktivnosti i tečajevi',
            visibility: 'javna' as const,
            archived: false
          }
        ];

        const createdGroups = await db.insert(workGroups).values(demoGroups).returning();
        console.log(`✅ Created ${createdGroups.length} demo work groups`);

        // 3. Add admin to all work groups
        for (const group of createdGroups) {
          await db.insert(workGroupMembers).values({
            tenantId: DEFAULT_TENANT_ID,
            workGroupId: group.id,
            userId: adminUser.id,
            isModerator: true
          });
        }
        console.log('✅ Added admin to all work groups');

        // 4. Create demo tasks
        const demoTasks = [
          {
            tenantId: DEFAULT_TENANT_ID,
            workGroupId: createdGroups[0].id,
            title: 'Kupiti namirnice za iftar',
            description: 'Nabaviti voće, hljeb i jaja za iftar',
            assignedUserIds: [adminUser.id],
            status: 'u_toku' as const,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            estimatedCost: '150.00',
            pointsValue: 50
          },
          {
            tenantId: DEFAULT_TENANT_ID,
            workGroupId: createdGroups[1].id,
            title: 'Čišćenje glavne sale',
            description: 'Detaljno čišćenje glavne molione sale',
            assignedUserIds: [adminUser.id],
            status: 'na_cekanju' as const,
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            estimatedCost: '50.00',
            pointsValue: 30
          },
          {
            tenantId: DEFAULT_TENANT_ID,
            workGroupId: createdGroups[2].id,
            title: 'Priprema tečaja Kur\'ana',
            description: 'Organizacija tečaja čitanja Kur\'ana za omladinu',
            assignedUserIds: [adminUser.id],
            status: 'u_toku' as const,
            dueDate: null,
            estimatedCost: '100.00',
            pointsValue: 40
          }
        ];

        await db.insert(tasks).values(demoTasks);
        console.log(`✅ Created ${demoTasks.length} demo tasks`);
      } else {
        console.log('ℹ️ Demo data already exists');
      }

      console.log('✅ Demo data seed completed!\n');
      
      // AUTO-PURGE: Move demo users from all non-demo tenants to demo tenant (after seeding completes)
      setTimeout(async () => {
        try {
          console.log('\n🧹 [AUTO-PURGE] Starting automatic demo user cleanup...');
          const allTenants = await db.select().from(tenants);
          console.log(`[AUTO-PURGE] Found ${allTenants.length} tenants`);
          
          const demoUsernames = [
            'Alma', 'Alja', 'Ali', 'Haris', 'Osman', 
            'Mujo', 'Hazo', 'Mustafa', 'Zlata', 'Hase', 
            'Alen', 'Iso', 'Elma'
          ];
          
          for (const tenant of allTenants) {
            if (tenant.id === DEFAULT_TENANT_ID) {
              console.log(`[AUTO-PURGE] Skipping demo tenant ${tenant.name}`);
              continue;
            }
            
            console.log(`[AUTO-PURGE] Processing tenant: ${tenant.name}`);
            
            // Move demo users to demo tenant instead of deleting them
            const movedUsers = await db.update(users)
              .set({ tenantId: DEFAULT_TENANT_ID })
              .where(
                and(
                  eq(users.tenantId, tenant.id),
                  or(
                    eq(users.firstName, 'Iso'),
                    eq(users.firstName, 'Elma'),
                    eq(users.firstName, 'Hase'),
                    eq(users.firstName, 'Mujo'),
                    eq(users.firstName, 'Fata'),
                    eq(users.firstName, 'Suljo'),
                    eq(users.firstName, 'Haso')
                  )
                )
              )
              .returning({ username: users.username, firstName: users.firstName, lastName: users.lastName });
            
            if (movedUsers.length > 0) {
              console.log(`[AUTO-PURGE] ✅ Moved ${movedUsers.length} demo users from ${tenant.name} to demo tenant`);
              for (const user of movedUsers) {
                console.log(`[AUTO-PURGE]   - ${user.firstName} ${user.lastName}`);
              }
            }
          }
          
          console.log('[AUTO-PURGE] ✅ Automatic demo user cleanup completed!\n');
        } catch (error) {
          console.error('[AUTO-PURGE] ❌ Cleanup failed:', error);
        }
      }, 1000); // Wait 1 second before running purge
      
    } catch (error) {
      console.error('❌ Demo data seed failed:', error);
    }
  })();
}
