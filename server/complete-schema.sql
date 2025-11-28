-- Complete SQL Schema for DžematApp
-- Generated from shared/schema.ts Drizzle definitions
-- This file ensures 100% column compatibility

-- Drop all tables in reverse dependency order
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS tenant_features CASCADE;
DROP TABLE IF EXISTS activity_feed CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS marriage_applications CASCADE;
DROP TABLE IF EXISTS akika_applications CASCADE;
DROP TABLE IF EXISTS membership_applications CASCADE;
DROP TABLE IF EXISTS user_certificates CASCADE;
DROP TABLE IF EXISTS certificate_templates CASCADE;
DROP TABLE IF EXISTS receipts CASCADE;
DROP TABLE IF EXISTS proposals CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS user_badges CASCADE;
DROP TABLE IF EXISTS badges CASCADE;
DROP TABLE IF EXISTS points_settings CASCADE;
DROP TABLE IF EXISTS event_attendance CASCADE;
DROP TABLE IF EXISTS activity_log CASCADE;
DROP TABLE IF EXISTS financial_contributions CASCADE;
DROP TABLE IF EXISTS contribution_purposes CASCADE;
DROP TABLE IF EXISTS important_dates CASCADE;
DROP TABLE IF EXISTS prayer_times CASCADE;
DROP TABLE IF EXISTS product_purchase_requests CASCADE;
DROP TABLE IF EXISTS marketplace_items CASCADE;
DROP TABLE IF EXISTS shop_products CASCADE;
DROP TABLE IF EXISTS requests CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS imam_questions CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS activities CASCADE;
DROP TABLE IF EXISTS announcement_files CASCADE;
DROP TABLE IF EXISTS task_comments CASCADE;
DROP TABLE IF EXISTS access_requests CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS work_group_members CASCADE;
DROP TABLE IF EXISTS work_groups CASCADE;
DROP TABLE IF EXISTS event_rsvps CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS announcements CASCADE;
DROP TABLE IF EXISTS family_relationships CASCADE;
DROP TABLE IF EXISTS organization_settings CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;
DROP TABLE IF EXISTS subscription_plans CASCADE;

