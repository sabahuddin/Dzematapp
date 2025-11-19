import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import MemoryStore from "memorystore";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import type { User } from "@shared/schema";

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

// Trust proxy - Required for Replit deployment behind their reverse proxy
app.set('trust proxy', 1);

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: false, limit: '5mb' }));

// Initialize memory store for sessions
const MemStore = MemoryStore(session);

// Session configuration
// Auto-detect if we're behind HTTPS (Replit deployment uses REPL_ID env var)
const isReplitDeployment = !!process.env.REPL_ID;
const isProduction = process.env.NODE_ENV === 'production';

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-key-change-in-production',
  store: new MemStore({
    checkPeriod: 86400000 // Prune expired entries every 24h
  }),
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isReplitDeployment || isProduction, // true on Replit or production
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax' // Important for cookies to work properly
  },
  name: 'sessionId' // Name of the session cookie
}));

// Authentication middleware - checks session and sets req.user if authenticated
app.use(async (req, res, next) => {
  if (req.session.userId) {
    try {
      const user = await storage.getUser(req.session.userId);
      if (user) {
        // Set isAdmin to true if user has "imam" or "admin" role
        const hasImamRole = user.roles?.includes('imam') || false;
        req.user = {
          ...user,
          isAdmin: user.isAdmin || hasImamRole
        };
      } else {
        // User no longer exists, clear the session
        req.session.userId = undefined;
      }
    } catch (error) {
      console.error('Error loading user from session:', error);
      req.session.userId = undefined;
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
    return res.status(401).json({ message: "Authentication required" });
  }
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: "Admin privileges required" });
  }
  next();
};

// Initialize default admin user if none exists
async function ensureAdminUser() {
  try {
    const adminUser = await storage.getUserByUsername('admin');
    if (!adminUser) {
      console.log('🔧 Creating default admin user...');
      await storage.createUser({
        username: 'admin',
        password: 'admin123',
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@dzemat.app',
        phone: '',
        address: '',
        jmbg: '',
        roles: ['admin'],
        isAdmin: true,
        totalPoints: 0
      });
      console.log('✅ Default admin user created (username: admin, password: admin123)');
    } else {
      console.log('✅ Admin user already exists');
    }
  } catch (error) {
    console.error('❌ Error ensuring admin user:', error);
  }
}

// Call on startup
ensureAdminUser();

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

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
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
  });
})();
