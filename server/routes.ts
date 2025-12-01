import express, { type Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import { promises as fs } from "fs";
import * as XLSX from "xlsx";
import { ZodError } from "zod";
import { storage } from "./storage";
import { requireAuth, requireAdmin, requireSuperAdmin, requireAuthOrSuperAdmin } from "./index";
import { seedDefaultTenant } from "./seed-tenant";
import { seedDemoData } from "./seed-demo-data";
import { requireFeature, getTenantSubscriptionInfo } from "./feature-access";
import { generateCertificate, saveCertificate } from "./certificateService";
import { type User, insertUserSchema, insertAnnouncementSchema, insertEventSchema, insertWorkGroupSchema, insertWorkGroupMemberSchema, insertTaskSchema, insertAccessRequestSchema, insertTaskCommentSchema, insertAnnouncementFileSchema, insertFamilyRelationshipSchema, insertMessageSchema, insertOrganizationSettingsSchema, insertDocumentSchema, insertRequestSchema, insertShopProductSchema, insertMarketplaceItemSchema, insertProductPurchaseRequestSchema, insertPrayerTimeSchema, insertContributionPurposeSchema, insertFinancialContributionSchema, insertActivityLogSchema, insertEventAttendanceSchema, insertPointsSettingsSchema, insertBadgeSchema, insertUserBadgeSchema, insertProjectSchema, insertProposalSchema, insertReceiptSchema, insertCertificateTemplateSchema, insertUserCertificateSchema, insertMembershipApplicationSchema, insertAkikaApplicationSchema, insertMarriageApplicationSchema, insertServiceSchema, insertTenantSchema } from "@shared/schema";

// Configure multer for photo uploads
const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'photos');

