-- CRITICAL FIX: Update Full plan with all modules
-- Run this SQL directly on production PostgreSQL database

-- First, check current state
SELECT slug, name, enabled_modules FROM subscription_plans WHERE slug = 'full';

-- Update Full plan with ALL modules (including activity-log, badges, etc.)
UPDATE subscription_plans 
SET enabled_modules = ARRAY[
  'dashboard', 
  'users', 
  'announcements', 
  'events', 
  'tasks', 
  'messages', 
  'askImam', 
  'ask-imam', 
  'requests', 
  'shop', 
  'marketplace', 
  'vaktija', 
  'finances', 
  'projects', 
  'activity', 
  'activity-log', 
  'badges', 
  'points', 
  'certificates', 
  'documents', 
  'media', 
  'livestream', 
  'settings', 
  'guide', 
  'vodic', 
  'sponsors', 
  'applications'
]
WHERE slug = 'full';

-- Verify the update
SELECT slug, name, enabled_modules FROM subscription_plans WHERE slug = 'full';
