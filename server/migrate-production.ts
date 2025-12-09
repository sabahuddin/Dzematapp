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
  const client = await pool.connect();

  try {
    // First cleanup broken data (created_by_id='system' references)
    console.log("🧹 Cleaning up broken data references...");
    try {
      await client.query("UPDATE contribution_purposes SET created_by_id = NULL WHERE created_by_id = 'system'");
      await client.query("UPDATE financial_contributions SET created_by_id = NULL WHERE created_by_id = 'system'");
      console.log("✅ Cleaned up broken data references");
    } catch (error: any) {
      console.log("ℹ️  No broken data to clean up");
    }

    // Fix certificate_templates type and content columns (production has them as NOT NULL without default)
    console.log("🔧 Fixing certificate_templates columns...");
    try {
      // Fix type column
      await client.query("ALTER TABLE certificate_templates ALTER COLUMN type SET DEFAULT 'certificate'");
      await client.query("UPDATE certificate_templates SET type = 'certificate' WHERE type IS NULL");
      // Fix content column
      await client.query("ALTER TABLE certificate_templates ALTER COLUMN content SET DEFAULT ''");
      await client.query("UPDATE certificate_templates SET content = '' WHERE content IS NULL");
      console.log("✅ Fixed certificate_templates columns");
    } catch (error: any) {
      // Column might not exist yet or table might not exist - that's OK
      console.log("ℹ️  certificate_templates column fix skipped (table/column may not exist yet)");
    }

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

    // First create any missing tables
    await createMissingTables(client);
    
    // Then add missing columns
    await addMissingColumns(client);
    
    // Copy data from old 'title' column to new 'name' column if exists
    await copyTitleToName(client);
    
    console.log("✅ Schema migration complete");
  } finally {
    client.release();
    await pool.end();
  }
}

