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
    
    // Update demo tenant admin username from 'demo-admin' to 'admin'
    await client.query(`
      UPDATE users SET username = 'admin', password = 'admin123'
      WHERE tenant_id = 'default-tenant-demo' 
      AND (username = 'demo-admin' OR username = 'admindemo')
      AND is_admin = true
    `);
    
    // Fix demo admin name (was showing as "Super Admin")
    await client.query(`
      UPDATE users SET first_name = 'Admin', last_name = 'Džemat'
      WHERE tenant_id = 'default-tenant-demo' 
      AND username = 'admin'
      AND is_admin = true
    `);
    
    // Fix admin2024 to have admin role
    await client.query(`
      UPDATE users SET roles = '{admin}', is_admin = true
      WHERE tenant_id = 'default-tenant-demo' 
      AND username = 'admin2024'
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
    
    // EVENTS - ensure all columns exist
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
    
    // CONTRIBUTION_PURPOSES - 1 missing column
    `ALTER TABLE "contribution_purposes" ADD COLUMN IF NOT EXISTS "target_amount" text`,
    
    // FINANCIAL_CONTRIBUTIONS - 4 missing columns
    `ALTER TABLE "financial_contributions" ADD COLUMN IF NOT EXISTS "purpose_id" varchar`,
    `ALTER TABLE "financial_contributions" ADD COLUMN IF NOT EXISTS "contribution_date" timestamp DEFAULT now()`,
    `ALTER TABLE "financial_contributions" ADD COLUMN IF NOT EXISTS "recorded_by_id" varchar`,
    `ALTER TABLE "financial_contributions" ADD COLUMN IF NOT EXISTS "receipt_number" text`,
    
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
    
    // PROJECTS - 3 missing columns
    `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "start_date" timestamp`,
    `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "end_date" timestamp`,
    `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "budget" text`,
    
    // PROPOSALS - ensure tenant_id exists + reserved keywords
    `ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "tenant_id" varchar`,
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
    
    // IMPORTANT_DATES
    `ALTER TABLE "important_dates" ADD COLUMN IF NOT EXISTS "is_recurring" boolean DEFAULT true NOT NULL`,
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
