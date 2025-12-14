/**
 * Seed Demo Data - Kreira demo sekcije i taskove SAMO za Demo Džemat
 * 
 * IMPORTANT: This ONLY seeds data for the default demo tenant.
 * New tenants should NOT get any demo data - they start empty.
 */

import { db } from './db';
import { 
  workGroups, workGroupMembers, tasks, users, tenants,
  announcements, events, activities, userBadges, activityLog,
  messages, eventRsvps, taskComments, userCertificates,
  userPreferences, financialContributions
} from '@shared/schema';
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

        // 4. Create demo tasks with various statuses
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
            workGroupId: createdGroups[0].id,
            title: 'Organizacija stolova za iftar',
            description: 'Pripremiti stolove i stolice',
            assignedUserIds: [adminUser.id],
            status: 'u_toku' as const,
            dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
            estimatedCost: '0.00',
            pointsValue: 30
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
            workGroupId: createdGroups[1].id,
            title: 'Popravka klime',
            description: 'Servis klima uređaja u sali',
            assignedUserIds: [adminUser.id],
            status: 'na_cekanju' as const,
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            estimatedCost: '200.00',
            pointsValue: 20
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
          },
          {
            tenantId: DEFAULT_TENANT_ID,
            workGroupId: createdGroups[2].id,
            title: 'Nabavka udžbenika',
            description: 'Kupiti udžbenike za vjeronauku',
            assignedUserIds: [adminUser.id],
            status: 'zavrsen' as const,
            dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            estimatedCost: '120.00',
            pointsValue: 25
          },
          {
            tenantId: DEFAULT_TENANT_ID,
            workGroupId: createdGroups[0].id,
            title: 'Dekoracija za bajram',
            description: 'Ukrašavanje džamije za bajram',
            assignedUserIds: [adminUser.id],
            status: 'zavrsen' as const,
            dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            estimatedCost: '80.00',
            pointsValue: 35
          },
          {
            tenantId: DEFAULT_TENANT_ID,
            workGroupId: createdGroups[1].id,
            title: 'Farbanje ograde',
            description: 'Farbanje ograde oko džamije',
            assignedUserIds: [adminUser.id],
            status: 'zavrsen' as const,
            dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            estimatedCost: '300.00',
            pointsValue: 60
          }
        ];

        await db.insert(tasks).values(demoTasks);
        console.log(`✅ Created ${demoTasks.length} demo tasks`);

        // 5. Create demo announcements
        const existingAnnouncements = await db.select().from(announcements).where(eq(announcements.tenantId, DEFAULT_TENANT_ID));
        if (existingAnnouncements.length === 0) {
          const demoAnnouncements = [
            {
              tenantId: DEFAULT_TENANT_ID,
              title: 'Dobrodošli u DžematApp',
              content: '<p>Dragi članovi džemata, dobrodošli u našu novu aplikaciju za upravljanje zajednicom. Ovdje možete pratiti sve aktivnosti, obavijesti i događaje.</p>',
              authorId: adminUser.id,
              status: 'published' as const,
              publishDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
              isFeatured: true
            },
            {
              tenantId: DEFAULT_TENANT_ID,
              title: 'Raspored Ramazanskih aktivnosti',
              content: '<p>Objavljujemo raspored iftar-a i teravija za ovaj Ramazan. Pozivamo sve članove da aktivno učestvuju.</p>',
              authorId: adminUser.id,
              status: 'published' as const,
              publishDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
              isFeatured: false
            },
            {
              tenantId: DEFAULT_TENANT_ID,
              title: 'Nova sekcija za mlade',
              content: '<p>Otvorena je nova sekcija za mlade članove džemata. Pridružite se i budite dio aktivnosti!</p>',
              authorId: adminUser.id,
              status: 'published' as const,
              publishDate: new Date(),
              isFeatured: false
            }
          ];
          await db.insert(announcements).values(demoAnnouncements);
          console.log(`✅ Created ${demoAnnouncements.length} demo announcements`);
        }

        // 6. Create demo events
        const existingEvents = await db.select().from(events).where(eq(events.tenantId, DEFAULT_TENANT_ID));
        if (existingEvents.length === 0) {
          const demoEvents = [
            {
              tenantId: DEFAULT_TENANT_ID,
              name: 'Kahva sa....',
              description: 'Druženje uz kahvu i razgovor',
              location: 'Stadion pored džamije',
              dateTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
              createdById: adminUser.id
            },
            {
              tenantId: DEFAULT_TENANT_ID,
              name: 'Zajednički iftar',
              description: 'Pozivamo sve članove na zajednički iftar',
              location: 'Sala džemata',
              dateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
              createdById: adminUser.id
            },
            {
              tenantId: DEFAULT_TENANT_ID,
              name: 'Predavanje za mlade',
              description: 'Edukativno predavanje za mlade članove',
              location: 'Mala sala',
              dateTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
              createdById: adminUser.id
            },
            {
              tenantId: DEFAULT_TENANT_ID,
              name: 'Vikend izlet',
              description: 'Porodični izlet za članove džemata',
              location: 'Priroda',
              dateTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
              createdById: adminUser.id
            }
          ];
          await db.insert(events).values(demoEvents);
          console.log(`✅ Created ${demoEvents.length} demo events`);
        }
      } else {
        console.log('ℹ️ Demo data already exists');
      }

      console.log('✅ Demo data seed completed!\n');
      
      // AUTO-PURGE: Delete demo users from all non-demo tenants (after seeding completes)
      setTimeout(async () => {
        try {
          console.log('\n🧹 [AUTO-PURGE] Starting automatic demo user cleanup...');
          const allTenants = await db.select().from(tenants);
          console.log(`[AUTO-PURGE] Found ${allTenants.length} tenants`);
          
          const demoFirstNames = ['Iso', 'Elma', 'Hase', 'Mujo', 'Fata', 'Suljo', 'Haso', 'Alma'];
          
          for (const tenant of allTenants) {
            if (tenant.id === DEFAULT_TENANT_ID) {
              console.log(`[AUTO-PURGE] Skipping demo tenant ${tenant.name}`);
              continue;
            }
            
            console.log(`[AUTO-PURGE] Processing tenant: ${tenant.name}`);
            
            // Find demo users in this tenant
            const demoUsers = await db.select().from(users).where(
              and(
                eq(users.tenantId, tenant.id),
                or(
                  eq(users.firstName, 'Iso'),
                  eq(users.firstName, 'Elma'),
                  eq(users.firstName, 'Hase'),
                  eq(users.firstName, 'Mujo'),
                  eq(users.firstName, 'Fata'),
                  eq(users.firstName, 'Suljo'),
                  eq(users.firstName, 'Haso'),
                  eq(users.firstName, 'Alma')
                )
              )
            );
            
            for (const demoUser of demoUsers) {
              try {
                // Delete all foreign key references first
                try {
                  await db.delete(activities).where(eq(activities.userId, demoUser.id));
                } catch (e) { /* ignore */ }
                
                try {
                  await db.delete(userBadges).where(eq(userBadges.userId, demoUser.id));
                } catch (e) { /* ignore */ }
                
                try {
                  await db.delete(activityLog).where(eq(activityLog.userId, demoUser.id));
                } catch (e) { /* ignore */ }
                
                try {
                  await db.delete(messages).where(
                    or(
                      eq(messages.senderId, demoUser.id),
                      eq(messages.recipientId, demoUser.id)
                    )
                  );
                } catch (e) { /* ignore */ }
                
                try {
                  await db.delete(eventRsvps).where(eq(eventRsvps.userId, demoUser.id));
                } catch (e) { /* ignore */ }
                
                try {
                  await db.delete(taskComments).where(eq(taskComments.userId, demoUser.id));
                } catch (e) { /* ignore */ }
                
                try {
                  await db.delete(workGroupMembers).where(eq(workGroupMembers.userId, demoUser.id));
                } catch (e) { /* ignore */ }
                
                try {
                  await db.delete(userCertificates).where(eq(userCertificates.userId, demoUser.id));
                } catch (e) { /* ignore */ }
                
                try {
                  await db.delete(userPreferences).where(eq(userPreferences.userId, demoUser.id));
                } catch (e) { /* ignore */ }
                
                try {
                  await db.delete(financialContributions).where(eq(financialContributions.userId, demoUser.id));
                } catch (e) { /* ignore */ }
                
                // Now delete the user
                await db.delete(users).where(
                  and(
                    eq(users.id, demoUser.id),
                    eq(users.tenantId, tenant.id)
                  )
                );
                
                console.log(`[AUTO-PURGE] ✅ Deleted ${demoUser.firstName} ${demoUser.lastName} from ${tenant.name}`);
              } catch (err) {
                console.log(`[AUTO-PURGE] ⚠️ Could not delete user ${demoUser.firstName} ${demoUser.lastName}: ${(err as any).message}`);
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
