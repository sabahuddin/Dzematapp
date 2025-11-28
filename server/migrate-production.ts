import { pool } from "./db";

export async function migrateProductionSchema(): Promise<void> {
  console.log("🔄 Running production schema migration...");
  
  const client = await pool.connect();
  
  try {
    // List of columns to add if they don't exist
    const migrations = [
      // Users table - last_viewed columns
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
    ];
    
    let addedColumns = 0;
    
    for (const migration of migrations) {
      try {
        // Check if column exists
        const checkResult = await client.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = $1 AND column_name = $2
        `, [migration.table, migration.column]);
        
        if (checkResult.rows.length === 0) {
          // Column doesn't exist, add it
          await client.query(`
            ALTER TABLE ${migration.table} 
            ADD COLUMN IF NOT EXISTS ${migration.column} ${migration.type}
          `);
          console.log(`  ✅ Added column: ${migration.table}.${migration.column}`);
          addedColumns++;
        }
      } catch (error: any) {
        // Ignore if column already exists
        if (!error.message.includes("already exists")) {
          console.error(`  ⚠️ Error adding ${migration.table}.${migration.column}:`, error.message);
        }
      }
    }
    
    if (addedColumns > 0) {
      console.log(`✅ Migration complete: Added ${addedColumns} columns`);
    } else {
      console.log("✅ Schema is up to date - no migration needed");
    }
    
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    client.release();
  }
}
