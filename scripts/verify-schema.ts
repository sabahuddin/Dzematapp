/**
 * Schema Verification Script
 * 
 * Compares shared/schema.ts with the actual database structure.
 * Reports exactly what's missing - tables and columns.
 * 
 * Usage: npx tsx scripts/verify-schema.ts
 */

import { Pool } from "pg";

// All 44 tables from schema.ts with their expected columns
// This is the SINGLE SOURCE OF TRUTH - extracted from shared/schema.ts
const EXPECTED_SCHEMA: Record<string, string[]> = {
  tenants: ['id', 'name', 'slug', 'subdomain', 'domain', 'contact_email', 'contact_phone', 'address', 'city', 'country', 'postal_code', 'logo_url', 'subscription_tier', 'subscription_status', 'trial_ends_at', 'stripe_customer_id', 'stripe_subscription_id', 'created_at', 'updated_at', 'settings'],
  users: ['id', 'tenant_id', 'first_name', 'last_name', 'username', 'email', 'password', 'phone', 'photo', 'address', 'city', 'postal_code', 'date_of_birth', 'occupation', 'membership_date', 'status', 'inactive_reason', 'categories', 'roles', 'is_admin', 'is_super_admin', 'last_viewed_shop', 'last_viewed_events', 'last_viewed_announcements', 'last_viewed_imam_questions', 'last_viewed_tasks', 'skills', 'total_points'],
  announcements: ['id', 'tenant_id', 'title', 'content', 'author_id', 'publish_date', 'status', 'is_featured', 'categories', 'photo_url'],
  events: ['id', 'tenant_id', 'name', 'description', 'location', 'date_time', 'photo_url', 'rsvp_enabled', 'require_adults_children', 'max_attendees', 'reminder_time', 'categories', 'points_value', 'created_by_id', 'created_at'],
  event_rsvps: ['id', 'tenant_id', 'event_id', 'user_id', 'adults_count', 'children_count', 'created_at'],
  event_attendance: ['id', 'tenant_id', 'event_id', 'user_id', 'checked_in_by_id', 'points_awarded', 'checked_in_at'],
  messages: ['id', 'tenant_id', 'sender_id', 'recipient_id', 'category', 'subject', 'content', 'is_read', 'thread_id', 'parent_message_id', 'created_at'],
  imam_questions: ['id', 'tenant_id', 'user_id', 'subject', 'question', 'answer', 'answered_by_id', 'answered_at', 'is_archived', 'created_at'],
  work_groups: ['id', 'tenant_id', 'name', 'description', 'visibility', 'archived', 'created_at'],
  work_group_members: ['id', 'tenant_id', 'work_group_id', 'user_id', 'is_moderator', 'joined_at'],
  tasks: ['id', 'tenant_id', 'title', 'description', 'description_image', 'work_group_id', 'assigned_user_ids', 'status', 'due_date', 'estimated_cost', 'points_value', 'created_at', 'completed_at'],
  task_comments: ['id', 'tenant_id', 'task_id', 'user_id', 'content', 'comment_image', 'created_at'],
  access_requests: ['id', 'tenant_id', 'user_id', 'work_group_id', 'status', 'request_date'],
  activities: ['id', 'tenant_id', 'type', 'description', 'user_id', 'created_at'],
  prayer_times: ['id', 'tenant_id', 'date', 'fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha', 'juma', 'juma_2'],
  important_dates: ['id', 'tenant_id', 'name', 'date', 'is_recurring', 'created_at'],
  contribution_purposes: ['id', 'tenant_id', 'name', 'description', 'target_amount', 'is_active', 'created_at'],
  financial_contributions: ['id', 'tenant_id', 'user_id', 'purpose_id', 'amount', 'contribution_date', 'payment_method', 'notes', 'recorded_by_id', 'receipt_number', 'created_at'],
  documents: ['id', 'tenant_id', 'name', 'category', 'file_path', 'description', 'uploaded_by_id', 'is_public', 'created_at'],
  shop_products: ['id', 'tenant_id', 'name', 'description', 'price', 'image_url', 'category', 'status', 'created_by_id', 'reserved_by_id', 'reserved_at', 'sold_to_id', 'sold_at', 'deleted_at'],
  product_purchase_requests: ['id', 'tenant_id', 'product_id', 'user_id', 'status', 'created_at', 'updated_at'],
  marketplace_items: ['id', 'tenant_id', 'user_id', 'title', 'description', 'type', 'price', 'photos', 'status', 'created_at'],
  family_relationships: ['id', 'tenant_id', 'parent_user_id', 'child_user_id', 'relationship_type', 'created_at'],
  membership_applications: ['id', 'tenant_id', 'first_name', 'last_name', 'date_of_birth', 'email', 'phone', 'occupation', 'address', 'city', 'postal_code', 'partner_first_name', 'partner_last_name', 'partner_date_of_birth', 'partner_occupation', 'children', 'previous_communities', 'membership_type', 'accept_statute', 'accept_privacy', 'accept_fee', 'notes', 'status', 'reviewed_by_id', 'reviewed_at', 'review_notes', 'is_archived', 'created_at'],
  requests: ['id', 'tenant_id', 'user_id', 'type', 'title', 'description', 'status', 'reviewed_by_id', 'reviewed_at', 'created_at'],
  services: ['id', 'tenant_id', 'user_id', 'name', 'description', 'category', 'contact_info', 'price_range', 'photos', 'status', 'duration'],
  badges: ['id', 'tenant_id', 'name', 'description', 'icon', 'criteria_type', 'criteria_value', 'created_at'],
  user_badges: ['id', 'tenant_id', 'user_id', 'badge_id', 'earned_at'],
  activity_log: ['id', 'tenant_id', 'user_id', 'activity_type', 'description', 'points', 'related_entity_id', 'created_at'],
  activity_feed: ['id', 'tenant_id', 'type', 'title', 'description', 'related_entity_id', 'related_entity_type', 'metadata', 'is_clickable', 'created_at'],
  projects: ['id', 'tenant_id', 'name', 'description', 'status', 'start_date', 'end_date', 'budget', 'created_by_id', 'created_at'],
  certificate_templates: ['id', 'tenant_id', 'name', 'description', 'background_image_path', 'title_position', 'recipient_position', 'message_position', 'date_position', 'font_family', 'primary_color', 'is_default', 'created_at'],
  user_certificates: ['id', 'tenant_id', 'user_id', 'template_id', 'recipient_name', 'certificate_image_path', 'message', 'issued_by_id', 'issued_at', 'viewed'],
  proposals: ['id', 'tenant_id', 'work_group_id', 'created_by_id', 'who', 'what', 'where', 'when', 'how', 'why', 'budget', 'status', 'reviewed_by_id', 'review_comment', 'created_at', 'reviewed_at'],
  receipts: ['id', 'tenant_id', 'task_id', 'proposal_id', 'uploaded_by_id', 'description', 'amount', 'photo_path', 'status', 'reviewed_by_id', 'reviewed_at', 'review_comment', 'work_group_id', 'created_at'],
  organization_settings: ['id', 'tenant_id', 'imam_name', 'address', 'bank_name', 'iban', 'account_holder', 'annual_fee', 'referenz_zeile', 'show_financial_section', 'livestream_url', 'created_at'],
  points_settings: ['id', 'tenant_id', 'event_attendance', 'task_completion', 'task_on_time_bonus', 'created_at'],
  announcement_files: ['id', 'tenant_id', 'announcement_id', 'uploaded_by_id', 'file_name', 'file_type', 'file_size', 'file_path', 'uploaded_at'],
  marriage_applications: ['id', 'tenant_id', 'groom_first_name', 'groom_last_name', 'groom_father_name', 'groom_mother_name', 'groom_date_of_birth', 'groom_place_of_birth', 'groom_nationality', 'groom_address', 'groom_phone', 'groom_email', 'groom_previous_marriage', 'groom_witness_1_name', 'groom_witness_1_father', 'groom_witness_2_name', 'groom_witness_2_father', 'bride_first_name', 'bride_last_name', 'bride_father_name', 'bride_mother_name', 'bride_date_of_birth', 'bride_place_of_birth', 'bride_nationality', 'bride_address', 'bride_phone', 'bride_email', 'bride_previous_marriage', 'bride_witness_1_name', 'bride_witness_1_father', 'bride_witness_2_name', 'bride_witness_2_father', 'marriage_date', 'mehr_amount', 'mehr_payment_type', 'mehr_details', 'additional_notes', 'status', 'is_archived', 'submitted_by', 'reviewed_by_id', 'reviewed_at', 'review_notes', 'created_at'],
  akika_applications: ['id', 'tenant_id', 'is_member', 'father_name', 'mother_name', 'child_name', 'child_gender', 'child_date_of_birth', 'child_place_of_birth', 'location', 'organize_catering', 'custom_address', 'custom_city', 'custom_canton', 'custom_postal_code', 'phone', 'email', 'notes', 'status', 'is_archived', 'submitted_by', 'reviewed_by_id', 'reviewed_at', 'review_notes', 'created_at'],
  subscription_plans: ['id', 'name', 'tier', 'price_monthly', 'price_yearly', 'max_users', 'features', 'is_active', 'stripe_price_id_monthly', 'stripe_price_id_yearly', 'description', 'sort_order', 'popular', 'trial_days', 'created_at', 'updated_at'],
  tenant_features: ['id', 'tenant_id', 'feature_key', 'enabled', 'custom_value', 'created_at', 'updated_at'],
  audit_logs: ['id', 'tenant_id', 'user_id', 'action', 'resource_type', 'resource_id', 'data_before', 'data_after', 'ip_address', 'user_agent', 'description', 'created_at'],
  user_preferences: ['id', 'user_id', 'quick_access_shortcuts', 'updated_at'],
};

