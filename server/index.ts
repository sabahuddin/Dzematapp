import path from "path";
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
import { seedDefaultTenant } from "./seed-tenant";
import { ensurePublicPathSymlink } from "./public-path-fix";
import { serveStaticFiles } from "./middleware";

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

// Authentication middleware - checks session and sets req.user if authenticated
app.use(async (req, res, next) => {
  const session = req.session as any;
  
  if (session.userId) {
    try {
      let user;
      
      // Super Admin: Find user across all tenants
      if (session.isSuperAdmin) {
        console.log('[AUTH MIDDLEWARE] 🛡️ SuperAdmin session detected - userId:', session.userId);
        // For SuperAdmin, load from default-tenant-demo tenant with admin privileges
        let foundUser = await storage.getUser(session.userId, "default-tenant-demo");
        console.log('[AUTH MIDDLEWARE] SuperAdmin user found in default-tenant-demo:', !!foundUser);
        if (!foundUser) {
          // Fallback to default-tenant-demo if DEMO2024 doesn't exist
          foundUser = await storage.getUser(session.userId, "default-tenant-demo");
          console.log('[AUTH MIDDLEWARE] SuperAdmin user fallback search:', !!foundUser);
        }
        if (foundUser) {
          user = foundUser;
          console.log('[AUTH MIDDLEWARE] ✅ SuperAdmin user loaded:', foundUser.id);
        } else {
          // Final fallback: search all tenants
          console.log('[AUTH MIDDLEWARE] ⚠️ SuperAdmin not found - searching all tenants...');
          const allTenants = await storage.getAllTenants();
          console.log('[AUTH MIDDLEWARE] Found tenants:', allTenants.map(t => t.id));
          for (const tenant of allTenants) {
            const candidate = await storage.getUser(session.userId, tenant.id);
            if (candidate && candidate.isSuperAdmin) {
              user = candidate;
              console.log('[AUTH MIDDLEWARE] ✅ SuperAdmin found in tenant:', tenant.id);
              break;
            }
          }
        }
      } else {
        // Regular user: Find in their tenant
        user = await storage.getUser(session.userId, req.tenantId);
      }
      
      if (user) {
        // Set isAdmin to true if user has "imam" or "admin" role
        const hasImamRole = user.roles?.includes('imam') || false;
        const isSuperAdmin = session.isSuperAdmin || user.isSuperAdmin || false;
        req.user = {
          ...user,
          isAdmin: isSuperAdmin ? true : (user.isAdmin || hasImamRole),
          isSuperAdmin: isSuperAdmin,
          tenantId: isSuperAdmin ? "default-tenant-demo" : user.tenantId
        };
        console.log('[AUTH MIDDLEWARE] ✅ req.user set - isSuperAdmin:', req.user.isSuperAdmin);
      } else {
        // User no longer exists, clear the session
        console.log('[AUTH MIDDLEWARE] ❌ User not found - clearing session');
        session.userId = undefined;
        session.isSuperAdmin = undefined;
      }
    } catch (error) {
      console.error('[AUTH MIDDLEWARE] Error loading user from session:', error);
      session.userId = undefined;
      session.isSuperAdmin = undefined;
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
      req.tenantId = req.tenantId || "default-tenant-demo";
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

// Initialize default admin user if none exists
async function ensureAdminUser() {
  try {
    const adminUser = await storage.getUserByUsername('admin', DEFAULT_TENANT_ID);
    if (!adminUser) {
      console.log('🔧 Creating default admin user...');
      await storage.createUser({
        tenantId: DEFAULT_TENANT_ID,
        username: 'admin',
        password: 'admin123',
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@dzemat.app',
        roles: ['admin'],
        isAdmin: true
      });
      console.log('✅ Default admin user created (username: admin, password: admin123)');
    } else {
      console.log('✅ Admin user already exists');
    }
  } catch (error) {
    console.error('❌ Error ensuring admin user:', error);
  }
}

// Initialize default contribution purposes
async function seedContributionPurposes() {
  try {
    const purposes = await storage.getContributionPurposes(DEFAULT_TENANT_ID);
    if (purposes.length === 0) {
      console.log('🔧 Seeding default contribution purposes...');
      const defaultPurposes = [
        { name: 'Članarina', description: 'Godišnja članarina' },
        { name: 'Donacija', description: 'Slobodna donacija' },
        { name: 'Žrtva (Kurbani)', description: 'Kurban - Bakrid' },
        { name: 'Sadaka (Fitr)', description: 'Sadaka za Ramazan' },
        { name: 'Hadž', description: 'Pomoc za hadž' },
        { name: 'Džemat Fond', description: 'Doprinos Džemat fondu' },
        { name: 'Projekti', description: 'Doprinos projektima' },
        { name: 'Ostalo', description: 'Ostale namjene' }
      ];

      for (const purpose of defaultPurposes) {
        await storage.createContributionPurpose({
          ...purpose,
          createdById: 'system',
          tenantId: DEFAULT_TENANT_ID
        });
      }
      console.log('✅ Default contribution purposes seeded');
    } else {
      console.log('✅ Contribution purposes already exist');
    }
  } catch (error) {
    console.error('❌ Error seeding contribution purposes:', error);
  }
}

// Call on startup - non-blocking async operations
ensureAdminUser();
seedContributionPurposes();

// Seed operations will run in background after server starts
let seedingPromise: Promise<void> | null = null;

const startSeeding = async () => {
  try {
    await seedDefaultTenant();
    seedSubscriptionPlans();
    seedDemoData();
  } catch (err) {
    console.error('Seed error:', err);
  }
};

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
  const server = await registerRoutes(app);

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
  }, () => {
    log(`serving on port ${port}`);
    // Start seeding after server is listening
    seedingPromise = startSeeding();
  });
})();
