import { pool } from "./db";

export async function migrateProductionSchema(): Promise<void> {
  console.log("🔄 Running production schema migration...");
  
  const client = await pool.connect();
  
  try {
    // First, create all missing tables
    await createMissingTables(client);
    
    // Then add missing columns to existing tables
    await addMissingColumns(client);
    
    console.log("✅ Schema migration complete");
    
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    client.release();
  }
}

async function tableExists(client: any, tableName: string): Promise<boolean> {
  const result = await client.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = $1
    )
  `, [tableName]);
  return result.rows[0].exists;
}

async function createMissingTables(client: any): Promise<void> {
  console.log("📋 Checking for missing tables...");
  
  // Work Groups table
  if (!(await tableExists(client, 'work_groups'))) {
    await client.query(`
      CREATE TABLE work_groups (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id VARCHAR NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        visibility TEXT NOT NULL DEFAULT 'javna',
        archived BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("  ✅ Created table: work_groups");
  }
  
  // Work Group Members table
  if (!(await tableExists(client, 'work_group_members'))) {
    await client.query(`
      CREATE TABLE work_group_members (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id VARCHAR NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        work_group_id VARCHAR NOT NULL REFERENCES work_groups(id),
        user_id VARCHAR NOT NULL REFERENCES users(id),
        is_moderator BOOLEAN DEFAULT FALSE,
        joined_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("  ✅ Created table: work_group_members");
  }
  
  // Tasks table
  if (!(await tableExists(client, 'tasks'))) {
    await client.query(`
      CREATE TABLE tasks (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id VARCHAR NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        description_image TEXT,
        work_group_id VARCHAR NOT NULL REFERENCES work_groups(id),
        assigned_user_ids TEXT[],
        status TEXT NOT NULL DEFAULT 'u_toku',
        due_date TIMESTAMP,
        estimated_cost TEXT,
        points_value INTEGER DEFAULT 50,
        created_at TIMESTAMP DEFAULT NOW(),
        completed_at TIMESTAMP
      )
    `);
    console.log("  ✅ Created table: tasks");
  }
  
  // Task Comments table
  if (!(await tableExists(client, 'task_comments'))) {
    await client.query(`
      CREATE TABLE task_comments (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id VARCHAR NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        task_id VARCHAR NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        user_id VARCHAR NOT NULL REFERENCES users(id),
        content TEXT NOT NULL,
        comment_image TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("  ✅ Created table: task_comments");
  }
  
  // Access Requests table
  if (!(await tableExists(client, 'access_requests'))) {
    await client.query(`
      CREATE TABLE access_requests (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id VARCHAR NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        user_id VARCHAR NOT NULL REFERENCES users(id),
        work_group_id VARCHAR NOT NULL REFERENCES work_groups(id),
        status TEXT NOT NULL DEFAULT 'pending',
        request_date TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("  ✅ Created table: access_requests");
  }
  
  // Shop Products table
  if (!(await tableExists(client, 'shop_products'))) {
    await client.query(`
      CREATE TABLE shop_products (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id VARCHAR NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        price TEXT NOT NULL,
        category TEXT NOT NULL,
        photo_url TEXT,
        in_stock BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("  ✅ Created table: shop_products");
  }
  
  // Marketplace Items table
  if (!(await tableExists(client, 'marketplace_items'))) {
    await client.query(`
      CREATE TABLE marketplace_items (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id VARCHAR NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        user_id VARCHAR NOT NULL REFERENCES users(id),
        title TEXT NOT NULL,
        description TEXT,
        price TEXT,
        type TEXT NOT NULL DEFAULT 'sale',
        photo_url TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("  ✅ Created table: marketplace_items");
  }
  
  // Product Purchase Requests table
  if (!(await tableExists(client, 'product_purchase_requests'))) {
    await client.query(`
      CREATE TABLE product_purchase_requests (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id VARCHAR NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        product_id VARCHAR NOT NULL REFERENCES shop_products(id),
        user_id VARCHAR NOT NULL REFERENCES users(id),
        quantity INTEGER NOT NULL DEFAULT 1,
        status TEXT NOT NULL DEFAULT 'pending',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("  ✅ Created table: product_purchase_requests");
  }
  
  // Prayer Times table
  if (!(await tableExists(client, 'prayer_times'))) {
    await client.query(`
      CREATE TABLE prayer_times (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id VARCHAR NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        date TEXT NOT NULL,
        fajr TEXT NOT NULL,
        sunrise TEXT NOT NULL,
        dhuhr TEXT NOT NULL,
        asr TEXT NOT NULL,
        maghrib TEXT NOT NULL,
        isha TEXT NOT NULL
      )
    `);
    console.log("  ✅ Created table: prayer_times");
  }
  
  // Important Dates table
  if (!(await tableExists(client, 'important_dates'))) {
    await client.query(`
      CREATE TABLE important_dates (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id VARCHAR NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        date TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL DEFAULT 'holiday'
      )
    `);
    console.log("  ✅ Created table: important_dates");
  }
  
  // Contribution Purposes table
  if (!(await tableExists(client, 'contribution_purposes'))) {
    await client.query(`
      CREATE TABLE contribution_purposes (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id VARCHAR NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("  ✅ Created table: contribution_purposes");
  }
  
  // Financial Contributions table
  if (!(await tableExists(client, 'financial_contributions'))) {
    await client.query(`
      CREATE TABLE financial_contributions (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id VARCHAR NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        user_id VARCHAR NOT NULL REFERENCES users(id),
        purpose_id VARCHAR REFERENCES contribution_purposes(id),
        amount TEXT NOT NULL,
        payment_method TEXT,
        notes TEXT,
        date TIMESTAMP DEFAULT NOW(),
        recorded_by_id VARCHAR REFERENCES users(id)
      )
    `);
    console.log("  ✅ Created table: financial_contributions");
  }
  
  // Badges table
  if (!(await tableExists(client, 'badges'))) {
    await client.query(`
      CREATE TABLE badges (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id VARCHAR NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        icon TEXT,
        points_required INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("  ✅ Created table: badges");
  }
  
  // User Badges table
  if (!(await tableExists(client, 'user_badges'))) {
    await client.query(`
      CREATE TABLE user_badges (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id),
        badge_id VARCHAR NOT NULL REFERENCES badges(id),
        awarded_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("  ✅ Created table: user_badges");
  }
  
  // Projects table
  if (!(await tableExists(client, 'projects'))) {
    await client.query(`
      CREATE TABLE projects (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id VARCHAR NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        start_date TIMESTAMP,
        end_date TIMESTAMP,
        budget TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("  ✅ Created table: projects");
  }
  
  // Proposals table
  if (!(await tableExists(client, 'proposals'))) {
    await client.query(`
      CREATE TABLE proposals (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id VARCHAR NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'activity',
        status TEXT NOT NULL DEFAULT 'pending',
        submitted_by_id VARCHAR NOT NULL REFERENCES users(id),
        work_group_id VARCHAR REFERENCES work_groups(id),
        reviewed_by_id VARCHAR REFERENCES users(id),
        review_notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        reviewed_at TIMESTAMP
      )
    `);
    console.log("  ✅ Created table: proposals");
  }
  
  // Receipts table
  if (!(await tableExists(client, 'receipts'))) {
    await client.query(`
      CREATE TABLE receipts (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id VARCHAR NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        user_id VARCHAR NOT NULL REFERENCES users(id),
        task_id VARCHAR REFERENCES tasks(id),
        amount TEXT NOT NULL,
        description TEXT,
        image_url TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("  ✅ Created table: receipts");
  }
  
  // Certificate Templates table
  if (!(await tableExists(client, 'certificate_templates'))) {
    await client.query(`
      CREATE TABLE certificate_templates (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id VARCHAR NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        content TEXT NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("  ✅ Created table: certificate_templates");
  }
  
  // User Certificates table
  if (!(await tableExists(client, 'user_certificates'))) {
    await client.query(`
      CREATE TABLE user_certificates (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id VARCHAR NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        user_id VARCHAR NOT NULL REFERENCES users(id),
        template_id VARCHAR NOT NULL REFERENCES certificate_templates(id),
        issued_by_id VARCHAR NOT NULL REFERENCES users(id),
        certificate_number TEXT,
        issued_at TIMESTAMP DEFAULT NOW(),
        is_viewed BOOLEAN NOT NULL DEFAULT FALSE,
        pdf_url TEXT
      )
    `);
    console.log("  ✅ Created table: user_certificates");
  }
  
  // Membership Applications table
  if (!(await tableExists(client, 'membership_applications'))) {
    await client.query(`
      CREATE TABLE membership_applications (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id VARCHAR NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        address TEXT,
        city TEXT,
        postal_code TEXT,
        date_of_birth TEXT,
        occupation TEXT,
        message TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        reviewed_by_id VARCHAR REFERENCES users(id),
        review_notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        reviewed_at TIMESTAMP
      )
    `);
    console.log("  ✅ Created table: membership_applications");
  }
  
  // Activity Feed table
  if (!(await tableExists(client, 'activity_feed'))) {
    await client.query(`
      CREATE TABLE activity_feed (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id VARCHAR NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        user_id VARCHAR REFERENCES users(id),
        related_id VARCHAR,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("  ✅ Created table: activity_feed");
  }
  
  // Services table
  if (!(await tableExists(client, 'services'))) {
    await client.query(`
      CREATE TABLE services (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id VARCHAR NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        price TEXT,
        category TEXT,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("  ✅ Created table: services");
  }
  
  // Tenant Features table
  if (!(await tableExists(client, 'tenant_features'))) {
    await client.query(`
      CREATE TABLE tenant_features (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id VARCHAR NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        feature_key TEXT NOT NULL,
        is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
        settings TEXT,
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("  ✅ Created table: tenant_features");
  }
  
  // Audit Logs table
  if (!(await tableExists(client, 'audit_logs'))) {
    await client.query(`
      CREATE TABLE audit_logs (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id VARCHAR NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        user_id VARCHAR REFERENCES users(id),
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id VARCHAR,
        old_values TEXT,
        new_values TEXT,
        ip_address TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("  ✅ Created table: audit_logs");
  }
}

async function addMissingColumns(client: any): Promise<void> {
  console.log("📋 Checking for missing columns...");
  
  const migrations = [
    // Users table
    { table: "users", column: "last_viewed_shop", type: "TIMESTAMP" },
    { table: "users", column: "last_viewed_events", type: "TIMESTAMP" },
    { table: "users", column: "last_viewed_announcements", type: "TIMESTAMP" },
    { table: "users", column: "last_viewed_imam_questions", type: "TIMESTAMP" },
    { table: "users", column: "last_viewed_tasks", type: "TIMESTAMP" },
    { table: "users", column: "skills", type: "TEXT[]" },
    { table: "users", column: "total_points", type: "INTEGER DEFAULT 0" },
    { table: "users", column: "is_super_admin", type: "BOOLEAN DEFAULT FALSE" },
    
    // Tenants table
    { table: "tenants", column: "currency", type: "TEXT DEFAULT 'CHF' NOT NULL" },
    { table: "tenants", column: "is_default", type: "BOOLEAN DEFAULT FALSE NOT NULL" },
    { table: "tenants", column: "stripe_customer_id", type: "TEXT" },
    { table: "tenants", column: "stripe_subscription_id", type: "TEXT" },
    { table: "tenants", column: "subscription_tier", type: "TEXT DEFAULT 'basic' NOT NULL" },
    { table: "tenants", column: "subscription_status", type: "TEXT DEFAULT 'trial' NOT NULL" },
    { table: "tenants", column: "trial_ends_at", type: "TIMESTAMP" },
    { table: "tenants", column: "subscription_started_at", type: "TIMESTAMP" },
    { table: "tenants", column: "locale", type: "TEXT DEFAULT 'bs' NOT NULL" },
    
    // Organization settings
    { table: "organization_settings", column: "currency", type: "TEXT DEFAULT 'CHF' NOT NULL" },
    
    // Events table
    { table: "events", column: "points_value", type: "INTEGER DEFAULT 20" },
    { table: "events", column: "reminder_time", type: "TEXT" },
    
    // Tasks table
    { table: "tasks", column: "points_value", type: "INTEGER DEFAULT 50" },
    { table: "tasks", column: "completed_at", type: "TIMESTAMP" },
    
    // Work groups table
    { table: "work_groups", column: "archived", type: "BOOLEAN DEFAULT FALSE NOT NULL" },
    { table: "work_groups", column: "visibility", type: "TEXT DEFAULT 'javna' NOT NULL" },
    
    // Contribution purposes table
    { table: "contribution_purposes", column: "is_default", type: "BOOLEAN DEFAULT FALSE NOT NULL" },
    { table: "contribution_purposes", column: "created_by_id", type: "VARCHAR" },
    
    // Important dates table
    { table: "important_dates", column: "is_recurring", type: "BOOLEAN DEFAULT TRUE NOT NULL" },
    
    // User certificates table - schema uses 'viewed' not 'is_viewed'
    { table: "user_certificates", column: "viewed", type: "BOOLEAN DEFAULT FALSE" },
    { table: "user_certificates", column: "recipient_name", type: "TEXT" },
    { table: "user_certificates", column: "certificate_image_path", type: "TEXT" },
    { table: "user_certificates", column: "message", type: "TEXT" },
    
    // Certificate templates - additional columns from schema
    { table: "certificate_templates", column: "template_image_path", type: "TEXT" },
    { table: "certificate_templates", column: "text_position_x", type: "INTEGER DEFAULT 400" },
    { table: "certificate_templates", column: "text_position_y", type: "INTEGER DEFAULT 300" },
    { table: "certificate_templates", column: "font_size", type: "INTEGER DEFAULT 48" },
    { table: "certificate_templates", column: "font_color", type: "TEXT DEFAULT '#000000'" },
    { table: "certificate_templates", column: "font_family", type: "TEXT DEFAULT 'Arial'" },
    { table: "certificate_templates", column: "text_align", type: "TEXT DEFAULT 'center'" },
    { table: "certificate_templates", column: "created_by_id", type: "VARCHAR" },
    
    // Messages table
    { table: "messages", column: "is_read", type: "BOOLEAN DEFAULT FALSE NOT NULL" },
    { table: "messages", column: "thread_id", type: "VARCHAR" },
    { table: "messages", column: "parent_message_id", type: "VARCHAR" },
  ];
  
  let addedColumns = 0;
  
  for (const migration of migrations) {
    try {
      // Check if table exists first
      if (!(await tableExists(client, migration.table))) {
        continue;
      }
      
      // Check if column exists
      const checkResult = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = $1 AND column_name = $2
      `, [migration.table, migration.column]);
      
      if (checkResult.rows.length === 0) {
        await client.query(`
          ALTER TABLE ${migration.table} 
          ADD COLUMN IF NOT EXISTS ${migration.column} ${migration.type}
        `);
        console.log(`  ✅ Added column: ${migration.table}.${migration.column}`);
        addedColumns++;
      }
    } catch (error: any) {
      if (!error.message.includes("already exists")) {
        console.error(`  ⚠️ Error adding ${migration.table}.${migration.column}:`, error.message);
      }
    }
  }
  
  if (addedColumns > 0) {
    console.log(`  Added ${addedColumns} columns`);
  }
}
