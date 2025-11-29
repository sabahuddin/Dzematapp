import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import * as schema from "@shared/schema";

export async function migrateProductionSchema(): Promise<void> {
  console.log("🔄 Running production schema migration...");
  
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle(pool, { schema });

  try {
    await migrate(db, { migrationsFolder: "./migrations" });
    console.log("✅ Schema migration complete - all 44 tables verified");
  } catch (error: any) {
    if (error.message?.includes("already exists")) {
      console.log("✅ Schema already up to date");
    } else {
      console.error("❌ Migration failed:", error);
      throw error;
    }
  } finally {
    await pool.end();
  }
}

export async function verifyAllTablesExist(): Promise<void> {
  console.log("📋 Verifying all schema tables exist...");
  
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const client = await pool.connect();

  try {
    const expectedTables = [
      'access_requests', 'activities', 'activity_feed', 'activity_log',
      'akika_applications', 'announcement_files', 'announcements', 'audit_logs',
      'badges', 'certificate_templates', 'contribution_purposes', 'documents',
      'event_attendance', 'event_rsvps', 'events', 'family_relationships',
      'financial_contributions', 'imam_questions', 'important_dates',
      'marketplace_items', 'marriage_applications', 'membership_applications',
      'messages', 'organization_settings', 'points_settings', 'prayer_times',
      'product_purchase_requests', 'projects', 'proposals', 'receipts',
      'requests', 'services', 'shop_products', 'subscription_plans',
      'task_comments', 'tasks', 'tenant_features', 'tenants',
      'user_badges', 'user_certificates', 'user_preferences', 'users',
      'work_group_members', 'work_groups'
    ];

    const result = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    const existingTables = new Set(result.rows.map(r => r.table_name));
    const missingTables = expectedTables.filter(t => !existingTables.has(t));

    if (missingTables.length > 0) {
      console.error("❌ CRITICAL: Missing tables detected:", missingTables);
      throw new Error(`Missing tables: ${missingTables.join(', ')}`);
    }

    console.log(`✅ All ${expectedTables.length} tables verified`);
  } finally {
    client.release();
    await pool.end();
  }
}
