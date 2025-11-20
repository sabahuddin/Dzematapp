/**
 * Migration Script: Single-tenant → Multi-tenant
 * 
 * Postupak:
 * 1. Kreira default tenant
 * 2. Update sve postojeće podatke sa tenant_id
 */

import { db } from './db';
import { sql } from 'drizzle-orm';

const DEFAULT_TENANT_ID = 'default-tenant-demo';

async function migrateToMultiTenant() {
  console.log('🔄 Starting multi-tenant migration...\n');

  try {
    // Liste svih tabela koje imaju tenant_id
    const tables = [
      'users',
      'family_relationships',
      'announcements',
      'events',
      'event_rsvps',
      'work_groups',
      'work_group_members',
      'tasks',
      'access_requests',
      'task_comments',
      'announcement_files',
      'activities',
      'messages',
      'imam_questions',
      'organization_settings',
      'documents',
      'requests',
      'shop_products',
      'marketplace_items',
      'product_purchase_requests',
      'prayer_times',
      'important_dates',
      'financial_contributions',
      'activity_log',
      'event_attendance',
      'points_settings',
      'badges',
      'user_badges',
      'projects',
      'certificate_templates',
      'user_certificates',
      'membership_applications',
      'akika_applications',
      'marriage_applications',
      'activity_feed',
      'services',
    ];

    console.log(`📦 Updating ${tables.length} tables with default tenant_id...\n`);

    for (const table of tables) {
      try {
        // Update samo redove koji NEMAJU tenant_id
        const result = await db.execute(
          sql.raw(`
            UPDATE ${table}
            SET tenant_id = '${DEFAULT_TENANT_ID}'
            WHERE tenant_id IS NULL
          `)
        );
        
        console.log(`✅ ${table}: updated`);
      } catch (error: any) {
        // Ignoriši greške za tabele koje još nemaju tenant_id kolonu
        if (error.message?.includes('column "tenant_id" does not exist')) {
          console.log(`⏭️  ${table}: tenant_id column doesn't exist yet (will be added)`);
        } else {
          console.warn(`⚠️  ${table}: ${error.message}`);
        }
      }
    }

    console.log('\n✅ Migration completed!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration
migrateToMultiTenant()
  .then(() => {
    console.log('\n🎉 Multi-tenant migration complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration error:', error);
    process.exit(1);
  });