-- 1. Subscription Plans
CREATE TABLE subscription_plans (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price_monthly TEXT NOT NULL,
  price_yearly TEXT,
  currency TEXT NOT NULL DEFAULT 'EUR',
  stripe_price_id_monthly TEXT,
  stripe_price_id_yearly TEXT,
  stripe_product_id TEXT,
  enabled_modules TEXT[],
  read_only_modules TEXT[],
  max_users INTEGER,
  max_storage INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tenants
CREATE TABLE tenants (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  tenant_code TEXT NOT NULL UNIQUE,
  subdomain TEXT UNIQUE,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  city TEXT,
  country TEXT NOT NULL DEFAULT 'Switzerland',
  subscription_tier TEXT NOT NULL DEFAULT 'basic',
  subscription_status TEXT NOT NULL DEFAULT 'trial',
  trial_ends_at TIMESTAMP,
  subscription_started_at TIMESTAMP,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  locale TEXT NOT NULL DEFAULT 'bs',
  currency TEXT NOT NULL DEFAULT 'CHF',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Users (COMPLETE - all columns from schema)
CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  username TEXT UNIQUE,
  email TEXT UNIQUE,
  password TEXT,
  phone TEXT,
  photo TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  date_of_birth TEXT,
  occupation TEXT,
  membership_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'aktivan',
  inactive_reason TEXT,
  categories TEXT[],
  roles TEXT[] DEFAULT ARRAY['clan']::text[],
  is_admin BOOLEAN DEFAULT false,
  is_super_admin BOOLEAN DEFAULT false,
  last_viewed_shop TIMESTAMP,
  last_viewed_events TIMESTAMP,
  last_viewed_announcements TIMESTAMP,
  last_viewed_imam_questions TIMESTAMP,
  last_viewed_tasks TIMESTAMP,
  skills TEXT[],
  total_points INTEGER DEFAULT 0
);

-- 4. Organization Settings (COMPLETE)
CREATE TABLE organization_settings (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Islamska Zajednica',
  address TEXT NOT NULL DEFAULT 'Ulica Džemata 123',
  phone TEXT NOT NULL DEFAULT '+387 33 123 456',
  email TEXT NOT NULL DEFAULT 'info@dzemat.ba',
  currency TEXT NOT NULL DEFAULT 'CHF',
  facebook_url TEXT,
  instagram_url TEXT,
  youtube_url TEXT,
  twitter_url TEXT,
  livestream_url TEXT,
  livestream_enabled BOOLEAN NOT NULL DEFAULT false,
  livestream_title TEXT,
  livestream_description TEXT,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Family Relationships
CREATE TABLE family_relationships (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id),
  related_user_id VARCHAR(255) NOT NULL REFERENCES users(id),
  relationship TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Announcements (COMPLETE)
CREATE TABLE announcements (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id VARCHAR(255) NOT NULL REFERENCES users(id),
  publish_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'published',
  is_featured BOOLEAN DEFAULT false,
  categories TEXT[],
  photo_url TEXT
);

-- 7. Events (COMPLETE)
CREATE TABLE events (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  date_time TIMESTAMP NOT NULL,
  photo_url TEXT,
  rsvp_enabled BOOLEAN DEFAULT true,
  require_adults_children BOOLEAN DEFAULT false,
  max_attendees INTEGER,
  reminder_time TEXT,
  categories TEXT[],
  points_value INTEGER DEFAULT 20,
  created_by_id VARCHAR(255) NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Event RSVPs
CREATE TABLE event_rsvps (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  event_id VARCHAR(255) NOT NULL REFERENCES events(id),
  user_id VARCHAR(255) NOT NULL REFERENCES users(id),
  adults_count INTEGER DEFAULT 1,
  children_count INTEGER DEFAULT 0,
  rsvp_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Work Groups (COMPLETE)
CREATE TABLE work_groups (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  visibility TEXT NOT NULL DEFAULT 'javna',
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Work Group Members
CREATE TABLE work_group_members (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  work_group_id VARCHAR(255) NOT NULL REFERENCES work_groups(id),
  user_id VARCHAR(255) NOT NULL REFERENCES users(id),
  is_moderator BOOLEAN DEFAULT false,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. Tasks (COMPLETE)
CREATE TABLE tasks (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  description_image TEXT,
  work_group_id VARCHAR(255) NOT NULL REFERENCES work_groups(id),
  assigned_user_ids TEXT[],
  status TEXT NOT NULL DEFAULT 'u_toku',
  due_date TIMESTAMP,
  estimated_cost TEXT,
  points_value INTEGER DEFAULT 50,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

-- 12. Access Requests
CREATE TABLE access_requests (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id),
  work_group_id VARCHAR(255) NOT NULL REFERENCES work_groups(id),
  status TEXT NOT NULL DEFAULT 'pending',
  request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. Task Comments
CREATE TABLE task_comments (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  task_id VARCHAR(255) NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  comment_image TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 14. Announcement Files
CREATE TABLE announcement_files (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  announcement_id VARCHAR(255) NOT NULL REFERENCES announcements(id),
  uploaded_by_id VARCHAR(255) NOT NULL REFERENCES users(id),
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_path TEXT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 15. Activities
CREATE TABLE activities (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  user_id VARCHAR(255) REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 16. Messages
CREATE TABLE messages (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  sender_id VARCHAR(255) NOT NULL REFERENCES users(id),
  recipient_id VARCHAR(255) REFERENCES users(id),
  category TEXT,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  thread_id VARCHAR(255),
  parent_message_id VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 17. Imam Questions
CREATE TABLE imam_questions (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id),
  subject TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT,
  is_answered BOOLEAN NOT NULL DEFAULT false,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  answered_at TIMESTAMP
);

-- 18. Documents
CREATE TABLE documents (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  uploaded_by_id VARCHAR(255) NOT NULL REFERENCES users(id),
  uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 19. Requests
CREATE TABLE requests (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id),
  request_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  form_data TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP,
  reviewed_by_id VARCHAR(255) REFERENCES users(id),
  admin_notes TEXT
);

-- 20. Shop Products
CREATE TABLE shop_products (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  photos TEXT[],
  category TEXT,
  weight TEXT,
  volume TEXT,
  size TEXT,
  quantity INTEGER DEFAULT 0,
  color TEXT,
  notes TEXT,
  price TEXT,
  created_by_id VARCHAR(255) NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 21. Marketplace Items
CREATE TABLE marketplace_items (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  photos TEXT[],
  type TEXT NOT NULL,
  price TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  user_id VARCHAR(255) NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 22. Product Purchase Requests
CREATE TABLE product_purchase_requests (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id VARCHAR(255) NOT NULL REFERENCES shop_products(id),
  user_id VARCHAR(255) NOT NULL REFERENCES users(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 23. Prayer Times
CREATE TABLE prayer_times (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  date TEXT NOT NULL UNIQUE,
  hijri_date TEXT,
  fajr TEXT NOT NULL,
  sunrise TEXT,
  dhuhr TEXT NOT NULL,
  asr TEXT NOT NULL,
  maghrib TEXT NOT NULL,
  isha TEXT NOT NULL,
  events TEXT
);

-- 24. Important Dates
CREATE TABLE important_dates (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  date TEXT NOT NULL,
  is_recurring BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 25. Contribution Purposes
CREATE TABLE contribution_purposes (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by_id VARCHAR(255) NOT NULL REFERENCES users(id)
);

-- 26. Financial Contributions
CREATE TABLE financial_contributions (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id),
  amount TEXT NOT NULL,
  payment_date TIMESTAMP NOT NULL,
  purpose TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  notes TEXT,
  project_id VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by_id VARCHAR(255) NOT NULL REFERENCES users(id)
);

-- 27. Activity Log
CREATE TABLE activity_log (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id),
  activity_type TEXT NOT NULL,
  description TEXT NOT NULL,
  points INTEGER DEFAULT 0,
  related_entity_id VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 28. Event Attendance
CREATE TABLE event_attendance (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  event_id VARCHAR(255) NOT NULL REFERENCES events(id),
  user_id VARCHAR(255) NOT NULL REFERENCES users(id),
  attended BOOLEAN NOT NULL DEFAULT true,
  recorded_by_id VARCHAR(255) NOT NULL REFERENCES users(id),
  recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 29. Points Settings
CREATE TABLE points_settings (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  points_per_chf INTEGER NOT NULL DEFAULT 1,
  points_per_task INTEGER NOT NULL DEFAULT 50,
  points_per_event INTEGER NOT NULL DEFAULT 20,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 30. Badges
CREATE TABLE badges (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT,
  criteria_type TEXT NOT NULL,
  criteria_value INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 31. User Badges
CREATE TABLE user_badges (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id),
  badge_id VARCHAR(255) NOT NULL REFERENCES badges(id),
  earned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 32. Projects
CREATE TABLE projects (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  goal_amount TEXT NOT NULL,
  current_amount TEXT NOT NULL DEFAULT '0',
  status TEXT NOT NULL DEFAULT 'active',
  created_by_id VARCHAR(255) NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

-- 33. User Preferences
CREATE TABLE user_preferences (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR(255) NOT NULL UNIQUE REFERENCES users(id),
  quick_access_shortcuts TEXT[] DEFAULT ARRAY[]::text[],
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 34. Proposals
CREATE TABLE proposals (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  work_group_id VARCHAR(255) NOT NULL REFERENCES work_groups(id),
  created_by_id VARCHAR(255) NOT NULL REFERENCES users(id),
  who TEXT,
  what TEXT NOT NULL,
  "where" TEXT,
  "when" TEXT,
  how TEXT,
  why TEXT,
  budget TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by_id VARCHAR(255) REFERENCES users(id),
  review_comment TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP
);

-- 35. Receipts
CREATE TABLE receipts (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  task_id VARCHAR(255) REFERENCES tasks(id),
  proposal_id VARCHAR(255) REFERENCES proposals(id),
  uploaded_by_id VARCHAR(255) NOT NULL REFERENCES users(id),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  amount TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by_id VARCHAR(255) REFERENCES users(id),
  review_comment TEXT,
  uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP
);

-- 36. Certificate Templates
CREATE TABLE certificate_templates (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  template_image_path TEXT NOT NULL,
  text_position_x INTEGER DEFAULT 400,
  text_position_y INTEGER DEFAULT 300,
  font_size INTEGER DEFAULT 48,
  font_color TEXT DEFAULT '#000000',
  font_family TEXT DEFAULT 'Arial',
  text_align TEXT DEFAULT 'center',
  created_by_id VARCHAR(255) NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 37. User Certificates
CREATE TABLE user_certificates (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id),
  template_id VARCHAR(255) NOT NULL REFERENCES certificate_templates(id),
  recipient_name TEXT NOT NULL,
  certificate_image_path TEXT NOT NULL,
  message TEXT,
  issued_by_id VARCHAR(255) NOT NULL REFERENCES users(id),
  issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  viewed BOOLEAN DEFAULT false
);

-- 38. Membership Applications
CREATE TABLE membership_applications (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  last_name TEXT NOT NULL,
  first_name TEXT NOT NULL,
  gender TEXT NOT NULL,
  photo TEXT,
  date_of_birth TEXT NOT NULL,
  place_of_birth TEXT NOT NULL,
  country TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  street_address TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  city TEXT NOT NULL,
  employment_status TEXT NOT NULL,
  occupation TEXT,
  skills_hobbies TEXT,
  marital_status TEXT NOT NULL,
  spouse_name TEXT,
  spouse_phone TEXT,
  children_info TEXT,
  monthly_fee INTEGER NOT NULL,
  invoice_delivery TEXT NOT NULL,
  membership_start_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by_id VARCHAR(255) REFERENCES users(id),
  reviewed_at TIMESTAMP,
  review_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 39. Akika Applications
CREATE TABLE akika_applications (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  is_member BOOLEAN NOT NULL DEFAULT true,
  father_name TEXT NOT NULL,
  mother_name TEXT NOT NULL,
  child_name TEXT NOT NULL,
  child_gender TEXT NOT NULL,
  child_date_of_birth TEXT NOT NULL,
  child_place_of_birth TEXT NOT NULL,
  location TEXT NOT NULL,
  organize_catering BOOLEAN DEFAULT false,
  custom_address TEXT,
  custom_city TEXT,
  custom_canton TEXT,
  custom_postal_code TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  is_archived BOOLEAN NOT NULL DEFAULT false,
  submitted_by VARCHAR(255) REFERENCES users(id),
  reviewed_by_id VARCHAR(255) REFERENCES users(id),
  reviewed_at TIMESTAMP,
  review_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 40. Marriage Applications
CREATE TABLE marriage_applications (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  groom_last_name TEXT NOT NULL,
  groom_first_name TEXT NOT NULL,
  groom_date_of_birth TEXT NOT NULL,
  groom_place_of_birth TEXT NOT NULL,
  groom_nationality TEXT NOT NULL,
  groom_street_address TEXT NOT NULL,
  groom_postal_code TEXT NOT NULL,
  groom_city TEXT NOT NULL,
  groom_father_name TEXT NOT NULL,
  groom_mother_name TEXT NOT NULL,
  bride_last_name TEXT NOT NULL,
  bride_first_name TEXT NOT NULL,
  bride_date_of_birth TEXT NOT NULL,
  bride_place_of_birth TEXT NOT NULL,
  bride_nationality TEXT NOT NULL,
  bride_street_address TEXT NOT NULL,
  bride_postal_code TEXT NOT NULL,
  bride_city TEXT NOT NULL,
  bride_father_name TEXT NOT NULL,
  bride_mother_name TEXT NOT NULL,
  selected_last_name TEXT NOT NULL,
  mahr TEXT NOT NULL,
  civil_marriage_date TEXT NOT NULL,
  civil_marriage_location TEXT NOT NULL,
  witness1_name TEXT NOT NULL,
  witness2_name TEXT NOT NULL,
  witness3_name TEXT,
  witness4_name TEXT,
  proposed_date_time TEXT NOT NULL,
  location TEXT NOT NULL,
  custom_address TEXT,
  custom_city TEXT,
  custom_canton TEXT,
  custom_postal_code TEXT,
  phone TEXT NOT NULL,
  civil_marriage_proof TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by_id VARCHAR(255) REFERENCES users(id),
  reviewed_at TIMESTAMP,
  review_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 41. Services
CREATE TABLE services (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  photos TEXT[],
  price TEXT,
  duration TEXT,
  category TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  user_id VARCHAR(255) NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 42. Activity Feed
CREATE TABLE activity_feed (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  related_entity_id VARCHAR(255),
  related_entity_type TEXT,
  metadata TEXT,
  is_clickable BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 43. Tenant Features
CREATE TABLE tenant_features (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  is_read_only BOOLEAN NOT NULL DEFAULT false,
  settings TEXT,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 44. Audit Logs
CREATE TABLE audit_logs (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR(255) REFERENCES tenants(id) ON DELETE CASCADE,
  user_id VARCHAR(255) REFERENCES users(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id VARCHAR(255),
  data_before TEXT,
  data_after TEXT,
  ip_address TEXT,
  user_agent TEXT,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key for financial_contributions -> projects (after projects table exists)
ALTER TABLE financial_contributions ADD CONSTRAINT fk_project FOREIGN KEY (project_id) REFERENCES projects(id);