async function createMissingTables(client: any): Promise<void> {
  console.log("📋 Creating missing tables...");
  
  const tableCreations = [
    // family_relationships
    `CREATE TABLE IF NOT EXISTS "family_relationships" (
      "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      "tenant_id" varchar NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
      "user_id" varchar NOT NULL REFERENCES "users"("id"),
      "related_user_id" varchar NOT NULL REFERENCES "users"("id"),
      "relationship" text NOT NULL,
      "created_at" timestamp DEFAULT now()
    )`,
    
    // announcement_files
    `CREATE TABLE IF NOT EXISTS "announcement_files" (
      "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      "tenant_id" varchar NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
      "announcement_id" varchar NOT NULL REFERENCES "announcements"("id"),
      "uploaded_by_id" varchar NOT NULL REFERENCES "users"("id"),
      "file_name" text NOT NULL,
      "file_type" text NOT NULL,
      "file_size" integer NOT NULL,
      "file_path" text NOT NULL,
      "uploaded_at" timestamp DEFAULT now()
    )`,
    
    // activities
    `CREATE TABLE IF NOT EXISTS "activities" (
      "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      "tenant_id" varchar NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
      "type" text NOT NULL,
      "description" text NOT NULL,
      "user_id" varchar REFERENCES "users"("id"),
      "created_at" timestamp DEFAULT now()
    )`,
    
    // messages
    `CREATE TABLE IF NOT EXISTS "messages" (
      "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      "tenant_id" varchar NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
      "sender_id" varchar NOT NULL REFERENCES "users"("id"),
      "recipient_id" varchar REFERENCES "users"("id"),
      "category" text,
      "subject" text NOT NULL,
      "content" text NOT NULL,
      "is_read" boolean NOT NULL DEFAULT false,
      "thread_id" varchar,
      "parent_message_id" varchar,
      "created_at" timestamp NOT NULL DEFAULT now()
    )`,
    
    // activity_log
    `CREATE TABLE IF NOT EXISTS "activity_log" (
      "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      "tenant_id" varchar NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
      "user_id" varchar NOT NULL REFERENCES "users"("id"),
      "activity_type" text NOT NULL,
      "description" text NOT NULL,
      "points" integer DEFAULT 0,
      "related_entity_id" varchar,
      "created_at" timestamp NOT NULL DEFAULT now()
    )`,
    
    // event_attendance
    `CREATE TABLE IF NOT EXISTS "event_attendance" (
      "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      "tenant_id" varchar NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
      "event_id" varchar NOT NULL REFERENCES "events"("id"),
      "user_id" varchar NOT NULL REFERENCES "users"("id"),
      "attended" boolean NOT NULL DEFAULT true,
      "recorded_by_id" varchar NOT NULL REFERENCES "users"("id"),
      "recorded_at" timestamp NOT NULL DEFAULT now()
    )`,
    
    // points_settings
    `CREATE TABLE IF NOT EXISTS "points_settings" (
      "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      "tenant_id" varchar NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
      "points_per_chf" integer NOT NULL DEFAULT 1,
      "points_per_task" integer NOT NULL DEFAULT 50,
      "points_per_event" integer NOT NULL DEFAULT 20,
      "updated_at" timestamp NOT NULL DEFAULT now()
    )`,
    
    // user_preferences
    `CREATE TABLE IF NOT EXISTS "user_preferences" (
      "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      "user_id" varchar NOT NULL UNIQUE REFERENCES "users"("id"),
      "quick_access_shortcuts" text[] DEFAULT ARRAY[]::text[],
      "updated_at" timestamp NOT NULL DEFAULT now()
    )`,
    
    // akika_applications
    `CREATE TABLE IF NOT EXISTS "akika_applications" (
      "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      "tenant_id" varchar NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
      "is_member" boolean NOT NULL DEFAULT true,
      "father_name" text NOT NULL,
      "mother_name" text NOT NULL,
      "child_name" text NOT NULL,
      "child_gender" text NOT NULL,
      "child_date_of_birth" text NOT NULL,
      "child_place_of_birth" text NOT NULL,
      "location" text NOT NULL,
      "organize_catering" boolean DEFAULT false,
      "custom_address" text,
      "custom_city" text,
      "custom_canton" text,
      "custom_postal_code" text,
      "phone" text NOT NULL,
      "email" text,
      "notes" text,
      "status" text NOT NULL DEFAULT 'pending',
      "is_archived" boolean NOT NULL DEFAULT false,
      "submitted_by" varchar REFERENCES "users"("id"),
      "reviewed_by_id" varchar REFERENCES "users"("id"),
      "reviewed_at" timestamp,
      "review_notes" text,
      "created_at" timestamp DEFAULT now()
    )`,
    
    // marriage_applications
    `CREATE TABLE IF NOT EXISTS "marriage_applications" (
      "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      "tenant_id" varchar NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
      "groom_last_name" text NOT NULL,
      "groom_first_name" text NOT NULL,
      "groom_date_of_birth" text NOT NULL,
      "groom_place_of_birth" text NOT NULL,
      "groom_nationality" text NOT NULL,
      "groom_street_address" text NOT NULL,
      "groom_postal_code" text NOT NULL,
      "groom_city" text NOT NULL,
      "groom_father_name" text NOT NULL,
      "groom_mother_name" text NOT NULL,
      "bride_last_name" text NOT NULL,
      "bride_first_name" text NOT NULL,
      "bride_date_of_birth" text NOT NULL,
      "bride_place_of_birth" text NOT NULL,
      "bride_nationality" text NOT NULL,
      "bride_street_address" text NOT NULL,
      "bride_postal_code" text NOT NULL,
      "bride_city" text NOT NULL,
      "bride_father_name" text NOT NULL,
      "bride_mother_name" text NOT NULL,
      "selected_last_name" text NOT NULL,
      "mahr" text NOT NULL,
      "civil_marriage_date" text NOT NULL,
      "civil_marriage_location" text NOT NULL,
      "witness1_name" text NOT NULL,
      "witness2_name" text NOT NULL,
      "witness3_name" text,
      "witness4_name" text,
      "proposed_date_time" text NOT NULL,
      "location" text NOT NULL,
      "custom_address" text,
      "custom_city" text,
      "custom_canton" text,
      "custom_postal_code" text,
      "phone" text NOT NULL,
      "civil_marriage_proof" text,
      "notes" text,
      "status" text NOT NULL DEFAULT 'pending',
      "reviewed_by_id" varchar REFERENCES "users"("id"),
      "reviewed_at" timestamp,
      "review_notes" text,
      "created_at" timestamp DEFAULT now()
    )`,
    
    // shop_products
    `CREATE TABLE IF NOT EXISTS "shop_products" (
      "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      "tenant_id" varchar NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
      "name" text NOT NULL,
      "photos" text[],
      "category" text,
      "weight" text,
      "volume" text,
      "size" text,
      "quantity" integer DEFAULT 0,
      "color" text,
      "notes" text,
      "price" text,
      "created_by_id" varchar NOT NULL REFERENCES "users"("id"),
      "created_at" timestamp NOT NULL DEFAULT now()
    )`,
    
    // marketplace_items
    `CREATE TABLE IF NOT EXISTS "marketplace_items" (
      "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      "tenant_id" varchar NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
      "user_id" varchar NOT NULL REFERENCES "users"("id"),
      "name" text NOT NULL,
      "photos" text[],
      "description" text,
      "price" text,
      "type" text NOT NULL DEFAULT 'prodaja',
      "status" text NOT NULL DEFAULT 'aktivan',
      "sold_to_user_id" varchar REFERENCES "users"("id"),
      "created_at" timestamp NOT NULL DEFAULT now()
    )`,
    
    // product_purchase_requests
    `CREATE TABLE IF NOT EXISTS "product_purchase_requests" (
      "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      "tenant_id" varchar NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
      "product_id" varchar NOT NULL REFERENCES "shop_products"("id"),
      "user_id" varchar NOT NULL REFERENCES "users"("id"),
      "quantity" integer NOT NULL DEFAULT 1,
      "status" text NOT NULL DEFAULT 'pending',
      "created_at" timestamp NOT NULL DEFAULT now()
    )`,
    
    // events
    `CREATE TABLE IF NOT EXISTS "events" (
      "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      "tenant_id" varchar NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
      "name" text NOT NULL,
      "description" text,
      "location" text NOT NULL,
      "date_time" timestamp NOT NULL,
      "photo_url" text,
      "rsvp_enabled" boolean DEFAULT true,
      "require_adults_children" boolean DEFAULT false,
      "max_attendees" integer,
      "reminder_time" text,
      "categories" text[],
      "points_value" integer DEFAULT 20,
      "created_by_id" varchar NOT NULL REFERENCES "users"("id"),
      "created_at" timestamp DEFAULT now()
    )`,
    
    // event_rsvps
    `CREATE TABLE IF NOT EXISTS "event_rsvps" (
      "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      "tenant_id" varchar NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
      "event_id" varchar NOT NULL REFERENCES "events"("id"),
      "user_id" varchar NOT NULL REFERENCES "users"("id"),
      "adults_count" integer DEFAULT 1,
      "children_count" integer DEFAULT 0,
      "rsvp_date" timestamp DEFAULT now(),
      "created_at" timestamp DEFAULT now()
    )`,
    
    // important_dates
    `CREATE TABLE IF NOT EXISTS "important_dates" (
      "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      "tenant_id" varchar NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
      "name" text NOT NULL,
      "date" text NOT NULL,
      "is_recurring" boolean DEFAULT true NOT NULL,
      "created_at" timestamp DEFAULT now()
    )`,
    
    // proposals (ensure exists)
    `CREATE TABLE IF NOT EXISTS "proposals" (
      "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      "tenant_id" varchar NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
      "work_group_id" varchar REFERENCES "work_groups"("id"),
      "created_by_id" varchar NOT NULL REFERENCES "users"("id"),
      "title" text NOT NULL,
      "who" text,
      "what" text,
      "where" text,
      "when" text,
      "how" text,
      "why" text,
      "budget" text,
      "status" text NOT NULL DEFAULT 'pending',
      "reviewed_by_id" varchar REFERENCES "users"("id"),
      "review_comment" text,
      "reviewed_at" timestamp,
      "created_at" timestamp NOT NULL DEFAULT now()
    )`,
    
    // sponsors
    `CREATE TABLE IF NOT EXISTS "sponsors" (
      "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      "tenant_id" varchar NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
      "name" text NOT NULL,
      "type" text NOT NULL DEFAULT 'company',
      "tier" text NOT NULL,
      "email" text,
      "phone" text,
      "website" text,
      "logo_url" text,
      "contribution_amount" integer,
      "contribution_currency" text,
      "start_date" timestamp NOT NULL DEFAULT now(),
      "end_date" timestamp,
      "status" text NOT NULL DEFAULT 'pending',
      "reviewed_by_id" varchar REFERENCES "users"("id"),
      "reviewed_at" timestamp,
      "review_notes" text,
      "created_at" timestamp NOT NULL DEFAULT now()
    )`,
    
    // sponsor_pricing
    `CREATE TABLE IF NOT EXISTS "sponsor_pricing" (
      "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      "tenant_id" varchar NOT NULL UNIQUE REFERENCES "tenants"("id") ON DELETE CASCADE,
      "bronze_amount" integer,
      "silver_amount" integer,
      "gold_amount" integer,
      "currency" text NOT NULL DEFAULT 'EUR',
      "updated_at" timestamp NOT NULL DEFAULT now()
    )`,
    
    // badges
    `CREATE TABLE IF NOT EXISTS "badges" (
      "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      "tenant_id" varchar NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
      "name" text NOT NULL,
      "description" text NOT NULL,
      "icon" text,
      "criteria_type" text NOT NULL,
      "criteria_value" integer NOT NULL,
      "created_at" timestamp NOT NULL DEFAULT now()
    )`,
    
    // user_badges
    `CREATE TABLE IF NOT EXISTS "user_badges" (
      "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      "tenant_id" varchar NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
      "user_id" varchar NOT NULL REFERENCES "users"("id"),
      "badge_id" varchar NOT NULL REFERENCES "badges"("id"),
      "earned_at" timestamp NOT NULL DEFAULT now()
    )`,
    
    // membership_upload_logs (must be created first - referenced by membership_payments)
    `CREATE TABLE IF NOT EXISTS "membership_upload_logs" (
      "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      "tenant_id" varchar NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
      "admin_id" varchar NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
      "uploaded_at" timestamp DEFAULT now(),
      "file_name" text,
      "records_processed" integer DEFAULT 0,
      "records_successful" integer DEFAULT 0,
      "records_failed" integer DEFAULT 0,
      "error_log" text
    )`,
    
    // membership_settings
    `CREATE TABLE IF NOT EXISTS "membership_settings" (
      "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      "tenant_id" varchar NOT NULL UNIQUE REFERENCES "tenants"("id") ON DELETE CASCADE,
      "fee_type" text NOT NULL DEFAULT 'monthly',
      "monthly_amount" text DEFAULT '30',
      "yearly_amount" text DEFAULT '300',
      "current_fiscal_year" integer DEFAULT 2025,
      "currency" text DEFAULT 'CHF',
      "updated_at" timestamp DEFAULT now(),
      "updated_by_id" varchar REFERENCES "users"("id") ON DELETE SET NULL
    )`,
    
    // membership_payments
    `CREATE TABLE IF NOT EXISTS "membership_payments" (
      "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      "tenant_id" varchar NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
      "user_id" varchar NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
      "amount" text NOT NULL,
      "coverage_year" integer NOT NULL,
      "coverage_month" integer,
      "paid_at" timestamp DEFAULT now(),
      "recorded_by_id" varchar REFERENCES "users"("id") ON DELETE SET NULL,
      "upload_batch_id" varchar REFERENCES "membership_upload_logs"("id") ON DELETE SET NULL
    )`
  ];
  
  let createdCount = 0;
  let existingCount = 0;
  
  for (const sql of tableCreations) {
    try {
      await client.query(sql);
      // Check if table was actually created or already existed
      createdCount++;
    } catch (error: any) {
      if (error.code === '42P07') { // table already exists
        existingCount++;
      } else {
        console.error(`⚠️ Error creating table: ${error.message}`);
      }
    }
  }
  
  console.log(`✅ Table creation complete: ${createdCount} processed, ${existingCount} already existed`);
  
  // Migrate unique constraints: from global to per-tenant
  console.log("📋 Migrating unique constraints to per-tenant...");
  try {
    // Drop old global unique constraints if they exist
    await client.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_username_unique') THEN
          ALTER TABLE users DROP CONSTRAINT users_username_unique;
          RAISE NOTICE 'Dropped global username unique constraint';
        END IF;
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_email_unique') THEN
          ALTER TABLE users DROP CONSTRAINT users_email_unique;
          RAISE NOTICE 'Dropped global email unique constraint';
        END IF;
      END $$;
    `);
    
    // Create new composite unique constraints (username + tenant, email + tenant)
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_username_tenant_unique') THEN
          ALTER TABLE users ADD CONSTRAINT users_username_tenant_unique UNIQUE (username, tenant_id);
          RAISE NOTICE 'Created per-tenant username unique constraint';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_email_tenant_unique') THEN
          ALTER TABLE users ADD CONSTRAINT users_email_tenant_unique UNIQUE (email, tenant_id);
          RAISE NOTICE 'Created per-tenant email unique constraint';
        END IF;
      END $$;
    `);
    console.log("✅ Unique constraints migrated to per-tenant");
  } catch (error: any) {
    console.log("ℹ️  Constraint migration note:", error.message);
  }
  
  // Update usernames to new standard
  console.log("📋 Updating admin usernames to new standard...");
  try {
    // Update SuperAdmin username from 'admin' to 'superadmin' in global tenant
    await client.query(`
      UPDATE users SET username = 'superadmin' 
      WHERE tenant_id = 'tenant-superadmin-global' 
      AND username = 'admin' 
      AND is_super_admin = true
    `);
    
    // Update demo tenant admin username to standard 'admin' (now safe with per-tenant uniqueness)
    await client.query(`
      UPDATE users SET username = 'admin', password = 'admin123'
      WHERE tenant_id = 'default-tenant-demo' 
      AND (username = 'demo-admin' OR username = 'admindemo' OR username LIKE 'admin-%')
      AND is_admin = true
    `);
    
    // Fix demo admin name (was showing as "Super Admin")
    await client.query(`
      UPDATE users SET first_name = 'Admin', last_name = 'Džemat'
      WHERE tenant_id = 'default-tenant-demo' 
      AND username = 'admin'
      AND is_admin = true
    `);
    
    console.log("✅ Admin usernames and names updated");
  } catch (error: any) {
    console.log("ℹ️  Username update skipped:", error.message);
  }
}

