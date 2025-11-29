import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import * as schema from "@shared/schema";
import * as fs from "fs";
import * as path from "path";

export async function migrateProductionSchema(): Promise<void> {
  console.log("🔄 Running production schema migration...");
  
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const client = await pool.connect();

  try {
    // First, try Drizzle migrations for new tables
    const db = drizzle(pool, { schema });
    try {
      await migrate(db, { migrationsFolder: "./migrations" });
      console.log("✅ Drizzle migrations applied");
    } catch (error: any) {
      if (error.message?.includes("already exists") || error.code === '42P07') {
        console.log("ℹ️  Tables already exist, applying column fixes...");
      } else {
        console.warn("⚠️  Drizzle migration warning:", error.message);
      }
    }

    // Always run column fixes for existing tables
    await addMissingColumns(client);
    
    console.log("✅ Schema migration complete");
  } finally {
    client.release();
    await pool.end();
  }
}

async function addMissingColumns(client: any): Promise<void> {
  console.log("📋 Adding missing columns to existing tables...");
  
  const columnFixes = [
    // ANNOUNCEMENTS
    `ALTER TABLE "announcements" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'published' NOT NULL`,
    `ALTER TABLE "announcements" ADD COLUMN IF NOT EXISTS "is_featured" boolean DEFAULT false`,
    `ALTER TABLE "announcements" ADD COLUMN IF NOT EXISTS "categories" text[]`,
    `ALTER TABLE "announcements" ADD COLUMN IF NOT EXISTS "photo_url" text`,
    `ALTER TABLE "announcements" ADD COLUMN IF NOT EXISTS "publish_date" timestamp DEFAULT now()`,
    
    // EVENTS
    `ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "photo_url" text`,
    `ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "rsvp_enabled" boolean DEFAULT true`,
    `ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "require_adults_children" boolean DEFAULT false`,
    `ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "max_attendees" integer`,
    `ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "reminder_time" text`,
    `ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "categories" text[]`,
    `ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "points_value" integer DEFAULT 20`,
    `ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now()`,
    
    // MESSAGES
    `ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "category" text`,
    `ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "thread_id" varchar`,
    `ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "parent_message_id" varchar`,
    
    // PROPOSALS - reserved keywords must be quoted
    `ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "who" text`,
    `ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "what" text`,
    `ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "where" text`,
    `ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "when" text`,
    `ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "how" text`,
    `ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "why" text`,
    `ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "budget" text`,
    `ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "reviewed_by_id" varchar`,
    `ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "review_comment" text`,
    `ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "reviewed_at" timestamp`,
    
    // IMPORTANT_DATES
    `ALTER TABLE "important_dates" ADD COLUMN IF NOT EXISTS "is_recurring" boolean DEFAULT true NOT NULL`,
    
    // CERTIFICATE_TEMPLATES
    `ALTER TABLE "certificate_templates" ADD COLUMN IF NOT EXISTS "background_image_path" text`,
    `ALTER TABLE "certificate_templates" ADD COLUMN IF NOT EXISTS "title_position" text DEFAULT '{"x": 50, "y": 20}'`,
    `ALTER TABLE "certificate_templates" ADD COLUMN IF NOT EXISTS "recipient_position" text DEFAULT '{"x": 50, "y": 45}'`,
    `ALTER TABLE "certificate_templates" ADD COLUMN IF NOT EXISTS "message_position" text DEFAULT '{"x": 50, "y": 60}'`,
    `ALTER TABLE "certificate_templates" ADD COLUMN IF NOT EXISTS "date_position" text DEFAULT '{"x": 50, "y": 85}'`,
    `ALTER TABLE "certificate_templates" ADD COLUMN IF NOT EXISTS "font_family" text DEFAULT 'Arial'`,
    `ALTER TABLE "certificate_templates" ADD COLUMN IF NOT EXISTS "primary_color" text DEFAULT '#000000'`,
    `ALTER TABLE "certificate_templates" ADD COLUMN IF NOT EXISTS "is_default" boolean DEFAULT false`,
    
    // SERVICES
    `ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "photos" text[]`,
    `ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "user_id" varchar`,
    `ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'aktivan'`,
    `ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "duration" text`,
    
    // ACTIVITY_LOG
    `ALTER TABLE "activity_log" ADD COLUMN IF NOT EXISTS "related_entity_id" varchar`,
    
    // USER_CERTIFICATES
    `ALTER TABLE "user_certificates" ADD COLUMN IF NOT EXISTS "message" text`,
    `ALTER TABLE "user_certificates" ADD COLUMN IF NOT EXISTS "viewed" boolean DEFAULT false`,
    
    // USERS
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "skills" text[]`,
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "total_points" integer DEFAULT 0`,
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_viewed_shop" timestamp`,
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_viewed_events" timestamp`,
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_viewed_announcements" timestamp`,
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_viewed_imam_questions" timestamp`,
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_viewed_tasks" timestamp`,
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_super_admin" boolean DEFAULT false`,
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "inactive_reason" text`,
    
    // TASKS
    `ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "description_image" text`,
    `ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "points_value" integer DEFAULT 50`,
    `ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "completed_at" timestamp`,
    
    // TASK_COMMENTS
    `ALTER TABLE "task_comments" ADD COLUMN IF NOT EXISTS "comment_image" text`,
    
    // WORK_GROUPS
    `ALTER TABLE "work_groups" ADD COLUMN IF NOT EXISTS "archived" boolean DEFAULT false NOT NULL`,
    
    // RECEIPTS
    `ALTER TABLE "receipts" ADD COLUMN IF NOT EXISTS "proposal_id" varchar`,
    
    // SHOP_PRODUCTS
    `ALTER TABLE "shop_products" ADD COLUMN IF NOT EXISTS "reserved_by_id" varchar`,
    `ALTER TABLE "shop_products" ADD COLUMN IF NOT EXISTS "reserved_at" timestamp`,
    `ALTER TABLE "shop_products" ADD COLUMN IF NOT EXISTS "sold_to_id" varchar`,
    `ALTER TABLE "shop_products" ADD COLUMN IF NOT EXISTS "sold_at" timestamp`,
    `ALTER TABLE "shop_products" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp`,
    
    // MARKETPLACE_ITEMS
    `ALTER TABLE "marketplace_items" ADD COLUMN IF NOT EXISTS "photos" text[]`,
  ];

  let addedCount = 0;
  for (const sql of columnFixes) {
    try {
      await client.query(sql);
      addedCount++;
    } catch (error: any) {
      // Ignore errors for tables that don't exist yet
      if (!error.message?.includes('does not exist')) {
        console.warn(`⚠️  Column fix warning: ${error.message}`);
      }
    }
  }
  console.log(`✅ Processed ${addedCount} column fixes`);
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
