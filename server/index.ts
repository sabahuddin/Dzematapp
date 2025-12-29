import path from "path";
import fs from "fs";
import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import MemoryStore from "memorystore";
import pgSimple from "connect-pg-simple";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import { pool } from "./db";
import type { User } from "@shared/schema";
import { tenantContextMiddleware, DEFAULT_TENANT_ID } from "./tenant-context";
import { seedSubscriptionPlans } from "./subscription-plans-seed";
import { seedDemoData } from "./seed-demo-data";
import { seedDefaultTenant, seedBadgesForTenant, TENANT_IDS } from "./seed-tenant";
import { ensurePublicPathSymlink } from "./public-path-fix";
import { serveStaticFiles } from "./middleware";
import { migrateProductionSchema, verifyAllTablesExist } from "./migrate-production";

// Fix file permissions for static assets (badges, uploads)
function fixStaticAssetPermissions() {
  const badgesPath = path.join(process.cwd(), 'public', 'uploads', 'badges');
  try {
    if (fs.existsSync(badgesPath)) {
      const files = fs.readdirSync(badgesPath);
      for (const file of files) {
        if (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg')) {
          const filePath = path.join(badgesPath, file);
          fs.chmodSync(filePath, 0o644);
        }
      }
      console.log(`✅ Fixed permissions for ${files.length} badge images`);
    }
  } catch (error) {
    console.log('ℹ️  Could not fix badge permissions:', error);
  }
}

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

// Extend session to include user data
declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

const app = express();

// Fix production bundled code path resolution before anything else
ensurePublicPathSymlink();

// Fix permissions for badge images on startup
fixStaticAssetPermissions();

// In production, when bundled by esbuild, import.meta.dirname becomes "."
// We need to override the working directory context for serveStatic to find public files
if (process.env.NODE_ENV === 'production') {
  // Set environment variable that serveStaticFiles() middleware can use
  // dist/public is where Vite outputs build artifacts (HTML, CSS, JS, etc.)
  process.env.PUBLIC_PATH = path.resolve(process.cwd(), 'dist', 'public');
}

// Trust proxy - Required for Replit deployment behind their reverse proxy
app.set('trust proxy', 1);

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: false, limit: '5mb' }));

// CORS for marketing site (dzematapp.com -> app.dzematapp.com)
const marketingCorsMiddleware = (req: any, res: any, next: any) => {
  const allowedOrigins = ['https://dzematapp.com', 'https://www.dzematapp.com'];
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'false');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
};

// Apply CORS to contact form endpoint
app.use('/api/contact', marketingCorsMiddleware);

// Apply CORS to analytics tracking endpoint (for marketing site tracking)
app.use('/api/analytics/track', marketingCorsMiddleware);

// Session store: ALWAYS use database if DATABASE_URL is available (for production/Replit)
// Only use MemoryStore if there's no database configured
const isReplitDeployment = !!process.env.REPL_ID;
const isProduction = process.env.NODE_ENV === 'production';
const PostgresStore = pgSimple(session);
const useDatabaseStore = !!process.env.DATABASE_URL;

let store;
let usePostgres = false;

if (useDatabaseStore) {
  try {
    store = new PostgresStore({
      pool: pool,
      tableName: 'session',
      ttl: 24 * 60 * 60, // 24 hours
      createTableIfMissing: true // Auto-create session table if not exists
    });
    usePostgres = true;
    console.log('✅ Using PostgreSQL session store');
  } catch (error) {
    console.error('⚠️ PostgreSQL session store initialization failed, using Memory store:', error);
    const MemStore = MemoryStore(session);
    store = new MemStore({
      checkPeriod: 86400000 // Prune expired entries every 24h
    });
    console.log('✅ Fallback: Using Memory session store');
  }
} else {
  const MemStore = MemoryStore(session);
  store = new MemStore({
    checkPeriod: 86400000 // Prune expired entries every 24h
  });
  console.log('⚠️ Using Memory session store (not recommended for production)');
}

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-key-change-in-production',
  store: store,
  resave: true,
  saveUninitialized: true,
  cookie: {
    secure: false, // Allow HTTP for development and local testing
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax'
  },
  name: 'sessionId'
}));

// Tenant Context Middleware - dodaje tenantId u svaki request
app.use(tenantContextMiddleware);

// Global tenant ID for SuperAdmin - NEVER visible to regular users
const SUPERADMIN_TENANT_ID = 'tenant-superadmin-global';