interface VerificationResult {
  missingTables: string[];
  tablesWithMissingColumns: { table: string; missingColumns: string[]; existingColumns: string[] }[];
  allVerified: boolean;
  totalTables: number;
  totalColumns: number;
}

async function getDatabaseInfo(client: any): Promise<Map<string, Set<string>>> {
  const result = await client.query(`
    SELECT table_name, column_name 
    FROM information_schema.columns 
    WHERE table_schema = 'public'
    ORDER BY table_name, ordinal_position
  `);
  
  const dbInfo = new Map<string, Set<string>>();
  
  for (const row of result.rows) {
    if (!dbInfo.has(row.table_name)) {
      dbInfo.set(row.table_name, new Set());
    }
    dbInfo.get(row.table_name)!.add(row.column_name);
  }
  
  return dbInfo;
}

async function verifySchema(): Promise<VerificationResult> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const client = await pool.connect();

  try {
    const tableCount = Object.keys(EXPECTED_SCHEMA).length;
    const columnCount = Object.values(EXPECTED_SCHEMA).reduce((sum, cols) => sum + cols.length, 0);
    
    console.log(`📋 Expected: ${tableCount} tables, ${columnCount} columns\n`);

    const dbInfo = await getDatabaseInfo(client);
    console.log(`🔍 Database has: ${dbInfo.size} tables\n`);

    const missingTables: string[] = [];
    const tablesWithMissingColumns: { table: string; missingColumns: string[]; existingColumns: string[] }[] = [];

    for (const [tableName, expectedColumns] of Object.entries(EXPECTED_SCHEMA)) {
      const dbColumns = dbInfo.get(tableName);
      
      if (!dbColumns) {
        missingTables.push(tableName);
        console.log(`❌ MISSING TABLE: ${tableName}`);
        console.log(`   Needs ${expectedColumns.length} columns: ${expectedColumns.slice(0, 5).join(', ')}...\n`);
      } else {
        const missingColumns = expectedColumns.filter(col => !dbColumns.has(col));
        
        if (missingColumns.length > 0) {
          tablesWithMissingColumns.push({
            table: tableName,
            missingColumns,
            existingColumns: Array.from(dbColumns)
          });
          console.log(`⚠️  ${tableName}: MISSING ${missingColumns.length} COLUMNS`);
          console.log(`   Missing: ${missingColumns.join(', ')}\n`);
        } else {
          console.log(`✅ ${tableName} (${expectedColumns.length} columns)`);
        }
      }
    }

    const allVerified = missingTables.length === 0 && tablesWithMissingColumns.length === 0;

    return { 
      missingTables, 
      tablesWithMissingColumns, 
      allVerified,
      totalTables: tableCount,
      totalColumns: columnCount
    };
  } finally {
    client.release();
    await pool.end();
  }
}