async function addMissingColumns(client: any): Promise<void> {
  console.log("📋 Adding missing columns to existing tables...");
  
  // COMPLETE list of ALL columns from schema.ts verification
  // Generated from scripts/verify-schema.ts analysis
  const columnFixes = [
    // TENANTS - 6 missing columns
    `ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "domain" text`,
    `ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "contact_email" text`,
    `ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "contact_phone" text`,
    `ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "postal_code" text`,
    `ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "logo_url" text`,
    `ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "settings" text`,
    
    // ANNOUNCEMENTS - ensure all columns exist
    `ALTER TABLE "announcements" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'published' NOT NULL`,
    `ALTER TABLE "announcements" ADD COLUMN IF NOT EXISTS "is_featured" boolean DEFAULT false`,
    `ALTER TABLE "announcements" ADD COLUMN IF NOT EXISTS "categories" text[]`,
    `ALTER TABLE "announcements" ADD COLUMN IF NOT EXISTS "photo_url" text`,
    `ALTER TABLE "announcements" ADD COLUMN IF NOT EXISTS "publish_date" timestamp DEFAULT now()`,
    
    // EVENTS - ensure all columns exist (CRITICAL: add name column if missing - old tables may have 'title')
    `ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "name" text`,
    `ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "photo_url" text`,
    `ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "rsvp_enabled" boolean DEFAULT true`,
    `ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "require_adults_children" boolean DEFAULT false`,
    `ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "max_attendees" integer`,
    `ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "reminder_time" text`,
    `ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "categories" text[]`,
    `ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "points_value" integer DEFAULT 20`,
    `ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now()`,
    
    // EVENT_RSVPS - 1 missing column
    `ALTER TABLE "event_rsvps" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now()`,
    
    // SHOP_PRODUCTS - all columns
    `ALTER TABLE "shop_products" ADD COLUMN IF NOT EXISTS "tenant_id" varchar`,
    `ALTER TABLE "shop_products" ADD COLUMN IF NOT EXISTS "name" text`,
    `ALTER TABLE "shop_products" ADD COLUMN IF NOT EXISTS "photos" text[]`,
    `ALTER TABLE "shop_products" ADD COLUMN IF NOT EXISTS "category" text`,
    `ALTER TABLE "shop_products" ADD COLUMN IF NOT EXISTS "weight" text`,
    `ALTER TABLE "shop_products" ADD COLUMN IF NOT EXISTS "volume" text`,
    `ALTER TABLE "shop_products" ADD COLUMN IF NOT EXISTS "size" text`,
    `ALTER TABLE "shop_products" ADD COLUMN IF NOT EXISTS "quantity" integer DEFAULT 0`,
    `ALTER TABLE "shop_products" ADD COLUMN IF NOT EXISTS "color" text`,
    `ALTER TABLE "shop_products" ADD COLUMN IF NOT EXISTS "notes" text`,
    `ALTER TABLE "shop_products" ADD COLUMN IF NOT EXISTS "price" text`,
    `ALTER TABLE "shop_products" ADD COLUMN IF NOT EXISTS "created_by_id" varchar`,
    `ALTER TABLE "shop_products" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now()`,
    
    // EVENT_ATTENDANCE - 3 missing columns
    `ALTER TABLE "event_attendance" ADD COLUMN IF NOT EXISTS "checked_in_by_id" varchar`,
    `ALTER TABLE "event_attendance" ADD COLUMN IF NOT EXISTS "points_awarded" integer DEFAULT 0`,
    `ALTER TABLE "event_attendance" ADD COLUMN IF NOT EXISTS "checked_in_at" timestamp DEFAULT now()`,
    
    // MESSAGES
    `ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "category" text`,
    `ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "thread_id" varchar`,
    `ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "parent_message_id" varchar`,
    
    // IMAM_QUESTIONS - 1 missing column
    `ALTER TABLE "imam_questions" ADD COLUMN IF NOT EXISTS "is_archived" boolean DEFAULT false`,
    
    // PRAYER_TIMES - 2 missing columns
    `ALTER TABLE "prayer_times" ADD COLUMN IF NOT EXISTS "juma" text`,
    `ALTER TABLE "prayer_times" ADD COLUMN IF NOT EXISTS "juma_2" text`,
    
    // CONTRIBUTION_PURPOSES - ensure name column exists (CRITICAL: old tables may have 'title')
    `ALTER TABLE "contribution_purposes" ADD COLUMN IF NOT EXISTS "name" text`,
    `ALTER TABLE "contribution_purposes" ADD COLUMN IF NOT EXISTS "target_amount" text`,
    
    // FINANCIAL_CONTRIBUTIONS - 5 missing columns
    `ALTER TABLE "financial_contributions" ADD COLUMN IF NOT EXISTS "purpose_id" varchar`,
    `ALTER TABLE "financial_contributions" ADD COLUMN IF NOT EXISTS "contribution_date" timestamp DEFAULT now()`,
    `ALTER TABLE "financial_contributions" ADD COLUMN IF NOT EXISTS "recorded_by_id" varchar`,
    `ALTER TABLE "financial_contributions" ADD COLUMN IF NOT EXISTS "receipt_number" text`,
    `ALTER TABLE "financial_contributions" ADD COLUMN IF NOT EXISTS "points_value" integer DEFAULT 0`,
    
    // DOCUMENTS - 4 missing columns
    `ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "name" text`,
    `ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "category" text`,
    `ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "is_public" boolean DEFAULT false`,
    `ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now()`,
    
    // SHOP_PRODUCTS - 3 missing + existing
    `ALTER TABLE "shop_products" ADD COLUMN IF NOT EXISTS "description" text`,
    `ALTER TABLE "shop_products" ADD COLUMN IF NOT EXISTS "image_url" text`,
    `ALTER TABLE "shop_products" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'dostupno'`,
    `ALTER TABLE "shop_products" ADD COLUMN IF NOT EXISTS "reserved_by_id" varchar`,
    `ALTER TABLE "shop_products" ADD COLUMN IF NOT EXISTS "reserved_at" timestamp`,
    `ALTER TABLE "shop_products" ADD COLUMN IF NOT EXISTS "sold_to_id" varchar`,
    `ALTER TABLE "shop_products" ADD COLUMN IF NOT EXISTS "sold_at" timestamp`,
    `ALTER TABLE "shop_products" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp`,
    
    // PRODUCT_PURCHASE_REQUESTS - 1 missing column
    `ALTER TABLE "product_purchase_requests" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now()`,
    
    // MARKETPLACE_ITEMS - 1 missing column
    `ALTER TABLE "marketplace_items" ADD COLUMN IF NOT EXISTS "title" text`,
    `ALTER TABLE "marketplace_items" ADD COLUMN IF NOT EXISTS "photos" text[]`,
    
    // FAMILY_RELATIONSHIPS - 3 missing columns
    `ALTER TABLE "family_relationships" ADD COLUMN IF NOT EXISTS "parent_user_id" varchar`,
    `ALTER TABLE "family_relationships" ADD COLUMN IF NOT EXISTS "child_user_id" varchar`,
    `ALTER TABLE "family_relationships" ADD COLUMN IF NOT EXISTS "relationship_type" text`,
    
    // MEMBERSHIP_APPLICATIONS - 13 missing columns
    `ALTER TABLE "membership_applications" ADD COLUMN IF NOT EXISTS "address" text`,
    `ALTER TABLE "membership_applications" ADD COLUMN IF NOT EXISTS "partner_first_name" text`,
    `ALTER TABLE "membership_applications" ADD COLUMN IF NOT EXISTS "partner_last_name" text`,
    `ALTER TABLE "membership_applications" ADD COLUMN IF NOT EXISTS "partner_date_of_birth" text`,
    `ALTER TABLE "membership_applications" ADD COLUMN IF NOT EXISTS "partner_occupation" text`,
    `ALTER TABLE "membership_applications" ADD COLUMN IF NOT EXISTS "children" text`,
    `ALTER TABLE "membership_applications" ADD COLUMN IF NOT EXISTS "previous_communities" text`,
    `ALTER TABLE "membership_applications" ADD COLUMN IF NOT EXISTS "membership_type" text DEFAULT 'individual'`,
    `ALTER TABLE "membership_applications" ADD COLUMN IF NOT EXISTS "accept_statute" boolean DEFAULT false`,
    `ALTER TABLE "membership_applications" ADD COLUMN IF NOT EXISTS "accept_privacy" boolean DEFAULT false`,
    `ALTER TABLE "membership_applications" ADD COLUMN IF NOT EXISTS "accept_fee" boolean DEFAULT false`,
    `ALTER TABLE "membership_applications" ADD COLUMN IF NOT EXISTS "notes" text`,
    `ALTER TABLE "membership_applications" ADD COLUMN IF NOT EXISTS "is_archived" boolean DEFAULT false`,
    
    // REQUESTS - 3 missing columns
    `ALTER TABLE "requests" ADD COLUMN IF NOT EXISTS "type" text`,
    `ALTER TABLE "requests" ADD COLUMN IF NOT EXISTS "title" text`,
    `ALTER TABLE "requests" ADD COLUMN IF NOT EXISTS "description" text`,
    
    // SERVICES - 2 missing + existing
    `ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "contact_info" text`,
    `ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "price_range" text`,
    `ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "photos" text[]`,
    `ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "user_id" varchar`,
    `ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'aktivan'`,
    `ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "duration" text`,
    
    // PROJECTS - ensure name column exists (CRITICAL: old tables may have 'title')
    `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "name" text`,
    `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "start_date" timestamp`,
    `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "end_date" timestamp`,
    `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "budget" text`,
    
    // PROPOSALS - ensure tenant_id exists + reserved keywords + created_by_id
    `ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "tenant_id" varchar`,
    `ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "created_by_id" varchar`,
    `ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "work_group_id" varchar`,
    `ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "title" text`,
    `ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'pending'`,
    `ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now()`,
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
    
    // RECEIPTS - 4 missing columns
    `ALTER TABLE "receipts" ADD COLUMN IF NOT EXISTS "tenant_id" varchar`,
    `ALTER TABLE "receipts" ADD COLUMN IF NOT EXISTS "photo_path" text`,
    `ALTER TABLE "receipts" ADD COLUMN IF NOT EXISTS "work_group_id" varchar`,
    `ALTER TABLE "receipts" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now()`,
    `ALTER TABLE "receipts" ADD COLUMN IF NOT EXISTS "proposal_id" varchar`,
    
    // ORGANIZATION_SETTINGS - 8 missing columns
    `ALTER TABLE "organization_settings" ADD COLUMN IF NOT EXISTS "imam_name" text`,
    `ALTER TABLE "organization_settings" ADD COLUMN IF NOT EXISTS "bank_name" text`,
    `ALTER TABLE "organization_settings" ADD COLUMN IF NOT EXISTS "iban" text`,
    `ALTER TABLE "organization_settings" ADD COLUMN IF NOT EXISTS "account_holder" text`,
    `ALTER TABLE "organization_settings" ADD COLUMN IF NOT EXISTS "annual_fee" text`,
    `ALTER TABLE "organization_settings" ADD COLUMN IF NOT EXISTS "referenz_zeile" text`,
    `ALTER TABLE "organization_settings" ADD COLUMN IF NOT EXISTS "show_financial_section" boolean DEFAULT true`,
    `ALTER TABLE "organization_settings" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now()`,
    
    // SPONSORS - fix column names for existing tables
    `ALTER TABLE "sponsors" ADD COLUMN IF NOT EXISTS "contribution_amount" integer`,
    `ALTER TABLE "sponsors" ADD COLUMN IF NOT EXISTS "contribution_currency" text`,
    `ALTER TABLE "sponsors" ADD COLUMN IF NOT EXISTS "review_notes" text`,
    `ALTER TABLE "sponsors" ADD COLUMN IF NOT EXISTS "start_date" timestamp DEFAULT now()`,
    `ALTER TABLE "sponsors" ADD COLUMN IF NOT EXISTS "end_date" timestamp`,
    `ALTER TABLE "sponsors" ADD COLUMN IF NOT EXISTS "logo_url" text`,
    
    // POINTS_SETTINGS - 4 missing columns
    `ALTER TABLE "points_settings" ADD COLUMN IF NOT EXISTS "event_attendance" integer DEFAULT 20`,
    `ALTER TABLE "points_settings" ADD COLUMN IF NOT EXISTS "task_completion" integer DEFAULT 50`,
    `ALTER TABLE "points_settings" ADD COLUMN IF NOT EXISTS "task_on_time_bonus" integer DEFAULT 10`,
    `ALTER TABLE "points_settings" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now()`,
    
    // MARRIAGE_APPLICATIONS - 23 missing columns
    `ALTER TABLE "marriage_applications" ADD COLUMN IF NOT EXISTS "groom_address" text`,
    `ALTER TABLE "marriage_applications" ADD COLUMN IF NOT EXISTS "groom_phone" text`,
    `ALTER TABLE "marriage_applications" ADD COLUMN IF NOT EXISTS "groom_email" text`,
    `ALTER TABLE "marriage_applications" ADD COLUMN IF NOT EXISTS "groom_previous_marriage" boolean DEFAULT false`,
    `ALTER TABLE "marriage_applications" ADD COLUMN IF NOT EXISTS "groom_witness_1_name" text`,
    `ALTER TABLE "marriage_applications" ADD COLUMN IF NOT EXISTS "groom_witness_1_father" text`,
    `ALTER TABLE "marriage_applications" ADD COLUMN IF NOT EXISTS "groom_witness_2_name" text`,
    `ALTER TABLE "marriage_applications" ADD COLUMN IF NOT EXISTS "groom_witness_2_father" text`,
    `ALTER TABLE "marriage_applications" ADD COLUMN IF NOT EXISTS "bride_address" text`,
    `ALTER TABLE "marriage_applications" ADD COLUMN IF NOT EXISTS "bride_phone" text`,
    `ALTER TABLE "marriage_applications" ADD COLUMN IF NOT EXISTS "bride_email" text`,
    `ALTER TABLE "marriage_applications" ADD COLUMN IF NOT EXISTS "bride_previous_marriage" boolean DEFAULT false`,
    `ALTER TABLE "marriage_applications" ADD COLUMN IF NOT EXISTS "bride_witness_1_name" text`,
    `ALTER TABLE "marriage_applications" ADD COLUMN IF NOT EXISTS "bride_witness_1_father" text`,
    `ALTER TABLE "marriage_applications" ADD COLUMN IF NOT EXISTS "bride_witness_2_name" text`,
    `ALTER TABLE "marriage_applications" ADD COLUMN IF NOT EXISTS "bride_witness_2_father" text`,
    `ALTER TABLE "marriage_applications" ADD COLUMN IF NOT EXISTS "marriage_date" text`,
    `ALTER TABLE "marriage_applications" ADD COLUMN IF NOT EXISTS "mehr_amount" text`,
    `ALTER TABLE "marriage_applications" ADD COLUMN IF NOT EXISTS "mehr_payment_type" text`,
    `ALTER TABLE "marriage_applications" ADD COLUMN IF NOT EXISTS "mehr_details" text`,
    `ALTER TABLE "marriage_applications" ADD COLUMN IF NOT EXISTS "additional_notes" text`,
    `ALTER TABLE "marriage_applications" ADD COLUMN IF NOT EXISTS "is_archived" boolean DEFAULT false`,
    `ALTER TABLE "marriage_applications" ADD COLUMN IF NOT EXISTS "submitted_by" varchar`,
    
    // SUBSCRIPTION_PLANS - 6 missing columns
    `ALTER TABLE "subscription_plans" ADD COLUMN IF NOT EXISTS "tier" text`,
    `ALTER TABLE "subscription_plans" ADD COLUMN IF NOT EXISTS "features" text[]`,
    `ALTER TABLE "subscription_plans" ADD COLUMN IF NOT EXISTS "sort_order" integer DEFAULT 0`,
    `ALTER TABLE "subscription_plans" ADD COLUMN IF NOT EXISTS "popular" boolean DEFAULT false`,
    `ALTER TABLE "subscription_plans" ADD COLUMN IF NOT EXISTS "trial_days" integer DEFAULT 14`,
    `ALTER TABLE "subscription_plans" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now()`,
    
    // TENANT_FEATURES - 4 missing columns
    `ALTER TABLE "tenant_features" ADD COLUMN IF NOT EXISTS "feature_key" text`,
    `ALTER TABLE "tenant_features" ADD COLUMN IF NOT EXISTS "enabled" boolean DEFAULT true`,
    `ALTER TABLE "tenant_features" ADD COLUMN IF NOT EXISTS "custom_value" text`,
    `ALTER TABLE "tenant_features" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now()`,
    
    // CERTIFICATE_TEMPLATES
    `ALTER TABLE "certificate_templates" ADD COLUMN IF NOT EXISTS "type" text NOT NULL DEFAULT 'certificate'`,
    `ALTER TABLE "certificate_templates" ADD COLUMN IF NOT EXISTS "content" text NOT NULL DEFAULT ''`,
    `ALTER TABLE "certificate_templates" ADD COLUMN IF NOT EXISTS "background_image_path" text`,
    `ALTER TABLE "certificate_templates" ADD COLUMN IF NOT EXISTS "title_position" text DEFAULT '{"x": 50, "y": 20}'`,
    `ALTER TABLE "certificate_templates" ADD COLUMN IF NOT EXISTS "recipient_position" text DEFAULT '{"x": 50, "y": 45}'`,
    `ALTER TABLE "certificate_templates" ADD COLUMN IF NOT EXISTS "message_position" text DEFAULT '{"x": 50, "y": 60}'`,
    `ALTER TABLE "certificate_templates" ADD COLUMN IF NOT EXISTS "date_position" text DEFAULT '{"x": 50, "y": 85}'`,
    `ALTER TABLE "certificate_templates" ADD COLUMN IF NOT EXISTS "font_family" text DEFAULT 'Arial'`,
    `ALTER TABLE "certificate_templates" ADD COLUMN IF NOT EXISTS "primary_color" text DEFAULT '#000000'`,
    `ALTER TABLE "certificate_templates" ADD COLUMN IF NOT EXISTS "is_default" boolean DEFAULT false`,
    
    // ACTIVITY_LOG
    `ALTER TABLE "activity_log" ADD COLUMN IF NOT EXISTS "related_entity_id" varchar`,
    
    // ACTIVITY_FEED - missing metadata column
    `ALTER TABLE "activity_feed" ADD COLUMN IF NOT EXISTS "metadata" text`,
    `ALTER TABLE "activity_feed" ADD COLUMN IF NOT EXISTS "is_clickable" boolean DEFAULT false`,
    `ALTER TABLE "activity_feed" ADD COLUMN IF NOT EXISTS "related_entity_id" varchar`,
    `ALTER TABLE "activity_feed" ADD COLUMN IF NOT EXISTS "related_entity_type" text`,
    
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
    `ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "estimated_cost" text`,
    `ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "assigned_user_ids" text[]`,
    
    // TASK_COMMENTS
    `ALTER TABLE "task_comments" ADD COLUMN IF NOT EXISTS "comment_image" text`,
    
    // WORK_GROUPS
    `ALTER TABLE "work_groups" ADD COLUMN IF NOT EXISTS "archived" boolean DEFAULT false NOT NULL`,
    
    // IMPORTANT_DATES
    `ALTER TABLE "important_dates" ADD COLUMN IF NOT EXISTS "name" text`,
    `ALTER TABLE "important_dates" ADD COLUMN IF NOT EXISTS "date" text`,
    `ALTER TABLE "important_dates" ADD COLUMN IF NOT EXISTS "is_recurring" boolean DEFAULT true NOT NULL`,
    
    // BADGES - all columns from schema.ts (with defaults for safety)
    `ALTER TABLE "badges" ADD COLUMN IF NOT EXISTS "name" text DEFAULT ''`,
    `ALTER TABLE "badges" ADD COLUMN IF NOT EXISTS "description" text DEFAULT ''`,
    `ALTER TABLE "badges" ADD COLUMN IF NOT EXISTS "icon" text`,
    `ALTER TABLE "badges" ADD COLUMN IF NOT EXISTS "criteria_type" text DEFAULT 'points_total'`,
    `ALTER TABLE "badges" ADD COLUMN IF NOT EXISTS "criteria_value" integer DEFAULT 0`,
    `ALTER TABLE "badges" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now()`,
    
    // USER_BADGES - all columns from schema.ts
    `ALTER TABLE "user_badges" ADD COLUMN IF NOT EXISTS "awarded_at" timestamp DEFAULT now()`,
  ];

  let addedCount = 0;
  let errorCount = 0;
  
  for (const sql of columnFixes) {
    try {
      await client.query(sql);
      addedCount++;
    } catch (error: any) {
      if (!error.message?.includes('does not exist')) {
        errorCount++;
      }
    }
  }
  console.log(`✅ Processed ${addedCount} column fixes (${errorCount} skipped)`);
  
  // Fix NOT NULL constraints on created_by_id columns (should be nullable per schema)
  console.log("📋 Fixing NOT NULL constraints on created_by_id columns...");
  const nullableConstraints = [
    `ALTER TABLE "contribution_purposes" ALTER COLUMN "created_by_id" DROP NOT NULL`,
    `ALTER TABLE "financial_contributions" ALTER COLUMN "created_by_id" DROP NOT NULL`,
    `ALTER TABLE "events" ALTER COLUMN "created_by_id" DROP NOT NULL`,
    `ALTER TABLE "projects" ALTER COLUMN "created_by_id" DROP NOT NULL`,
  ];
  
  let constraintCount = 0;
  for (const sql of nullableConstraints) {
    try {
      await client.query(sql);
      constraintCount++;
    } catch (error: any) {
      // Ignore if already nullable or column doesn't exist
    }
  }
  console.log(`✅ Fixed ${constraintCount} NOT NULL constraints`);
  
  // Fix NOT NULL constraints on legacy 'title' columns (production has title, schema uses name)
  console.log("📋 Fixing NOT NULL constraints on legacy 'title' columns...");
  const legacyTitleConstraints = [
    `ALTER TABLE "events" ALTER COLUMN "title" DROP NOT NULL`,
    `ALTER TABLE "contribution_purposes" ALTER COLUMN "title" DROP NOT NULL`,
    `ALTER TABLE "projects" ALTER COLUMN "title" DROP NOT NULL`,
  ];
  
  // Fix NOT NULL on legacy 'start_date' column (production uses start_date, schema uses date_time)
  try {
    await client.query(`ALTER TABLE "events" ALTER COLUMN "start_date" DROP NOT NULL`);
    console.log("✅ Fixed events.start_date NOT NULL constraint");
  } catch (e: any) {
    // Column may not exist
  }
  
  // Copy date_time to start_date if start_date is null
  try {
    await client.query(`UPDATE "events" SET "start_date" = "date_time" WHERE "start_date" IS NULL AND "date_time" IS NOT NULL`);
    console.log("✅ Synced events.date_time → start_date");
  } catch (e: any) {
    // Ignore
  }
  
  let titleConstraintCount = 0;
  for (const sql of legacyTitleConstraints) {
    try {
      await client.query(sql);
      titleConstraintCount++;
    } catch (error: any) {
      // Ignore if column doesn't exist
    }
  }
  console.log(`✅ Fixed ${titleConstraintCount} legacy 'title' NOT NULL constraints`);
  
  // Add CASCADE DELETE to all user FK constraints
  console.log("📋 Migrating user foreign key constraints to CASCADE...");
  const cascadeDeletes = [
    // Activities FK
    `ALTER TABLE "activities" DROP CONSTRAINT IF EXISTS "activities_user_id_fkey"`,
    `ALTER TABLE "activities" ADD CONSTRAINT "activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE`,
    
    // Activity Log FK
    `ALTER TABLE "activity_log" DROP CONSTRAINT IF EXISTS "activity_log_user_id_fkey"`,
    `ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE`,
    
    // User Badges FK
    `ALTER TABLE "user_badges" DROP CONSTRAINT IF EXISTS "user_badges_user_id_fkey"`,
    `ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE`,
    
    // Event Attendance User FK
    `ALTER TABLE "event_attendance" DROP CONSTRAINT IF EXISTS "event_attendance_user_id_fkey"`,
    `ALTER TABLE "event_attendance" ADD CONSTRAINT "event_attendance_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE`,
    
    // Event Attendance Recorded By FK
    `ALTER TABLE "event_attendance" DROP CONSTRAINT IF EXISTS "event_attendance_recorded_by_id_fkey"`,
    `ALTER TABLE "event_attendance" ADD CONSTRAINT "event_attendance_recorded_by_id_fkey" FOREIGN KEY ("recorded_by_id") REFERENCES "users"("id") ON DELETE SET NULL`,
    
    // Messages Sender FK
    `ALTER TABLE "messages" DROP CONSTRAINT IF EXISTS "messages_sender_id_fkey"`,
    `ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE`,
    
    // Messages Recipient FK
    `ALTER TABLE "messages" DROP CONSTRAINT IF EXISTS "messages_recipient_id_fkey"`,
    `ALTER TABLE "messages" ADD CONSTRAINT "messages_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE CASCADE`,
    
    // Task Comments User FK
    `ALTER TABLE "task_comments" DROP CONSTRAINT IF EXISTS "task_comments_user_id_fkey"`,
    `ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE`,
    
    // Work Group Members User FK
    `ALTER TABLE "work_group_members" DROP CONSTRAINT IF EXISTS "work_group_members_user_id_fkey"`,
    `ALTER TABLE "work_group_members" ADD CONSTRAINT "work_group_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE`,
    
    // User Certificates FK
    `ALTER TABLE "user_certificates" DROP CONSTRAINT IF EXISTS "user_certificates_user_id_fkey"`,
    `ALTER TABLE "user_certificates" ADD CONSTRAINT "user_certificates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE`,
    
    // User Preferences FK
    `ALTER TABLE "user_preferences" DROP CONSTRAINT IF EXISTS "user_preferences_user_id_fkey"`,
    `ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE`,
    
    // Financial Contributions FK
    `ALTER TABLE "financial_contributions" DROP CONSTRAINT IF EXISTS "financial_contributions_user_id_fkey"`,
    `ALTER TABLE "financial_contributions" ADD CONSTRAINT "financial_contributions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE`,
    
    // Event RSVPs User FK
    `ALTER TABLE "event_rsvps" DROP CONSTRAINT IF EXISTS "event_rsvps_user_id_fkey"`,
    `ALTER TABLE "event_rsvps" ADD CONSTRAINT "event_rsvps_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE`,
  ];
  
  let cascadeCount = 0;
  for (const sql of cascadeDeletes) {
    try {
      await client.query(sql);
      cascadeCount++;
    } catch (error: any) {
      if (!error.message?.includes('does not exist')) {
        console.log(`ℹ️  Cascade migration skipped: ${error.message?.substring(0, 60)}`);
      }
    }
  }
  console.log(`✅ Migrated ${cascadeCount} foreign key constraints to CASCADE`);
}