// Authentication middleware - checks session and sets req.user if authenticated
app.use(async (req, res, next) => {
  const session = req.session as any;
  
  if (session.userId) {
    try {
      let user;
      
      // Super Admin: Find user in the global SuperAdmin tenant
      if (session.isSuperAdmin) {
        console.log('[AUTH MIDDLEWARE] 🛡️ SuperAdmin session detected');
        // SuperAdmin lives in the global tenant - NOT in any regular tenant
        user = await storage.getUser(session.userId, SUPERADMIN_TENANT_ID);
        
        if (!user) {
          // Fallback: check if it's a legacy SuperAdmin in old tenant
          const allTenants = await storage.getAllTenants();
          for (const tenant of allTenants) {
            const candidate = await storage.getUser(session.userId, tenant.id);
            if (candidate && candidate.isSuperAdmin) {
              user = candidate;
              console.log('[AUTH MIDDLEWARE] ⚠️ Legacy SuperAdmin found in:', tenant.id);
              break;
            }
          }
        }
      } else {
        // Regular user: Find in their tenant FROM SESSION (not from request context)
        // session.tenantId is set during login and is the authoritative source
        // STRICT: Do NOT fallback to req.tenantId - that enables cross-tenant access!
        const userTenantId = session.tenantId;
        
        if (!userTenantId) {
          console.log('[AUTH MIDDLEWARE] ⚠️ Missing session.tenantId - clearing session');
          session.userId = undefined;
          session.isSuperAdmin = undefined;
          session.tenantId = undefined;
          return next();
        }
        
        user = await storage.getUser(session.userId, userTenantId);
      }
      
      if (user) {
        const hasImamRole = user.roles?.includes('imam') || false;
        // ONLY trust session.isSuperAdmin - user.isSuperAdmin could be stale or wrong
        const isSuperAdmin = session.isSuperAdmin === true;
        
        console.log('[AUTH MIDDLEWARE] User loaded:', {
          userId: user.id,
          username: user.username,
          userTenantId: user.tenantId,
          sessionTenantId: session.tenantId,
          sessionIsSuperAdmin: session.isSuperAdmin,
          userIsSuperAdmin: user.isSuperAdmin,
          resolvedIsSuperAdmin: isSuperAdmin
        });
        
        // CRITICAL: For regular users, ALWAYS use session.tenantId
        // SuperAdmin only if explicitly logged in via /superadmin route
        const resolvedTenantId = isSuperAdmin ? SUPERADMIN_TENANT_ID : (session.tenantId || user.tenantId);
        
        req.user = {
          ...user,
          isAdmin: isSuperAdmin ? true : (user.isAdmin || hasImamRole),
          isSuperAdmin: isSuperAdmin,
          tenantId: resolvedTenantId
        };
        // Update req.tenantId to match for consistent behavior
        req.tenantId = resolvedTenantId;
        
        console.log('[AUTH MIDDLEWARE] Final tenantId:', resolvedTenantId);
      } else {
        console.log('[AUTH MIDDLEWARE] ❌ User not found - clearing session');
        session.userId = undefined;
        session.isSuperAdmin = undefined;
        session.tenantId = undefined;
      }
    } catch (error) {
      console.error('[AUTH MIDDLEWARE] Error loading user from session:', error);
      session.userId = undefined;
      session.isSuperAdmin = undefined;
      session.tenantId = undefined;
    }
  }
  next();
});

// Helper middleware to require authentication
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
};

// Helper middleware to require admin privileges
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    // Check for superadmin session
    const session = req.session as any;
    if (session?.isSuperAdmin) {
      // SuperAdmin can access any tenant - use request tenant or global
      req.tenantId = req.tenantId || SUPERADMIN_TENANT_ID;
      return next();
    }
    return res.status(401).json({ message: "Authentication required" });
  }
  if (!req.user.isAdmin && !req.user.isSuperAdmin) {
    return res.status(403).json({ message: "Admin privileges required" });
  }
  next();
};

// Helper middleware to require super admin privileges (global tenant management)
export const requireSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  if (!req.user.isSuperAdmin) {
    return res.status(403).json({ message: "Super Admin privileges required" });
  }
  next();
};

// Helper middleware to allow either authenticated user OR superadmin
export const requireAuthOrSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user) {
    // Regular authenticated user OR SuperAdmin (loaded as req.user)
    return next();
  }
  // Neither authenticated user nor superadmin
  return res.status(401).json({ message: "Authentication required" });
};