function generateAlterStatements(result: VerificationResult): string[] {
  const statements: string[] = [];
  
  for (const { table, missingColumns } of result.tablesWithMissingColumns) {
    statements.push(`-- ${table}`);
    for (const col of missingColumns) {
      // Determine type based on column name patterns
      let sqlType = 'text';
      let defaultVal = '';
      
      if (col.endsWith('_id')) sqlType = 'varchar';
      else if (col.endsWith('_at') || col.endsWith('_date')) { sqlType = 'timestamp'; defaultVal = ' DEFAULT now()'; }
      else if (col.startsWith('is_') || col === 'archived' || col === 'viewed') { sqlType = 'boolean'; defaultVal = ' DEFAULT false'; }
      else if (col.endsWith('_count') || col === 'points' || col === 'amount' || col === 'total_points' || col === 'points_value') { sqlType = 'integer'; defaultVal = ' DEFAULT 0'; }
      else if (col.endsWith('s') && !col.endsWith('ss') && !col.endsWith('status')) sqlType = 'text[]';
      
      statements.push(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "${col}" ${sqlType}${defaultVal};`);
    }
    statements.push('');
  }
  
  return statements;
}

async function main() {
  console.log("\n" + "=".repeat(70));
  console.log("🔄 SCHEMA VERIFICATION - Comparing schema.ts with database");
  console.log("=".repeat(70) + "\n");
  
  try {
    const result = await verifySchema();
    
    console.log("\n" + "=".repeat(70));
    if (result.allVerified) {
      console.log(`✅ ALL ${result.totalTables} TABLES AND ${result.totalColumns} COLUMNS VERIFIED!`);
      console.log("=".repeat(70));
      process.exit(0);
    } else {
      console.log("❌ SCHEMA DRIFT DETECTED!");
      console.log(`   Missing tables: ${result.missingTables.length}`);
      console.log(`   Tables with missing columns: ${result.tablesWithMissingColumns.length}`);
      console.log("=".repeat(70));
      
      if (result.tablesWithMissingColumns.length > 0) {
        console.log("\n📝 COPY THESE TO migrate-production.ts:\n");
        const statements = generateAlterStatements(result);
        console.log(statements.join('\n'));
      }
      
      process.exit(1);
    }
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