// Copy data from old 'title' column to new 'name' column for legacy databases
async function copyTitleToName(client: any): Promise<void> {
  console.log("📋 Migrating title->name for legacy tables...");
  
  const tablesToMigrate = ['events', 'contribution_purposes', 'projects'];
  let migratedCount = 0;
  
  for (const table of tablesToMigrate) {
    try {
      // Check if 'title' column exists in the table
      const titleCheck = await client.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = $1 AND column_name = 'title'
      `, [table]);
      
      if (titleCheck.rows.length > 0) {
        // 'title' column exists, copy data to 'name' where 'name' is null
        await client.query(`
          UPDATE "${table}" SET "name" = "title" 
          WHERE "name" IS NULL AND "title" IS NOT NULL
        `);
        migratedCount++;
        console.log(`  ✅ Migrated ${table}: copied title->name`);
      }
    } catch (error: any) {
      // Silently skip if table or column doesn't exist
      if (!error.message?.includes('does not exist')) {
        console.log(`  ℹ️  ${table}: ${error.message?.substring(0, 50)}`);
      }
    }
  }
  
  if (migratedCount > 0) {
    console.log(`✅ Migrated ${migratedCount} tables (title->name)`);
  } else {
    console.log(`ℹ️  No title->name migration needed`);
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