// Admin user creation is now handled by seedDefaultTenant
// 'admin' username is reserved for SuperAdmin in global tenant
async function ensureAdminUser() {
  // No-op: seedDefaultTenant creates demo-admin for demo tenant
  // and SuperAdmin lives in tenant-superadmin-global
  console.log('✅ Admin user already exists');
}

// Initialize default contribution purposes

// Seed operations will run in background after server starts
let seedingPromise: Promise<void> | null = null;

const startSeeding = async () => {
  try {
    // First ensure admin user exists
    await ensureAdminUser();
    
    // Seed tenant and demo data
    await seedDefaultTenant();
    seedSubscriptionPlans();
    seedDemoData();
    
    // Seed default badges for all tenants
    await seedBadgesForAllTenants();
  } catch (err) {
    console.error('Seed error:', err);
  }
};

// Migrate badge icon paths from static to API endpoint (one-time migration)
async function migrateBadgeIconPaths() {
  try {
    const { db } = await import('./db');
    const { sql } = await import('drizzle-orm');
    
    // Update all badges that still use the old static path
    const result = await db.execute(sql`
      UPDATE badges 
      SET icon = REPLACE(icon, '/uploads/badges/', '/api/badges/image/') 
      WHERE icon LIKE '/uploads/badges/%'
    `);
    
    const count = (result as any)?.rowCount || 0;
    if (count > 0) {
      console.log(`🔄 Migrated ${count} badge icon paths to API endpoint`);
    }
  } catch (error) {
    console.error('⚠️ Badge path migration skipped:', error);
  }
}

// Seed badges for all existing tenants
async function seedBadgesForAllTenants() {
  try {
    // First migrate any old paths
    await migrateBadgeIconPaths();
    
    const { db } = await import('./db');
    const { tenants } = await import('@shared/schema');
    
    const allTenants = await db.select().from(tenants);
    console.log(`🏅 Seeding badges for ${allTenants.length} tenants...`);
    
    for (const tenant of allTenants) {
      // Skip SuperAdmin global tenant
      if (tenant.id === TENANT_IDS.SUPERADMIN_GLOBAL) continue;
      await seedBadgesForTenant(tenant.id);
    }
    
    console.log('✅ Badge seeding complete for all tenants');
  } catch (error) {
    console.error('❌ Badge seeding failed:', error);
  }
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // ALWAYS run schema migration before anything else - ensures database is in sync
  // This runs on EVERY startup (both development and production)
  try {
    console.log('🔄 Starting database schema synchronization...');
    await migrateProductionSchema();
    await verifyAllTablesExist();
    console.log('✅ Database schema synchronized successfully!');
  } catch (error) {
    console.error('❌ Schema migration failed:', error);
    // In production, we should fail fast if migration fails
    if (process.env.NODE_ENV === 'production') {
      console.error('🚨 CRITICAL: Cannot start without successful migration. Exiting...');
      process.exit(1);
    }
  }
  
  const server = await registerRoutes(app);

  // Serve downloads folder statically BEFORE Vite catch-all
  app.use('/downloads', express.static(path.join(process.cwd(), 'public', 'downloads')));
  
  // Serve uploads folder statically for certificates, images, etc.
  app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));
  
  // Explicit download route for mobile app archive
  app.get('/api/download-mobile', (_req, res) => {
    const filePath = path.join(process.cwd(), 'public', 'downloads', 'mobile-complete.tar.gz');
    res.download(filePath, 'mobile-complete.tar.gz', (err) => {
      if (err) {
        console.error('Download error:', err);
        res.status(404).send('File not found');
      }
    });
  });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    if (!res.headersSent) {
      res.status(status).json({ message });
    }
    console.error("Error:", err);
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === undefined;
  if (isDevelopment) {
    await setupVite(app, server);
  } else {
    // In production, use custom static file middleware that handles bundled code path issues
    try {
      serveStaticFiles(app);
    } catch (err) {
      console.error('Failed to serve static files:', err);
      // Fallback to original serveStatic (may fail)
      serveStatic(app);
    }
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, async () => {
    log(`serving on port ${port}`);
    // Start seeding after server is listening
    seedingPromise = startSeeding();
    
    // One-time cleanup: Remove old profile_updated activity logs (can be removed after first deploy)
    try {
      const { db } = await import("./db");
      const { activityLog } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      const result = await db.delete(activityLog).where(eq(activityLog.activityType, 'profile_updated'));
      if (result.rowCount && result.rowCount > 0) {
        log(`Cleanup: Deleted ${result.rowCount} profile_updated activity log entries`);
      }
    } catch (err) {
      console.error('Cleanup failed:', err);
    }
  });
})();