const upload = multer({
  storage: multer.diskStorage({
    destination: async (req, file, cb) => {
      try {
        await fs.mkdir(uploadDir, { recursive: true });
        cb(null, uploadDir);
      } catch (error) {
        cb(error as Error, '');
      }
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const extension = path.extname(file.originalname);
      cb(null, `user-photo-${uniqueSuffix}${extension}`);
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1
  }
});

// Configure multer for shop photos (multiple files)
const shopUploadDir = path.join(process.cwd(), 'public', 'uploads', 'shop');

const shopUpload = multer({
  storage: multer.diskStorage({
    destination: async (req, file, cb) => {
      try {
        await fs.mkdir(shopUploadDir, { recursive: true });
        cb(null, shopUploadDir);
      } catch (error) {
        cb(error as Error, '');
      }
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const extension = path.extname(file.originalname);
      cb(null, `shop-${uniqueSuffix}${extension}`);
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 10
  }
});

// Configure multer for event photos
const eventUploadDir = path.join(process.cwd(), 'public', 'uploads', 'events');

const eventUpload = multer({
  storage: multer.diskStorage({
    destination: async (req, file, cb) => {
      try {
        await fs.mkdir(eventUploadDir, { recursive: true });
        cb(null, eventUploadDir);
      } catch (error) {
        cb(error as Error, '');
      }
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const extension = path.extname(file.originalname);
      cb(null, `event-${uniqueSuffix}${extension}`);
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed'));
    }
  }
});

// Configure multer for CSV uploads
const csvUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 1 * 1024 * 1024, // 1MB limit for CSV
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['text/csv', 'application/vnd.ms-excel', 'text/plain'];
    const allowedExtensions = ['.csv'];
    const extension = path.extname(file.originalname).toLowerCase();
    
    if (allowedMimes.includes(file.mimetype) || allowedExtensions.includes(extension)) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

// Configure multer for certificate template uploads
const certificateUploadDir = path.join(process.cwd(), 'public', 'uploads', 'certificates');

const certificateUpload = multer({
  storage: multer.diskStorage({
    destination: async (req, file, cb) => {
      try {
        await fs.mkdir(certificateUploadDir, { recursive: true });
        cb(null, certificateUploadDir);
      } catch (error) {
        cb(error as Error, '');
      }
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const extension = path.extname(file.originalname);
      cb(null, `template-${uniqueSuffix}${extension}`);
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for templates
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/png'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PNG files are allowed for certificate templates'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve uploads directory as static files
  const uploadsPath = path.join(process.cwd(), 'public', 'uploads');
  app.use('/uploads', express.static(uploadsPath));
  
  // Event photo upload route
  app.post("/api/upload/event-photo", requireAuth, eventUpload.single('photo'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const photoUrl = `/uploads/events/${req.file.filename}`;
      
      res.json({ 
        message: "Photo uploaded successfully",
        photoUrl: photoUrl 
});
    } catch (error) {
      res.status(500).json({ message: "Failed to upload photo" });
    }
});

  // Shop photos upload route (multiple files)
  app.post("/api/upload/shop-photos", requireAuth, shopUpload.array('photos', 10), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      const photoUrls = files.map(file => `/uploads/shop/${file.filename}`);
      
      res.json({ 
        message: "Photos uploaded successfully",
        photoUrls: photoUrls 
});
    } catch (error) {
      res.status(500).json({ message: "Failed to upload photos" });
    }
});

  // Photo upload route
  app.post("/api/upload/photo", requireAuth, upload.single('photo'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const photoUrl = `/uploads/photos/${req.file.filename}`;
      
      res.json({ 
        message: "Photo uploaded successfully",
        photoUrl: photoUrl 
});
    } catch (error) {
      res.status(500).json({ message: "Failed to upload photo" });
    }
});

  // Authentication routes
  // Regular user login (requires tenant code)
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password, tenantCode, tenantId: bodyTenantId } = req.body;
      
      let tenantId = bodyTenantId;
      
      // If tenantCode is provided, convert it to tenantId
      if (!tenantId && tenantCode) {
        const tenant = await storage.getTenantByCode(tenantCode);
        if (!tenant) {
          return res.status(400).json({ message: "Neispravan kod organizacije" });
        }
        tenantId = tenant.id;
      }
      
      console.log('[LOGIN] Received credentials:', { username, passwordLength: password?.length, tenantCode, tenantId });
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      if (!tenantId) {
        return res.status(400).json({ message: "Tenant selection is required" });
      }

      const user = await storage.getUserByUsername(username, tenantId);
      console.log('[LOGIN] User from DB:', user ? { 
        username: user.username, 
        hasPassword: !!user.password,
        passwordLength: user.password?.length,
        passwordMatch: user.password === password
      } : 'NOT FOUND');
      
      if (!user || user.password !== password) {
        console.log('[LOGIN] Authentication failed:', !user ? 'User not found' : 'Password mismatch');
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Create session with tenantId
      req.session.userId = user.id;
      req.session.tenantId = tenantId;
      
      // Save session explicitly
      req.session.save((err) => {
        if (err) {
          console.error('[LOGIN] ❌ Session save error:', err);
          return res.status(500).json({ message: "Session error" });
        }
        
        console.log('[LOGIN] ✅ Session created and saved:', { 
          userId: req.session.userId, 
          tenantId: req.session.tenantId,
          sessionId: req.sessionID 
        });
        
        // Check if user has Imam role for admin privileges
        const hasImamRole = user.roles?.includes('imam') || false;
        
        console.log('[LOGIN] ✅ Response sent for user:', user.username);
        
        res.json({ 
          user: { 
            id: user.id, 
            firstName: user.firstName, 
            lastName: user.lastName, 
            email: user.email,
            roles: user.roles || [],
            isAdmin: user.isAdmin || hasImamRole,
            isSuperAdmin: false,
            totalPoints: user.totalPoints || 0,
            tenantId: tenantId
          } 
        });
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
});

  // Super Admin login (no tenant code required)
  // SuperAdmin lives in a GLOBAL tenant (tenant-superadmin-global) that's hidden from regular users
  console.log('[INIT] Registering /api/auth/superadmin/login endpoint');
  app.post("/api/auth/superadmin/login", async (req, res) => {
    console.log('[ENDPOINT HIT] /api/auth/superadmin/login POST');
    try {
      const { username, password } = req.body;
      console.log('[SUPERADMIN LOGIN] Attempting login for:', username);
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      // Look for SuperAdmin in the global SuperAdmin tenant only
      let superAdminUser = null;
      
      try {
        superAdminUser = await storage.getSuperAdminByUsername(username);
        
        if (superAdminUser && superAdminUser.password === password) {
          console.log('[SUPERADMIN] ✅ FOUND in global tenant');
        } else if (superAdminUser) {
          console.log('[SUPERADMIN] ❌ Password mismatch');
          superAdminUser = null;
        }
      } catch (error) {
        console.error('[SUPERADMIN LOGIN] Database error:', error);
      }
      
      // Fallback for hardcoded superadmin if database unavailable
      if (!superAdminUser && username === 'superadmin' && password === 'admin123') {
        console.log('[SUPERADMIN LOGIN] Using fallback superadmin credentials');
        superAdminUser = {
          id: 'superadmin-fallback',
          firstName: 'Super',
          lastName: 'Admin',
          email: 'superadmin@dzematapp.com',
          username: 'superadmin',
          password: 'admin123',
          isSuperAdmin: true,
          isAdmin: true,
          roles: ['admin'],
          tenantId: 'tenant-superadmin-global',
          totalPoints: 0,
          photo: null,
          status: 'aktivan',
          phone: null,
          address: null,
          city: null,
          postalCode: null,
          dateOfBirth: null,
          occupation: null,
          membershipDate: new Date(),
          inactiveReason: null,
          categories: []
        };
      }
      
      if (!superAdminUser) {
        console.log('[SUPERADMIN] ❌ FAILED - Not found or invalid credentials');
        return res.status(401).json({ message: "Invalid Super Admin credentials" });
      }

      // Create session with global SuperAdmin tenant ID
      // SuperAdmin is NOT associated with any regular tenant
      const SUPERADMIN_TENANT_ID = 'tenant-superadmin-global';
      
      try {
        req.session.userId = superAdminUser.id;
        req.session.isSuperAdmin = true;
        req.session.tenantId = SUPERADMIN_TENANT_ID;
        
        await new Promise<void>((resolve, reject) => {
          req.session.save((err: any) => {
            if (err) {
              console.error('[SUPERADMIN LOGIN] Session save error:', err?.message);
              reject(err);
            } else {
              resolve();
            }
          });
        });
        
        console.log('[SUPERADMIN LOGIN] ✅ Session saved successfully');
        return res.json({ 
          user: { 
            id: superAdminUser.id, 
            firstName: superAdminUser.firstName, 
            lastName: superAdminUser.lastName, 
            email: superAdminUser.email,
            roles: superAdminUser.roles || [],
            isAdmin: true,
            isSuperAdmin: true,
            totalPoints: 0,
            tenantId: SUPERADMIN_TENANT_ID
          } 
        });
      } catch (sessionErr) {
        console.error('[SUPERADMIN LOGIN] Session save error - DETAILS:', sessionErr);
        console.warn('[SUPERADMIN LOGIN] ⚠️ Session save failed but returning user data anyway');
        return res.json({ 
          user: { 
            id: superAdminUser.id, 
            firstName: superAdminUser.firstName, 
            lastName: superAdminUser.lastName, 
            email: superAdminUser.email,
            roles: superAdminUser.roles || [],
            isAdmin: true,
            isSuperAdmin: true,
            totalPoints: 0,
            tenantId: SUPERADMIN_TENANT_ID
          } 
        });
      }
    } catch (error) {
      console.error('[SUPERADMIN LOGIN] Unexpected error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // SuperAdmin Database RESET endpoint - drops and recreates all tables (for fresh installs)
  app.get("/api/superadmin/reset-db", async (req, res) => {
    try {
      console.log('[RESET-DB] 🔥 Starting FULL database reset with COMPLETE schema...');
      
      const { db, pool } = await import('./db');
      const fs = await import('fs');
      const path = await import('path');
      
      // Read complete schema SQL from file
      const schemaPath = path.join(process.cwd(), 'server', 'complete-schema.sql');
      let schemaSql: string;
      
      try {
        schemaSql = fs.readFileSync(schemaPath, 'utf-8');
        console.log('[RESET-DB] ✅ Loaded complete-schema.sql');
      } catch (err) {
        console.log('[RESET-DB] ⚠️ Could not load SQL file, using inline schema');
        // Fallback inline SQL if file doesn't exist
        schemaSql = getCompleteSchemaSQL();
      }
      
      // Execute the complete schema SQL
      await pool.query(schemaSql);
      console.log('[RESET-DB] ✅ All 44 tables created with correct schema');

      // Now run seeds
      await seedDefaultTenant();
      await seedDemoData();
      
      console.log('[RESET-DB] ✅ Database reset and seed completed successfully');
      
      res.json({ 
        success: true, 
        message: "Database reset completed! All 44 tables recreated and seeded." 
      });
    } catch (error: any) {
      console.error('[RESET-DB] ❌ Reset error:', error);
      res.status(500).json({ 
        message: "Failed to reset database", 
        error: error.message,
        stack: error.stack 
      });
    }
  });
  
  // Helper function with complete inline SQL schema
  function getCompleteSchemaSQL(): string {
    return `
-- Complete SQL Schema for DžematApp - All 44 Tables
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
  name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, description TEXT,
  price_monthly TEXT NOT NULL, price_yearly TEXT, currency TEXT NOT NULL DEFAULT 'EUR',
  stripe_price_id_monthly TEXT, stripe_price_id_yearly TEXT, stripe_product_id TEXT,
  enabled_modules TEXT[], read_only_modules TEXT[], max_users INTEGER, max_storage INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tenants
CREATE TABLE tenants (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, tenant_code TEXT NOT NULL UNIQUE,
  subdomain TEXT UNIQUE, email TEXT NOT NULL, phone TEXT, address TEXT, city TEXT,
  country TEXT NOT NULL DEFAULT 'Switzerland', subscription_tier TEXT NOT NULL DEFAULT 'basic',
  subscription_status TEXT NOT NULL DEFAULT 'trial', trial_ends_at TIMESTAMP,
  subscription_started_at TIMESTAMP, stripe_customer_id TEXT UNIQUE, stripe_subscription_id TEXT UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true, locale TEXT NOT NULL DEFAULT 'bs',
  currency TEXT NOT NULL DEFAULT 'CHF', created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Users (COMPLETE)
CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL, last_name TEXT NOT NULL, username TEXT UNIQUE, email TEXT UNIQUE,
  password TEXT, phone TEXT, photo TEXT, address TEXT, city TEXT, postal_code TEXT,
  date_of_birth TEXT, occupation TEXT, membership_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'aktivan', inactive_reason TEXT, categories TEXT[],
  roles TEXT[] DEFAULT ARRAY['clan']::text[], is_admin BOOLEAN DEFAULT false,
  is_super_admin BOOLEAN DEFAULT false, last_viewed_shop TIMESTAMP, last_viewed_events TIMESTAMP,
  last_viewed_announcements TIMESTAMP, last_viewed_imam_questions TIMESTAMP,
  last_viewed_tasks TIMESTAMP, skills TEXT[], total_points INTEGER DEFAULT 0
);

-- 4. Organization Settings
CREATE TABLE organization_settings (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Islamska Zajednica', address TEXT NOT NULL DEFAULT 'Ulica Džemata 123',
  phone TEXT NOT NULL DEFAULT '+387 33 123 456', email TEXT NOT NULL DEFAULT 'info@dzemat.ba',
  currency TEXT NOT NULL DEFAULT 'CHF', facebook_url TEXT, instagram_url TEXT, youtube_url TEXT,
  twitter_url TEXT, livestream_url TEXT, livestream_enabled BOOLEAN NOT NULL DEFAULT false,
  livestream_title TEXT, livestream_description TEXT, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Family Relationships
CREATE TABLE family_relationships (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id),
  related_user_id VARCHAR(255) NOT NULL REFERENCES users(id),
  relationship TEXT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Announcements
CREATE TABLE announcements (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL, content TEXT NOT NULL, author_id VARCHAR(255) NOT NULL REFERENCES users(id),
  publish_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP, status TEXT NOT NULL DEFAULT 'published',
  is_featured BOOLEAN DEFAULT false, categories TEXT[], photo_url TEXT
);

-- 7. Events
CREATE TABLE events (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL, description TEXT, location TEXT NOT NULL, date_time TIMESTAMP NOT NULL,
  photo_url TEXT, rsvp_enabled BOOLEAN DEFAULT true, require_adults_children BOOLEAN DEFAULT false,
  max_attendees INTEGER, reminder_time TEXT, categories TEXT[], points_value INTEGER DEFAULT 20,
  created_by_id VARCHAR(255) NOT NULL REFERENCES users(id), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Event RSVPs
CREATE TABLE event_rsvps (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  event_id VARCHAR(255) NOT NULL REFERENCES events(id), user_id VARCHAR(255) NOT NULL REFERENCES users(id),
  adults_count INTEGER DEFAULT 1, children_count INTEGER DEFAULT 0, rsvp_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Work Groups
CREATE TABLE work_groups (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL, description TEXT, visibility TEXT NOT NULL DEFAULT 'javna',
  archived BOOLEAN NOT NULL DEFAULT false, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Work Group Members
CREATE TABLE work_group_members (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  work_group_id VARCHAR(255) NOT NULL REFERENCES work_groups(id),
  user_id VARCHAR(255) NOT NULL REFERENCES users(id), is_moderator BOOLEAN DEFAULT false,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. Tasks
CREATE TABLE tasks (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL, description TEXT, description_image TEXT,
  work_group_id VARCHAR(255) NOT NULL REFERENCES work_groups(id),
  assigned_user_ids TEXT[], status TEXT NOT NULL DEFAULT 'u_toku', due_date TIMESTAMP,
  estimated_cost TEXT, points_value INTEGER DEFAULT 50, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

-- 12. Access Requests
CREATE TABLE access_requests (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id),
  work_group_id VARCHAR(255) NOT NULL REFERENCES work_groups(id),
  status TEXT NOT NULL DEFAULT 'pending', request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. Task Comments
CREATE TABLE task_comments (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  task_id VARCHAR(255) NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id), content TEXT NOT NULL,
  comment_image TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 14. Announcement Files
CREATE TABLE announcement_files (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  announcement_id VARCHAR(255) NOT NULL REFERENCES announcements(id),
  uploaded_by_id VARCHAR(255) NOT NULL REFERENCES users(id), file_name TEXT NOT NULL,
  file_type TEXT NOT NULL, file_size INTEGER NOT NULL, file_path TEXT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 15. Activities
CREATE TABLE activities (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type TEXT NOT NULL, description TEXT NOT NULL, user_id VARCHAR(255) REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 16. Messages
CREATE TABLE messages (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  sender_id VARCHAR(255) NOT NULL REFERENCES users(id), recipient_id VARCHAR(255) REFERENCES users(id),
  category TEXT, subject TEXT NOT NULL, content TEXT NOT NULL, is_read BOOLEAN NOT NULL DEFAULT false,
  thread_id VARCHAR(255), parent_message_id VARCHAR(255), created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 17. Imam Questions
CREATE TABLE imam_questions (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id), subject TEXT NOT NULL, question TEXT NOT NULL,
  answer TEXT, is_answered BOOLEAN NOT NULL DEFAULT false, is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, answered_at TIMESTAMP
);

-- 18. Documents
CREATE TABLE documents (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL, description TEXT, file_name TEXT NOT NULL, file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL, uploaded_by_id VARCHAR(255) NOT NULL REFERENCES users(id),
  uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 19. Requests
CREATE TABLE requests (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id), request_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', form_data TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, reviewed_at TIMESTAMP,
  reviewed_by_id VARCHAR(255) REFERENCES users(id), admin_notes TEXT
);

-- 20. Shop Products
CREATE TABLE shop_products (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL, photos TEXT[], category TEXT, weight TEXT, volume TEXT, size TEXT,
  quantity INTEGER DEFAULT 0, color TEXT, notes TEXT, price TEXT,
  created_by_id VARCHAR(255) NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 21. Marketplace Items
CREATE TABLE marketplace_items (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL, description TEXT, photos TEXT[], type TEXT NOT NULL, price TEXT,
  status TEXT NOT NULL DEFAULT 'active', user_id VARCHAR(255) NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 22. Product Purchase Requests
CREATE TABLE product_purchase_requests (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id VARCHAR(255) NOT NULL REFERENCES shop_products(id),
  user_id VARCHAR(255) NOT NULL REFERENCES users(id), quantity INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending', created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 23. Prayer Times
CREATE TABLE prayer_times (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  date TEXT NOT NULL UNIQUE, hijri_date TEXT, fajr TEXT NOT NULL, sunrise TEXT,
  dhuhr TEXT NOT NULL, asr TEXT NOT NULL, maghrib TEXT NOT NULL, isha TEXT NOT NULL, events TEXT
);

-- 24. Important Dates
CREATE TABLE important_dates (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL, date TEXT NOT NULL, is_recurring BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 25. Contribution Purposes
CREATE TABLE contribution_purposes (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL, description TEXT, is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by_id VARCHAR(255) NOT NULL REFERENCES users(id)
);

-- 26. Financial Contributions
CREATE TABLE financial_contributions (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id), amount TEXT NOT NULL,
  payment_date TIMESTAMP NOT NULL, purpose TEXT NOT NULL, payment_method TEXT NOT NULL,
  notes TEXT, project_id VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by_id VARCHAR(255) NOT NULL REFERENCES users(id)
);

-- 27. Activity Log
CREATE TABLE activity_log (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id), activity_type TEXT NOT NULL,
  description TEXT NOT NULL, points INTEGER DEFAULT 0, related_entity_id VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 28. Event Attendance
CREATE TABLE event_attendance (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  event_id VARCHAR(255) NOT NULL REFERENCES events(id),
  user_id VARCHAR(255) NOT NULL REFERENCES users(id), attended BOOLEAN NOT NULL DEFAULT true,
  recorded_by_id VARCHAR(255) NOT NULL REFERENCES users(id),
  recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 29. Points Settings
CREATE TABLE points_settings (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  points_per_chf INTEGER NOT NULL DEFAULT 1, points_per_task INTEGER NOT NULL DEFAULT 50,
  points_per_event INTEGER NOT NULL DEFAULT 20, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 30. Badges
CREATE TABLE badges (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL, description TEXT NOT NULL, icon TEXT, criteria_type TEXT NOT NULL,
  criteria_value INTEGER NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
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
  name TEXT NOT NULL, description TEXT NOT NULL, goal_amount TEXT NOT NULL,
  current_amount TEXT NOT NULL DEFAULT '0', status TEXT NOT NULL DEFAULT 'active',
  created_by_id VARCHAR(255) NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, completed_at TIMESTAMP
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
  who TEXT, what TEXT NOT NULL, "where" TEXT, "when" TEXT, how TEXT, why TEXT, budget TEXT,
  status TEXT NOT NULL DEFAULT 'pending', reviewed_by_id VARCHAR(255) REFERENCES users(id),
  review_comment TEXT, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, reviewed_at TIMESTAMP
);

-- 35. Receipts
CREATE TABLE receipts (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  task_id VARCHAR(255) REFERENCES tasks(id), proposal_id VARCHAR(255) REFERENCES proposals(id),
  uploaded_by_id VARCHAR(255) NOT NULL REFERENCES users(id), file_name TEXT NOT NULL,
  file_url TEXT NOT NULL, amount TEXT NOT NULL, description TEXT,
  status TEXT NOT NULL DEFAULT 'pending', reviewed_by_id VARCHAR(255) REFERENCES users(id),
  review_comment TEXT, uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, reviewed_at TIMESTAMP
);

-- 36. Certificate Templates
CREATE TABLE certificate_templates (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL, description TEXT, template_image_path TEXT NOT NULL,
  text_position_x INTEGER DEFAULT 400, text_position_y INTEGER DEFAULT 300,
  font_size INTEGER DEFAULT 48, font_color TEXT DEFAULT '#000000',
  font_family TEXT DEFAULT 'Arial', text_align TEXT DEFAULT 'center',
  created_by_id VARCHAR(255) NOT NULL REFERENCES users(id), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 37. User Certificates
CREATE TABLE user_certificates (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id),
  template_id VARCHAR(255) NOT NULL REFERENCES certificate_templates(id),
  recipient_name TEXT NOT NULL, certificate_image_path TEXT NOT NULL, message TEXT,
  issued_by_id VARCHAR(255) NOT NULL REFERENCES users(id),
  issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, viewed BOOLEAN DEFAULT false
);

-- 38. Membership Applications
CREATE TABLE membership_applications (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  last_name TEXT NOT NULL, first_name TEXT NOT NULL, gender TEXT NOT NULL, photo TEXT,
  date_of_birth TEXT NOT NULL, place_of_birth TEXT NOT NULL, country TEXT NOT NULL,
  email TEXT, phone TEXT NOT NULL, street_address TEXT NOT NULL, postal_code TEXT NOT NULL,
  city TEXT NOT NULL, employment_status TEXT NOT NULL, occupation TEXT, skills_hobbies TEXT,
  marital_status TEXT NOT NULL, spouse_name TEXT, spouse_phone TEXT, children_info TEXT,
  monthly_fee INTEGER NOT NULL, invoice_delivery TEXT NOT NULL, membership_start_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', reviewed_by_id VARCHAR(255) REFERENCES users(id),
  reviewed_at TIMESTAMP, review_notes TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 39. Akika Applications
CREATE TABLE akika_applications (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  is_member BOOLEAN NOT NULL DEFAULT true, father_name TEXT NOT NULL, mother_name TEXT NOT NULL,
  child_name TEXT NOT NULL, child_gender TEXT NOT NULL, child_date_of_birth TEXT NOT NULL,
  child_place_of_birth TEXT NOT NULL, location TEXT NOT NULL, organize_catering BOOLEAN DEFAULT false,
  custom_address TEXT, custom_city TEXT, custom_canton TEXT, custom_postal_code TEXT,
  phone TEXT NOT NULL, email TEXT, notes TEXT, status TEXT NOT NULL DEFAULT 'pending',
  is_archived BOOLEAN NOT NULL DEFAULT false, submitted_by VARCHAR(255) REFERENCES users(id),
  reviewed_by_id VARCHAR(255) REFERENCES users(id), reviewed_at TIMESTAMP, review_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 40. Marriage Applications
CREATE TABLE marriage_applications (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  groom_last_name TEXT NOT NULL, groom_first_name TEXT NOT NULL, groom_date_of_birth TEXT NOT NULL,
  groom_place_of_birth TEXT NOT NULL, groom_nationality TEXT NOT NULL, groom_street_address TEXT NOT NULL,
  groom_postal_code TEXT NOT NULL, groom_city TEXT NOT NULL, groom_father_name TEXT NOT NULL,
  groom_mother_name TEXT NOT NULL, bride_last_name TEXT NOT NULL, bride_first_name TEXT NOT NULL,
  bride_date_of_birth TEXT NOT NULL, bride_place_of_birth TEXT NOT NULL, bride_nationality TEXT NOT NULL,
  bride_street_address TEXT NOT NULL, bride_postal_code TEXT NOT NULL, bride_city TEXT NOT NULL,
  bride_father_name TEXT NOT NULL, bride_mother_name TEXT NOT NULL, selected_last_name TEXT NOT NULL,
  mahr TEXT NOT NULL, civil_marriage_date TEXT NOT NULL, civil_marriage_location TEXT NOT NULL,
  witness1_name TEXT NOT NULL, witness2_name TEXT NOT NULL, witness3_name TEXT, witness4_name TEXT,
  proposed_date_time TEXT NOT NULL, location TEXT NOT NULL, custom_address TEXT, custom_city TEXT,
  custom_canton TEXT, custom_postal_code TEXT, phone TEXT NOT NULL, civil_marriage_proof TEXT,
  notes TEXT, status TEXT NOT NULL DEFAULT 'pending', reviewed_by_id VARCHAR(255) REFERENCES users(id),
  reviewed_at TIMESTAMP, review_notes TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 41. Services
CREATE TABLE services (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL, description TEXT NOT NULL, photos TEXT[], price TEXT, duration TEXT,
  category TEXT, status TEXT NOT NULL DEFAULT 'active',
  user_id VARCHAR(255) NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 42. Activity Feed
CREATE TABLE activity_feed (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type TEXT NOT NULL, title TEXT NOT NULL, description TEXT, related_entity_id VARCHAR(255),
  related_entity_type TEXT, metadata TEXT, is_clickable BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 43. Tenant Features
CREATE TABLE tenant_features (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL, is_enabled BOOLEAN NOT NULL DEFAULT true,
  is_read_only BOOLEAN NOT NULL DEFAULT false, settings TEXT,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 44. Audit Logs
CREATE TABLE audit_logs (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR(255) REFERENCES tenants(id) ON DELETE CASCADE,
  user_id VARCHAR(255) REFERENCES users(id), action TEXT NOT NULL, resource_type TEXT NOT NULL,
  resource_id VARCHAR(255), data_before TEXT, data_after TEXT, ip_address TEXT, user_agent TEXT,
  description TEXT, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add FK for financial_contributions -> projects
ALTER TABLE financial_contributions ADD CONSTRAINT fk_project FOREIGN KEY (project_id) REFERENCES projects(id);
    `;
  }

  // SuperAdmin Database Setup endpoint - creates tables and seeds data (GET for browser access)
  app.get("/api/superadmin/setup-db", async (req, res) => {
    try {
      console.log('[SETUP-DB] 🔧 Starting database setup via GET...');
      
      // Import db and run table creation
      const { db, pool } = await import('./db');
      
      // Create all tables using raw SQL from Drizzle schema
      const createTablesSQL = `
        -- Subscription Plans (complete schema)
        CREATE TABLE IF NOT EXISTS subscription_plans (
          id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
          name TEXT NOT NULL,
          slug TEXT NOT NULL UNIQUE,
          description TEXT,
          price_monthly TEXT NOT NULL DEFAULT '0',
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
        
        -- Add missing columns to subscription_plans if they don't exist
        DO $$ 
        BEGIN 
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscription_plans' AND column_name='stripe_price_id_monthly') THEN
            ALTER TABLE subscription_plans ADD COLUMN stripe_price_id_monthly TEXT;
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscription_plans' AND column_name='stripe_price_id_yearly') THEN
            ALTER TABLE subscription_plans ADD COLUMN stripe_price_id_yearly TEXT;
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscription_plans' AND column_name='stripe_product_id') THEN
            ALTER TABLE subscription_plans ADD COLUMN stripe_product_id TEXT;
          END IF;
        END $$;

        -- Tenants
        CREATE TABLE IF NOT EXISTS tenants (
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          slug VARCHAR(255) NOT NULL UNIQUE,
          subdomain VARCHAR(255) UNIQUE,
          custom_domain VARCHAR(255),
          email VARCHAR(255),
          phone VARCHAR(255),
          address TEXT,
          city VARCHAR(255),
          postal_code VARCHAR(50),
          country VARCHAR(100) DEFAULT 'Bosnia and Herzegovina',
          website VARCHAR(255),
          logo_url VARCHAR(500),
          subscription_plan_id VARCHAR(255) REFERENCES subscription_plans(id),
          subscription_tier VARCHAR(50) DEFAULT 'basic',
          subscription_status VARCHAR(50) DEFAULT 'trial',
          trial_ends_at TIMESTAMP,
          subscription_ends_at TIMESTAMP,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Users
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
          tenant_id VARCHAR(255) REFERENCES tenants(id),
          username VARCHAR(255),
          password VARCHAR(255),
          first_name VARCHAR(255) NOT NULL,
          last_name VARCHAR(255) NOT NULL,
          email VARCHAR(255),
          phone VARCHAR(50),
          address TEXT,
          city VARCHAR(255),
          postal_code VARCHAR(50),
          date_of_birth DATE,
          occupation VARCHAR(255),
          photo VARCHAR(500),
          roles TEXT[] DEFAULT '{}',
          categories TEXT[] DEFAULT '{}',
          is_admin BOOLEAN DEFAULT false,
          is_super_admin BOOLEAN DEFAULT false,
          status VARCHAR(50) DEFAULT 'aktivan',
          inactive_reason TEXT,
          membership_date DATE DEFAULT CURRENT_DATE,
          total_points INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Announcements
        CREATE TABLE IF NOT EXISTS announcements (
          id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
          tenant_id VARCHAR(255) REFERENCES tenants(id),
          title VARCHAR(500) NOT NULL,
          content TEXT NOT NULL,
          type VARCHAR(50) DEFAULT 'general',
          priority VARCHAR(50) DEFAULT 'normal',
          is_pinned BOOLEAN DEFAULT false,
          author_id VARCHAR(255) REFERENCES users(id),
          views INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Events
        CREATE TABLE IF NOT EXISTS events (
          id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
          tenant_id VARCHAR(255) REFERENCES tenants(id),
          title VARCHAR(500) NOT NULL,
          description TEXT,
          location VARCHAR(500),
          start_date TIMESTAMP NOT NULL,
          end_date TIMESTAMP,
          is_all_day BOOLEAN DEFAULT false,
          category VARCHAR(100),
          organizer_id VARCHAR(255) REFERENCES users(id),
          max_participants INTEGER,
          is_public BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Work Groups (Sekcije)
        CREATE TABLE IF NOT EXISTS work_groups (
          id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
          tenant_id VARCHAR(255) REFERENCES tenants(id),
          name VARCHAR(255) NOT NULL,
          description TEXT,
          color VARCHAR(50),
          icon VARCHAR(100),
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Activity Logs
        CREATE TABLE IF NOT EXISTS activity_logs (
          id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
          tenant_id VARCHAR(255) REFERENCES tenants(id),
          user_id VARCHAR(255) REFERENCES users(id),
          action VARCHAR(255) NOT NULL,
          entity_type VARCHAR(100),
          entity_id VARCHAR(255),
          details JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Organization Settings
        CREATE TABLE IF NOT EXISTS organization_settings (
          id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
          tenant_id VARCHAR(255) REFERENCES tenants(id) UNIQUE,
          name VARCHAR(255),
          address TEXT,
          city VARCHAR(255),
          phone VARCHAR(50),
          email VARCHAR(255),
          website VARCHAR(255),
          logo_url VARCHAR(500),
          settings JSONB DEFAULT '{}',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Prayer Times
        CREATE TABLE IF NOT EXISTS prayer_times (
          id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
          tenant_id VARCHAR(255) REFERENCES tenants(id),
          date DATE NOT NULL,
          fajr VARCHAR(10),
          sunrise VARCHAR(10),
          dhuhr VARCHAR(10),
          asr VARCHAR(10),
          maghrib VARCHAR(10),
          isha VARCHAR(10),
          juma VARCHAR(10),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Contribution Purposes
        CREATE TABLE IF NOT EXISTS contribution_purposes (
          id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
          tenant_id VARCHAR(255) REFERENCES tenants(id),
          name VARCHAR(255) NOT NULL,
          description TEXT,
          created_by_id VARCHAR(255),
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;

      await pool.query(createTablesSQL);
      console.log('[SETUP-DB] ✅ Tables created successfully via GET');

      // Now run seeds
      await seedDefaultTenant();
      await seedDemoData();
      
      console.log('[SETUP-DB] ✅ Database setup completed successfully via GET');
      
      res.json({ 
        success: true, 
        message: "Database tables created and seeded successfully!" 
      });
    } catch (error: any) {
      console.error('[SETUP-DB GET] ❌ Setup error:', error);
      res.status(500).json({ 
        message: "Failed to setup database", 
        error: error.message,
        stack: error.stack 
      });
    }
  });

  // SuperAdmin Database Setup endpoint - creates tables and seeds data
  app.post("/api/superadmin/setup-db", async (req, res) => {
    try {
      console.log('[SETUP-DB] 🔧 Starting database setup...');
      
      // Import db and run table creation
      const { db, pool } = await import('./db');
      const schema = await import('@shared/schema');
      
      // Create all tables using raw SQL from Drizzle schema
      // This is a simplified approach - creates essential tables
      const createTablesSQL = `
        -- Subscription Plans
        CREATE TABLE IF NOT EXISTS subscription_plans (
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          slug VARCHAR(255) NOT NULL UNIQUE,
          description TEXT,
          price_monthly DECIMAL(10,2) DEFAULT 0,
          price_yearly DECIMAL(10,2) DEFAULT 0,
          currency VARCHAR(10) DEFAULT 'EUR',
          enabled_modules TEXT[] DEFAULT '{}',
          read_only_modules TEXT[] DEFAULT '{}',
          max_users INTEGER,
          max_storage INTEGER,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Tenants
        CREATE TABLE IF NOT EXISTS tenants (
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          slug VARCHAR(255) NOT NULL UNIQUE,
          subdomain VARCHAR(255) UNIQUE,
          custom_domain VARCHAR(255),
          email VARCHAR(255),
          phone VARCHAR(255),
          address TEXT,
          city VARCHAR(255),
          postal_code VARCHAR(50),
          country VARCHAR(100) DEFAULT 'Bosnia and Herzegovina',
          website VARCHAR(255),
          logo_url VARCHAR(500),
          subscription_plan_id VARCHAR(255) REFERENCES subscription_plans(id),
          subscription_tier VARCHAR(50) DEFAULT 'basic',
          subscription_status VARCHAR(50) DEFAULT 'trial',
          trial_ends_at TIMESTAMP,
          subscription_ends_at TIMESTAMP,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Users
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
          tenant_id VARCHAR(255) REFERENCES tenants(id),
          username VARCHAR(255),
          password VARCHAR(255),
          first_name VARCHAR(255) NOT NULL,
          last_name VARCHAR(255) NOT NULL,
          email VARCHAR(255),
          phone VARCHAR(50),
          address TEXT,
          city VARCHAR(255),
          postal_code VARCHAR(50),
          date_of_birth DATE,
          occupation VARCHAR(255),
          photo VARCHAR(500),
          roles TEXT[] DEFAULT '{}',
          categories TEXT[] DEFAULT '{}',
          is_admin BOOLEAN DEFAULT false,
          is_super_admin BOOLEAN DEFAULT false,
          status VARCHAR(50) DEFAULT 'aktivan',
          inactive_reason TEXT,
          membership_date DATE DEFAULT CURRENT_DATE,
          total_points INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Announcements
        CREATE TABLE IF NOT EXISTS announcements (
          id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
          tenant_id VARCHAR(255) REFERENCES tenants(id),
          title VARCHAR(500) NOT NULL,
          content TEXT NOT NULL,
          type VARCHAR(50) DEFAULT 'general',
          priority VARCHAR(50) DEFAULT 'normal',
          is_pinned BOOLEAN DEFAULT false,
          author_id VARCHAR(255) REFERENCES users(id),
          views INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Events
        CREATE TABLE IF NOT EXISTS events (
          id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
          tenant_id VARCHAR(255) REFERENCES tenants(id),
          title VARCHAR(500) NOT NULL,
          description TEXT,
          location VARCHAR(500),
          start_date TIMESTAMP NOT NULL,
          end_date TIMESTAMP,
          is_all_day BOOLEAN DEFAULT false,
          category VARCHAR(100),
          organizer_id VARCHAR(255) REFERENCES users(id),
          max_participants INTEGER,
          is_public BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Work Groups (Sekcije)
        CREATE TABLE IF NOT EXISTS work_groups (
          id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
          tenant_id VARCHAR(255) REFERENCES tenants(id),
          name VARCHAR(255) NOT NULL,
          description TEXT,
          color VARCHAR(50),
          icon VARCHAR(100),
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Activity Logs
        CREATE TABLE IF NOT EXISTS activity_logs (
          id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
          tenant_id VARCHAR(255) REFERENCES tenants(id),
          user_id VARCHAR(255) REFERENCES users(id),
          action VARCHAR(255) NOT NULL,
          entity_type VARCHAR(100),
          entity_id VARCHAR(255),
          details JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Organization Settings
        CREATE TABLE IF NOT EXISTS organization_settings (
          id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
          tenant_id VARCHAR(255) REFERENCES tenants(id) UNIQUE,
          name VARCHAR(255),
          address TEXT,
          city VARCHAR(255),
          phone VARCHAR(50),
          email VARCHAR(255),
          website VARCHAR(255),
          logo_url VARCHAR(500),
          settings JSONB DEFAULT '{}',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Prayer Times
        CREATE TABLE IF NOT EXISTS prayer_times (
          id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
          tenant_id VARCHAR(255) REFERENCES tenants(id),
          date DATE NOT NULL,
          fajr VARCHAR(10),
          sunrise VARCHAR(10),
          dhuhr VARCHAR(10),
          asr VARCHAR(10),
          maghrib VARCHAR(10),
          isha VARCHAR(10),
          juma VARCHAR(10),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Contribution Purposes
        CREATE TABLE IF NOT EXISTS contribution_purposes (
          id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
          tenant_id VARCHAR(255) REFERENCES tenants(id),
          name VARCHAR(255) NOT NULL,
          description TEXT,
          created_by_id VARCHAR(255),
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;

      await pool.query(createTablesSQL);
      console.log('[SETUP-DB] ✅ Tables created successfully');

      // Now run seeds
      await seedDefaultTenant();
      await seedDemoData();
      
      console.log('[SETUP-DB] ✅ Database setup completed successfully');
      
      res.json({ 
        success: true, 
        message: "Database tables created and seeded successfully!" 
      });
    } catch (error: any) {
      console.error('[SETUP-DB] ❌ Setup error:', error);
      res.status(500).json({ 
        message: "Failed to setup database", 
        error: error.message,
        stack: error.stack 
      });
    }
  });

  // SuperAdmin Seed Database endpoint - triggers database seeding for fresh deployments
  app.post("/api/superadmin/seed", async (req, res) => {
    try {
      const session = req.session as any;
      
      // Only allow SuperAdmin to trigger seeding
      if (!session.isSuperAdmin) {
        return res.status(403).json({ message: "SuperAdmin access required" });
      }
      
      console.log('[SEED] 🌱 Starting database seed triggered by SuperAdmin...');
      
      // Run seed functions
      await seedDefaultTenant();
      await seedDemoData();
      
      console.log('[SEED] ✅ Database seed completed successfully');
      
      res.json({ 
        success: true, 
        message: "Database seeded successfully. Demo tenant and users created." 
      });
    } catch (error) {
      console.error('[SEED] ❌ Seed error:', error);
      res.status(500).json({ message: "Failed to seed database", error: String(error) });
    }
  });

  // Logout route
  app.post("/api/auth/logout", (req, res) => {
    // Explicitly clear session fields before destroying
    const session = req.session as any;
    session.userId = undefined;
    session.tenantId = undefined;
    session.isSuperAdmin = undefined;
    
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Could not log out" });
      }
      res.clearCookie('sessionId');
      res.json({ message: "Logged out successfully" });
    });
  });

  // Session check route
  app.get("/api/auth/session", (req, res) => {
    const session = req.session as any;
    
    if (req.user) {
      res.json({ 
        user: { 
          id: req.user.id, 
          firstName: req.user.firstName, 
          lastName: req.user.lastName, 
          email: req.user.email,
          roles: req.user.roles || [],
          isAdmin: req.user.isAdmin,
          isSuperAdmin: session.isSuperAdmin || false,
          totalPoints: req.user.totalPoints || 0,
          tenantId: session.isSuperAdmin ? "default-tenant-demo" : req.tenantId
        } 
});
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
});

  // Users routes
  app.get("/api/users", requireAuth, async (req, res) => {
    try {
      const session = req.session as any;
      console.log("[GET /api/users] DEBUG:", {
        "req.user.tenantId": req.user?.tenantId,
        "session.tenantId": session.tenantId,
        "req.tenantId": req.tenantId,
        "username": req.user?.username,
        "userId": req.user?.id
      });
      
      // CRITICAL: Use session.tenantId as authoritative source
      const tenantId = session.tenantId || req.user?.tenantId || req.tenantId || "default-tenant-demo";
      console.log("[GET /api/users] Using tenantId:", tenantId);
      
      const users = await storage.getAllUsers(tenantId);
      console.log("[GET /api/users] Found", users.length, "users for tenant:", tenantId);
      res.json(users.map(user => ({ ...user, password: undefined })));
    } catch (error) {
      console.error("[GET /api/users] Error:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
});

  // Bulk upload template endpoint - MUST BE BEFORE :id route to prevent matching as user ID
  const xlsxUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024
    }
  });

  app.get("/api/users/template", requireAuth, async (req, res) => {
    try {
      const workbook = XLSX.utils.book_new();
      
      const templateData = [
        ["Ime", "Prezime", "Korisničko ime", "Šifra", "Email", "Telefon", "Ulica i broj", "Broj pošte", "Naziv mjesta", "Član od", "Status članstva"],
        ["Marko", "Marković", "marko.markovic", "password123", "marko@example.com", "+387 61 123 456", "Ulica Maršala Tita 15", "71000", "Sarajevo", "2024-01-15", "aktivan"],
        ["Ana", "Anić", "ana.anic", "password123", "ana@example.com", "+387 62 234 567", "Koning Tvrtka 22", "72000", "Zenica", "2023-06-20", "aktivan"]
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(templateData);
      
      worksheet['!cols'] = [
        { wch: 15 },
        { wch: 15 },
        { wch: 18 },
        { wch: 15 },
        { wch: 25 },
        { wch: 18 },
        { wch: 25 },
        { wch: 12 },
        { wch: 18 },
        { wch: 15 },
        { wch: 18 }
      ];

      XLSX.utils.book_append_sheet(workbook, worksheet, "Korisnici");
      
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Disposition', 'attachment; filename="JamatHub_Template.xlsx"');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate template" });
    }
  });

  app.post("/api/users/bulk-upload", requireAdmin, xlsxUpload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";

      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      if (data.length < 2) {
        return res.status(400).json({ message: "Fajl ne sadrži podatke" });
      }

      const headers = data[0];
      const rows = data.slice(1);

      const results = {
        success: [] as any[],
        errors: [] as { row: number; errors: string[] }[]
      };
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNumber = i + 2;

        if (!row || row.every(cell => !cell)) {
          continue;
        }

        const errors: string[] = [];
        
        const firstName = row[0]?.toString().trim() || '';
        const lastName = row[1]?.toString().trim() || '';
        const username = row[2]?.toString().trim() || '';
        const password = row[3]?.toString().trim() || '';
        const email = row[4]?.toString().trim() || '';
        const phone = row[5]?.toString().trim() || '';
        const address = row[6]?.toString().trim() || '';
        const postalCode = row[7]?.toString().trim() || '';
        const city = row[8]?.toString().trim() || '';
        const membershipDateStr = row[9]?.toString().trim() || '';
        const status = row[10]?.toString().trim() || 'aktivan';

        if (!firstName) {
          errors.push("Ime je obavezno polje");
        }
        if (!lastName) {
          errors.push("Prezime je obavezno polje");
        }
        if (!username) {
          errors.push("Korisničko ime je obavezno polje");
        }
        if (!password) {
          errors.push("Šifra je obavezno polje");
        }
        
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          errors.push("Neispravan format email adrese");
        }

        const validStatuses = ['aktivan', 'pasivan', 'član porodice'];
        if (status && !validStatuses.includes(status.toLowerCase())) {
          errors.push(`Status članstva mora biti: ${validStatuses.join(', ')}`);
        }

        let membershipDate: Date | null = null;
        if (membershipDateStr) {
          try {
            if (typeof membershipDateStr === 'number') {
              const parsedDate = XLSX.SSF.parse_date_code(membershipDateStr) as any;
              membershipDate = new Date(parsedDate.y, parsedDate.m - 1, parsedDate.d);
            } else {
              membershipDate = new Date(membershipDateStr);
              if (isNaN(membershipDate.getTime())) {
                throw new Error('Invalid date');
              }
            }
          } catch {
            errors.push("Neispravan format datuma za 'Član od' (koristite format: YYYY-MM-DD)");
          }
        }

        if (errors.length > 0) {
          results.errors.push({ row: rowNumber, errors });
          continue;
        }

        // Check if username already exists
        if (await storage.getUserByUsername(username)) {
          results.errors.push({ 
            row: rowNumber, 
            errors: [`Korisničko ime '${username}' već postoji u sistemu`] 
          });
          continue;
        }

        if (email && await storage.getUserByEmail(email)) {
          results.errors.push({ 
            row: rowNumber, 
            errors: [`Email adresa '${email}' već postoji u sistemu`] 
          });
          continue;
        }

        try {
          const newUser = await storage.createUser({
            firstName,
            lastName,
            username,
            email: email || undefined,
            password,
            phone: phone || undefined,
            address: address || undefined,
            categories: [],
            membershipDate: membershipDate || undefined,
            status: status.toLowerCase() as any,
            isAdmin: false,
            photo: undefined,
            city: city || undefined,
            postalCode: postalCode || undefined,
            dateOfBirth: undefined,
            tenantId
          });
          
          results.success.push({
            row: rowNumber,
            user: { 
              firstName: newUser.firstName, 
              lastName: newUser.lastName, 
              username: newUser.username 
            }
          });
        } catch (error: any) {
          results.errors.push({ 
            row: rowNumber, 
            errors: [`Greška pri kreiranju korisnika: ${error.message || 'Nepoznata greška'}`] 
          });
        }
      }

      res.json({
        successCount: results.success.length,
        errorCount: results.errors.length,
        results
      });
    } catch (error: any) {
      res.status(500).json({ message: `Greška pri obradi fajla: ${error.message}` });
    }
  });

  app.get("/api/users/me", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      res.json({ ...user, password: undefined });
    } catch (error) {
      console.error('❌ [GET CURRENT USER] Error:', error);
      res.status(500).json({ 
        message: "Failed to fetch current user",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.get("/api/users/:id", requireAuth, async (req, res) => {
    try {
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      const { id } = req.params;
      const currentUser = req.user!;
      
      // Check if user is viewing their own profile or if they're an admin
      const isOwnProfile = currentUser.id === id;
      const isAdmin = currentUser.isAdmin || false;
      
      if (!isOwnProfile && !isAdmin) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const user = await storage.getUser(id, tenantId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ ...user, password: undefined });
    } catch (error) {
      console.error('❌ [GET USER BY ID] Error:', error);
      console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A');
      res.status(500).json({ 
        message: "Failed to fetch user",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.post("/api/users", requireAuth, async (req, res) => {
    try {
      // CRITICAL: Always use authenticated user's tenantId for tenant isolation
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      console.log("[DEBUG POST /api/users] Using tenantId from session:", tenantId, "user:", req.user?.username);
      
      // Get createdById - use current user or get admin from tenant
      let createdById = req.user?.id;
      if (!createdById) {
        const admin = await storage.getUserByUsername("admin", tenantId);
        createdById = admin?.id;
        if (!createdById) {
          return res.status(400).json({ message: "Admin user not found in tenant" });
        }
      }
      
      // Block attempts to set isSuperAdmin - SuperAdmin can only exist in global tenant
      if (req.body.isSuperAdmin === true) {
        return res.status(403).json({ message: "SuperAdmin access je samo za globalni tenant" });
      }
      
      // Add createdById (admin who created this user)
      const userData = insertUserSchema.parse({ 
        ...req.body, 
        tenantId,
        createdById,
        isSuperAdmin: false  // Force isSuperAdmin to false
      });
      
      // Check if username already exists (only if username is provided)
      if (userData.username) {
        const existingUser = await storage.getUserByUsername(userData.username, tenantId);
        if (existingUser) {
          return res.status(400).json({ message: "Korisničko ime već postoji" });
        }
      }
      
      const user = await storage.createUser(userData);
      res.json({ ...user, password: undefined });
    } catch (error: any) {
      console.error("Error creating user:", error);
      // Check for unique constraint violation
      if (error.code === '23505') {
        if (error.constraint?.includes('email')) {
          return res.status(400).json({ message: "Email adresa već postoji" });
        }
        if (error.constraint?.includes('username')) {
          return res.status(400).json({ message: "Korisničko ime već postoji" });
        }
        return res.status(400).json({ message: "Korisnik sa ovim podacima već postoji" });
      }
      res.status(400).json({ message: "Invalid user data", error: error.message || String(error) });
    }
});

  app.put("/api/users/:id", requireAuth, async (req, res) => {
    try {
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      const { id } = req.params;
      const currentUser = req.user!;
      
      // Check if user is editing their own profile or if they're an admin
      const isOwnProfile = currentUser.id === id;
      const isAdmin = currentUser.isAdmin || false;
      
      if (!isOwnProfile && !isAdmin) {
        return res.status(403).json({ message: "Admin privileges required" });
      }
      
      // Block attempts to set isSuperAdmin - SuperAdmin can only exist in global tenant
      if (req.body.isSuperAdmin === true) {
        return res.status(403).json({ message: "SuperAdmin access je samo za globalni tenant" });
      }
      
      const userData = insertUserSchema.partial().parse(req.body);
      userData.isSuperAdmin = false;  // Force isSuperAdmin to false
      
      // Don't update password if it's empty or not provided
      if (!userData.password) {
        delete (userData as any).password;
      }
      
      // Protect the default "admin" account from password/username changes
      const userToUpdate = await storage.getUser(id, tenantId);
      if (userToUpdate?.username === 'admin') {
        if (userData.password !== undefined) {
          return res.status(403).json({ message: "Nije dozvoljeno mijenjanje lozinke za admin nalog" });
        }
        if (userData.username !== undefined && userData.username !== 'admin') {
          return res.status(403).json({ message: "Nije dozvoljeno mijenjanje korisničkog imena za admin nalog" });
        }
      }
      
      // Regular users can only update certain fields on their own profile
      if (isOwnProfile && !isAdmin) {
        // Remove sensitive fields that only admins can update
        const allowedFields = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'postalCode', 'username', 'password'];
        const filteredData: any = {};
        for (const key of allowedFields) {
          if (key in userData) {
            filteredData[key] = userData[key as keyof typeof userData];
          }
        }
        Object.assign(userData, filteredData);
        // Remove fields that users shouldn't be able to change
        delete (userData as any).roles;
        delete (userData as any).isAdmin;
        delete (userData as any).totalPoints;
        delete (userData as any).status;
        delete (userData as any).inactiveReason;
        delete (userData as any).membershipDate;
        delete (userData as any).categories;
      }
      
      // Check if username is being changed and if it already exists
      if (userData.username) {
        const existingUser = await storage.getUserByUsername(userData.username, tenantId);
        if (existingUser && existingUser.id !== id) {
          return res.status(400).json({ message: "Korisničko ime već postoji" });
        }
      }
      
      const user = await storage.updateUser(id, tenantId, userData);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Log activity
      await storage.createActivityLog({
        userId: id,
        activityType: 'profile_updated',
        description: 'Profil ažuriran',
        points: 0,
        relatedEntityId: id,
        tenantId: tenantId
      });

      res.json({ ...user, password: undefined });
    } catch (error) {
      console.error('User update error:', error);
      res.status(400).json({ message: "Invalid user data", error: error instanceof Error ? error.message : String(error) });
    }
});

  // Delete user (Admin only)
  app.delete("/api/users/:id", requireAdmin, async (req, res) => {
    try {
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      const { id } = req.params;
      
      // Prevent deleting the admin account
      const userToDelete = await storage.getUser(id, tenantId);
      if (!userToDelete) {
        return res.status(404).json({ message: "Korisnik nije pronađen" });
      }
      
      if (userToDelete.username === 'admin') {
        return res.status(403).json({ message: "Nije dozvoljeno brisanje admin naloga" });
      }
      
      // Prevent users from deleting themselves
      if (req.user?.id === id) {
        return res.status(403).json({ message: "Ne možete obrisati vlastiti nalog" });
      }
      
      const success = await storage.deleteUser(id, tenantId);
      if (!success) {
        return res.status(404).json({ message: "Korisnik nije pronađen" });
      }
      
      console.log('[USER DELETE] ✅ Deleted user:', id, 'from tenant:', tenantId);
      res.json({ message: "Korisnik uspješno obrisan" });
    } catch (error) {
      console.error('[USER DELETE] Error:', error);
      res.status(500).json({ message: "Greška pri brisanju korisnika" });
    }
  });

  // Announcements routes
  app.get("/api/announcements", async (req, res) => {
    try {
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      const announcements = await storage.getAllAnnouncements(tenantId);
      res.json(announcements);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch announcements" });
    }
});

  app.post("/api/announcements", requireAuth, async (req, res) => {
    try {
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      const announcementData = insertAnnouncementSchema.parse({
        ...req.body,
        authorId: req.user!.id,
        tenantId
      });
      const announcement = await storage.createAnnouncement(announcementData);
      res.json(announcement);
    } catch (error) {
      res.status(400).json({ message: "Invalid announcement data" });
    }
});

  app.put("/api/announcements/:id", requireAuth, async (req, res) => {
    try {
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      const { id } = req.params;
      const announcementData = insertAnnouncementSchema.partial().parse(req.body);
      const announcement = await storage.updateAnnouncement(id, tenantId, announcementData);
      if (!announcement) {
        return res.status(404).json({ message: "Announcement not found" });
      }
      res.json(announcement);
    } catch (error) {
      res.status(400).json({ message: "Invalid announcement data" });
    }
});

  app.delete("/api/announcements/:id", requireAdmin, async (req, res) => {
    try {
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      const { id } = req.params;
      const deleted = await storage.deleteAnnouncement(id, tenantId);
      if (!deleted) {
        return res.status(404).json({ message: "Announcement not found" });
      }
      res.json({ message: "Announcement deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete announcement" });
    }
});

  // Events routes
  app.get("/api/events", async (req, res) => {
    try {
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      const events = await storage.getAllEvents(tenantId);
      
      // Add RSVP count to each event
      const eventsWithRsvpCount = await Promise.all(
        events.map(async (event) => {
          if (event.rsvpEnabled) {
            const rsvpStats = await storage.getEventRsvps(event.id, tenantId);
            console.log(`Event ${event.name}: rsvpCount = ${rsvpStats.totalAttendees}`);
            return {
              ...event,
              rsvpCount: rsvpStats.totalAttendees
            };
          }
          return {
            ...event,
            rsvpCount: 0
          };
        })
      );
      
      // Disable caching for this endpoint
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      res.json(eventsWithRsvpCount);
    } catch (error) {
      console.error('❌ [EVENTS] Error:', error);
      console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A');
      res.status(500).json({
        message: "Failed to fetch events",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.get("/api/events/locations", async (req, res) => {
    try {
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      const locations = await storage.getEventLocations(tenantId);
      res.json(locations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch event locations" });
    }
});

  app.post("/api/events", requireAuth, async (req, res) => {
    try {
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      const eventData = insertEventSchema.parse({
        ...req.body,
        createdById: req.user!.id,
        tenantId
      });
      const event = await storage.createEvent(eventData);
      res.json(event);
    } catch (error: any) {
      console.error('❌ [CREATE EVENT] Error:', error);
      console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A');
      console.error('Request body:', req.body);
      const errorMsg = error?.errors?.[0]?.message || error?.message || JSON.stringify(error);
      res.status(400).json({ message: "Invalid event data", details: errorMsg });
    }
  });

  app.put("/api/events/:id", requireAuth, async (req, res) => {
    try {
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      const { id } = req.params;
      const eventData = insertEventSchema.partial().parse(req.body);
      const event = await storage.updateEvent(id, tenantId, eventData);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json(event);
    } catch (error: any) {
      res.status(400).json({ message: "Invalid event data", details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.delete("/api/events/:id", requireAuth, async (req, res) => {
    try {
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      const { id } = req.params;
      const deleted = await storage.deleteEvent(id, tenantId);
      if (!deleted) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json({ message: "Event deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete event" });
    }
});

  app.get("/api/events/:id/rsvps", async (req, res) => {
    try {
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      const { id } = req.params;
      const rsvpStats = await storage.getEventRsvps(id, tenantId);
      res.json(rsvpStats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch RSVPs" });
    }
});

  app.post("/api/events/:id/rsvp", requireAuth, async (req, res) => {
    try {
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      const { id } = req.params;
      const { adultsCount, childrenCount } = req.body;
      
      // Get event to check max attendees
      const event = await storage.getEvent(id, tenantId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      // If max attendees is set, check capacity
      if (event.maxAttendees) {
        const rsvpStats = await storage.getEventRsvps(id, tenantId);
        const requestedCount = (adultsCount || 1) + (childrenCount || 0);
        const newTotal = rsvpStats.totalAttendees + requestedCount;
        
        if (newTotal > event.maxAttendees) {
          return res.status(409).json({ 
            message: "Event capacity reached",
            currentTotal: rsvpStats.totalAttendees,
            maxAttendees: event.maxAttendees,
            requested: requestedCount
});
        }
      }
      
      const rsvpData = {
        eventId: id,
        userId: req.user!.id,
        tenantId: tenantId,
        adultsCount: adultsCount || 1,
        childrenCount: childrenCount || 0
      };
      const rsvp = await storage.createEventRsvp(rsvpData);

      // Log activity
      const pointsSettings = await storage.getPointsSettings(tenantId);
      const points = event.pointsValue || pointsSettings?.pointsPerEvent || 20;
      
      await storage.createActivityLog({
        userId: req.user!.id,
        activityType: 'event_rsvp',
        description: `RSVP na događaj: ${event.name}`,
        points,
        relatedEntityId: id,
        tenantId: tenantId
      });

      res.json(rsvp);
    } catch (error) {
      res.status(400).json({ message: "Failed to create RSVP" });
    }
});

  app.put("/api/events/:eventId/rsvp/:rsvpId", requireAuth, async (req, res) => {
    try {
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      const { rsvpId } = req.params;
      const { adultsCount, childrenCount } = req.body;
      
      const rsvp = await storage.updateEventRsvp(rsvpId, tenantId, {
        adultsCount,
        childrenCount
      });
      
      if (!rsvp) {
        return res.status(404).json({ message: "RSVP not found" });
      }
      
      res.json(rsvp);
    } catch (error) {
      res.status(400).json({ message: "Failed to update RSVP" });
    }
});

  app.delete("/api/events/:eventId/rsvp/:rsvpId", requireAuth, async (req, res) => {
    try {
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      const { rsvpId } = req.params;
      const deleted = await storage.deleteEventRsvp(rsvpId, tenantId);
      
      if (!deleted) {
        return res.status(404).json({ message: "RSVP not found" });
      }
      
      res.json({ message: "RSVP deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete RSVP" });
    }
});

  app.get("/api/events/:eventId/user-rsvp", requireAuth, async (req, res) => {
    try {
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      const { eventId } = req.params;
      const rsvp = await storage.getUserEventRsvp(eventId, req.user!.id, tenantId);
      res.json(rsvp);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user RSVP" });
    }
});

  // Work Groups routes
  app.get("/api/work-groups", requireFeature("tasks"), async (req, res) => {
    try {
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      // Proslijedi userId i isAdmin za filtriranje po vidljivosti
      const userId = req.user?.id;
      const isAdmin = req.user?.isAdmin || false;
      const isClanIO = req.user?.roles?.includes('clan_io') || false;
      
      // Član IO i Admin vide sve sekcije (javne i privatne)
      const canSeeAll = isAdmin || isClanIO;
      
      const workGroups = await storage.getAllWorkGroups(tenantId, userId, canSeeAll);
      
      // FILTER ARCHIVED SECTIONS FOR NON-ADMIN USERS
      const filteredWorkGroups = isAdmin 
        ? workGroups 
        : workGroups.filter(wg => !wg.archived);
      
      // Add members to each work group
      const workGroupsWithMembers = await Promise.all(
        filteredWorkGroups.map(async (wg) => {
          const members = await storage.getWorkGroupMembers(wg.id, tenantId);
          return {
            ...wg,
            members
          };
        })
      );
      
      // Prevent caching of this endpoint
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.json(workGroupsWithMembers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch work groups" });
    }
});

  app.post("/api/work-groups", requireAuth, requireFeature("tasks"), async (req, res) => {
    try {
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      const workGroupData = insertWorkGroupSchema.parse({ ...req.body, tenantId });
      const workGroup = await storage.createWorkGroup(workGroupData);
      res.json(workGroup);
    } catch (error) {
      res.status(400).json({ message: "Invalid work group data" });
    }
});

  app.put("/api/work-groups/:id", requireAuth, requireFeature("tasks"), async (req, res) => {
    try {
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      const { id } = req.params;

      // Check if work group exists
      const workGroup = await storage.getWorkGroup(id, tenantId);
      if (!workGroup) {
        return res.status(404).json({ message: "Work group not found" });
      }

      // Authorization check: Only admins or group moderators can update
      const isAdmin = req.user!.isAdmin;
      const isModerator = await storage.isUserModeratorOfWorkGroup(id, req.user!.id, tenantId);
      
      if (!isAdmin && !isModerator) {
        return res.status(403).json({ message: "Forbidden: Only admins or group moderators can update work groups" });
      }

      const updates = insertWorkGroupSchema.partial().parse(req.body);
      const updatedWorkGroup = await storage.updateWorkGroup(id, tenantId, updates);
      
      res.json(updatedWorkGroup);
    } catch (error) {
      res.status(400).json({ message: "Invalid work group data" });
    }
});

  app.post("/api/work-groups/:id/archive", requireAdmin, requireFeature("tasks"), async (req, res) => {
    try {
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      const { id } = req.params;

      // Check if work group exists
      const workGroup = await storage.getWorkGroup(id, tenantId);
      if (!workGroup) {
        return res.status(404).json({ message: "Work group not found" });
      }

      // Toggle archive status
      const updatedWorkGroup = await storage.updateWorkGroup(id, tenantId, { archived: !workGroup.archived });
      
      res.json(updatedWorkGroup);
    } catch (error) {
      res.status(500).json({ message: "Failed to archive work group" });
    }
});

  app.delete("/api/work-groups/:id", requireAdmin, requireFeature("tasks"), async (req, res) => {
    try {
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      const { id } = req.params;

      // Check if work group exists
      const workGroup = await storage.getWorkGroup(id, tenantId);
      if (!workGroup) {
        return res.status(404).json({ message: "Work group not found" });
      }

      // Delete work group
      const deleted = await storage.deleteWorkGroup(id, tenantId);
      
      if (deleted) {
        res.json({ message: "Work group deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete work group" });
      }
    } catch (error) {
      console.error("Error deleting work group:", error);
      res.status(500).json({ message: "Failed to delete work group", error: String(error) });
    }
});

  // Work Group Members routes
  app.post("/api/work-groups/:id/members", requireAuth, requireFeature("tasks"), async (req, res) => {
    try {
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      const { id } = req.params;
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      // Check if work group exists
      const workGroup = await storage.getWorkGroup(id, tenantId);
      if (!workGroup) {
        return res.status(404).json({ message: "Work group not found" });
      }

      // Authorization check: Only admins or group moderators can add members
      const isAdmin = req.user!.isAdmin;
      const isModerator = await storage.isUserModeratorOfWorkGroup(id, req.user!.id, tenantId);
      
      if (!isAdmin && !isModerator) {
        return res.status(403).json({ message: "Forbidden: Only admins or group moderators can add members" });
      }

      // Check if user exists
      const user = await storage.getUser(userId, tenantId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user is already a member
      const isAlreadyMember = await storage.isUserMemberOfWorkGroup(id, userId, tenantId);
      if (isAlreadyMember) {
        return res.status(409).json({ message: "User is already a member of this work group" });
      }

      const member = await storage.addMemberToWorkGroup(id, userId, tenantId);
      res.json(member);
    } catch (error) {
      res.status(500).json({ message: "Failed to add member to work group" });
    }
});

  app.delete("/api/work-groups/:id/members/:userId", requireAuth, requireFeature("tasks"), async (req, res) => {
    try {
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      const { id, userId } = req.params;

      // Check if work group exists
      const workGroup = await storage.getWorkGroup(id, tenantId);
      if (!workGroup) {
        return res.status(404).json({ message: "Work group not found" });
      }

      // Authorization check: Only admins or group moderators can remove members
      // Or users can remove themselves
      const isAdmin = req.user!.isAdmin;
      const isModerator = await storage.isUserModeratorOfWorkGroup(id, req.user!.id, tenantId);
      const isSelfRemoval = userId === req.user!.id;
      
      if (!isAdmin && !isModerator && !isSelfRemoval) {
        return res.status(403).json({ message: "Forbidden: Only admins, group moderators, or the user themselves can remove members" });
      }

      // Check if user exists
      const user = await storage.getUser(userId, tenantId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const removed = await storage.removeMemberFromWorkGroup(id, userId, tenantId);
      if (!removed) {
        return res.status(404).json({ message: "User is not a member of this work group" });
      }

      res.json({ message: "Member removed from work group successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove member from work group" });
    }
});

  app.get("/api/work-groups/:id/members", requireAuth, requireFeature("tasks"), async (req, res) => {
    try {
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      const { id } = req.params;

      // Check if work group exists
      const workGroup = await storage.getWorkGroup(id, tenantId);
      if (!workGroup) {
        return res.status(404).json({ message: "Work group not found" });
      }

      const members = await storage.getWorkGroupMembers(id, tenantId);
      
      // Get user details for each member
      const membersWithUserDetails = await Promise.all(
        members.map(async (member) => {
          const user = await storage.getUser(member.userId, tenantId);
          return {
            ...member,
            user: user ? { 
              id: user.id, 
              firstName: user.firstName, 
              lastName: user.lastName, 
              email: user.email 
            } : null
          };
        })
      );
      
      res.json(membersWithUserDetails);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch work group members" });
    }
});

  // Moderator management routes
  app.put("/api/work-groups/:workGroupId/members/:userId/moderator", requireAdmin, requireFeature("tasks"), async (req, res) => {
    try {
      const { workGroupId, userId } = req.params;
      const { isModerator } = req.body;

      if (typeof isModerator !== 'boolean') {
        return res.status(400).json({ message: "isModerator must be a boolean" });
      }

      // Check if work group exists
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      const workGroup = await storage.getWorkGroup(workGroupId, tenantId);
      if (!workGroup) {
        return res.status(404).json({ message: "Work group not found" });
      }

      // Check if target user exists
      const targetUser = await storage.getUser(userId, tenantId);
      if (!targetUser) {
        return res.status(404).json({ message: "Target user not found" });
      }

      // Check if user is a member
      const isMember = await storage.isUserMemberOfWorkGroup(workGroupId, userId, tenantId);
      if (!isMember) {
        return res.status(404).json({ message: "User is not a member of this work group" });
      }

      const member = await storage.setModerator(workGroupId, userId, tenantId, isModerator);
      if (!member) {
        return res.status(404).json({ message: "Failed to update moderator status" });
      }

      res.json(member);
    } catch (error) {
      res.status(500).json({ message: "Failed to update moderator status" });
    }
});

  app.get("/api/work-groups/:id/moderators", requireFeature("tasks"), async (req, res) => {
    try {
      const { id } = req.params;

      // Check if work group exists
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      const workGroup = await storage.getWorkGroup(id, tenantId);
      if (!workGroup) {
        return res.status(404).json({ message: "Work group not found" });
      }

      const moderators = await storage.getWorkGroupModerators(id, tenantId);
      res.json(moderators);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch moderators" });
    }
});

  app.get("/api/users/:id/work-groups", requireFeature("tasks"), async (req, res) => {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";

      // Check if user exists
      const user = await storage.getUser(id, tenantId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const userWorkGroups = await storage.getUserWorkGroups(id, tenantId);
      res.json(userWorkGroups);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user work groups" });
    }
});

  // Tasks routes
  app.get("/api/work-groups/:workGroupId/tasks", requireFeature("tasks"), async (req, res) => {
    try {
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      const { workGroupId } = req.params;
      const tasks = await storage.getTasksByWorkGroup(workGroupId, tenantId);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
});

  app.get("/api/tasks/dashboard", requireAuth, requireFeature("tasks"), async (req, res) => {
    try {
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      const userId = req.user!.id;
      const isAdmin = req.user!.isAdmin || false;
      
      const tasks = await storage.getAllTasksWithWorkGroup(userId, isAdmin, tenantId);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard tasks" });
    }
});

  app.get("/api/tasks/admin-archive", requireAdmin, requireFeature("tasks"), async (req, res) => {
    try {
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      const userId = req.user!.id;
      const isAdmin = true;
      
      const tasks = await storage.getAllTasksWithWorkGroup(userId, isAdmin, tenantId);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch admin archive tasks" });
    }
});

  app.post("/api/tasks", requireAuth, requireFeature("tasks"), async (req, res) => {
    try {
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      const taskData = insertTaskSchema.parse({
        ...req.body,
        status: req.body.status || 'u_toku',
        tenantId
      });
      
      // Check if work group exists
      const workGroup = await storage.getWorkGroup(taskData.workGroupId, tenantId);
      if (!workGroup) {
        return res.status(404).json({ message: "Work group not found" });
      }

      // Authorization check: Only admins or group moderators can create tasks
      const isAdmin = req.user!.isAdmin;
      const isModerator = await storage.isUserModeratorOfWorkGroup(taskData.workGroupId, req.user!.id, tenantId);
      
      if (!isAdmin && !isModerator) {
        return res.status(403).json({ message: "Forbidden: Only admins or group moderators can create tasks" });
      }

      const task = await storage.createTask(taskData);
      res.status(201).json(task);
    } catch (error) {
      res.status(400).json({ message: "Invalid task data" });
    }
});

  app.put("/api/tasks/:id", requireAuth, requireFeature("tasks"), async (req, res) => {
    try {
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      const { id } = req.params;
      const taskData = insertTaskSchema.partial().parse({
        ...req.body,
        tenantId
      });
      
      // Get existing task to check work group
      const existingTask = await storage.getTask(id, tenantId);
      if (!existingTask) {
        return res.status(404).json({ message: "Task not found" });
      }

      // PREVENT EDITING COMPLETED OR ARCHIVED TASKS
      if (existingTask.status === 'završeno' || existingTask.status === 'arhiva') {
        return res.status(403).json({ message: "Završeni i arhivirani zadaci ne mogu biti mijenjani. Zadatak je zaključan." });
      }

      // Authorization check: Only admins or group moderators can update tasks
      // OR assigned users can update status to na_cekanju
      const isAdmin = req.user!.isAdmin;
      const isModerator = await storage.isUserModeratorOfWorkGroup(existingTask.workGroupId, req.user!.id, tenantId);
      const isAssignedUser = existingTask.assignedUserIds?.includes(req.user!.id) || false;
      
      // If not admin or moderator, only allow assigned user to change status to na_cekanju or završeno
      if (!isAdmin && !isModerator) {
        if (!isAssignedUser || Object.keys(taskData).length !== 1 || !taskData.status || (taskData.status !== 'na_cekanju' && taskData.status !== 'završeno')) {
          return res.status(403).json({ message: "Forbidden: Only admins or group moderators can update tasks" });
        }
      }

      // Set completedAt timestamp when task is marked as completed
      if (taskData.status === 'završeno' && existingTask.status !== 'završeno') {
        taskData.completedAt = new Date();
      }

      const task = await storage.updateTask(id, tenantId, taskData);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      // Activity logging when task status changes
      const statusChanged = taskData.status && existingTask.status !== taskData.status;

      if (statusChanged) {
        const workGroup = await storage.getWorkGroup(task.workGroupId, tenantId);
        const settings = await storage.getPointsSettings(tenantId);
        const points = task.pointsValue || settings?.pointsPerTask || 50;

        // If assigned user marked as na_cekanju (pending approval), log for that user WITHOUT points
        // Points are only awarded when admin approves (završeno status)
        if (taskData.status === 'na_cekanju' && isAssignedUser && !isAdmin && !isModerator && existingTask.status !== 'na_cekanju') {
          await storage.createActivityLog({
            userId: req.user!.id,
            tenantId: tenantId,
            activityType: 'task_completed',
            description: `Završen zadatak: ${task.title} u sekciji ${workGroup?.name || 'Nepoznata'} (čeka odobrenje)`,
            points: 0, // No points until admin approves
            relatedEntityId: task.id
          });
        }
        
        // If admin/moderator marks as završeno (approved), log for all assigned users WITH points
        // This happens when admin approves the task or directly marks it as finished
        if (taskData.status === 'završeno' && existingTask.status !== 'završeno' && task.assignedUserIds && task.assignedUserIds.length > 0) {
          for (const userId of task.assignedUserIds) {
            await storage.createActivityLog({
              userId,
              tenantId: tenantId,
              activityType: 'task_completed',
              description: `Završen zadatak: ${task.title} u sekciji ${workGroup?.name || 'Nepoznata'}`,
              points,
              relatedEntityId: task.id
            });
          }
        }
      }

      res.json(task);
    } catch (error) {
      res.status(400).json({ message: "Invalid task data" });
    }
});

  app.delete("/api/tasks/:id", requireAuth, requireFeature("tasks"), async (req, res) => {
    try {
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      const { id } = req.params;
      
      // Get existing task to check work group
      const existingTask = await storage.getTask(id, tenantId);
      if (!existingTask) {
        return res.status(404).json({ message: "Task not found" });
      }

      // PREVENT DELETING COMPLETED OR ARCHIVED TASKS
      if (existingTask.status === 'završeno' || existingTask.status === 'arhiva') {
        return res.status(403).json({ message: "Završeni i arhivirani zadaci ne mogu biti obrisani. Zadatak je zaključan." });
      }

      // Authorization check: Only admins or group moderators can delete tasks
      const isAdmin = req.user!.isAdmin;
      const isModerator = await storage.isUserModeratorOfWorkGroup(existingTask.workGroupId, req.user!.id, tenantId);
      
      if (!isAdmin && !isModerator) {
        return res.status(403).json({ message: "Forbidden: Only admins or group moderators can delete tasks" });
      }

      const deleted = await storage.deleteTask(id, tenantId);
      if (!deleted) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json({ message: "Task deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete task" });
    }
});

  app.patch("/api/tasks/:taskId/move", requireAuth, requireFeature("tasks"), async (req, res) => {
    try {
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      const { taskId } = req.params;
      const { newWorkGroupId } = req.body;

      if (!newWorkGroupId) {
        return res.status(400).json({ message: "New work group ID is required" });
      }

      // Get existing task to check current work group
      const existingTask = await storage.getTask(taskId, tenantId);
      if (!existingTask) {
        return res.status(404).json({ message: "Task not found" });
      }

      // Authorization check: Only admins or moderators of current group can move tasks
      const isAdmin = req.user!.isAdmin;
      const isModerator = await storage.isUserModeratorOfWorkGroup(existingTask.workGroupId, req.user!.id, tenantId);
      
      if (!isAdmin && !isModerator) {
        return res.status(403).json({ message: "Forbidden: Only admins or group moderators can move tasks" });
      }

      // Check if new work group exists
      const newWorkGroup = await storage.getWorkGroup(newWorkGroupId, tenantId);
      if (!newWorkGroup) {
        return res.status(404).json({ message: "New work group not found" });
      }

      // Move the task
      const movedTask = await storage.moveTaskToWorkGroup(taskId, newWorkGroupId, tenantId);
      if (!movedTask) {
        return res.status(500).json({ message: "Failed to move task" });
      }

      res.json(movedTask);
    } catch (error) {
      res.status(500).json({ message: "Failed to move task" });
    }
});

  // Task Comments routes
  app.get("/api/tasks/:taskId/comments", requireFeature("tasks"), async (req, res) => {
    try {
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      const { taskId } = req.params;
      
      // Check if task exists
      const task = await storage.getTask(taskId, tenantId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      const comments = await storage.getTaskComments(taskId, tenantId);
      
      // Get user details for each comment
      const commentsWithUserDetails = await Promise.all(
        comments.map(async (comment) => {
          const user = await storage.getUser(comment.userId, tenantId);
          return {
            ...comment,
            user: user ? { 
              id: user.id, 
              firstName: user.firstName, 
              lastName: user.lastName 
            } : null
          };
        })
      );
      
      res.json(commentsWithUserDetails);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch task comments" });
    }
});

  app.post("/api/tasks/:taskId/comments", requireAuth, requireFeature("tasks"), async (req, res) => {
    try {
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      const { taskId } = req.params;
      const { content, commentImage } = req.body;

      if (!content && !commentImage) {
        return res.status(400).json({ message: "Content or image is required" });
      }

      // Use authenticated user's ID - prevents identity spoofing
      const userId = req.user!.id;
      const user = req.user!;

      // Check if task exists
      const task = await storage.getTask(taskId, tenantId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      // Check if user is a member of the work group this task belongs to (admins can comment on any task)
      if (!user.isAdmin) {
        const isMember = await storage.isUserMemberOfWorkGroup(task.workGroupId, userId, tenantId);
        if (!isMember) {
          return res.status(403).json({ message: "Forbidden: Only work group members can comment on tasks" });
        }
      }

      const commentData = insertTaskCommentSchema.parse({ 
        taskId, 
        userId, 
        content,
        commentImage: commentImage || null,
        tenantId
      });
      const comment = await storage.createTaskComment(commentData);
      
      // Get user details for the response
      const commentWithUser = {
        ...comment,
        user: { 
          id: user.id, 
          firstName: user.firstName, 
          lastName: user.lastName 
        }
      };
      res.json(commentWithUser);
    } catch (error) {
      res.status(400).json({ message: "Invalid comment data" });
    }
});

  app.delete("/api/comments/:id", requireAuth, requireFeature("tasks"), async (req, res) => {
    try {
      const { id } = req.params;

      // Get the comment to check ownership and work group
      const comment = await storage.getTaskComment(id);
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }

      // Get the task to find the work group
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      const task = await storage.getTask(comment.taskId, tenantId);
      if (!task) {
        return res.status(404).json({ message: "Associated task not found" });
      }

      // Check authorization: admin, work group moderator, or comment author
      const isAdmin = req.user!.isAdmin;
      const isModerator = await storage.isUserModeratorOfWorkGroup(task.workGroupId, req.user!.id, tenantId);
      const isAuthor = comment.userId === req.user!.id;

      if (!isAdmin && !isModerator && !isAuthor) {
        return res.status(403).json({ message: "Forbidden: Only admins, moderators, or comment authors can delete comments" });
      }

      const deleted = await storage.deleteTaskComment(id);
      if (!deleted) {
        return res.status(404).json({ message: "Comment not found" });
      }
      res.json({ message: "Comment deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete comment" });
    }
});


  // Access Requests routes
  app.get("/api/access-requests", requireAdmin, requireFeature("tasks"), async (req, res) => {
    try {
      const requests = await storage.getAllAccessRequests(req.user!.tenantId);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch access requests" });
    }
});

  app.get("/api/access-requests/my", requireAuth, requireFeature("tasks"), async (req, res) => {
    try {
      const requests = await storage.getUserAccessRequests(req.user!.id);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user access requests" });
    }
});

  app.post("/api/access-requests", requireAuth, requireFeature("tasks"), async (req, res) => {
    try {
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      const requestData = insertAccessRequestSchema.parse({
        ...req.body,
        tenantId
      });
      const request = await storage.createAccessRequest(requestData);
      res.json(request);
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
});

  app.put("/api/access-requests/:id", requireAdmin, requireFeature("tasks"), async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const request = await storage.updateAccessRequest(id, status);
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }
      
      // If approved, add the user as a member to the work group
      if (status === 'approved') {
        await storage.addMemberToWorkGroup(request.workGroupId, request.userId);
      }
      
      res.json(request);
    } catch (error) {
      res.status(400).json({ message: "Invalid request status" });
    }
});

  // Activities routes
  app.get("/api/activities", async (req, res) => {
    try {
      const activities = await storage.getRecentActivities();
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activities" });
    }
});

  // Statistics routes
  app.get("/api/statistics", async (req, res) => {
    try {
      const session = req.session as any;
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      
      // If Super Admin, return zero statistics
      if (session.isSuperAdmin) {
        return res.json({
          userCount: 0,
          newAnnouncementsCount: 0,
          upcomingEventsCount: 0,
          activeTasksCount: 0
});
      }
      
      const [userCount, newAnnouncementsCount, upcomingEventsCount, activeTasksCount] = await Promise.all([
        storage.getUserCount(tenantId),
        storage.getNewAnnouncementsCount(tenantId, 7),
        storage.getUpcomingEventsCount(tenantId),
        storage.getActiveTasksCount(tenantId)
      ]);

      res.json({
        userCount,
        newAnnouncementsCount,
        upcomingEventsCount,
        activeTasksCount
});
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
});

  // Family Relationships routes
  app.get("/api/family-relationships/:userId", requireAuth, async (req, res) => {
    try {
      const { userId } = req.params;
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      const relationships = await storage.getUserFamilyRelationships(userId, tenantId);
      
      // Get user details for each relationship
      const relationshipsWithUsers = await Promise.all(
        relationships.map(async (rel) => {
          const relatedUser = await storage.getUser(
            rel.userId === userId ? rel.relatedUserId : rel.userId,
            tenantId
          );
          return {
            ...rel,
            relatedUser: relatedUser ? {
              id: relatedUser.id,
              firstName: relatedUser.firstName,
              lastName: relatedUser.lastName,
              photo: relatedUser.photo,
              email: relatedUser.email,
              phone: relatedUser.phone
            } : null
          };
        })
      );
      
      // Prevent client caching - force server to return fresh data
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
      res.json(relationshipsWithUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch family relationships" });
    }
});

  app.post("/api/family-relationships", requireAuth, async (req, res) => {
    try {
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      const relationshipData = insertFamilyRelationshipSchema.parse({
        ...req.body,
        tenantId
      });
      const relationship = await storage.createFamilyRelationship(relationshipData);
      res.json(relationship);
    } catch (error) {
      res.status(400).json({ message: "Invalid family relationship data" });
    }
});

  app.delete("/api/family-relationships/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      const deleted = await storage.deleteFamilyRelationship(id, tenantId);
      if (!deleted) {
        return res.status(404).json({ message: "Family relationship not found" });
      }
      res.json({ message: "Family relationship deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete family relationship" });
    }
});

  app.get("/api/family-relationships/by-type/:userId/:relationship", requireAuth, async (req, res) => {
    try {
      const { userId, relationship } = req.params;
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      const relationships = await storage.getFamilyMembersByRelationship(userId, relationship, tenantId);
      res.json(relationships);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch family members by relationship" });
    }
});

  // Messages routes
  app.get("/api/messages/conversations", requireAuth, requireFeature("messages"), async (req, res) => {
    try {
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const conversations = await storage.getConversations(req.user.id, tenantId);
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
});

  app.get("/api/messages", requireAuth, requireFeature("messages"), async (req, res) => {
    try {
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const messages = await storage.getMessages(req.user.id, tenantId);
      
      const messagesWithSenderInfo = await Promise.all(
        messages.map(async (msg) => {
          const sender = await storage.getUser(msg.senderId, tenantId);
          const recipient = msg.recipientId ? await storage.getUser(msg.recipientId, tenantId) : null;
          
          return {
            ...msg,
            sender: sender ? {
              id: sender.id,
              firstName: sender.firstName,
              lastName: sender.lastName
            } : null,
            recipient: recipient ? {
              id: recipient.id,
              firstName: recipient.firstName,
              lastName: recipient.lastName
            } : null
          };
        })
      );
      
      res.json(messagesWithSenderInfo);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
});

  app.get("/api/messages/unread-count", requireAuth, requireFeature("messages"), async (req, res) => {
    try {
      const session = req.session as any;
      const tenantId = session.tenantId || req.user?.tenantId || req.tenantId || "default-tenant-demo";
      
      console.log('[MESSAGES/UNREAD-COUNT] Debug:', {
        userId: req.user.id,
        sessionTenantId: session.tenantId,
        userTenantId: req.user?.tenantId,
        reqTenantId: req.tenantId,
        resolvedTenantId: tenantId
      });
      
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const count = await storage.getUnreadCount(req.user.id, tenantId);
      res.json({ count });
    } catch (error) {
      console.error('❌ [MESSAGES/UNREAD-COUNT] Error:', error);
      console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A');
      res.status(500).json({ 
        message: "Failed to fetch unread count", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
});

  app.get("/api/messages/thread/:threadId", requireAuth, requireFeature("messages"), async (req, res) => {
    try {
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { threadId } = req.params;
      const thread = await storage.getMessageThread(threadId, req.user.id, tenantId);
      
      const threadWithUserInfo = await Promise.all(
        thread.map(async (msg) => {
          const sender = await storage.getUser(msg.senderId, tenantId);
          const recipient = msg.recipientId ? await storage.getUser(msg.recipientId, tenantId) : null;
          
          return {
            ...msg,
            sender: sender ? {
              id: sender.id,
              firstName: sender.firstName,
              lastName: sender.lastName
            } : null,
            recipient: recipient ? {
              id: recipient.id,
              firstName: recipient.firstName,
              lastName: recipient.lastName
            } : null
        };
        })
      );
      
      res.json(threadWithUserInfo);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch message thread" });
    }
});

  app.post("/api/messages", requireAuth, requireFeature("messages"), async (req, res) => {
    try {
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const messageData = insertMessageSchema.parse({
        ...req.body,
        senderId: req.user.id,
        tenantId
      });

      if (messageData.recipientId === req.user.id) {
        return res.status(400).json({ message: "Cannot send message to yourself" });
      }

      if (messageData.category && !messageData.recipientId) {
        const hasPermission = req.user.isAdmin || req.user.roles?.includes('clan_io');
        if (!hasPermission) {
          return res.status(403).json({ message: "Only admins and IO members can send category messages" });
        }
      }

      if (!messageData.recipientId && !messageData.category) {
        return res.status(400).json({ message: "Must specify either recipient or category" });
      }

      const message = await storage.createMessage(messageData);
      res.json(message);
    } catch (error) {
      res.status(400).json({ message: "Invalid message data" });
    }
});

  app.put("/api/messages/:id/read", requireAuth, requireFeature("messages"), async (req, res) => {
    try {
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { id } = req.params;
      const message = await storage.markAsRead(id, req.user.id, tenantId);
      
      if (!message) {
        return res.status(404).json({ message: "Message not found or you don't have permission" });
      }

      res.json(message);
    } catch (error) {
      res.status(500).json({ message: "Failed to mark message as read" });
    }
});

  app.put("/api/messages/thread/:threadId/read", requireAuth, requireFeature("messages"), async (req, res) => {
    try {
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { threadId } = req.params;
      await storage.markThreadAsRead(threadId, req.user.id, tenantId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to mark thread as read" });
    }
});

  app.delete("/api/messages/:id", requireAuth, requireFeature("messages"), async (req, res) => {
    try {
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { id } = req.params;
      const deleted = await storage.deleteMessage(id, tenantId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Message not found" });
      }

      res.json({ message: "Message deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete message" });
    }
});

  // Imam Questions routes
  app.get("/api/imam-questions", requireAuth, requireFeature("ask-imam"), async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const userId = req.user.isAdmin ? undefined : req.user.id;
      const questions = await storage.getImamQuestions(userId);
      
      const questionsWithUserInfo = await Promise.all(
        questions.map(async (q) => {
          const user = await storage.getUser(q.userId, req.user!.tenantId);
          return {
            ...q,
            user: user ? {
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName
            } : null
          };
        })
      );
      
      res.json(questionsWithUserInfo);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch imam questions" });
    }
});

  app.post("/api/imam-questions", requireAuth, requireFeature("ask-imam"), async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const questionData = {
        userId: req.user.id,
        subject: req.body.subject,
        question: req.body.question,
        tenantId: req.user!.tenantId
      };
      const question = await storage.createImamQuestion(questionData);
      res.status(201).json(question);
    } catch (error) {
      res.status(500).json({ message: "Failed to create imam question" });
    }
});

  app.put("/api/imam-questions/:id/answer", requireAuth, requireFeature("ask-imam"), async (req, res) => {
    try {
      if (!req.user?.isAdmin) {
        return res.status(403).json({ message: "Only admins can answer questions" });
      }

      const { id } = req.params;
      const { answer } = req.body;

      if (!answer) {
        return res.status(400).json({ message: "Answer is required" });
      }

      const question = await storage.answerImamQuestion(id, answer);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }

      res.json(question);
    } catch (error) {
      res.status(500).json({ message: "Failed to answer question" });
    }
});

  app.put("/api/imam-questions/:id/read", requireAuth, requireFeature("ask-imam"), async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { id } = req.params;
      const question = await storage.markQuestionAsRead(id);
      
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }

      res.json(question);
    } catch (error) {
      res.status(500).json({ message: "Failed to mark question as read" });
    }
});

  app.delete("/api/imam-questions/:id", requireAuth, requireFeature("ask-imam"), async (req, res) => {
    try {
      if (!req.user?.isAdmin) {
        return res.status(403).json({ message: "Only admins can delete questions" });
      }

      const { id } = req.params;
      const deleted = await storage.deleteImamQuestion(id);

      if (!deleted) {
        return res.status(404).json({ message: "Question not found" });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete question" });
    }
});

  // Organization Settings routes
  app.get("/api/organization-settings", async (req, res) => {
    try {
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      console.log('[ORG-SETTINGS] Getting settings for tenant:', tenantId);
      const settings = await storage.getOrganizationSettings(tenantId);
      console.log('[ORG-SETTINGS] ✅ Success:', settings?.id);
      res.json(settings);
    } catch (error) {
      console.error('[ORG-SETTINGS] ❌ Error:', error);
      res.status(500).json({ message: "Failed to get organization settings" });
    }
  });

  app.put("/api/organization-settings", requireAdmin, async (req, res) => {
    try {
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      const settingsData = insertOrganizationSettingsSchema.parse(req.body);
      const updatedSettings = await storage.updateOrganizationSettings(tenantId, settingsData);
      res.json(updatedSettings);
    } catch (error) {
      res.status(400).json({ message: "Invalid organization settings data" });
    }
});

  // Documents routes
  app.get("/api/documents", requireAuth, requireFeature("documents"), async (req, res) => {
    try {
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      const documents = await storage.getAllDocuments(tenantId);
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Failed to get documents" });
    }
});

  app.post("/api/documents", requireAdmin, requireFeature("documents"), async (req, res) => {
    try {
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      const documentData = insertDocumentSchema.parse({
        ...req.body,
        uploadedById: req.user!.id,
        fileName: req.body.fileName || 'document',
        filePath: req.body.filePath || `/uploads/documents/${req.body.fileName || 'document'}`,
        fileSize: req.body.fileSize || 0,
        tenantId
      });
      const document = await storage.createDocument(documentData);
      res.status(201).json(document);
    } catch (error) {
      res.status(400).json({ message: "Invalid document data" });
    }
});

  app.delete("/api/documents/:id", requireAdmin, requireFeature("documents"), async (req, res) => {
    try {
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      const deleted = await storage.deleteDocument(req.params.id, tenantId);
      if (!deleted) {
        return res.status(404).json({ message: "Document not found" });
      }
      res.json({ message: "Document deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete document" });
    }
});

  // Requests routes
  app.get("/api/requests", requireAdmin, async (req, res) => {
    try {
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      const requests = await storage.getAllRequests(tenantId);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Failed to get requests" });
    }
});

  app.get("/api/requests/my", requireAuth, async (req, res) => {
    try {
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      const userId = req.session.userId!;
      const requests = await storage.getUserRequests(userId, tenantId);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user requests" });
    }
});

  app.post("/api/requests", requireAuth, async (req, res) => {
    try {
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      const userId = req.session.userId!;
      const requestData = insertRequestSchema.parse({
        ...req.body,
        userId,
        tenantId
      });
      const request = await storage.createRequest(requestData);
      res.status(201).json(request);
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
});

  app.put("/api/requests/:id/status", requireAdmin, async (req, res) => {
    try {
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      const { status, adminNotes } = req.body;
      const reviewedById = req.session.userId!;
      const request = await storage.updateRequestStatus(
        req.params.id,
        tenantId,
        status,
        reviewedById,
        adminNotes
      );
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }
      res.json(request);
    } catch (error) {
      res.status(500).json({ message: "Failed to update request status" });
    }
});

  // Shop Products routes
  app.get("/api/shop/products", requireAuth, requireFeature("shop"), async (req, res) => {
    try {
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      const products = await storage.getAllShopProducts(tenantId);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to get products" });
    }
});

  app.post("/api/shop/products", requireAdmin, async (req, res) => {
    try {
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      const createdById = req.session.userId!;
      const productData = insertShopProductSchema.parse({
        ...req.body,
        createdById,
        tenantId
      });
      const product = await storage.createShopProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      res.status(400).json({ message: "Invalid product data" });
    }
});

  app.put("/api/shop/products/:id", requireAdmin, async (req, res) => {
    try {
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      const product = await storage.updateShopProduct(req.params.id, tenantId, req.body);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to update product" });
    }
});

  app.delete("/api/shop/products/:id", requireAdmin, async (req, res) => {
    try {
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      const deleted = await storage.deleteShopProduct(req.params.id, tenantId);
      if (!deleted) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete product" });
    }
});

  // Marketplace Items routes
  app.get("/api/marketplace/items", requireAuth, requireFeature("marketplace"), async (req, res) => {
    try {
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      const items = await storage.getAllMarketplaceItems(tenantId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to get marketplace items" });
    }
});

  app.post("/api/marketplace/items", requireAuth, requireFeature("marketplace"), async (req, res) => {
    try {
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      const userId = req.session.userId!;
      const parsedData = insertMarketplaceItemSchema.parse(req.body);
      const itemData = {
        ...parsedData,
        tenantId,
        userId
      };
      const item = await storage.createMarketplaceItem(itemData);
      res.status(201).json(item);
    } catch (error: any) {
      console.error("[MARKETPLACE POST ERROR]", error.errors || error.message || error);
      res.status(400).json({ message: "Invalid item data", details: error.errors || error.message });
    }
  });

  app.put("/api/marketplace/items/:id", requireAuth, requireFeature("marketplace"), async (req, res) => {
    try {
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      const item = await storage.getMarketplaceItem(req.params.id, tenantId);
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      // Allow update only by owner or admin
      const user = await storage.getUser(req.session.userId!, tenantId);
      const isAdmin = user?.isAdmin || false;
      if (item.userId !== req.session.userId && !isAdmin) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const updatedItem = await storage.updateMarketplaceItem(req.params.id, tenantId, req.body);
      if (!updatedItem) {
        return res.status(404).json({ message: "Item not found" });
      }
      res.json(updatedItem);
    } catch (error) {
      res.status(500).json({ message: "Failed to update item" });
    }
});

  app.delete("/api/marketplace/items/:id", requireAuth, requireFeature("marketplace"), async (req, res) => {
    try {
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      const item = await storage.getMarketplaceItem(req.params.id, tenantId);
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      // Allow deletion only by owner or admin
      const user = await storage.getUser(req.session.userId!, tenantId);
      const isAdmin = user?.isAdmin || false;
      if (item.userId !== req.session.userId && !isAdmin) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const deleted = await storage.deleteMarketplaceItem(req.params.id, tenantId);
      if (!deleted) {
        return res.status(404).json({ message: "Item not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete item" });
    }
});

  // Services (Usluge) routes
  app.get("/api/services", requireAuth, async (req, res) => {
    try {
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      const services = await storage.getAllServicesWithUsers(tenantId);
      res.json(services);
    } catch (error) {
      res.status(500).json({ message: "Failed to get services" });
    }
});

  app.post("/api/services", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      const parsedData = insertServiceSchema.parse(req.body);
      const serviceData = {
        ...parsedData,
        userId,
        tenantId
      };
      const service = await storage.createService(serviceData);
      res.status(201).json(service);
    } catch (error: any) {
      console.error("[SERVICE POST ERROR]", error.errors || error.message || error);
      res.status(400).json({ message: "Invalid service data", details: error.errors || error.message });
    }
});

  app.put("/api/services/:id", requireAuth, async (req, res) => {
    try {
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      const service = await storage.getService(req.params.id, tenantId);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      
      // Allow edit only by owner or admin
      const user = await storage.getUser(req.session.userId!, tenantId);
      const isAdmin = user?.isAdmin || false;
      if (service.userId !== req.session.userId && !isAdmin) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const updated = await storage.updateService(req.params.id, tenantId, req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update service" });
    }
});

  app.delete("/api/services/:id", requireAuth, async (req, res) => {
    try {
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      const service = await storage.getService(req.params.id, tenantId);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      
      // Allow deletion only by owner or admin
      const user = await storage.getUser(req.session.userId!, tenantId);
      const isAdmin = user?.isAdmin || false;
      if (service.userId !== req.session.userId && !isAdmin) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const deleted = await storage.deleteService(req.params.id, tenantId);
      if (!deleted) {
        return res.status(404).json({ message: "Service not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete service" });
    }
});

  // Purchase Requests routes
  app.get("/api/shop/purchase-requests", requireAdmin, async (req, res) => {
    try {
      const requests = await storage.getAllProductPurchaseRequests();
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Failed to get purchase requests" });
    }
});

  app.post("/api/shop/purchase-requests", requireAuth, async (req, res) => {
    try {
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      const userId = req.session.userId!;
      const requestData = insertProductPurchaseRequestSchema.parse({
        ...req.body,
        userId,
        tenantId
      });
      const request = await storage.createProductPurchaseRequest(requestData);
      res.status(201).json(request);
    } catch (error) {
      res.status(400).json({ message: "Invalid purchase request data" });
    }
});

  app.put("/api/shop/purchase-requests/:id/status", requireAdmin, async (req, res) => {
    try {
      const { status } = req.body;
      const request = await storage.updateProductPurchaseRequest(req.params.id, status);
      if (!request) {
        return res.status(404).json({ message: "Purchase request not found" });
      }
      res.json(request);
    } catch (error) {
      res.status(500).json({ message: "Failed to update purchase request" });
    }
});

  // Notifications routes
  app.get("/api/notifications/unread", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const counts = await storage.getAllNewItemsCounts(userId);
      res.json(counts);
    } catch (error) {
      console.error("Error in /api/notifications/unread:", error);
      res.status(500).json({ message: "Failed to fetch notification counts" });
    }
});

  app.put("/api/notifications/mark-viewed/:type", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { type } = req.params;
      
      if (!['shop', 'events', 'announcements', 'imamQuestions', 'tasks'].includes(type)) {
        return res.status(400).json({ message: "Invalid notification type" });
      }
      
      const user = await storage.updateLastViewed(userId, req.user!.tenantId, type as any);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to update last viewed timestamp" });
    }
});

  // Prayer Times routes
  app.get("/api/prayer-times", async (req, res) => {
    try {
      const prayerTimes = await storage.getAllPrayerTimes(req.user!.tenantId);
      res.json(prayerTimes);
    } catch (error) {
      res.status(500).json({ message: "Failed to get prayer times" });
    }
});

  app.get("/api/prayer-times/today", async (req, res) => {
    try {
      const session = req.session as any;
      
      // If Super Admin (no tenantId), return null
      if (session.isSuperAdmin && !session.tenantId) {
        return res.status(404).json({ message: "Prayer times not available for Super Admin" });
      }
      
      const tenantId = req.user?.tenantId || session.tenantId || "default-tenant-demo";
      
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      const todayDate = `${day}.${month}.${year}`;
      
      const prayerTime = await storage.getPrayerTimeByDate(todayDate, tenantId);
      if (!prayerTime) {
        return res.status(404).json({ message: "Prayer times not found for today" });
      }
      res.json(prayerTime);
    } catch (error) {
      res.status(500).json({ message: "Failed to get today's prayer times" });
    }
});

  app.get("/api/prayer-times/export", requireAdmin, async (req, res) => {
    try {
      const prayerTimes = await storage.getAllPrayerTimes(req.user!.tenantId);
      console.log(`[EXPORT] Found ${prayerTimes.length} prayer times to export`);
      
      if (prayerTimes.length === 0) {
        return res.status(404).json({ message: "No prayer times to export" });
      }

      const csvRows = [];
      csvRows.push('Datum;Sabah;Izlazak sunca;Podne;Ikindija;Akšam;Jacija');
      
      prayerTimes.forEach(pt => {
        csvRows.push([
          pt.date,
          pt.fajr,
          pt.sunrise || '',
          pt.dhuhr,
          pt.asr,
          pt.maghrib,
          pt.isha
        ].join(';'));
});

      const csvContent = csvRows.join('\n');
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename=vaktija.csv');
      res.send(csvContent);
    } catch (error) {
      console.error('CSV export error:', error);
      res.status(500).json({ message: "Failed to export CSV" });
    }
});

  app.get("/api/prayer-times/:date", async (req, res) => {
    try {
      const prayerTime = await storage.getPrayerTimeByDate(req.params.date);
      if (!prayerTime) {
        return res.status(404).json({ message: "Prayer times not found for this date" });
      }
      res.json(prayerTime);
    } catch (error) {
      res.status(500).json({ message: "Failed to get prayer times" });
    }
});

  app.post("/api/prayer-times/upload", requireAdmin, csvUpload.single('csv'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No CSV file uploaded" });
      }

      // Parse CSV file (SwissMosque format with semicolon delimiter)
      let csvData = req.file.buffer.toString('utf-8');
      
      // Remove BOM if present
      if (csvData.charCodeAt(0) === 0xFEFF) {
        csvData = csvData.slice(1);
      }
      
      const lines = csvData.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        return res.status(400).json({ message: "CSV file is empty or invalid" });
      }

      console.log(`Processing ${lines.length} lines from CSV`);
      
      // Skip header line
      const dataLines = lines.slice(1);
      const prayerTimes = [];

      for (let i = 0; i < dataLines.length; i++) {
        const line = dataLines[i];
        // Use semicolon as delimiter
        const parts = line.split(';').map(p => p.trim());
        
        // Log first line for debugging
        if (i === 0) {
          console.log(`First data line has ${parts.length} parts:`, parts);
        }
        
        // Support two formats:
        // 1. Export format (7 columns): Datum;Sabah;Izlazak sunca;Podne;Ikindija;Akšam;Jacija
        // 2. SwissMosque format (10 columns): Datum;Hijri;Tag;Fajr-Beginn;Sonnenaufgang;Dhuhr;Asr;Maghrib;Isha;Wichtige Ereignisse
        
        if (parts.length === 7) {
          // Export format: Datum;Sabah;Izlazak sunca;Podne;Ikindija;Akšam;Jacija
          const [date, fajr, sunrise, dhuhr, asr, maghrib, isha] = parts;
          
          if (date && date.match(/\d{2}\.\d{2}\.\d{4}/) && fajr && dhuhr && asr && maghrib && isha) {
            prayerTimes.push({
              date,
              fajr,
              sunrise: sunrise || null,
              dhuhr,
              asr,
              maghrib,
              isha,
              hijriDate: null,
              events: null
});
          } else if (i === 0) {
            console.log('Export format validation failed:', { date, fajr, dhuhr, asr, maghrib, isha });
          }
        } else if (parts.length >= 9) {
          // SwissMosque format: Datum;Hijri;Tag;Fajr-Beginn;Sonnenaufgang;Dhuhr;Asr;Maghrib;Isha;Wichtige Ereignisse
          const [date, hijri, day, fajr, sunrise, dhuhr, asr, maghrib, isha, events] = parts;
          
          if (date && date.match(/\d{2}\.\d{2}\.\d{4}/) && fajr && dhuhr && asr && maghrib && isha) {
            prayerTimes.push({
              date,
              fajr,
              sunrise: sunrise || null,
              dhuhr,
              asr,
              maghrib,
              isha,
              hijriDate: hijri || null,
              events: events || null
});
          } else if (i === 0) {
            console.log('SwissMosque format validation failed:', { date, fajr, dhuhr, asr, maghrib, isha });
          }
        } else if (i === 0) {
          console.log(`First line has ${parts.length} parts, expected 7 (export format) or 9+ (SwissMosque format)`);
        }
      }

      console.log(`Parsed ${prayerTimes.length} valid prayer time entries`);

      if (prayerTimes.length === 0) {
        return res.status(400).json({ 
          message: "No valid prayer times found in CSV", 
          details: `Processed ${lines.length} total lines, ${dataLines.length} data lines` 
});
      }

      // Bulk create prayer times
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      const created = await storage.bulkCreatePrayerTimes(prayerTimes.map(pt => ({ ...pt, tenantId })));
      
      res.json({ 
        message: `Successfully imported ${created.length} prayer times`,
        count: created.length 
});
    } catch (error) {
      console.error('CSV upload error:', error);
      res.status(500).json({ message: "Failed to upload and parse CSV" });
    }
});

  app.delete("/api/prayer-times", requireAdmin, async (req, res) => {
    try {
      await storage.deleteAllPrayerTimes();
      res.json({ message: "All prayer times deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete prayer times" });
    }
});

  // Important Dates Routes
  app.get("/api/important-dates", requireAuth, async (req, res) => {
    try {
      const dates = await storage.getAllImportantDates(req.user!.tenantId);
      res.json(dates);
    } catch (error) {
      res.status(500).json({ message: "Failed to get important dates" });
    }
});

  app.post("/api/important-dates", requireAdmin, async (req, res) => {
    try {
      const date = await storage.createImportantDate({...req.body, tenantId: req.user!.tenantId});
      res.status(201).json(date);
    } catch (error) {
      res.status(500).json({ message: "Failed to create important date" });
    }
});

  app.put("/api/important-dates/:id", requireAdmin, async (req, res) => {
    try {
      const date = await storage.updateImportantDate(req.params.id, req.user!.tenantId, req.body);
      if (!date) {
        return res.status(404).json({ message: "Important date not found" });
      }
      res.json(date);
    } catch (error) {
      res.status(500).json({ message: "Failed to update important date" });
    }
});

  app.delete("/api/important-dates/:id", requireAdmin, async (req, res) => {
    try {
      const success = await storage.deleteImportantDate(req.params.id, req.user!.tenantId);
      if (!success) {
        return res.status(404).json({ message: "Important date not found" });
      }
      res.json({ message: "Important date deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete important date" });
    }
});

  // Contribution Purposes Routes
  app.get("/api/contribution-purposes", requireAdmin, requireFeature("finances"), async (req, res) => {
    try {
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      const purposes = await storage.getContributionPurposes(tenantId);
      res.json(purposes);
    } catch (error) {
      console.error("Error fetching contribution purposes:", error);
      res.status(500).json({ message: "Failed to get contribution purposes" });
    }
  });

  app.post("/api/contribution-purposes", requireAdmin, requireFeature("finances"), async (req, res) => {
    try {
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      const validated = insertContributionPurposeSchema.parse(req.body);
      const purpose = await storage.createContributionPurpose({
        ...validated,
        createdById: req.user!.id,
        tenantId
      });
      res.status(201).json(purpose);
    } catch (error: any) {
      console.error('❌ [CREATE CONTRIBUTION PURPOSE] Error:', error);
      console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A');
      console.error('Request body:', req.body);
      const errorMsg = error?.errors?.[0]?.message || error?.message || String(error);
      res.status(500).json({ message: "Failed to create contribution purpose", error: errorMsg });
    }
  });

  app.delete("/api/contribution-purposes/:id", requireAdmin, requireFeature("finances"), async (req, res) => {
    try {
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      const success = await storage.deleteContributionPurpose(req.params.id, tenantId);
      if (!success) {
        return res.status(404).json({ message: "Contribution purpose not found" });
      }
      res.json({ message: "Contribution purpose deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete contribution purpose" });
    }
  });

  // Financial Contributions Routes (Feature 1)
  app.get("/api/financial-contributions", requireAdmin, requireFeature("finances"), async (req, res) => {
    try {
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      const contributions = await storage.getAllFinancialContributions(tenantId);
      res.json(contributions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get financial contributions" });
    }
});

  app.get("/api/financial-contributions/user/:userId", requireAuth, requireFeature("finances"), async (req, res) => {
    try {
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      // Only admins or the user themselves can view contributions
      if (req.user?.id !== req.params.userId && !req.user?.isAdmin) {
        return res.status(403).json({ message: "Access denied" });
      }
      const contributions = await storage.getUserFinancialContributions(req.params.userId, tenantId);
      res.json(contributions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user contributions" });
    }
});

  app.post("/api/financial-contributions", requireAdmin, requireFeature("finances"), async (req, res) => {
    try {
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      const validated = insertFinancialContributionSchema.parse(req.body);
      const contribution = await storage.createFinancialContribution({
        ...validated,
        createdById: req.user!.id,
        tenantId
});

      // If contribution is for a project, update project's currentAmount
      if (validated.projectId) {
        const project = await storage.getProject(validated.projectId, tenantId);
        if (project) {
          const currentAmount = parseFloat(project.currentAmount || '0');
          const contributionAmount = parseFloat(validated.amount);
          const newAmount = (currentAmount + contributionAmount).toFixed(2);
          
          await storage.updateProject(validated.projectId, tenantId, {
            currentAmount: newAmount
          });
        }
      }

      // Log activity with 1:1 ratio (1 CHF = 1 point)
      const points = Math.floor(parseFloat(validated.amount));
      
      await storage.createActivityLog({
        userId: validated.userId,
        activityType: 'contribution_made',
        description: `Uplata: ${validated.amount} CHF (${validated.purpose})`,
        points,
        relatedEntityId: contribution.id,
        tenantId
      });

      // If contribution is for a project, create additional activity log
      if (validated.projectId) {
        const project = await storage.getProject(validated.projectId, tenantId);
        if (project) {
          await storage.createActivityLog({
            userId: validated.userId,
            activityType: 'project_contribution',
            description: `Doprinos projektu: ${project.name} (${validated.amount} CHF)`,
            points: 0,
            relatedEntityId: contribution.id,
            tenantId
          });
        }
      }

      // Recalculate user's total points
      await storage.recalculateUserPoints(validated.userId, tenantId);

      res.status(201).json(contribution);
    } catch (error) {
      console.error('Error creating financial contribution:', error);
      res.status(500).json({ message: "Failed to create financial contribution" });
    }
});

  app.put("/api/financial-contributions/:id", requireAdmin, requireFeature("finances"), async (req, res) => {
    try {
      const validated = insertFinancialContributionSchema.partial().parse(req.body);
      
      // Get existing contribution to handle project updates
      const existingContribution = await storage.getFinancialContribution(req.params.id, req.user!.tenantId);
      if (!existingContribution) {
        return res.status(404).json({ message: "Contribution not found" });
      }

      const userId = existingContribution.userId;
      const oldProjectId = existingContribution.projectId;

      // Delete old activity log entries for this contribution
      // Note: Both contribution_made and project_contribution logs use contributionId as relatedEntityId
      await storage.deleteActivityLogByRelatedEntity(req.params.id, req.user!.tenantId);

      const contribution = await storage.updateFinancialContribution(req.params.id, req.user!.tenantId, validated);
      if (!contribution) {
        return res.status(404).json({ message: "Contribution not found" });
      }

      // Handle project currentAmount updates
      const newProjectId = validated.projectId !== undefined ? validated.projectId : oldProjectId;
      const oldAmount = parseFloat(existingContribution.amount);
      const newAmount = validated.amount ? parseFloat(validated.amount) : oldAmount;

      // If project changed or amount changed, update project(s)
      if (oldProjectId !== newProjectId) {
        // Remove from old project
        if (oldProjectId) {
          const oldProject = await storage.getProject(oldProjectId, req.user!.tenantId);
          if (oldProject) {
            const currentAmount = parseFloat(oldProject.currentAmount || '0');
            const updatedAmount = Math.max(0, currentAmount - oldAmount).toFixed(2);
            await storage.updateProject(oldProjectId, req.user!.tenantId, { currentAmount: updatedAmount });
          }
        }
        // Add to new project
        if (newProjectId) {
          const newProject = await storage.getProject(newProjectId, req.user!.tenantId);
          if (newProject) {
            const currentAmount = parseFloat(newProject.currentAmount || '0');
            const updatedAmount = (currentAmount + newAmount).toFixed(2);
            await storage.updateProject(newProjectId, req.user!.tenantId, { currentAmount: updatedAmount });
          }
        }
      } else if (newProjectId && oldAmount !== newAmount) {
        // Same project, different amount
        const project = await storage.getProject(newProjectId, req.user!.tenantId);
        if (project) {
          const currentAmount = parseFloat(project.currentAmount || '0');
          const updatedAmount = (currentAmount - oldAmount + newAmount).toFixed(2);
          await storage.updateProject(newProjectId, req.user!.tenantId, { currentAmount: updatedAmount });
        }
      }

      // Recreate activity log entry with updated amount
      const pointsFromContribution = Math.floor(newAmount);
      await storage.createActivityLog({
        userId: userId,
        activityType: 'contribution_made',
        description: `Finansijski doprinos: ${newAmount} CHF`,
        points: pointsFromContribution,
        relatedEntityId: req.params.id,
        tenantId: req.user!.tenantId
      });

      // If contribution is for a project, create additional activity log
      if (newProjectId) {
        const project = await storage.getProject(newProjectId, req.user!.tenantId);
        if (project) {
          await storage.createActivityLog({
            userId: userId,
            activityType: 'project_contribution',
            description: `Doprinos projektu: ${project.name} (${newAmount} CHF)`,
            points: 0,
            relatedEntityId: req.params.id,
            tenantId: req.user!.tenantId
          });
        }
      }

      // Recalculate user's total points and re-check badges
      await storage.recalculateUserPoints(userId, req.user!.tenantId);
      await storage.checkAndAwardBadges(userId, req.user!.tenantId);
      await storage.removeUnqualifiedBadges(userId, req.user!.tenantId);

      res.json(contribution);
    } catch (error) {
      res.status(500).json({ message: "Failed to update contribution" });
    }
});

  app.patch("/api/financial-contributions/:id", requireAdmin, requireFeature("finances"), async (req, res) => {
    try {
      const validated = insertFinancialContributionSchema.partial().parse(req.body);
      
      // Get existing contribution to handle project updates
      const existingContribution = await storage.getFinancialContribution(req.params.id, req.user!.tenantId);
      if (!existingContribution) {
        return res.status(404).json({ message: "Contribution not found" });
      }

      const contribution = await storage.updateFinancialContribution(req.params.id, req.user!.tenantId, validated);
      if (!contribution) {
        return res.status(404).json({ message: "Contribution not found" });
      }

      // Handle project currentAmount updates
      const oldProjectId = existingContribution.projectId;
      const newProjectId = validated.projectId !== undefined ? validated.projectId : oldProjectId;
      const oldAmount = parseFloat(existingContribution.amount);
      const newAmount = validated.amount ? parseFloat(validated.amount) : oldAmount;

      // If project changed or amount changed, update project(s)
      if (oldProjectId !== newProjectId) {
        // Remove from old project
        if (oldProjectId) {
          const oldProject = await storage.getProject(oldProjectId, req.user!.tenantId);
          if (oldProject) {
            const currentAmount = parseFloat(oldProject.currentAmount || '0');
            const updatedAmount = Math.max(0, currentAmount - oldAmount).toFixed(2);
            await storage.updateProject(oldProjectId, req.user!.tenantId, { currentAmount: updatedAmount });
          }
        }
        // Add to new project
        if (newProjectId) {
          const newProject = await storage.getProject(newProjectId, req.user!.tenantId);
          if (newProject) {
            const currentAmount = parseFloat(newProject.currentAmount || '0');
            const updatedAmount = (currentAmount + newAmount).toFixed(2);
            await storage.updateProject(newProjectId, req.user!.tenantId, { currentAmount: updatedAmount });
          }
        }
      } else if (newProjectId && oldAmount !== newAmount) {
        // Same project, different amount
        const project = await storage.getProject(newProjectId, req.user!.tenantId);
        if (project) {
          const currentAmount = parseFloat(project.currentAmount || '0');
          const updatedAmount = (currentAmount - oldAmount + newAmount).toFixed(2);
          await storage.updateProject(newProjectId, req.user!.tenantId, { currentAmount: updatedAmount });
        }
      }

      res.json(contribution);
    } catch (error) {
      res.status(500).json({ message: "Failed to update contribution" });
    }
});

  app.delete("/api/financial-contributions/:id", requireAdmin, requireFeature("finances"), async (req, res) => {
    try {
      // Delete contribution with all related logs in a transaction
      const { userId, projectId } = await storage.deleteContributionWithLogs(req.params.id, req.user!.tenantId);
      
      // Recalculate points and badges outside transaction
      await storage.recalculateUserPoints(userId, req.user!.tenantId);
      await storage.removeUnqualifiedBadges(userId, req.user!.tenantId);
      
      res.json({ message: "Contribution deleted successfully" });
    } catch (error) {
      if (error instanceof Error && error.message === 'Contribution not found') {
        return res.status(404).json({ message: "Contribution not found" });
      }
      res.status(500).json({ message: "Failed to delete contribution" });
    }
});

  // Activity Log Routes (Feature 1)
  app.get("/api/activity-logs/user/:userId", requireAuth, requireFeature("activity-log"), async (req, res) => {
    try {
      // Only admins or the user themselves can view activity log
      if (req.user?.id !== req.params.userId && !req.user?.isAdmin) {
        return res.status(403).json({ message: "Access denied" });
      }
      const logs = await storage.getUserActivityLog(req.params.userId, req.user!.tenantId);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to get activity log" });
    }
});

  app.get("/api/activity-logs", requireAdmin, requireFeature("activity-log"), async (req, res) => {
    try {
      const logs = await storage.getAllActivityLogs(req.user!.tenantId);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to get activity logs" });
    }
});

  // Event Attendance Routes (Feature 1)
  app.post("/api/event-attendance", requireAdmin, async (req, res) => {
    try {
      const attendances = req.body.attendances; // Array of user IDs who attended
      const eventId = req.body.eventId;
      
      if (!attendances || !Array.isArray(attendances)) {
        return res.status(400).json({ message: "Attendances array required" });
      }

      const created = await storage.bulkCreateEventAttendance(
        attendances.map(userId => ({
          eventId,
          userId,
          attended: true,
          recordedById: req.user!.id,
          tenantId: req.user!.tenantId
        }))
      );
      
      res.status(201).json(created);
    } catch (error) {
      console.error('Error creating event attendance:', error);
      res.status(500).json({ message: "Failed to record event attendance" });
    }
});

  app.get("/api/event-attendance/:eventId", requireAuth, async (req, res) => {
    try {
      const attendance = await storage.getEventAttendance(req.params.eventId, req.user!.tenantId);
      res.json(attendance);
    } catch (error) {
      res.status(500).json({ message: "Failed to get event attendance" });
    }
});

  app.get("/api/event-attendance/user/:userId", requireAuth, async (req, res) => {
    try {
      // Only admins or the user themselves can view attendance
      if (req.user?.id !== req.params.userId && !req.user?.isAdmin) {
        return res.status(403).json({ message: "Access denied" });
      }
      const attendance = await storage.getUserEventAttendance(req.params.userId, req.user!.tenantId);
      res.json(attendance);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user attendance" });
    }
});

  // Points Settings Routes (Feature 2)
  app.get("/api/point-settings", requireAuth, async (req, res) => {
    try {
      const settings = await storage.getPointsSettings(req.user!.tenantId);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to get points settings" });
    }
});

  app.put("/api/point-settings/:id", requireAdmin, async (req, res) => {
    try {
      const validated = insertPointsSettingsSchema.partial().parse(req.body);
      const settings = await storage.updatePointsSettings(req.user!.tenantId, validated);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to update points settings" });
    }
});

  // Badges Routes (Feature 2)
  app.get("/api/badges", requireAuth, requireFeature("badges"), async (req, res) => {
    try {
      const badges = await storage.getAllBadges(req.user!.tenantId);
      res.json(badges);
    } catch (error) {
      res.status(500).json({ message: "Failed to get badges" });
    }
});

  app.post("/api/badges", requireAdmin, requireFeature("badges"), async (req, res) => {
    try {
      const validated = insertBadgeSchema.parse(req.body);
      const badge = await storage.createBadge({...validated, tenantId: req.user!.tenantId});
      res.status(201).json(badge);
    } catch (error) {
      console.error('Error creating badge:', error);
      res.status(500).json({ message: "Failed to create badge" });
    }
});

  app.put("/api/badges/:id", requireAdmin, requireFeature("badges"), async (req, res) => {
    try {
      const validated = insertBadgeSchema.partial().parse(req.body);
      const badge = await storage.updateBadge(req.params.id, req.user!.tenantId, validated);
      if (!badge) {
        return res.status(404).json({ message: "Badge not found" });
      }
      res.json(badge);
    } catch (error) {
      res.status(500).json({ message: "Failed to update badge" });
    }
});

  app.delete("/api/badges/:id", requireAdmin, requireFeature("badges"), async (req, res) => {
    try {
      const success = await storage.deleteBadge(req.params.id, req.user!.tenantId);
      if (!success) {
        return res.status(404).json({ message: "Badge not found" });
      }
      res.json({ message: "Badge deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete badge" });
    }
});

  // User Badges Routes (Feature 2)
  app.get("/api/user-badges/:userId", requireAuth, async (req, res) => {
    try {
      const badges = await storage.getUserBadges(req.params.userId, req.user!.tenantId);
      res.json(badges);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user badges" });
    }
});

  app.post("/api/user-badges/check/:userId", requireAdmin, async (req, res) => {
    try {
      const awarded = await storage.checkAndAwardBadges(req.params.userId, req.user!.tenantId);
      res.json(awarded);
    } catch (error) {
      res.status(500).json({ message: "Failed to check and award badges" });
    }
});

  app.post("/api/user-badges/check-all", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers(req.user!.tenantId);
      
      for (const user of users) {
        // recalculateUserPoints automatically calls checkAndAwardBadges
        await storage.recalculateUserPoints(user.id, req.user!.tenantId);
      }
      
      res.json({ 
        message: `Badges checked and awarded for ${users.length} users`
});
    } catch (error) {
      res.status(500).json({ message: "Failed to check badges for all users" });
    }
});

  app.get("/api/user-badges/all", requireAdmin, async (req, res) => {
    try {
      const allUserBadges = await storage.getAllUserBadges(req.user!.tenantId);
      res.json(allUserBadges);
    } catch (error) {
      res.status(500).json({ message: "Failed to get all user badges" });
    }
});

  // Projects Routes (Feature 4)
  app.get("/api/projects", requireAuthOrSuperAdmin, requireFeature("projects"), async (req, res) => {
    try {
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      const projects = await storage.getAllProjects(tenantId);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Failed to get projects" });
    }
});

  app.get("/api/projects/active", async (req, res) => {
    try {
      const tenantId = req.tenantId || req.user?.tenantId || "default-tenant-demo";
      const projects = await storage.getActiveProjects(tenantId);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Failed to get active projects" });
    }
});

  app.get("/api/projects/:id", requireAuthOrSuperAdmin, async (req, res) => {
    try {
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      const project = await storage.getProject(req.params.id, tenantId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: "Failed to get project" });
    }
});

  app.post("/api/projects", requireAdmin, async (req, res) => {
    try {
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      const validated = insertProjectSchema.parse(req.body);
      const project = await storage.createProject({
        ...validated,
        createdById: req.user!.id,
        tenantId
});
      res.status(201).json(project);
    } catch (error: any) {
      console.error('❌ [CREATE PROJECT] Error:', error);
      console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A');
      console.error('Request body:', req.body);
      const errorMsg = error?.errors?.[0]?.message || error?.message || String(error);
      res.status(500).json({ message: "Failed to create project", error: errorMsg });
    }
});

  app.patch("/api/projects/:id", requireAdmin, async (req, res) => {
    try {
      const validated = insertProjectSchema.partial().parse(req.body);
      const project = await storage.updateProject(req.params.id, req.user!.tenantId, validated);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: "Failed to update project" });
    }
});

  app.delete("/api/projects/:id", requireAdmin, async (req, res) => {
    try {
      const success = await storage.deleteProject(req.params.id, req.user!.tenantId);
      if (!success) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json({ message: "Project deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete project" });
    }
});

  // User Statistics Routes (Feature 2)
  app.get("/api/user-stats/:userId", requireAuth, async (req, res) => {
    try {
      // Only admins or the user themselves can view stats
      if (req.user?.id !== req.params.userId && !req.user?.isAdmin) {
        return res.status(403).json({ message: "Access denied" });
      }

      const userId = req.params.userId;
      const [tasksCompleted, eventsAttended, totalDonations, totalPoints] = await Promise.all([
        storage.getUserTasksCompleted(userId, req.user!.tenantId),
        storage.getUserEventsAttended(userId, req.user!.tenantId),
        storage.getUserTotalDonations(userId, req.user!.tenantId),
        storage.recalculateUserPoints(userId, req.user!.tenantId)
      ]);

      res.json({
        tasksCompleted,
        eventsAttended,
        totalDonations,
        totalPoints
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get user statistics" });
    }
});

  // User Preferences Routes (Feature: Quick Access)
  app.get("/api/user-preferences", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      let preferences = await storage.getUserPreferences(userId, tenantId);
      
      // If no preferences exist, create default ones
      if (!preferences) {
        preferences = await storage.createUserPreferences({
          userId,
          tenantId,
          quickAccessShortcuts: []
        });
      }
      
      res.json(preferences);
    } catch (error) {
      console.error('Error getting user preferences:', error);
      res.status(500).json({ message: "Failed to get user preferences" });
    }
});

  app.put("/api/user-preferences", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      const { quickAccessShortcuts } = req.body;
      
      // Validate that shortcuts is an array
      if (!Array.isArray(quickAccessShortcuts)) {
        return res.status(400).json({ message: "quickAccessShortcuts must be an array" });
      }
      
      // Check if preferences exist
      let preferences = await storage.getUserPreferences(userId, tenantId);
      
      if (!preferences) {
        // Create new preferences
        preferences = await storage.createUserPreferences({
          userId,
          tenantId,
          quickAccessShortcuts
        });
      } else {
        // Update existing preferences
        preferences = await storage.updateUserPreferences(userId, tenantId, {
          quickAccessShortcuts
        });
      }
      
      res.json(preferences);
    } catch (error) {
      console.error('Error updating user preferences:', error);
      res.status(500).json({ message: "Failed to update user preferences" });
    }
});

  // Proposals Routes (Moderator Proposals System)
  app.get("/api/proposals", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      const { status, workGroupId } = req.query;

      let proposals;
      
      if (status) {
        proposals = await storage.getProposalsByStatus(status as string, tenantId);
      } else if (workGroupId) {
        proposals = await storage.getProposalsByWorkGroup(workGroupId as string, tenantId);
      } else {
        proposals = await storage.getAllProposals(tenantId);
      }

      // Filter based on user role
      if (user.isAdmin || user.roles?.includes('clan_io')) {
        // Admins and IO members can see all proposals
        res.json(proposals);
      } else {
        // Regular members can only see proposals from their work groups
        const userWorkGroups = await storage.getUserWorkGroups(user.id, tenantId);
        const userWorkGroupIds = userWorkGroups.map(wg => wg.id);
        const filteredProposals = proposals.filter(p => userWorkGroupIds.includes(p.workGroupId));
        res.json(filteredProposals);
      }
    } catch (error) {
      console.error('Error getting proposals:', error);
      res.status(500).json({ message: "Failed to get proposals" });
    }
});

  app.get("/api/proposals/:id", requireAuth, async (req, res) => {
    try {
      const proposal = await storage.getProposal(req.params.id);
      if (!proposal) {
        return res.status(404).json({ message: "Proposal not found" });
      }
      res.json(proposal);
    } catch (error) {
      console.error('Error getting proposal:', error);
      res.status(500).json({ message: "Failed to get proposal" });
    }
});

  app.post("/api/proposals", requireAuth, async (req, res) => {
    try {
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      const user = req.user!;
      
      // Check if user is a moderator of the work group or an admin
      const workGroupMembers = await storage.getWorkGroupMembers(req.body.workGroupId);
      const userMembership = workGroupMembers.find(m => m.userId === user.id);
      const isModerator = userMembership?.isModerator;
      const isAdmin = user.isAdmin;
      
      if (!isModerator && !isAdmin) {
        return res.status(403).json({ message: "Only moderators and admins can create proposals" });
      }
      
      const validated = insertProposalSchema.parse({
        ...req.body,
        createdById: user.id,
        tenantId
      });
      
      const proposal = await storage.createProposal(validated);
      res.status(201).json(proposal);
    } catch (error) {
      console.error('Error creating proposal:', error);
      res.status(500).json({ message: "Failed to create proposal" });
    }
});

  app.patch("/api/proposals/:id", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const proposal = await storage.getProposal(req.params.id);
      
      if (!proposal) {
        return res.status(404).json({ message: "Proposal not found" });
      }
      
      // Only creator or admin can edit
      if (proposal.createdById !== user.id && !user.isAdmin) {
        return res.status(403).json({ message: "Not authorized to edit this proposal" });
      }
      
      const validated = insertProposalSchema.partial().parse(req.body);
      const updated = await storage.updateProposal(req.params.id, req.user!.tenantId, validated);
      res.json(updated);
    } catch (error) {
      console.error('Error updating proposal:', error);
      res.status(500).json({ message: "Failed to update proposal" });
    }
});

  app.patch("/api/proposals/:id/approve", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      
      // Only IO members and admins can approve
      if (!user.roles?.includes('clan_io') && !user.isAdmin) {
        return res.status(403).json({ message: "Only IO members and admins can approve proposals" });
      }
      
      const { reviewComment } = req.body;
      const updated = await storage.approveProposal(req.params.id, user.id, reviewComment);
      res.json(updated);
    } catch (error) {
      console.error('Error approving proposal:', error);
      res.status(500).json({ message: "Failed to approve proposal" });
    }
});

  app.patch("/api/proposals/:id/reject", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      
      // Only IO members and admins can reject
      if (!user.roles?.includes('clan_io') && !user.isAdmin) {
        return res.status(403).json({ message: "Only IO members and admins can reject proposals" });
      }
      
      const { reviewComment } = req.body;
      if (!reviewComment) {
        return res.status(400).json({ message: "Review comment is required for rejection" });
      }
      
      const updated = await storage.rejectProposal(req.params.id, user.id, reviewComment);
      res.json(updated);
    } catch (error) {
      console.error('Error rejecting proposal:', error);
      res.status(500).json({ message: "Failed to reject proposal" });
    }
});

  // Receipts Routes (Expense Receipts System)
  app.get("/api/receipts", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const { status, taskId, proposalId } = req.query;

      let receipts;
      
      if (status) {
        receipts = await storage.getReceiptsByStatus(status as string);
      } else if (taskId) {
        receipts = await storage.getReceiptsByTask(taskId as string);
      } else if (proposalId) {
        receipts = await storage.getReceiptsByProposal(proposalId as string);
      } else {
        receipts = await storage.getAllReceipts(req.user!.tenantId);
      }

      // Filter based on user role - blagajnik (treasurers) and admins see all
      if (!user.isAdmin && !user.roles?.includes('blagajnik')) {
        // Regular members only see their own receipts
        receipts = receipts.filter(r => r.uploadedById === user.id);
      }

      res.json(receipts);
    } catch (error) {
      console.error('Error getting receipts:', error);
      res.status(500).json({ message: "Failed to get receipts" });
    }
});

  app.get("/api/receipts/:id", requireAuth, async (req, res) => {
    try {
      const receipt = await storage.getReceipt(req.params.id, req.user!.tenantId);
      if (!receipt) {
        return res.status(404).json({ message: "Receipt not found" });
      }
      res.json(receipt);
    } catch (error) {
      console.error('Error getting receipt:', error);
      res.status(500).json({ message: "Failed to get receipt" });
    }
});

  app.post("/api/receipts", requireAuth, upload.single('file'), async (req, res) => {
    try {
      const tenantId = req.user?.tenantId || req.tenantId || "default-tenant-demo";
      const user = req.user!;
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ message: "Receipt file is required" });
      }
      
      const validated = insertReceiptSchema.parse({
        ...req.body,
        uploadedById: user.id,
        fileName: file.filename,
        fileUrl: `/uploads/${file.filename}`,
        tenantId
      });
      
      const receipt = await storage.createReceipt(validated);
      res.status(201).json(receipt);
    } catch (error) {
      console.error('Error uploading receipt:', error);
      res.status(500).json({ message: "Failed to upload receipt" });
    }
});

  app.patch("/api/receipts/:id/approve", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      
      // Only blagajnik and admins can approve receipts
      if (!user.roles?.includes('blagajnik') && !user.isAdmin) {
        return res.status(403).json({ message: "Only treasurers and admins can approve receipts" });
      }
      
      const { reviewComment } = req.body;
      const updated = await storage.approveReceipt(req.params.id, req.user!.tenantId, req.user!.tenantId, user.id, reviewComment);
      res.json(updated);
    } catch (error) {
      console.error('Error approving receipt:', error);
      res.status(500).json({ message: "Failed to approve receipt" });
    }
});

  app.patch("/api/receipts/:id/reject", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      
      // Only blagajnik and admins can reject receipts
      if (!user.roles?.includes('blagajnik') && !user.isAdmin) {
        return res.status(403).json({ message: "Only treasurers and admins can reject receipts" });
      }
      
      const { reviewComment } = req.body;
      if (!reviewComment) {
        return res.status(400).json({ message: "Review comment is required for rejection" });
      }
      
      const updated = await storage.rejectReceipt(req.params.id, req.user!.tenantId, req.user!.tenantId, user.id, reviewComment);
      res.json(updated);
    } catch (error) {
      console.error('Error rejecting receipt:', error);
      res.status(500).json({ message: "Failed to reject receipt" });
    }
});

  // Certificate Templates Routes (Zahvalnice)
  app.get("/api/certificates/templates", requireAdmin, requireFeature("certificates"), async (req, res) => {
    try {
      const templates = await storage.getAllCertificateTemplates(req.user!.tenantId);
      res.json(templates);
    } catch (error) {
      console.error('Error getting certificate templates:', error);
      res.status(500).json({ message: "Failed to get certificate templates" });
    }
});

  app.post("/api/certificates/templates", requireAdmin, requireFeature("certificates"), certificateUpload.single('templateImage'), async (req, res) => {
    try {
      const user = req.user as User;
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ message: "Template image is required" });
      }
      
      const tenantId = user.tenantId;
      const validated = insertCertificateTemplateSchema.parse({
        ...req.body,
        templateImagePath: `/uploads/certificates/${file.filename}`,
        textPositionX: parseInt(req.body.textPositionX),
        textPositionY: parseInt(req.body.textPositionY),
        fontSize: parseInt(req.body.fontSize),
        fontColor: req.body.fontColor || "#000000",
        fontFamily: req.body.fontFamily || "Arial",
        textAlign: req.body.textAlign || "center",
        createdById: user.id
      });
      
      const template = await storage.createCertificateTemplate(validated, tenantId);
      res.status(201).json(template);
    } catch (error) {
      console.error('Error creating certificate template:', error);
      res.status(500).json({ message: "Failed to create certificate template" });
    }
});

  app.put("/api/certificates/templates/:id", requireAdmin, requireFeature("certificates"), async (req, res) => {
    try {
      const updates = {
        ...req.body,
        ...(req.body.textPositionX && { textPositionX: parseInt(req.body.textPositionX) }),
        ...(req.body.textPositionY && { textPositionY: parseInt(req.body.textPositionY) }),
        ...(req.body.fontSize && { fontSize: parseInt(req.body.fontSize) }),
        ...(req.body.fontColor && { fontColor: req.body.fontColor }),
        ...(req.body.fontFamily && { fontFamily: req.body.fontFamily }),
        ...(req.body.textAlign && { textAlign: req.body.textAlign })
      };
      const updated = await storage.updateCertificateTemplate(req.params.id, req.user!.tenantId, updates);
      if (!updated) {
        return res.status(404).json({ message: "Certificate template not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error('Error updating certificate template:', error);
      res.status(500).json({ message: "Failed to update certificate template" });
    }
});

  app.delete("/api/certificates/templates/:id", requireAdmin, requireFeature("certificates"), async (req, res) => {
    try {
      const success = await storage.deleteCertificateTemplate(req.params.id, req.user!.tenantId);
      if (!success) {
        return res.status(404).json({ message: "Certificate template not found" });
      }
      res.json({ message: "Certificate template deleted successfully" });
    } catch (error) {
      console.error('Error deleting certificate template:', error);
      res.status(500).json({ message: "Failed to delete certificate template" });
    }
});

  // User Certificates Routes
  app.get("/api/certificates/user", requireAuth, requireFeature("certificates"), async (req, res) => {
    try {
      const user = req.user!;
      const certificates = await storage.getUserCertificates(user.id, user.tenantId);
      res.json(certificates);
    } catch (error) {
      console.error('Error getting user certificates:', error);
      res.status(500).json({ message: "Failed to get user certificates" });
    }
});

  app.get("/api/certificates/all", requireAdmin, requireFeature("certificates"), async (req, res) => {
    try {
      const certificates = await storage.getAllUserCertificates(req.user!.tenantId);
      res.json(certificates);
    } catch (error) {
      console.error('Error getting all certificates:', error);
      res.status(500).json({ message: "Failed to get all certificates" });
    }
});

  app.get("/api/certificates/unviewed-count", requireAuth, requireFeature("certificates"), async (req, res) => {
    try {
      const user = req.user!;
      const count = await storage.getUnviewedCertificatesCount(user.id, user.tenantId);
      res.json({ count });
    } catch (error) {
      console.error('Error getting unviewed certificates count:', error);
      res.status(500).json({ message: "Failed to get unviewed certificates count" });
    }
});

  app.post("/api/certificates/issue", requireAdmin, requireFeature("certificates"), async (req, res) => {
    try {
      const { templateId, userIds, customMessage } = req.body;
      const tenantId = req.user!.tenantId;
      
      if (!templateId || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ message: "Template ID and user IDs are required" });
      }
      
      const template = await storage.getCertificateTemplate(templateId, tenantId);
      if (!template) {
        return res.status(404).json({ message: "Certificate template not found" });
      }
      
      const issuedCertificates = [];
      
      for (const userId of userIds) {
        const user = await storage.getUser(userId, tenantId);
        if (!user) {
          console.log(`[Certificates] User not found: ${userId}`);
          continue;
        }
        
        const recipientName = `${user.firstName} ${user.lastName}`;
        console.log(`[Certificates] Processing certificate for user ${userId}: ${recipientName}`);
        
        // Generate certificate image
        const certificateBuffer = await generateCertificate({
          templateImagePath: template.templateImagePath,
          recipientName,
          textPositionX: template.textPositionX ?? 400,
          textPositionY: template.textPositionY ?? 300,
          fontSize: template.fontSize ?? 48,
          fontColor: template.fontColor ?? "#000000",
          textAlign: (template.textAlign as 'left' | 'center' | 'right') ?? 'center'
});
        
        // Save certificate image
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = `certificate-${userId}-${uniqueSuffix}.png`;
        const certificateUrl = await saveCertificate(certificateBuffer, filename);
        console.log(`[Certificates] Saved certificate for ${recipientName} to ${certificateUrl}`);
        
        // Create user certificate record
        const certificate = await storage.createUserCertificate({
          userId,
          templateId,
          recipientName,
          certificateImagePath: certificateUrl,
          issuedById: req.user!.id,
          message: customMessage || null,
          tenantId
});
        console.log(`[Certificates] Created DB record for ${recipientName}: certId=${certificate.id}, userId=${userId}, imageUrl=${certificateUrl}`);
        
        issuedCertificates.push(certificate);
      }
      
      res.status(201).json({ 
        message: "Certificates issued successfully",
        count: issuedCertificates.length,
        certificates: issuedCertificates
});
    } catch (error) {
      console.error('Error issuing certificates:', error);
      res.status(500).json({ message: "Failed to issue certificates" });
    }
});

  app.patch("/api/certificates/:id/viewed", requireAuth, requireFeature("certificates"), async (req, res) => {
    try {
      const user = req.user!;
      const certificate = await storage.getUserCertificate(req.params.id, req.user!.tenantId);
      
      if (!certificate) {
        return res.status(404).json({ message: "Certificate not found" });
      }
      
      if (certificate.userId !== user.id && !user.isAdmin) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updated = await storage.markCertificateAsViewed(req.params.id, req.user!.tenantId);
      res.json(updated);
    } catch (error) {
      console.error('Error marking certificate as viewed:', error);
      res.status(500).json({ message: "Failed to mark certificate as viewed" });
    }
});

  app.delete("/api/certificates/:id", requireAdmin, requireFeature("certificates"), async (req, res) => {
    try {
      const success = await storage.deleteCertificate(req.params.id, req.user!.tenantId);
      if (!success) {
        return res.status(404).json({ message: "Certificate not found" });
      }
      res.json({ message: "Certificate deleted successfully" });
    } catch (error) {
      console.error('Error deleting certificate:', error);
      res.status(500).json({ message: "Failed to delete certificate" });
    }
});

  // Membership Applications (Pristupnice)
  app.post("/api/membership-applications", requireFeature("applications"), async (req, res) => {
    try {
      // Use session tenantId if authenticated, otherwise from body (for guest applications)
      let tenantId = req.user?.tenantId || (req.session as any).tenantId;
      
      // For guest applications, validate the tenantId from body exists
      if (!tenantId && req.body.tenantId) {
        const tenant = await storage.getTenant(req.body.tenantId);
        if (!tenant) {
          return res.status(400).json({ message: "Invalid tenant" });
        }
        tenantId = req.body.tenantId;
      }
      
      // Fallback to request context tenant
      if (!tenantId) {
        tenantId = req.tenantId;
      }
      
      if (!tenantId) {
        return res.status(400).json({ message: "Tenant ID is required" });
      }
      
      const validated = insertMembershipApplicationSchema.parse({
        ...req.body,
        tenantId
      });
      const application = await storage.createMembershipApplication(validated);
      res.status(201).json(application);
    } catch (error) {
      console.error('Error creating membership application:', error);
      res.status(500).json({ message: "Failed to create membership application" });
    }
});

  app.get("/api/membership-applications", requireAdmin, requireFeature("applications"), async (req, res) => {
    try {
      const applications = await storage.getAllMembershipApplications(req.user!.tenantId);
      res.json(applications);
    } catch (error) {
      console.error('Error getting membership applications:', error);
      res.status(500).json({ message: "Failed to get membership applications" });
    }
});

  app.get("/api/membership-applications/:id", requireAdmin, requireFeature("applications"), async (req, res) => {
    try {
      const application = await storage.getMembershipApplication(req.params.id, req.user!.tenantId);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      res.json(application);
    } catch (error) {
      console.error('Error getting membership application:', error);
      res.status(500).json({ message: "Failed to get membership application" });
    }
});

  app.patch("/api/membership-applications/:id", requireAdmin, requireFeature("applications"), async (req, res) => {
    try {
      const validated = insertMembershipApplicationSchema.partial().parse(req.body);
      const updated = await storage.updateMembershipApplication(req.params.id, req.user!.tenantId, req.user!.tenantId, validated);
      if (!updated) {
        return res.status(404).json({ message: "Application not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error('Error updating membership application:', error);
      res.status(500).json({ message: "Failed to update membership application" });
    }
});

  app.patch("/api/membership-applications/:id/review", requireAdmin, requireFeature("applications"), async (req, res) => {
    try {
      const { status, reviewNotes } = req.body;
      const updated = await storage.reviewMembershipApplication(
        req.params.id, 
        status, 
        req.user!.id, 
        reviewNotes
      );
      if (!updated) {
        return res.status(404).json({ message: "Application not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error('Error reviewing membership application:', error);
      res.status(500).json({ message: "Failed to review membership application" });
    }
});

  app.delete("/api/membership-applications/:id", requireAdmin, requireFeature("applications"), async (req, res) => {
    try {
      const success = await storage.deleteMembershipApplication(req.params.id, req.user!.tenantId);
      if (!success) {
        return res.status(404).json({ message: "Application not found" });
      }
      res.json({ message: "Application deleted successfully" });
    } catch (error) {
      console.error('Error deleting membership application:', error);
      res.status(500).json({ message: "Failed to delete membership application" });
    }
});

  // Akika Applications (Prijave akike)
  app.post("/api/akika-applications", requireFeature("applications"), async (req, res) => {
    try {
      const validated = insertAkikaApplicationSchema.parse(req.body);
      
      // Use session tenantId if authenticated, otherwise validate from body
      let tenantId = req.user?.tenantId || (req.session as any).tenantId;
      
      // For guest applications, validate the tenantId from body exists
      if (!tenantId && req.body.tenantId) {
        const tenant = await storage.getTenant(req.body.tenantId);
        if (!tenant) {
          return res.status(400).json({ message: "Invalid tenant" });
        }
        tenantId = req.body.tenantId;
      }
      
      // Fallback to request context tenant
      if (!tenantId) {
        tenantId = req.tenantId;
      }
      
      const applicationData = {
        ...validated,
        submittedBy: req.user?.id || null,
        tenantId: tenantId || 'guest'
      };
      const application = await storage.createAkikaApplication(applicationData);
      res.status(201).json(application);
    } catch (error) {
      console.error('Error creating akika application:', error);
      res.status(500).json({ message: "Failed to create akika application" });
    }
});

  app.get("/api/akika-applications/my", requireAuth, requireFeature("applications"), async (req, res) => {
    try {
      const applications = await storage.getUserAkikaApplications(req.user!.id);
      res.json(applications);
    } catch (error) {
      console.error('Error getting user akika applications:', error);
      res.status(500).json({ message: "Failed to get user akika applications" });
    }
});

  app.get("/api/akika-applications", requireAdmin, requireFeature("applications"), async (req, res) => {
    try {
      const applications = await storage.getAllAkikaApplications(req.user!.tenantId);
      res.json(applications);
    } catch (error) {
      console.error('Error getting akika applications:', error);
      res.status(500).json({ message: "Failed to get akika applications" });
    }
});

  app.get("/api/akika-applications/:id", requireAdmin, requireFeature("applications"), async (req, res) => {
    try {
      const application = await storage.getAkikaApplication(req.params.id, req.user!.tenantId);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      res.json(application);
    } catch (error) {
      console.error('Error getting akika application:', error);
      res.status(500).json({ message: "Failed to get akika application" });
    }
});

  app.patch("/api/akika-applications/:id", requireAdmin, requireFeature("applications"), async (req, res) => {
    try {
      const validated = insertAkikaApplicationSchema.partial().parse(req.body);
      const updated = await storage.updateAkikaApplication(req.params.id, req.user!.tenantId, req.user!.tenantId, validated);
      if (!updated) {
        return res.status(404).json({ message: "Application not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error('Error updating akika application:', error);
      res.status(500).json({ message: "Failed to update akika application" });
    }
});

  app.patch("/api/akika-applications/:id/review", requireAdmin, requireFeature("applications"), async (req, res) => {
    try {
      const { status, reviewNotes } = req.body;
      const updated = await storage.reviewAkikaApplication(
        req.params.id, 
        req.user!.tenantId, 
        status, 
        req.user!.id, 
        reviewNotes
      );
      if (!updated) {
        return res.status(404).json({ message: "Application not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error('Error reviewing akika application:', error);
      res.status(500).json({ message: "Failed to review akika application" });
    }
});

  app.delete("/api/akika-applications/:id", requireAdmin, requireFeature("applications"), async (req, res) => {
    try {
      const success = await storage.deleteAkikaApplication(req.params.id, req.user!.tenantId);
      if (!success) {
        return res.status(404).json({ message: "Application not found" });
      }
      res.json({ message: "Application deleted successfully" });
    } catch (error) {
      console.error('Error deleting akika application:', error);
      res.status(500).json({ message: "Failed to delete akika application" });
    }
});

  // Marriage Applications (Prijave šerijatskog vjenčanja)
  app.post("/api/marriage-applications", requireFeature("applications"), async (req, res) => {
    try {
      // Use session tenantId if authenticated, otherwise from body (for guest applications)
      let tenantId = req.user?.tenantId || (req.session as any).tenantId;
      
      // For guest applications, validate the tenantId from body exists
      if (!tenantId && req.body.tenantId) {
        const tenant = await storage.getTenant(req.body.tenantId);
        if (!tenant) {
          return res.status(400).json({ message: "Invalid tenant" });
        }
        tenantId = req.body.tenantId;
      }
      
      // Fallback to request context tenant
      if (!tenantId) {
        tenantId = req.tenantId;
      }
      
      if (!tenantId) {
        return res.status(400).json({ message: "Tenant ID is required" });
      }
      
      const validated = insertMarriageApplicationSchema.parse({
        ...req.body,
        tenantId
      });
      const application = await storage.createMarriageApplication(validated);
      res.status(201).json(application);
    } catch (error) {
      console.error('Error creating marriage application:', error);
      res.status(500).json({ message: "Failed to create marriage application" });
    }
});

  app.get("/api/marriage-applications", requireAdmin, requireFeature("applications"), async (req, res) => {
    try {
      const applications = await storage.getAllMarriageApplications(req.user!.tenantId);
      res.json(applications);
    } catch (error) {
      console.error('Error getting marriage applications:', error);
      res.status(500).json({ message: "Failed to get marriage applications" });
    }
});

  app.get("/api/marriage-applications/:id", requireAdmin, requireFeature("applications"), async (req, res) => {
    try {
      const application = await storage.getMarriageApplication(req.params.id, req.user!.tenantId);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      res.json(application);
    } catch (error) {
      console.error('Error getting marriage application:', error);
      res.status(500).json({ message: "Failed to get marriage application" });
    }
});

  app.patch("/api/marriage-applications/:id", requireAdmin, requireFeature("applications"), async (req, res) => {
    try {
      const validated = insertMarriageApplicationSchema.partial().parse(req.body);
      const updated = await storage.updateMarriageApplication(req.params.id, req.user!.tenantId, req.user!.tenantId, validated);
      if (!updated) {
        return res.status(404).json({ message: "Application not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error('Error updating marriage application:', error);
      res.status(500).json({ message: "Failed to update marriage application" });
    }
});

  app.patch("/api/marriage-applications/:id/review", requireAdmin, requireFeature("applications"), async (req, res) => {
    try {
      const { status, reviewNotes } = req.body;
      const updated = await storage.reviewMarriageApplication(
        req.params.id, 
        req.user!.tenantId, 
        status, 
        req.user!.id, 
        reviewNotes
      );
      if (!updated) {
        return res.status(404).json({ message: "Application not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error('Error reviewing marriage application:', error);
      res.status(500).json({ message: "Failed to review marriage application" });
    }
});

  app.delete("/api/marriage-applications/:id", requireAdmin, requireFeature("applications"), async (req, res) => {
    try {
      const success = await storage.deleteMarriageApplication(req.params.id, req.user!.tenantId);
      if (!success) {
        return res.status(404).json({ message: "Application not found" });
      }
      res.json({ message: "Application deleted successfully" });
    } catch (error) {
      console.error('Error deleting marriage application:', error);
      res.status(500).json({ message: "Failed to delete marriage application" });
    }
});

  // Activity Feed
  app.get("/api/activity-feed", requireFeature("feed"), async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const tenantId = req.user?.tenantId || req.query.tenantId as string;
      if (!tenantId) return res.status(400).json({ message: "Tenant ID required" });
      const activities = await storage.getActivityFeed(tenantId, limit);
      res.json(activities);
    } catch (error) {
      console.error('Error getting activity feed:', error);
      res.status(500).json({ message: "Failed to get activity feed" });
    }
});

  // ============================================================================
  // TENANT MANAGEMENT (Super Admin only - Global tenant operations)
  // ============================================================================

  // PUBLIC: Verify tenant code and return tenant ID (no auth required)
  app.post("/api/tenants/verify-code", async (req, res) => {
    try {
      const { tenantCode } = req.body;
      
      if (!tenantCode) {
        return res.status(400).json({ message: "Tenant code is required" });
      }

      const tenant = await storage.getTenantByCode(tenantCode.toUpperCase());
      
      if (!tenant) {
        return res.status(404).json({ message: "Neispravan kod organizacije" });
      }

      res.json({ 
        tenantId: tenant.id,
        name: tenant.name 
});
    } catch (error) {
      console.error('Error verifying tenant code:', error);
      res.status(500).json({ message: "Failed to verify tenant code" });
    }
});

  // Get all tenants
  app.get("/api/tenants", requireSuperAdmin, async (req, res) => {
    try {
      const tenants = await storage.getAllTenants();
      res.json(tenants);
    } catch (error) {
      console.error('Error getting tenants:', error);
      res.status(500).json({ message: "Failed to get tenants" });
    }
});

  // Get single tenant by ID
  app.get("/api/tenants/:id", requireSuperAdmin, async (req, res) => {
    try {
      const tenant = await storage.getTenant(req.params.id);
      if (!tenant) {
        return res.status(404).json({ message: "Tenant not found" });
      }
      res.json(tenant);
    } catch (error) {
      console.error('Error getting tenant:', error);
      res.status(500).json({ message: "Failed to get tenant" });
    }
});

  // Get current tenant's subscription info (for logged-in users)
  // Get all subscription plans (public endpoint for pricing page)
  app.get("/api/subscription/plans", async (req, res) => {
    try {
      const plans = await storage.getAllSubscriptionPlans();
      res.json(plans);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
});

  app.get("/api/subscription/current", requireAuth, async (req, res) => {
    try {
      const session = req.session as any;
      
      // Super Admin has full access regardless of tenantId
      if (session.isSuperAdmin) {
        return res.json({
          tenantId: "DEMO2025",
          tenantName: "Super Admin",
          subscriptionTier: "full",
          subscriptionStatus: "active",
          plan: {
            name: "Super Admin",
            slug: "full",
            description: "Full access to all features",
            priceMonthly: "0.00",
            currency: "EUR",
            enabledModules: ["*"],
            readOnlyModules: [],
            maxUsers: null,
            maxStorage: null
          },
          isActive: true
        });
      }
      
      const tenantId = session.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: "No tenant context" });
      }
      
      const subscriptionInfo = await getTenantSubscriptionInfo(tenantId);
      
      if (!subscriptionInfo) {
        return res.status(404).json({ message: "Tenant not found" });
      }
      
      res.json(subscriptionInfo);
    } catch (error) {
      console.error('Error getting subscription info:', error);
      res.status(500).json({ message: "Failed to get subscription info" });
    }
});

  // SuperAdmin: Create user for any tenant
  app.post("/api/superadmin/users", requireSuperAdmin, async (req, res) => {
    try {
      const { firstName, lastName, username, email, password, isAdmin, tenantId } = req.body;
      
      if (!tenantId) {
        return res.status(400).json({ message: "Tenant ID je obavezan" });
      }
      
      if (!firstName || !lastName || !username || !password) {
        return res.status(400).json({ message: "Sva obavezna polja moraju biti popunjena" });
      }
      
      // Check if tenant exists
      const tenant = await storage.getTenant(tenantId);
      if (!tenant) {
        return res.status(404).json({ message: "Tenant nije pronađen" });
      }
      
      // Check if username already exists in that tenant
      const existingUser = await storage.getUserByUsername(username, tenantId);
      if (existingUser) {
        return res.status(400).json({ message: "Korisničko ime već postoji u ovom džematu" });
      }
      
      // Create user with specified tenant
      const userData = {
        firstName,
        lastName,
        username,
        email: email || null,
        password,
        role: isAdmin ? 'admin' : 'member',
        isAdmin: isAdmin || false,
        tenantId,
        categories: [],
        status: 'active'
      };
      
      const user = await storage.createUser(userData);
      console.log(`[SUPERADMIN] Created user ${username} for tenant ${tenant.name} (${tenantId})`);
      
      res.status(201).json({ 
        ...user, 
        password: undefined,
        message: `Korisnik ${firstName} ${lastName} kreiran za ${tenant.name}`
      });
    } catch (error) {
      console.error("Error creating user (SuperAdmin):", error);
      res.status(500).json({ message: "Greška pri kreiranju korisnika" });
    }
  });

  // Create new tenant (automatically creates admin user)
  app.post("/api/tenants", requireSuperAdmin, async (req, res) => {
    console.log('[TENANT CREATE] Request received', { body: req.body, userId: req.user?.id });
    try {
      const data = req.body;
      // Convert empty subdomain to undefined (null in DB)
      if (data.subdomain === '') {
        data.subdomain = undefined;
      }
      console.log('[TENANT CREATE] Validating data...');
      const validated = insertTenantSchema.parse(data);
      console.log('[TENANT CREATE] Data validated, creating tenant...');
      const newTenant = await storage.createTenant(validated);
      console.log('[TENANT CREATE] ✅ Tenant created:', newTenant.id);
      
      // Auto-create admin user for the new tenant with UNIQUE email
      // Use tenant code in email to guarantee uniqueness
      const adminUsername = 'admin';
      const uniqueAdminEmail = `admin+${newTenant.tenantCode?.toLowerCase() || newTenant.id}@system.dzematapp`;
      let adminUser = null;
      
      try {
        adminUser = await storage.createUser({
          firstName: 'Admin',
          lastName: newTenant.name,
          username: adminUsername,
          email: uniqueAdminEmail,
          password: 'admin123',
          roles: ['admin'],
          isAdmin: true,
          tenantId: newTenant.id,
          status: 'active'
        });
        console.log('[TENANT CREATE] ✅ Admin user created with email:', uniqueAdminEmail);
      } catch (adminError: any) {
        console.error('[TENANT CREATE] ❌ CRITICAL: Failed to create admin user:', adminError.message);
        // Delete the tenant since we couldn't create the admin
        try {
          await storage.deleteTenant(newTenant.id);
          console.log('[TENANT CREATE] ↩️ Rolled back tenant creation');
        } catch (rollbackError) {
          console.error('[TENANT CREATE] ❌ Rollback failed:', rollbackError);
        }
        return res.status(500).json({ 
          message: "Failed to create tenant: could not create admin user",
          error: adminError.message
        });
      }
      
      console.log('[TENANT CREATE] ✅ Tenant with admin created successfully');
      return res.status(201).json({
        ...newTenant,
        adminCredentials: {
          username: adminUsername,
          password: 'admin123'
        }
      });
    } catch (error) {
      if (error instanceof ZodError) {
        console.error('[TENANT CREATE] Validation error:', error.errors);
        return res.status(400).json({ 
          message: "Invalid tenant data", 
          errors: error.errors 
        });
      }
      console.error('[TENANT CREATE] Error creating tenant:', error);
      res.status(500).json({ message: "Failed to create tenant" });
    }
  });

  // Update tenant
  app.patch("/api/tenants/:id", requireSuperAdmin, async (req, res) => {
    console.log('[TENANT UPDATE] Request for:', req.params.id, { body: req.body, userId: req.user?.id });
    try {
      const validated = insertTenantSchema.partial().parse(req.body);
      const updated = await storage.updateTenant(req.params.id, validated);
      if (!updated) {
        console.log('[TENANT UPDATE] Not found:', req.params.id);
        return res.status(404).json({ message: "Tenant not found" });
      }
      console.log('[TENANT UPDATE] ✅ Updated:', req.params.id);
      res.json(updated);
    } catch (error) {
      if (error instanceof ZodError) {
        console.error('[TENANT UPDATE] Validation error:', error.errors);
        return res.status(400).json({ 
          message: "Invalid tenant data", 
          errors: error.errors 
        });
      }
      console.error('[TENANT UPDATE] Error:', error);
      res.status(500).json({ message: "Failed to update tenant" });
    }
  });

  // Backfill admin users for all tenants that don't have one
  app.post("/api/tenants/backfill-admins", requireSuperAdmin, async (req, res) => {
    try {
      const allTenants = await storage.getAllTenants();
      const results: { tenantId: string; tenantName: string; status: string; username?: string }[] = [];
      
      for (const tenant of allTenants) {
        // Skip SuperAdmin global tenant
        if (tenant.id === 'tenant-superadmin-global') {
          continue;
        }
        
        // Check if admin user exists
        let adminUser = await storage.getUserByUsername('admin', tenant.id);
        if (!adminUser) {
          adminUser = await storage.getUserByUsername('tenant-admin', tenant.id);
        }
        
        if (adminUser) {
          results.push({
            tenantId: tenant.id,
            tenantName: tenant.name,
            status: 'exists',
            username: adminUser.username
          });
          continue;
        }
        
        // Create admin user with unique email
        const uniqueEmail = `admin+${tenant.tenantCode?.toLowerCase() || tenant.id}@system.dzematapp`;
        try {
          const newAdmin = await storage.createUser({
            id: `admin-${tenant.id}`,
            firstName: 'Admin',
            lastName: tenant.name,
            username: 'admin',
            email: uniqueEmail,
            password: 'admin123',
            role: 'admin',
            roles: ['admin'],
            isAdmin: true,
            tenantId: tenant.id,
            categories: [],
            status: 'active'
          });
          
          results.push({
            tenantId: tenant.id,
            tenantName: tenant.name,
            status: 'created',
            username: 'admin'
          });
          console.log(`[BACKFILL] ✅ Created admin for ${tenant.name}`);
        } catch (error: any) {
          console.error(`[BACKFILL] ❌ Failed for ${tenant.name}:`, error.message);
          results.push({
            tenantId: tenant.id,
            tenantName: tenant.name,
            status: `error: ${error.message}`
          });
        }
      }
      
      res.json({
        message: 'Backfill complete',
        results
      });
    } catch (error) {
      console.error('[BACKFILL] Error:', error);
      res.status(500).json({ message: 'Backfill failed' });
    }
  });

  // Update tenant status (activate/deactivate)
  app.patch("/api/tenants/:id/status", requireSuperAdmin, async (req, res) => {
    try {
      const { isActive } = req.body;
      
      if (typeof isActive !== 'boolean') {
        return res.status(400).json({ message: "isActive must be a boolean" });
      }

      const updated = await storage.updateTenantStatus(req.params.id, isActive);
      if (!updated) {
        return res.status(404).json({ message: "Tenant not found" });
      }

      res.json(updated);
    } catch (error) {
      console.error('Error updating tenant status:', error);
      res.status(500).json({ message: "Failed to update tenant status" });
    }
});

  // Delete all users for a tenant (SuperAdmin only)
  app.delete("/api/tenants/:id/users", requireSuperAdmin, async (req, res) => {
    console.log('[TENANT DELETE USERS] Request for:', req.params.id);
    try {
      const count = await storage.deleteAllTenantUsers(req.params.id);
      console.log('[TENANT DELETE USERS] ✅ Deleted', count, 'users from tenant:', req.params.id);
      res.json({ message: `Obrisano ${count} korisnika iz tenant-a`, deletedCount: count });
    } catch (error) {
      console.error('[TENANT DELETE USERS] Error:', error);
      res.status(500).json({ message: "Failed to delete tenant users" });
    }
  });

  // Delete tenant
  app.delete("/api/tenants/:id", requireSuperAdmin, async (req, res) => {
    console.log('[TENANT DELETE] Request for:', req.params.id);
    try {
      // Check if tenant has users - cannot delete if it does
      const tenantUsers = await storage.getAllUsers(req.params.id);
      if (tenantUsers && tenantUsers.length > 0) {
        console.log('[TENANT DELETE] Blocked - tenant has', tenantUsers.length, 'users');
        return res.status(409).json({ 
          message: `Ne možete obrisati tenant koji ima ${tenantUsers.length} korisnika. Prvo obrišite sve korisnike.` 
        });
      }

      const success = await storage.deleteTenant(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Tenant not found" });
      }

      console.log('[TENANT DELETE] ✅ Deleted:', req.params.id);
      res.json({ message: "Tenant deleted successfully" });
    } catch (error) {
      console.error('[TENANT DELETE] Error:', error);
      res.status(500).json({ message: "Failed to delete tenant" });
    }
  });

  // Clean duplicate admin users (SuperAdmin only)
  app.post("/api/tenants/clean-duplicates", requireSuperAdmin, async (req, res) => {
    console.log('[CLEAN DUPLICATES] Starting...');
    try {
      const tenants = await storage.getAllTenants();
      const results: any[] = [];
      
      for (const tenant of tenants) {
        const users = await storage.getAllUsers(tenant.id);
        const admins = users.filter(u => u.username === 'admin');
        
        if (admins.length > 1) {
          // Keep the one with Admin role, delete others
          const adminWithRole = admins.find(a => a.roles && a.roles.includes('admin'));
          const duplicates = admins.filter(a => a.id !== adminWithRole?.id);
          
          for (const dup of duplicates) {
            await storage.deleteUser(dup.id, tenant.id);
            console.log(`[CLEAN DUPLICATES] Deleted duplicate admin ${dup.id} from ${tenant.name}`);
          }
          
          results.push({
            tenantId: tenant.id,
            tenantName: tenant.name,
            deleted: duplicates.length,
            kept: adminWithRole?.id
          });
        }
      }
      
      console.log('[CLEAN DUPLICATES] Complete:', results);
      res.json({ message: 'Cleanup complete', results });
    } catch (error) {
      console.error('[CLEAN DUPLICATES] Error:', error);
      res.status(500).json({ message: 'Cleanup failed', error: String(error) });
    }
  });

  // Purge demo users from all tenants except demo tenant (SuperAdmin only)
  app.post("/api/tenants/purge-demo-users", requireSuperAdmin, async (req, res) => {
    console.log('[PURGE DEMO] Starting...');
    try {
      const DEMO_TENANT_ID = 'default-tenant-demo';
      
      const tenants = await storage.getAllTenants();
      console.log(`[PURGE DEMO] Found ${tenants.length} tenants`);
      const results: any[] = [];
      
      for (const tenant of tenants) {
        console.log(`[PURGE DEMO] Processing tenant: ${tenant.name} (${tenant.id})`);
        
        // Skip demo tenant - it should keep demo users
        if (tenant.id === DEMO_TENANT_ID) {
          console.log(`[PURGE DEMO] Skipping demo tenant`);
          results.push({ tenantId: tenant.id, tenantName: tenant.name, skipped: true, reason: 'Demo tenant' });
          continue;
        }
        
        const users = await storage.getAllUsers(tenant.id);
        console.log(`[PURGE DEMO] Found ${users.length} users in ${tenant.name}`);
        let deletedCount = 0;
        const deletedNames: string[] = [];
        
        for (const user of users) {
          // Never delete the real tenant admin
          if (user.username === 'admin') {
            console.log(`[PURGE DEMO] Skipping admin user: ${user.firstName} ${user.lastName}`);
            continue;
          }
          
          // Check if this is a demo user by various criteria
          const firstName = (user.firstName || '').toLowerCase();
          const lastName = (user.lastName || '').toLowerCase();
          const email = (user.email || '').toLowerCase();
          const username = (user.username || '').toLowerCase();
          
          const isDemoUser = 
            // Demo names (case insensitive)
            ['iso', 'elma', 'hase', 'mujo', 'fata', 'suljo', 'haso'].includes(firstName) ||
            ['isic', 'elmic', 'hasic', 'mujic', 'fatic', 'suljic', 'hasovic'].includes(lastName) ||
            // Demo email patterns
            email.includes('@demo.local') ||
            email.includes('demo@') ||
            // Demo usernames
            username === 'demo-admin' ||
            username.includes('demo') ||
            // Generic test patterns
            firstName === 'admin' && lastName === 'demo' ||
            firstName === 'test' ||
            lastName === 'test';
          
          console.log(`[PURGE DEMO] User ${user.firstName} ${user.lastName}: isDemoUser=${isDemoUser}`);
          
          if (isDemoUser) {
            try {
              await storage.deleteUser(user.id, tenant.id);
              deletedCount++;
              deletedNames.push(`${user.firstName} ${user.lastName}`);
              console.log(`[PURGE DEMO] ✅ Deleted ${user.firstName} ${user.lastName} from ${tenant.name}`);
            } catch (err) {
              console.log(`[PURGE DEMO] ❌ Could not delete ${user.firstName}: ${err}`);
            }
          }
        }
        
        results.push({
          tenantId: tenant.id,
          tenantName: tenant.name,
          deleted: deletedCount,
          deletedUsers: deletedNames
        });
      }
      
      const totalDeleted = results.reduce((sum, r) => sum + (r.deleted || 0), 0);
      console.log('[PURGE DEMO] ✅ Complete. Total deleted:', totalDeleted);
      res.json({ message: 'Demo user purge complete', totalDeleted, results });
    } catch (error) {
      console.error('[PURGE DEMO] ❌ Error:', error);
      res.status(500).json({ message: 'Purge failed', error: String(error) });
    }
  });

  // Get tenant statistics
  app.get("/api/tenants/:id/stats", requireSuperAdmin, async (req, res) => {
    try {
      const stats = await storage.getTenantStats(req.params.id);
      if (!stats) {
        return res.status(404).json({ message: "Tenant not found" });
      }
      res.json(stats);
    } catch (error) {
      console.error('Error getting tenant stats:', error);
      res.status(500).json({ message: "Failed to get tenant stats" });
    }
});

  const httpServer = createServer(app);
  return httpServer;
}
