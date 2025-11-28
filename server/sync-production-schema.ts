/**
 * Production Database Schema Sync Script
 * This script adds missing columns to existing tables without dropping data.
 * Run via: npx tsx server/sync-production-schema.ts
 */

import pg from 'pg';
const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

async function syncSchema() {
  console.log('🔄 Starting production schema sync...');
  
  const alterStatements = [
    // organization_settings - add missing columns
    `ALTER TABLE organization_settings ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'EUR'`,
    `ALTER TABLE organization_settings ADD COLUMN IF NOT EXISTS timezone VARCHAR(100) DEFAULT 'Europe/Sarajevo'`,
    `ALTER TABLE organization_settings ADD COLUMN IF NOT EXISTS date_format VARCHAR(50) DEFAULT 'dd.MM.yyyy'`,
    `ALTER TABLE organization_settings ADD COLUMN IF NOT EXISTS time_format VARCHAR(50) DEFAULT 'HH:mm'`,
    `ALTER TABLE organization_settings ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'bs'`,
    `ALTER TABLE organization_settings ADD COLUMN IF NOT EXISTS primary_color VARCHAR(20) DEFAULT '#2e7d32'`,
    `ALTER TABLE organization_settings ADD COLUMN IF NOT EXISTS secondary_color VARCHAR(20) DEFAULT '#1976d2'`,
    `ALTER TABLE organization_settings ADD COLUMN IF NOT EXISTS logo_url TEXT`,
    `ALTER TABLE organization_settings ADD COLUMN IF NOT EXISTS favicon_url TEXT`,
    `ALTER TABLE organization_settings ADD COLUMN IF NOT EXISTS footer_text TEXT`,
    `ALTER TABLE organization_settings ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255)`,
    `ALTER TABLE organization_settings ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50)`,
    `ALTER TABLE organization_settings ADD COLUMN IF NOT EXISTS social_facebook TEXT`,
    `ALTER TABLE organization_settings ADD COLUMN IF NOT EXISTS social_instagram TEXT`,
    `ALTER TABLE organization_settings ADD COLUMN IF NOT EXISTS social_youtube TEXT`,
    `ALTER TABLE organization_settings ADD COLUMN IF NOT EXISTS enable_notifications BOOLEAN DEFAULT true`,
    `ALTER TABLE organization_settings ADD COLUMN IF NOT EXISTS enable_email_notifications BOOLEAN DEFAULT true`,
    `ALTER TABLE organization_settings ADD COLUMN IF NOT EXISTS enable_sms_notifications BOOLEAN DEFAULT false`,
    `ALTER TABLE organization_settings ADD COLUMN IF NOT EXISTS maintenance_mode BOOLEAN DEFAULT false`,
    `ALTER TABLE organization_settings ADD COLUMN IF NOT EXISTS maintenance_message TEXT`,
    
    // users - add missing columns
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_code VARCHAR(50)`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_viewed_shop TIMESTAMP`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_viewed_events TIMESTAMP`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS skills TEXT[]`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS availability TEXT`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS interests TEXT[]`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_contact_method VARCHAR(50)`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(255)`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(50)`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS membership_start_date TIMESTAMP`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS membership_end_date TIMESTAMP`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS contribution_status VARCHAR(50) DEFAULT 'inactive'`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_contribution_date TIMESTAMP`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS notes TEXT`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_visibility VARCHAR(50) DEFAULT 'members'`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{}'::jsonb`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS language_preference VARCHAR(10) DEFAULT 'bs'`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255)`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_password_change TIMESTAMP`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS account_locked_until TIMESTAMP`,
    
    // tenants - add missing columns
    `ALTER TABLE tenants ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255)`,
    `ALTER TABLE tenants ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255)`,
    `ALTER TABLE tenants ADD COLUMN IF NOT EXISTS billing_email VARCHAR(255)`,
    `ALTER TABLE tenants ADD COLUMN IF NOT EXISTS billing_address TEXT`,
    `ALTER TABLE tenants ADD COLUMN IF NOT EXISTS tax_id VARCHAR(50)`,
    `ALTER TABLE tenants ADD COLUMN IF NOT EXISTS max_users INTEGER DEFAULT 100`,
    `ALTER TABLE tenants ADD COLUMN IF NOT EXISTS max_storage_mb INTEGER DEFAULT 1024`,
    `ALTER TABLE tenants ADD COLUMN IF NOT EXISTS used_storage_mb INTEGER DEFAULT 0`,
    `ALTER TABLE tenants ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '{}'::jsonb`,
    `ALTER TABLE tenants ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP`,
    `ALTER TABLE tenants ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMP`,
    `ALTER TABLE tenants ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMP`,
    `ALTER TABLE tenants ADD COLUMN IF NOT EXISTS payment_failed_count INTEGER DEFAULT 0`,
    
    // subscription_plans - add missing columns
    `ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS stripe_price_id_monthly VARCHAR(255)`,
    `ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS stripe_price_id_yearly VARCHAR(255)`,
    `ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS yearly_price INTEGER`,
    `ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS yearly_discount_percent INTEGER DEFAULT 0`,
    `ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS trial_days INTEGER DEFAULT 14`,
    `ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS is_popular BOOLEAN DEFAULT false`,
    `ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0`,
    
    // events - add missing columns
    `ALTER TABLE events ADD COLUMN IF NOT EXISTS max_attendees INTEGER`,
    `ALTER TABLE events ADD COLUMN IF NOT EXISTS registration_required BOOLEAN DEFAULT false`,
    `ALTER TABLE events ADD COLUMN IF NOT EXISTS registration_deadline TIMESTAMP`,
    `ALTER TABLE events ADD COLUMN IF NOT EXISTS cost DECIMAL(10,2)`,
    `ALTER TABLE events ADD COLUMN IF NOT EXISTS recurring_pattern VARCHAR(50)`,
    `ALTER TABLE events ADD COLUMN IF NOT EXISTS parent_event_id VARCHAR(255)`,
    `ALTER TABLE events ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT false`,
    `ALTER TABLE events ADD COLUMN IF NOT EXISTS online_event BOOLEAN DEFAULT false`,
    `ALTER TABLE events ADD COLUMN IF NOT EXISTS meeting_link TEXT`,
    `ALTER TABLE events ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb`,
    
    // announcements - add missing columns
    `ALTER TABLE announcements ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0`,
    `ALTER TABLE announcements ADD COLUMN IF NOT EXISTS pinned BOOLEAN DEFAULT false`,
    `ALTER TABLE announcements ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP`,
    `ALTER TABLE announcements ADD COLUMN IF NOT EXISTS target_audience VARCHAR(50) DEFAULT 'all'`,
    `ALTER TABLE announcements ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb`,
    `ALTER TABLE announcements ADD COLUMN IF NOT EXISTS send_notification BOOLEAN DEFAULT true`,
    `ALTER TABLE announcements ADD COLUMN IF NOT EXISTS notification_sent BOOLEAN DEFAULT false`,
    
    // tasks - add missing columns
    `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS estimated_hours DECIMAL(5,2)`,
    `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS actual_hours DECIMAL(5,2)`,
    `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS tags TEXT[]`,
    `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb`,
    `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0`,
    `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS parent_task_id VARCHAR(255)`,
    `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0`,
    
    // work_groups (sekcije) - add missing columns
    `ALTER TABLE work_groups ADD COLUMN IF NOT EXISTS icon VARCHAR(50)`,
    `ALTER TABLE work_groups ADD COLUMN IF NOT EXISTS color VARCHAR(20)`,
    `ALTER TABLE work_groups ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true`,
    `ALTER TABLE work_groups ADD COLUMN IF NOT EXISTS max_members INTEGER`,
    `ALTER TABLE work_groups ADD COLUMN IF NOT EXISTS meeting_schedule TEXT`,
    `ALTER TABLE work_groups ADD COLUMN IF NOT EXISTS budget DECIMAL(10,2)`,
    `ALTER TABLE work_groups ADD COLUMN IF NOT EXISTS goals TEXT`,
    
    // contributions - add missing columns  
    `ALTER TABLE contributions ADD COLUMN IF NOT EXISTS receipt_url TEXT`,
    `ALTER TABLE contributions ADD COLUMN IF NOT EXISTS notes TEXT`,
    `ALTER TABLE contributions ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false`,
    `ALTER TABLE contributions ADD COLUMN IF NOT EXISTS recurring_frequency VARCHAR(50)`,
    `ALTER TABLE contributions ADD COLUMN IF NOT EXISTS next_payment_date TIMESTAMP`,
    `ALTER TABLE contributions ADD COLUMN IF NOT EXISTS stripe_payment_id VARCHAR(255)`,
    `ALTER TABLE contributions ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50)`,
    
    // shop_products - add missing columns
    `ALTER TABLE shop_products ADD COLUMN IF NOT EXISTS sku VARCHAR(100)`,
    `ALTER TABLE shop_products ADD COLUMN IF NOT EXISTS weight DECIMAL(10,2)`,
    `ALTER TABLE shop_products ADD COLUMN IF NOT EXISTS dimensions VARCHAR(100)`,
    `ALTER TABLE shop_products ADD COLUMN IF NOT EXISTS tags TEXT[]`,
    `ALTER TABLE shop_products ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false`,
    `ALTER TABLE shop_products ADD COLUMN IF NOT EXISTS discount_percent INTEGER DEFAULT 0`,
    `ALTER TABLE shop_products ADD COLUMN IF NOT EXISTS discount_ends_at TIMESTAMP`,
    
    // prayer_times - add missing columns
    `ALTER TABLE prayer_times ADD COLUMN IF NOT EXISTS hijri_date VARCHAR(50)`,
    `ALTER TABLE prayer_times ADD COLUMN IF NOT EXISTS sunrise TIME`,
    `ALTER TABLE prayer_times ADD COLUMN IF NOT EXISTS duha TIME`,
    `ALTER TABLE prayer_times ADD COLUMN IF NOT EXISTS notes TEXT`,
    
    // documents - add missing columns
    `ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_size INTEGER`,
    `ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_type VARCHAR(100)`,
    `ALTER TABLE documents ADD COLUMN IF NOT EXISTS download_count INTEGER DEFAULT 0`,
    `ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false`,
    `ALTER TABLE documents ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP`,
    `ALTER TABLE documents ADD COLUMN IF NOT EXISTS tags TEXT[]`,
    
    // notifications - add missing columns
    `ALTER TABLE notifications ADD COLUMN IF NOT EXISTS action_url TEXT`,
    `ALTER TABLE notifications ADD COLUMN IF NOT EXISTS action_label VARCHAR(100)`,
    `ALTER TABLE notifications ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'normal'`,
    `ALTER TABLE notifications ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP`,
    `ALTER TABLE notifications ADD COLUMN IF NOT EXISTS category VARCHAR(50)`,
    
    // messages - add missing columns
    `ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb`,
    `ALTER TABLE messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP`,
    `ALTER TABLE messages ADD COLUMN IF NOT EXISTS reply_to_id VARCHAR(255)`,
    `ALTER TABLE messages ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '{}'::jsonb`,
  ];

  let successCount = 0;
  let errorCount = 0;
  
  for (const sql of alterStatements) {
    try {
      await pool.query(sql);
      successCount++;
    } catch (error: any) {
      // Ignore "column already exists" errors - that's expected
      if (error.code !== '42701') {
        console.error(`❌ Failed: ${sql.substring(0, 80)}...`);
        console.error(`   Error: ${error.message}`);
        errorCount++;
      } else {
        successCount++; // Column already exists is a success
      }
    }
  }
  
  console.log(`\n✅ Schema sync completed: ${successCount} successful, ${errorCount} errors`);
  
  // Now verify key tables have required columns
  const verifyQuery = `
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'organization_settings' AND column_name = 'currency'
  `;
  
  const result = await pool.query(verifyQuery);
  if (result.rows.length > 0) {
    console.log('✅ Verification: currency column exists in organization_settings');
  } else {
    console.error('❌ Verification failed: currency column missing');
  }
  
  await pool.end();
}

syncSchema().catch(console.error);
