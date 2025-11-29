-- Migration to fix production database columns
-- This adds missing columns to tables that already exist with old structure
-- Uses ADD COLUMN IF NOT EXISTS for idempotency

-- ============================================
-- ANNOUNCEMENTS TABLE - add missing columns
-- ============================================
ALTER TABLE "announcements" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'published' NOT NULL;
ALTER TABLE "announcements" ADD COLUMN IF NOT EXISTS "is_featured" boolean DEFAULT false;
ALTER TABLE "announcements" ADD COLUMN IF NOT EXISTS "categories" text[];
ALTER TABLE "announcements" ADD COLUMN IF NOT EXISTS "photo_url" text;
ALTER TABLE "announcements" ADD COLUMN IF NOT EXISTS "publish_date" timestamp DEFAULT now();

-- ============================================
-- EVENTS TABLE - add missing columns  
-- ============================================
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "photo_url" text;
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "rsvp_enabled" boolean DEFAULT true;
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "require_adults_children" boolean DEFAULT false;
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "max_attendees" integer;
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "reminder_time" text;
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "categories" text[];
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "points_value" integer DEFAULT 20;
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now();

-- ============================================
-- MESSAGES TABLE - add missing columns
-- ============================================
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "category" text;
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "thread_id" varchar;
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "parent_message_id" varchar;

-- ============================================
-- PROPOSALS TABLE - add missing columns with QUOTED reserved keywords
-- ============================================
ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "who" text;
ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "what" text;
ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "where" text;
ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "when" text;
ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "how" text;
ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "why" text;
ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "budget" text;
ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "reviewed_by_id" varchar;
ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "review_comment" text;
ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "reviewed_at" timestamp;

-- ============================================
-- IMPORTANT_DATES TABLE - add missing columns
-- ============================================
ALTER TABLE "important_dates" ADD COLUMN IF NOT EXISTS "is_recurring" boolean DEFAULT true NOT NULL;

-- ============================================
-- CERTIFICATE_TEMPLATES TABLE - add missing columns
-- ============================================
ALTER TABLE "certificate_templates" ADD COLUMN IF NOT EXISTS "background_image_path" text;
ALTER TABLE "certificate_templates" ADD COLUMN IF NOT EXISTS "title_position" text DEFAULT '{"x": 50, "y": 20}';
ALTER TABLE "certificate_templates" ADD COLUMN IF NOT EXISTS "recipient_position" text DEFAULT '{"x": 50, "y": 45}';
ALTER TABLE "certificate_templates" ADD COLUMN IF NOT EXISTS "message_position" text DEFAULT '{"x": 50, "y": 60}';
ALTER TABLE "certificate_templates" ADD COLUMN IF NOT EXISTS "date_position" text DEFAULT '{"x": 50, "y": 85}';
ALTER TABLE "certificate_templates" ADD COLUMN IF NOT EXISTS "font_family" text DEFAULT 'Arial';
ALTER TABLE "certificate_templates" ADD COLUMN IF NOT EXISTS "primary_color" text DEFAULT '#000000';
ALTER TABLE "certificate_templates" ADD COLUMN IF NOT EXISTS "is_default" boolean DEFAULT false;

-- ============================================
-- SERVICES TABLE - add missing columns
-- ============================================
ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "photos" text[];
ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "user_id" varchar;
ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'aktivan';
ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "duration" text;

-- ============================================
-- ACTIVITY_LOG TABLE - add missing columns
-- ============================================
ALTER TABLE "activity_log" ADD COLUMN IF NOT EXISTS "related_entity_id" varchar;

-- ============================================
-- USER_CERTIFICATES TABLE - add missing columns
-- ============================================
ALTER TABLE "user_certificates" ADD COLUMN IF NOT EXISTS "message" text;
ALTER TABLE "user_certificates" ADD COLUMN IF NOT EXISTS "viewed" boolean DEFAULT false;

-- ============================================
-- USERS TABLE - add missing columns
-- ============================================
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "skills" text[];
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "total_points" integer DEFAULT 0;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_viewed_shop" timestamp;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_viewed_events" timestamp;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_viewed_announcements" timestamp;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_viewed_imam_questions" timestamp;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_viewed_tasks" timestamp;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_super_admin" boolean DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "inactive_reason" text;

-- ============================================
-- TASKS TABLE - add missing columns
-- ============================================
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "description_image" text;
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "points_value" integer DEFAULT 50;
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "completed_at" timestamp;

-- ============================================
-- TASK_COMMENTS TABLE - add missing columns
-- ============================================
ALTER TABLE "task_comments" ADD COLUMN IF NOT EXISTS "comment_image" text;

-- ============================================
-- WORK_GROUPS TABLE - add missing columns
-- ============================================
ALTER TABLE "work_groups" ADD COLUMN IF NOT EXISTS "archived" boolean DEFAULT false NOT NULL;

-- ============================================
-- RECEIPTS TABLE - add missing columns
-- ============================================
ALTER TABLE "receipts" ADD COLUMN IF NOT EXISTS "proposal_id" varchar;

-- ============================================
-- SHOP_PRODUCTS TABLE - add missing columns
-- ============================================
ALTER TABLE "shop_products" ADD COLUMN IF NOT EXISTS "reserved_by_id" varchar;
ALTER TABLE "shop_products" ADD COLUMN IF NOT EXISTS "reserved_at" timestamp;
ALTER TABLE "shop_products" ADD COLUMN IF NOT EXISTS "sold_to_id" varchar;
ALTER TABLE "shop_products" ADD COLUMN IF NOT EXISTS "sold_at" timestamp;
ALTER TABLE "shop_products" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp;

-- ============================================
-- MARKETPLACE_ITEMS TABLE - add missing columns
-- ============================================
ALTER TABLE "marketplace_items" ADD COLUMN IF NOT EXISTS "photos" text[];
