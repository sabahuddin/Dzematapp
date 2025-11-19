import express, { type Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import { promises as fs } from "fs";
import * as XLSX from "xlsx";
import { storage } from "./storage";
import { requireAuth, requireAdmin } from "./index";
import { generateCertificate, saveCertificate } from "./certificateService";
import { type User, insertUserSchema, insertAnnouncementSchema, insertEventSchema, insertWorkGroupSchema, insertWorkGroupMemberSchema, insertTaskSchema, insertAccessRequestSchema, insertTaskCommentSchema, insertAnnouncementFileSchema, insertFamilyRelationshipSchema, insertMessageSchema, insertOrganizationSettingsSchema, insertDocumentSchema, insertRequestSchema, insertShopProductSchema, insertMarketplaceItemSchema, insertProductPurchaseRequestSchema, insertPrayerTimeSchema, insertFinancialContributionSchema, insertActivityLogSchema, insertEventAttendanceSchema, insertPointsSettingsSchema, insertBadgeSchema, insertUserBadgeSchema, insertProjectSchema, insertProposalSchema, insertReceiptSchema, insertCertificateTemplateSchema, insertUserCertificateSchema, insertMembershipApplicationSchema, insertAkikaApplicationSchema, insertMarriageApplicationSchema, insertServiceSchema } from "@shared/schema";

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
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 10 // max 10 files
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
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      console.log('[LOGIN] Received credentials:', { username, passwordLength: password?.length });
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      const user = await storage.getUserByUsername(username);
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

      // Create session
      req.session.userId = user.id;
      
      // Check if user has Imam role for admin privileges
      const hasImamRole = user.roles?.includes('imam') || false;
      
      res.json({ 
        user: { 
          id: user.id, 
          firstName: user.firstName, 
          lastName: user.lastName, 
          email: user.email,
          roles: user.roles || [],
          isAdmin: user.isAdmin || hasImamRole,
          totalPoints: user.totalPoints || 0
        } 
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Logout route
  app.post("/api/auth/logout", (req, res) => {
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
    if (req.user) {
      res.json({ 
        user: { 
          id: req.user.id, 
          firstName: req.user.firstName, 
          lastName: req.user.lastName, 
          email: req.user.email,
          roles: req.user.roles || [],
          isAdmin: req.user.isAdmin,
          totalPoints: req.user.totalPoints || 0
        } 
      });
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  });

  // Users routes
  app.get("/api/users", requireAuth, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users.map(user => ({ ...user, password: undefined })));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/users/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const currentUser = req.user!;
      
      // Check if user is viewing their own profile or if they're an admin
      const isOwnProfile = currentUser.id === id;
      const isAdmin = currentUser.isAdmin || false;
      
      if (!isOwnProfile && !isAdmin) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ ...user, password: undefined });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.post("/api/users", requireAdmin, async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username already exists (only if username is provided)
      if (userData.username) {
        const existingUser = await storage.getUserByUsername(userData.username);
        if (existingUser) {
          return res.status(400).json({ message: "Korisničko ime već postoji" });
        }
      }
      
      const user = await storage.createUser(userData);
      res.json({ ...user, password: undefined });
    } catch (error) {
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  app.put("/api/users/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const currentUser = req.user!;
      
      // Check if user is editing their own profile or if they're an admin
      const isOwnProfile = currentUser.id === id;
      const isAdmin = currentUser.isAdmin || false;
      
      if (!isOwnProfile && !isAdmin) {
        return res.status(403).json({ message: "Admin privileges required" });
      }
      
      const userData = insertUserSchema.partial().parse(req.body);
      
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
        const existingUser = await storage.getUserByUsername(userData.username);
        if (existingUser && existingUser.id !== id) {
          return res.status(400).json({ message: "Korisničko ime već postoji" });
        }
      }
      
      const user = await storage.updateUser(id, userData);
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
      });

      res.json({ ...user, password: undefined });
    } catch (error) {
      console.error('User update error:', error);
      res.status(400).json({ message: "Invalid user data", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Bulk upload endpoints
  const xlsxUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
      const allowedMimes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
      if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Only Excel files (.xlsx, .xls) are allowed'));
      }
    }
  });

  app.get("/api/users/template", requireAuth, async (req, res) => {
    try {
      const workbook = XLSX.utils.book_new();
      
      const templateData = [
        ["Ime", "Prezime", "Korisničko ime", "Šifra", "Email", "Telefon", "Ulica i broj", "Broj pošte", "Naziv mjesta", "Član od", "Status članstva"],
        ["Marko", "Marković", "marko.markovic", "password123", "marko@example.com", "+387 61 123 456", "Ulica Maršala Tita 15", "71000", "Sarajevo", "2024-01-15", "aktivan"],
        ["Ana", "Anić", "ana.anic", "password123", "ana@example.com", "+387 62 234 567", "Kralja Tvrtka 22", "72000", "Zenica", "2023-06-20", "aktivan"]
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
            dateOfBirth: undefined
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

  // Announcements routes
  app.get("/api/announcements", async (req, res) => {
    try {
      const announcements = await storage.getAllAnnouncements();
      res.json(announcements);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch announcements" });
    }
  });

  app.post("/api/announcements", requireAuth, async (req, res) => {
    try {
      const announcementData = insertAnnouncementSchema.parse(req.body);
      const announcement = await storage.createAnnouncement(announcementData);
      res.json(announcement);
    } catch (error) {
      res.status(400).json({ message: "Invalid announcement data" });
    }
  });

  app.put("/api/announcements/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const announcementData = insertAnnouncementSchema.partial().parse(req.body);
      const announcement = await storage.updateAnnouncement(id, announcementData);
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
      const { id } = req.params;
      const deleted = await storage.deleteAnnouncement(id);
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
      const events = await storage.getAllEvents();
      
      // Add RSVP count to each event
      const eventsWithRsvpCount = await Promise.all(
        events.map(async (event) => {
          if (event.rsvpEnabled) {
            const rsvpStats = await storage.getEventRsvps(event.id);
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
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  app.get("/api/events/locations", async (req, res) => {
    try {
      const locations = await storage.getEventLocations();
      res.json(locations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch event locations" });
    }
  });

  app.post("/api/events", requireAuth, async (req, res) => {
    try {
      const eventData = insertEventSchema.parse(req.body);
      const event = await storage.createEvent(eventData);
      res.json(event);
    } catch (error) {
      res.status(400).json({ message: "Invalid event data" });
    }
  });

  app.put("/api/events/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const eventData = insertEventSchema.partial().parse(req.body);
      const event = await storage.updateEvent(id, eventData);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      res.status(400).json({ message: "Invalid event data" });
    }
  });

  app.delete("/api/events/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteEvent(id);
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
      const { id } = req.params;
      const rsvpStats = await storage.getEventRsvps(id);
      res.json(rsvpStats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch RSVPs" });
    }
  });

  app.post("/api/events/:id/rsvp", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { adultsCount, childrenCount } = req.body;
      
      // Get event to check max attendees
      const event = await storage.getEvent(id);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      // If max attendees is set, check capacity
      if (event.maxAttendees) {
        const rsvpStats = await storage.getEventRsvps(id);
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
        adultsCount: adultsCount || 1,
        childrenCount: childrenCount || 0
      };
      
      const rsvp = await storage.createEventRsvp(rsvpData);

      // Log activity
      const pointsSettings = await storage.getPointsSettings();
      const points = event.pointsValue || pointsSettings?.pointsPerEvent || 20;
      
      await storage.createActivityLog({
        userId: req.user!.id,
        activityType: 'event_rsvp',
        description: `RSVP na događaj: ${event.name}`,
        points,
        relatedEntityId: id,
      });

      res.json(rsvp);
    } catch (error) {
      res.status(400).json({ message: "Failed to create RSVP" });
    }
  });

  app.put("/api/events/:eventId/rsvp/:rsvpId", requireAuth, async (req, res) => {
    try {
      const { rsvpId } = req.params;
      const { adultsCount, childrenCount } = req.body;
      
      const rsvp = await storage.updateEventRsvp(rsvpId, {
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
      const { rsvpId } = req.params;
      const deleted = await storage.deleteEventRsvp(rsvpId);
      
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
      const { eventId } = req.params;
      const rsvp = await storage.getUserEventRsvp(eventId, req.user!.id);
      res.json(rsvp);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user RSVP" });
    }
  });

  // Work Groups routes
  app.get("/api/work-groups", async (req, res) => {
    try {
      // Proslijedi userId i isAdmin za filtriranje po vidljivosti
      const userId = req.user?.id;
      const isAdmin = req.user?.isAdmin || false;
      const isClanIO = req.user?.roles?.includes('clan_io') || false;
      
      // Član IO i Admin vide sve sekcije (javne i privatne)
      const canSeeAll = isAdmin || isClanIO;
      
      const workGroups = await storage.getAllWorkGroups(userId, canSeeAll);
      
      // FILTER ARCHIVED SECTIONS FOR NON-ADMIN USERS
      const filteredWorkGroups = isAdmin 
        ? workGroups 
        : workGroups.filter(wg => !wg.archived);
      
      // Add members to each work group
      const workGroupsWithMembers = await Promise.all(
        filteredWorkGroups.map(async (wg) => {
          const members = await storage.getWorkGroupMembers(wg.id);
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

  app.post("/api/work-groups", requireAuth, async (req, res) => {
    try {
      const workGroupData = insertWorkGroupSchema.parse(req.body);
      const workGroup = await storage.createWorkGroup(workGroupData);
      res.json(workGroup);
    } catch (error) {
      res.status(400).json({ message: "Invalid work group data" });
    }
  });

  app.put("/api/work-groups/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;

      // Check if work group exists
      const workGroup = await storage.getWorkGroup(id);
      if (!workGroup) {
        return res.status(404).json({ message: "Work group not found" });
      }

      // Authorization check: Only admins or group moderators can update
      const isAdmin = req.user!.isAdmin;
      const isModerator = await storage.isUserModeratorOfWorkGroup(id, req.user!.id);
      
      if (!isAdmin && !isModerator) {
        return res.status(403).json({ message: "Forbidden: Only admins or group moderators can update work groups" });
      }

      const updates = insertWorkGroupSchema.partial().parse(req.body);
      const updatedWorkGroup = await storage.updateWorkGroup(id, updates);
      
      res.json(updatedWorkGroup);
    } catch (error) {
      res.status(400).json({ message: "Invalid work group data" });
    }
  });

  app.post("/api/work-groups/:id/archive", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;

      // Check if work group exists
      const workGroup = await storage.getWorkGroup(id);
      if (!workGroup) {
        return res.status(404).json({ message: "Work group not found" });
      }

      // Toggle archive status
      const updatedWorkGroup = await storage.updateWorkGroup(id, { archived: !workGroup.archived });
      
      res.json(updatedWorkGroup);
    } catch (error) {
      res.status(500).json({ message: "Failed to archive work group" });
    }
  });

  app.delete("/api/work-groups/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;

      // Check if work group exists
      const workGroup = await storage.getWorkGroup(id);
      if (!workGroup) {
        return res.status(404).json({ message: "Work group not found" });
      }

      // Delete work group
      const deleted = await storage.deleteWorkGroup(id);
      
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
  app.post("/api/work-groups/:id/members", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      // Check if work group exists
      const workGroup = await storage.getWorkGroup(id);
      if (!workGroup) {
        return res.status(404).json({ message: "Work group not found" });
      }

      // Authorization check: Only admins or group moderators can add members
      const isAdmin = req.user!.isAdmin;
      const isModerator = await storage.isUserModeratorOfWorkGroup(id, req.user!.id);
      
      if (!isAdmin && !isModerator) {
        return res.status(403).json({ message: "Forbidden: Only admins or group moderators can add members" });
      }

      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user is already a member
      const isAlreadyMember = await storage.isUserMemberOfWorkGroup(id, userId);
      if (isAlreadyMember) {
        return res.status(409).json({ message: "User is already a member of this work group" });
      }

      const member = await storage.addMemberToWorkGroup(id, userId);
      res.json(member);
    } catch (error) {
      res.status(500).json({ message: "Failed to add member to work group" });
    }
  });

  app.delete("/api/work-groups/:id/members/:userId", requireAuth, async (req, res) => {
    try {
      const { id, userId } = req.params;

      // Check if work group exists
      const workGroup = await storage.getWorkGroup(id);
      if (!workGroup) {
        return res.status(404).json({ message: "Work group not found" });
      }

      // Authorization check: Only admins or group moderators can remove members
      // Or users can remove themselves
      const isAdmin = req.user!.isAdmin;
      const isModerator = await storage.isUserModeratorOfWorkGroup(id, req.user!.id);
      const isSelfRemoval = userId === req.user!.id;
      
      if (!isAdmin && !isModerator && !isSelfRemoval) {
        return res.status(403).json({ message: "Forbidden: Only admins, group moderators, or the user themselves can remove members" });
      }

      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const removed = await storage.removeMemberFromWorkGroup(id, userId);
      if (!removed) {
        return res.status(404).json({ message: "User is not a member of this work group" });
      }

      res.json({ message: "Member removed from work group successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove member from work group" });
    }
  });

  app.get("/api/work-groups/:id/members", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;

      // Check if work group exists
      const workGroup = await storage.getWorkGroup(id);
      if (!workGroup) {
        return res.status(404).json({ message: "Work group not found" });
      }

      const members = await storage.getWorkGroupMembers(id);
      
      // Get user details for each member
      const membersWithUserDetails = await Promise.all(
        members.map(async (member) => {
          const user = await storage.getUser(member.userId);
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
  app.put("/api/work-groups/:workGroupId/members/:userId/moderator", requireAdmin, async (req, res) => {
    try {
      const { workGroupId, userId } = req.params;
      const { isModerator } = req.body;

      if (typeof isModerator !== 'boolean') {
        return res.status(400).json({ message: "isModerator must be a boolean" });
      }

      // Check if work group exists
      const workGroup = await storage.getWorkGroup(workGroupId);
      if (!workGroup) {
        return res.status(404).json({ message: "Work group not found" });
      }

      // Check if target user exists
      const targetUser = await storage.getUser(userId);
      if (!targetUser) {
        return res.status(404).json({ message: "Target user not found" });
      }

      // Check if user is a member
      const isMember = await storage.isUserMemberOfWorkGroup(workGroupId, userId);
      if (!isMember) {
        return res.status(404).json({ message: "User is not a member of this work group" });
      }

      const member = await storage.setModerator(workGroupId, userId, isModerator);
      if (!member) {
        return res.status(404).json({ message: "Failed to update moderator status" });
      }

      res.json(member);
    } catch (error) {
      res.status(500).json({ message: "Failed to update moderator status" });
    }
  });

  app.get("/api/work-groups/:id/moderators", async (req, res) => {
    try {
      const { id } = req.params;

      // Check if work group exists
      const workGroup = await storage.getWorkGroup(id);
      if (!workGroup) {
        return res.status(404).json({ message: "Work group not found" });
      }

      const moderators = await storage.getWorkGroupModerators(id);
      res.json(moderators);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch moderators" });
    }
  });

  app.get("/api/users/:id/work-groups", async (req, res) => {
    try {
      const { id } = req.params;

      // Check if user exists
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const userWorkGroups = await storage.getUserWorkGroups(id);
      res.json(userWorkGroups);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user work groups" });
    }
  });

  // Tasks routes
  app.get("/api/work-groups/:workGroupId/tasks", async (req, res) => {
    try {
      const { workGroupId } = req.params;
      const tasks = await storage.getTasksByWorkGroup(workGroupId);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.get("/api/tasks/dashboard", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const isAdmin = req.user!.isAdmin || false;
      
      const tasks = await storage.getAllTasksWithWorkGroup(userId, isAdmin);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard tasks" });
    }
  });

  app.get("/api/tasks/admin-archive", requireAdmin, async (req, res) => {
    try {
      const userId = req.user!.id;
      const isAdmin = true;
      
      const tasks = await storage.getAllTasksWithWorkGroup(userId, isAdmin);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch admin archive tasks" });
    }
  });

  app.post("/api/tasks", requireAuth, async (req, res) => {
    try {
      const taskData = insertTaskSchema.parse(req.body);
      
      // Check if work group exists
      const workGroup = await storage.getWorkGroup(taskData.workGroupId);
      if (!workGroup) {
        return res.status(404).json({ message: "Work group not found" });
      }

      // Authorization check: Only admins or group moderators can create tasks
      const isAdmin = req.user!.isAdmin;
      const isModerator = await storage.isUserModeratorOfWorkGroup(taskData.workGroupId, req.user!.id);
      
      if (!isAdmin && !isModerator) {
        return res.status(403).json({ message: "Forbidden: Only admins or group moderators can create tasks" });
      }

      const task = await storage.createTask(taskData);
      res.json(task);
    } catch (error) {
      res.status(400).json({ message: "Invalid task data" });
    }
  });

  app.put("/api/tasks/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const taskData = insertTaskSchema.partial().parse(req.body);
      
      // Get existing task to check work group
      const existingTask = await storage.getTask(id);
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
      const isModerator = await storage.isUserModeratorOfWorkGroup(existingTask.workGroupId, req.user!.id);
      const isAssignedUser = existingTask.assignedUserIds?.includes(req.user!.id) || false;
      
      // If not admin or moderator, only allow assigned user to change status to na_cekanju
      if (!isAdmin && !isModerator) {
        if (!isAssignedUser || Object.keys(taskData).length !== 1 || !taskData.status || taskData.status !== 'na_cekanju') {
          return res.status(403).json({ message: "Forbidden: Only admins or group moderators can update tasks" });
        }
      }

      // Set completedAt timestamp when task is marked as completed
      if (taskData.status === 'završeno' && existingTask.status !== 'završeno') {
        taskData.completedAt = new Date();
      }

      const task = await storage.updateTask(id, taskData);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      // Activity logging when task status changes
      const statusChanged = taskData.status && existingTask.status !== taskData.status;

      if (statusChanged) {
        const workGroup = await storage.getWorkGroup(task.workGroupId);
        const settings = await storage.getPointsSettings();
        const points = task.pointsValue || settings?.pointsPerTask || 50;

        // If assigned user marked as na_cekanju (pending approval), log for that user WITHOUT points
        // Points are only awarded when admin approves (završeno status)
        if (taskData.status === 'na_cekanju' && isAssignedUser && !isAdmin && !isModerator && existingTask.status !== 'na_cekanju') {
          await storage.createActivityLog({
            userId: req.user!.id,
            activityType: 'task_completed',
            description: `Završen zadatak: ${task.title} u sekciji ${workGroup?.name || 'Nepoznata'} (čeka odobrenje)`,
            points: 0, // No points until admin approves
            relatedEntityId: task.id,
          });
        }
        
        // If admin/moderator marks as završeno (approved), log for all assigned users WITH points
        // This happens when admin approves the task or directly marks it as finished
        if (taskData.status === 'završeno' && existingTask.status !== 'završeno' && task.assignedUserIds && task.assignedUserIds.length > 0) {
          for (const userId of task.assignedUserIds) {
            await storage.createActivityLog({
              userId,
              activityType: 'task_completed',
              description: `Završen zadatak: ${task.title} u sekciji ${workGroup?.name || 'Nepoznata'}`,
              points,
              relatedEntityId: task.id,
            });
          }
        }
      }

      res.json(task);
    } catch (error) {
      res.status(400).json({ message: "Invalid task data" });
    }
  });

  app.delete("/api/tasks/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Get existing task to check work group
      const existingTask = await storage.getTask(id);
      if (!existingTask) {
        return res.status(404).json({ message: "Task not found" });
      }

      // PREVENT DELETING COMPLETED OR ARCHIVED TASKS
      if (existingTask.status === 'završeno' || existingTask.status === 'arhiva') {
        return res.status(403).json({ message: "Završeni i arhivirani zadaci ne mogu biti obrisani. Zadatak je zaključan." });
      }

      // Authorization check: Only admins or group moderators can delete tasks
      const isAdmin = req.user!.isAdmin;
      const isModerator = await storage.isUserModeratorOfWorkGroup(existingTask.workGroupId, req.user!.id);
      
      if (!isAdmin && !isModerator) {
        return res.status(403).json({ message: "Forbidden: Only admins or group moderators can delete tasks" });
      }

      const deleted = await storage.deleteTask(id);
      if (!deleted) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json({ message: "Task deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  app.patch("/api/tasks/:taskId/move", requireAuth, async (req, res) => {
    try {
      const { taskId } = req.params;
      const { newWorkGroupId } = req.body;

      if (!newWorkGroupId) {
        return res.status(400).json({ message: "New work group ID is required" });
      }

      // Get existing task to check current work group
      const existingTask = await storage.getTask(taskId);
      if (!existingTask) {
        return res.status(404).json({ message: "Task not found" });
      }

      // Authorization check: Only admins or moderators of current group can move tasks
      const isAdmin = req.user!.isAdmin;
      const isModerator = await storage.isUserModeratorOfWorkGroup(existingTask.workGroupId, req.user!.id);
      
      if (!isAdmin && !isModerator) {
        return res.status(403).json({ message: "Forbidden: Only admins or group moderators can move tasks" });
      }

      // Check if new work group exists
      const newWorkGroup = await storage.getWorkGroup(newWorkGroupId);
      if (!newWorkGroup) {
        return res.status(404).json({ message: "New work group not found" });
      }

      // Move the task
      const movedTask = await storage.moveTaskToWorkGroup(taskId, newWorkGroupId);
      if (!movedTask) {
        return res.status(500).json({ message: "Failed to move task" });
      }

      res.json(movedTask);
    } catch (error) {
      res.status(500).json({ message: "Failed to move task" });
    }
  });

  // Task Comments routes
  app.get("/api/tasks/:taskId/comments", async (req, res) => {
    try {
      const { taskId } = req.params;
      
      // Check if task exists
      const task = await storage.getTask(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      const comments = await storage.getTaskComments(taskId);
      
      // Get user details for each comment
      const commentsWithUserDetails = await Promise.all(
        comments.map(async (comment) => {
          const user = await storage.getUser(comment.userId);
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

  app.post("/api/tasks/:taskId/comments", requireAuth, async (req, res) => {
    try {
      const { taskId } = req.params;
      const { content, commentImage } = req.body;

      if (!content && !commentImage) {
        return res.status(400).json({ message: "Content or image is required" });
      }

      // Use authenticated user's ID - prevents identity spoofing
      const userId = req.user!.id;
      const user = req.user!;

      // Check if task exists
      const task = await storage.getTask(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      // Check if user is a member of the work group this task belongs to (admins can comment on any task)
      if (!user.isAdmin) {
        const isMember = await storage.isUserMemberOfWorkGroup(task.workGroupId, userId);
        if (!isMember) {
          return res.status(403).json({ message: "Forbidden: Only work group members can comment on tasks" });
        }
      }

      const commentData = insertTaskCommentSchema.parse({ 
        taskId, 
        userId, 
        content,
        commentImage: commentImage || null 
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

  app.delete("/api/comments/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;

      // Get the comment to check ownership and work group
      const comment = await storage.getTaskComment(id);
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }

      // Get the task to find the work group
      const task = await storage.getTask(comment.taskId);
      if (!task) {
        return res.status(404).json({ message: "Associated task not found" });
      }

      // Check authorization: admin, work group moderator, or comment author
      const isAdmin = req.user!.isAdmin;
      const isModerator = await storage.isUserModeratorOfWorkGroup(task.workGroupId, req.user!.id);
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


  // Announcement Files
  app.get("/api/announcements/:announcementId/files", async (req, res) => {
    try {
      const { announcementId } = req.params;
      
      // Check if announcement exists
      const announcement = await storage.getAnnouncement(announcementId);
      if (!announcement) {
        return res.status(404).json({ message: "Announcement not found" });
      }

      const files = await storage.getAnnouncementFiles(announcementId);
      
      // Get user details for each file
      const filesWithUserDetails = await Promise.all(
        files.map(async (file) => {
          const user = await storage.getUser(file.uploadedById);
          return {
            ...file,
            uploadedBy: user ? { 
              id: user.id, 
              firstName: user.firstName, 
              lastName: user.lastName 
            } : null
          };
        })
      );
      
      res.json(filesWithUserDetails);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch announcement files" });
    }
  });

  app.post("/api/announcements/:announcementId/files", requireAuth, async (req, res) => {
    try {
      const { announcementId } = req.params;
      const { fileName, fileType, fileSize } = req.body;

      if (!fileName || !fileType || !fileSize) {
        return res.status(400).json({ message: "fileName, fileType, and fileSize are required" });
      }

      // Use authenticated user's ID - prevents identity spoofing
      const uploadedById = req.user!.id;
      const user = req.user!;

      // Validate file type for security
      const allowedFileTypes = ['image', 'pdf', 'document'];
      if (!allowedFileTypes.includes(fileType)) {
        return res.status(400).json({ message: "Invalid file type. Allowed types: image, pdf, document" });
      }

      // Validate file size (10MB limit)
      if (fileSize > 10 * 1024 * 1024) {
        return res.status(400).json({ message: "File size too large. Maximum 10MB allowed" });
      }

      // Check if announcement exists
      const announcement = await storage.getAnnouncement(announcementId);
      if (!announcement) {
        return res.status(404).json({ message: "Announcement not found" });
      }

      // Only admins can upload files to announcements
      if (!user.isAdmin) {
        return res.status(403).json({ message: "Forbidden: Only admins can upload announcement files" });
      }

      // Generate secure file path server-side
      const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const timestamp = Date.now();
      const secureFilePath = `/uploads/announcements/${announcementId}/${timestamp}_${sanitizedFileName}`;

      const fileData = insertAnnouncementFileSchema.parse({
        announcementId,
        uploadedById,
        fileName: sanitizedFileName,
        fileType,
        fileSize,
        filePath: secureFilePath
      });
      
      const file = await storage.createAnnouncementFile(fileData);
      
      // Get user details for the response
      const fileWithUser = {
        ...file,
        uploadedBy: { 
          id: user.id, 
          firstName: user.firstName, 
          lastName: user.lastName 
        }
      };
      
      res.json(fileWithUser);
    } catch (error) {
      res.status(400).json({ message: "Invalid file data" });
    }
  });

  app.delete("/api/announcement-files/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;

      // Get the file to check ownership
      const file = await storage.getAnnouncementFile(id);
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }

      // Check authorization: admin or file uploader
      const isAdmin = req.user!.isAdmin;
      const isUploader = file.uploadedById === req.user!.id;

      if (!isAdmin && !isUploader) {
        return res.status(403).json({ message: "Forbidden: Only admins or file uploaders can delete files" });
      }

      const deleted = await storage.deleteAnnouncementFile(id);
      if (!deleted) {
        return res.status(404).json({ message: "File not found" });
      }
      res.json({ message: "File deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete file" });
    }
  });

  // Access Requests routes
  app.get("/api/access-requests", requireAdmin, async (req, res) => {
    try {
      const requests = await storage.getAllAccessRequests();
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch access requests" });
    }
  });

  app.get("/api/access-requests/my", requireAuth, async (req, res) => {
    try {
      const requests = await storage.getUserAccessRequests(req.user!.id);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user access requests" });
    }
  });

  app.post("/api/access-requests", requireAuth, async (req, res) => {
    try {
      const requestData = insertAccessRequestSchema.parse(req.body);
      const request = await storage.createAccessRequest(requestData);
      res.json(request);
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  app.put("/api/access-requests/:id", requireAdmin, async (req, res) => {
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
      const [userCount, newAnnouncementsCount, upcomingEventsCount, activeTasksCount] = await Promise.all([
        storage.getUserCount(),
        storage.getNewAnnouncementsCount(7),
        storage.getUpcomingEventsCount(),
        storage.getActiveTasksCount()
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
      const relationships = await storage.getUserFamilyRelationships(userId);
      
      // Get user details for each relationship
      const relationshipsWithUsers = await Promise.all(
        relationships.map(async (rel) => {
          const relatedUser = await storage.getUser(
            rel.userId === userId ? rel.relatedUserId : rel.userId
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
      
      res.json(relationshipsWithUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch family relationships" });
    }
  });

  app.post("/api/family-relationships", requireAuth, async (req, res) => {
    try {
      const relationshipData = insertFamilyRelationshipSchema.parse(req.body);
      const relationship = await storage.createFamilyRelationship(relationshipData);
      res.json(relationship);
    } catch (error) {
      res.status(400).json({ message: "Invalid family relationship data" });
    }
  });

  app.delete("/api/family-relationships/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteFamilyRelationship(id);
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
      const relationships = await storage.getFamilyMembersByRelationship(userId, relationship);
      res.json(relationships);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch family members by relationship" });
    }
  });

  // Messages routes
  app.get("/api/messages/conversations", requireAuth, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const conversations = await storage.getConversations(req.user.id);
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.get("/api/messages", requireAuth, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const messages = await storage.getMessages(req.user.id);
      
      const messagesWithSenderInfo = await Promise.all(
        messages.map(async (msg) => {
          const sender = await storage.getUser(msg.senderId);
          const recipient = msg.recipientId ? await storage.getUser(msg.recipientId) : null;
          
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

  app.get("/api/messages/unread-count", requireAuth, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const count = await storage.getUnreadCount(req.user.id);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch unread count" });
    }
  });

  app.get("/api/messages/thread/:threadId", requireAuth, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { threadId } = req.params;
      const thread = await storage.getMessageThread(threadId, req.user.id);
      
      const threadWithUserInfo = await Promise.all(
        thread.map(async (msg) => {
          const sender = await storage.getUser(msg.senderId);
          const recipient = msg.recipientId ? await storage.getUser(msg.recipientId) : null;
          
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

  app.post("/api/messages", requireAuth, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const messageData = insertMessageSchema.parse(req.body);

      if (messageData.senderId !== req.user.id) {
        return res.status(403).json({ message: "Cannot send message as another user" });
      }

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

  app.put("/api/messages/:id/read", requireAuth, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { id } = req.params;
      const message = await storage.markAsRead(id, req.user.id);
      
      if (!message) {
        return res.status(404).json({ message: "Message not found or you don't have permission" });
      }

      res.json(message);
    } catch (error) {
      res.status(500).json({ message: "Failed to mark message as read" });
    }
  });

  app.put("/api/messages/thread/:threadId/read", requireAuth, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { threadId } = req.params;
      await storage.markThreadAsRead(threadId, req.user.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to mark thread as read" });
    }
  });

  app.delete("/api/messages/:id", requireAuth, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { id } = req.params;
      const deleted = await storage.deleteMessage(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Message not found" });
      }

      res.json({ message: "Message deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete message" });
    }
  });

  // Imam Questions routes
  app.get("/api/imam-questions", requireAuth, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const userId = req.user.isAdmin ? undefined : req.user.id;
      const questions = await storage.getImamQuestions(userId);
      
      const questionsWithUserInfo = await Promise.all(
        questions.map(async (q) => {
          const user = await storage.getUser(q.userId);
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

  app.post("/api/imam-questions", requireAuth, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const questionData = {
        userId: req.user.id,
        subject: req.body.subject,
        question: req.body.question,
      };

      const question = await storage.createImamQuestion(questionData);
      res.status(201).json(question);
    } catch (error) {
      res.status(500).json({ message: "Failed to create imam question" });
    }
  });

  app.put("/api/imam-questions/:id/answer", requireAuth, async (req, res) => {
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

  app.put("/api/imam-questions/:id/read", requireAuth, async (req, res) => {
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

  app.delete("/api/imam-questions/:id", requireAuth, async (req, res) => {
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
      const settings = await storage.getOrganizationSettings();
      if (!settings) {
        return res.status(404).json({ message: "Organization settings not found" });
      }
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to get organization settings" });
    }
  });

  app.put("/api/organization-settings", requireAdmin, async (req, res) => {
    try {
      const settingsData = insertOrganizationSettingsSchema.parse(req.body);
      const updatedSettings = await storage.updateOrganizationSettings(settingsData);
      res.json(updatedSettings);
    } catch (error) {
      res.status(400).json({ message: "Invalid organization settings data" });
    }
  });

  // Documents routes
  app.get("/api/documents", requireAuth, async (req, res) => {
    try {
      const documents = await storage.getAllDocuments();
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Failed to get documents" });
    }
  });

  app.post("/api/documents", requireAdmin, async (req, res) => {
    try {
      const documentData = insertDocumentSchema.parse(req.body);
      const document = await storage.createDocument(documentData);
      res.status(201).json(document);
    } catch (error) {
      res.status(400).json({ message: "Invalid document data" });
    }
  });

  app.delete("/api/documents/:id", requireAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteDocument(req.params.id);
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
      const requests = await storage.getAllRequests();
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Failed to get requests" });
    }
  });

  app.get("/api/requests/my", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const requests = await storage.getUserRequests(userId);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user requests" });
    }
  });

  app.post("/api/requests", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const requestData = insertRequestSchema.parse({
        ...req.body,
        userId
      });
      const request = await storage.createRequest(requestData);
      res.status(201).json(request);
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  app.put("/api/requests/:id/status", requireAdmin, async (req, res) => {
    try {
      const { status, adminNotes } = req.body;
      const reviewedById = req.session.userId!;
      const request = await storage.updateRequestStatus(
        req.params.id,
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
  app.get("/api/shop/products", requireAuth, async (req, res) => {
    try {
      const products = await storage.getAllShopProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to get products" });
    }
  });

  app.post("/api/shop/products", requireAdmin, async (req, res) => {
    try {
      const createdById = req.session.userId!;
      const productData = insertShopProductSchema.parse({
        ...req.body,
        createdById
      });
      const product = await storage.createShopProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      res.status(400).json({ message: "Invalid product data" });
    }
  });

  app.put("/api/shop/products/:id", requireAdmin, async (req, res) => {
    try {
      const product = await storage.updateShopProduct(req.params.id, req.body);
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
      const deleted = await storage.deleteShopProduct(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Marketplace Items routes
  app.get("/api/marketplace/items", requireAuth, async (req, res) => {
    try {
      const items = await storage.getAllMarketplaceItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to get marketplace items" });
    }
  });

  app.post("/api/marketplace/items", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const itemData = insertMarketplaceItemSchema.parse({
        ...req.body,
        userId
      });
      const item = await storage.createMarketplaceItem(itemData);
      res.status(201).json(item);
    } catch (error) {
      res.status(400).json({ message: "Invalid item data" });
    }
  });

  app.put("/api/marketplace/items/:id", requireAuth, async (req, res) => {
    try {
      const item = await storage.getMarketplaceItem(req.params.id);
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      // Allow update only by owner or admin
      const user = await storage.getUser(req.session.userId!);
      const isAdmin = user?.isAdmin || false;
      if (item.userId !== req.session.userId && !isAdmin) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const updatedItem = await storage.updateMarketplaceItem(req.params.id, req.body);
      if (!updatedItem) {
        return res.status(404).json({ message: "Item not found" });
      }
      res.json(updatedItem);
    } catch (error) {
      res.status(500).json({ message: "Failed to update item" });
    }
  });

  app.delete("/api/marketplace/items/:id", requireAuth, async (req, res) => {
    try {
      const item = await storage.getMarketplaceItem(req.params.id);
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      // Allow deletion only by owner or admin
      const user = await storage.getUser(req.session.userId!);
      const isAdmin = user?.isAdmin || false;
      if (item.userId !== req.session.userId && !isAdmin) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const deleted = await storage.deleteMarketplaceItem(req.params.id);
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
      const services = await storage.getAllServicesWithUsers();
      res.json(services);
    } catch (error) {
      res.status(500).json({ message: "Failed to get services" });
    }
  });

  app.post("/api/services", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const serviceData = insertServiceSchema.parse({
        ...req.body,
        userId
      });
      const service = await storage.createService(serviceData);
      res.status(201).json(service);
    } catch (error) {
      res.status(400).json({ message: "Invalid service data" });
    }
  });

  app.put("/api/services/:id", requireAuth, async (req, res) => {
    try {
      const service = await storage.getService(req.params.id);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      
      // Allow edit only by owner or admin
      const user = await storage.getUser(req.session.userId!);
      const isAdmin = user?.isAdmin || false;
      if (service.userId !== req.session.userId && !isAdmin) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const updated = await storage.updateService(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update service" });
    }
  });

  app.delete("/api/services/:id", requireAuth, async (req, res) => {
    try {
      const service = await storage.getService(req.params.id);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      
      // Allow deletion only by owner or admin
      const user = await storage.getUser(req.session.userId!);
      const isAdmin = user?.isAdmin || false;
      if (service.userId !== req.session.userId && !isAdmin) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const deleted = await storage.deleteService(req.params.id);
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
      const userId = req.session.userId!;
      const requestData = insertProductPurchaseRequestSchema.parse({
        ...req.body,
        userId
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
      
      const user = await storage.updateLastViewed(userId, type as any);
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
      const prayerTimes = await storage.getAllPrayerTimes();
      res.json(prayerTimes);
    } catch (error) {
      res.status(500).json({ message: "Failed to get prayer times" });
    }
  });

  app.get("/api/prayer-times/today", async (req, res) => {
    try {
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      const todayDate = `${day}.${month}.${year}`;
      
      const prayerTime = await storage.getPrayerTimeByDate(todayDate);
      if (!prayerTime) {
        return res.status(404).json({ message: "Prayer times not found for today" });
      }
      res.json(prayerTime);
    } catch (error) {
      res.status(500).json({ message: "Failed to get today's prayer times" });
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
        // Use semicolon as delimiter for SwissMosque CSV format
        const parts = line.split(';').map(p => p.trim());
        
        // Log first line for debugging
        if (i === 0) {
          console.log(`First data line has ${parts.length} parts:`, parts);
        }
        
        // Expected format: Datum;Hijri;Tag;Fajr-Beginn;Sonnenaufgang;Dhuhr;Asr;Maghrib;Isha;Wichtige Ereignisse
        if (parts.length >= 9) {
          const [date, hijri, day, fajr, sunrise, dhuhr, asr, maghrib, isha, events] = parts;
          
          // Validate that we have at least the required fields (date and prayer times)
          // Date should be in format dd.mm.yyyy
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
            console.log('First line validation failed:', { date, fajr, dhuhr, asr, maghrib, isha });
          }
        } else if (i === 0) {
          console.log(`First line has only ${parts.length} parts, expected at least 9`);
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
      const created = await storage.bulkCreatePrayerTimes(prayerTimes);
      
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
  app.get("/api/important-dates", async (req, res) => {
    try {
      const dates = await storage.getAllImportantDates();
      res.json(dates);
    } catch (error) {
      res.status(500).json({ message: "Failed to get important dates" });
    }
  });

  app.post("/api/important-dates", requireAdmin, async (req, res) => {
    try {
      console.log('Creating important date with data:', req.body);
      const date = await storage.createImportantDate(req.body);
      res.status(201).json(date);
    } catch (error) {
      console.error('Error creating important date:', error);
      res.status(500).json({ message: "Failed to create important date" });
    }
  });

  app.put("/api/important-dates/:id", requireAdmin, async (req, res) => {
    try {
      const date = await storage.updateImportantDate(req.params.id, req.body);
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
      const success = await storage.deleteImportantDate(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Important date not found" });
      }
      res.json({ message: "Important date deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete important date" });
    }
  });

  // Financial Contributions Routes (Feature 1)
  app.get("/api/financial-contributions", requireAdmin, async (req, res) => {
    try {
      const contributions = await storage.getAllFinancialContributions();
      res.json(contributions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get financial contributions" });
    }
  });

  app.get("/api/financial-contributions/user/:userId", requireAuth, async (req, res) => {
    try {
      // Only admins or the user themselves can view contributions
      if (req.user?.id !== req.params.userId && !req.user?.isAdmin) {
        return res.status(403).json({ message: "Access denied" });
      }
      const contributions = await storage.getUserFinancialContributions(req.params.userId);
      res.json(contributions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user contributions" });
    }
  });

  app.post("/api/financial-contributions", requireAdmin, async (req, res) => {
    try {
      const { points: bonusPoints, ...contributionData } = req.body;
      const validated = insertFinancialContributionSchema.parse(contributionData);
      const contribution = await storage.createFinancialContribution({
        ...validated,
        createdById: req.user!.id
      });

      // If contribution is for a project, update project's currentAmount
      if (validated.projectId) {
        const project = await storage.getProject(validated.projectId);
        if (project) {
          const currentAmount = parseFloat(project.currentAmount || '0');
          const contributionAmount = parseFloat(validated.amount);
          const newAmount = (currentAmount + contributionAmount).toFixed(2);
          
          await storage.updateProject(validated.projectId, {
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
      });

      // If bonus points were added, create a separate activity log entry
      if (bonusPoints && bonusPoints > 0) {
        await storage.createActivityLog({
          userId: validated.userId,
          activityType: 'bonus_points',
          description: `Bonus bodovi za uplatu: ${validated.amount} CHF`,
          points: parseInt(bonusPoints),
          relatedEntityId: contribution.id,
        });
      }

      // If contribution is for a project, create additional activity log
      if (validated.projectId) {
        const project = await storage.getProject(validated.projectId);
        if (project) {
          await storage.createActivityLog({
            userId: validated.userId,
            activityType: 'project_contribution',
            description: `Doprinos projektu: ${project.name} (${validated.amount} CHF)`,
            points: 0, // Points already awarded in contribution_made log
            relatedEntityId: contribution.id,
          });
        }
      }

      // Recalculate user's total points
      await storage.recalculateUserPoints(validated.userId);

      res.status(201).json(contribution);
    } catch (error) {
      console.error('Error creating financial contribution:', error);
      res.status(500).json({ message: "Failed to create financial contribution" });
    }
  });

  app.put("/api/financial-contributions/:id", requireAdmin, async (req, res) => {
    try {
      const validated = insertFinancialContributionSchema.partial().parse(req.body);
      
      // Get existing contribution to handle project updates
      const existingContribution = await storage.getFinancialContribution(req.params.id);
      if (!existingContribution) {
        return res.status(404).json({ message: "Contribution not found" });
      }

      const userId = existingContribution.userId;
      const oldProjectId = existingContribution.projectId;

      // Delete old activity log entries for this contribution
      // Note: Both contribution_made and project_contribution logs use contributionId as relatedEntityId
      await storage.deleteActivityLogByRelatedEntity(req.params.id);

      const contribution = await storage.updateFinancialContribution(req.params.id, validated);
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
          const oldProject = await storage.getProject(oldProjectId);
          if (oldProject) {
            const currentAmount = parseFloat(oldProject.currentAmount || '0');
            const updatedAmount = Math.max(0, currentAmount - oldAmount).toFixed(2);
            await storage.updateProject(oldProjectId, { currentAmount: updatedAmount });
          }
        }
        // Add to new project
        if (newProjectId) {
          const newProject = await storage.getProject(newProjectId);
          if (newProject) {
            const currentAmount = parseFloat(newProject.currentAmount || '0');
            const updatedAmount = (currentAmount + newAmount).toFixed(2);
            await storage.updateProject(newProjectId, { currentAmount: updatedAmount });
          }
        }
      } else if (newProjectId && oldAmount !== newAmount) {
        // Same project, different amount
        const project = await storage.getProject(newProjectId);
        if (project) {
          const currentAmount = parseFloat(project.currentAmount || '0');
          const updatedAmount = (currentAmount - oldAmount + newAmount).toFixed(2);
          await storage.updateProject(newProjectId, { currentAmount: updatedAmount });
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
      });

      // If contribution is for a project, create additional activity log
      if (newProjectId) {
        const project = await storage.getProject(newProjectId);
        if (project) {
          await storage.createActivityLog({
            userId: userId,
            activityType: 'project_contribution',
            description: `Doprinos projektu: ${project.name} (${newAmount} CHF)`,
            points: 0,
            relatedEntityId: req.params.id,
          });
        }
      }

      // Recalculate user's total points and re-check badges
      await storage.recalculateUserPoints(userId);
      await storage.checkAndAwardBadges(userId);
      await storage.removeUnqualifiedBadges(userId);

      res.json(contribution);
    } catch (error) {
      res.status(500).json({ message: "Failed to update contribution" });
    }
  });

  app.patch("/api/financial-contributions/:id", requireAdmin, async (req, res) => {
    try {
      const validated = insertFinancialContributionSchema.partial().parse(req.body);
      
      // Get existing contribution to handle project updates
      const existingContribution = await storage.getFinancialContribution(req.params.id);
      if (!existingContribution) {
        return res.status(404).json({ message: "Contribution not found" });
      }

      const contribution = await storage.updateFinancialContribution(req.params.id, validated);
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
          const oldProject = await storage.getProject(oldProjectId);
          if (oldProject) {
            const currentAmount = parseFloat(oldProject.currentAmount || '0');
            const updatedAmount = Math.max(0, currentAmount - oldAmount).toFixed(2);
            await storage.updateProject(oldProjectId, { currentAmount: updatedAmount });
          }
        }
        // Add to new project
        if (newProjectId) {
          const newProject = await storage.getProject(newProjectId);
          if (newProject) {
            const currentAmount = parseFloat(newProject.currentAmount || '0');
            const updatedAmount = (currentAmount + newAmount).toFixed(2);
            await storage.updateProject(newProjectId, { currentAmount: updatedAmount });
          }
        }
      } else if (newProjectId && oldAmount !== newAmount) {
        // Same project, different amount
        const project = await storage.getProject(newProjectId);
        if (project) {
          const currentAmount = parseFloat(project.currentAmount || '0');
          const updatedAmount = (currentAmount - oldAmount + newAmount).toFixed(2);
          await storage.updateProject(newProjectId, { currentAmount: updatedAmount });
        }
      }

      res.json(contribution);
    } catch (error) {
      res.status(500).json({ message: "Failed to update contribution" });
    }
  });

  app.delete("/api/financial-contributions/:id", requireAdmin, async (req, res) => {
    try {
      // Delete contribution with all related logs in a transaction
      const { userId, projectId } = await storage.deleteContributionWithLogs(req.params.id);
      
      // Recalculate points and badges outside transaction
      await storage.recalculateUserPoints(userId);
      await storage.removeUnqualifiedBadges(userId);
      
      res.json({ message: "Contribution deleted successfully" });
    } catch (error) {
      if (error instanceof Error && error.message === 'Contribution not found') {
        return res.status(404).json({ message: "Contribution not found" });
      }
      res.status(500).json({ message: "Failed to delete contribution" });
    }
  });

  // Activity Log Routes (Feature 1)
  app.get("/api/activity-logs/user/:userId", requireAuth, async (req, res) => {
    try {
      // Only admins or the user themselves can view activity log
      if (req.user?.id !== req.params.userId && !req.user?.isAdmin) {
        return res.status(403).json({ message: "Access denied" });
      }
      const logs = await storage.getUserActivityLog(req.params.userId);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to get activity log" });
    }
  });

  app.get("/api/activity-logs", requireAdmin, async (req, res) => {
    try {
      const logs = await storage.getAllActivityLogs();
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
          recordedById: req.user!.id
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
      const attendance = await storage.getEventAttendance(req.params.eventId);
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
      const attendance = await storage.getUserEventAttendance(req.params.userId);
      res.json(attendance);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user attendance" });
    }
  });

  // Points Settings Routes (Feature 2)
  app.get("/api/point-settings", requireAuth, async (req, res) => {
    try {
      const settings = await storage.getPointsSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to get points settings" });
    }
  });

  app.put("/api/point-settings/:id", requireAdmin, async (req, res) => {
    try {
      const validated = insertPointsSettingsSchema.partial().parse(req.body);
      const settings = await storage.updatePointsSettings(validated);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to update points settings" });
    }
  });

  // Badges Routes (Feature 2)
  app.get("/api/badges", requireAuth, async (req, res) => {
    try {
      const badges = await storage.getAllBadges();
      res.json(badges);
    } catch (error) {
      res.status(500).json({ message: "Failed to get badges" });
    }
  });

  app.post("/api/badges", requireAdmin, async (req, res) => {
    try {
      const validated = insertBadgeSchema.parse(req.body);
      const badge = await storage.createBadge(validated);
      res.status(201).json(badge);
    } catch (error) {
      console.error('Error creating badge:', error);
      res.status(500).json({ message: "Failed to create badge" });
    }
  });

  app.put("/api/badges/:id", requireAdmin, async (req, res) => {
    try {
      const validated = insertBadgeSchema.partial().parse(req.body);
      const badge = await storage.updateBadge(req.params.id, validated);
      if (!badge) {
        return res.status(404).json({ message: "Badge not found" });
      }
      res.json(badge);
    } catch (error) {
      res.status(500).json({ message: "Failed to update badge" });
    }
  });

  app.delete("/api/badges/:id", requireAdmin, async (req, res) => {
    try {
      const success = await storage.deleteBadge(req.params.id);
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
      const badges = await storage.getUserBadges(req.params.userId);
      res.json(badges);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user badges" });
    }
  });

  app.post("/api/user-badges/check/:userId", requireAdmin, async (req, res) => {
    try {
      const awarded = await storage.checkAndAwardBadges(req.params.userId);
      res.json(awarded);
    } catch (error) {
      res.status(500).json({ message: "Failed to check and award badges" });
    }
  });

  app.post("/api/user-badges/check-all", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      
      for (const user of users) {
        // recalculateUserPoints automatically calls checkAndAwardBadges
        await storage.recalculateUserPoints(user.id);
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
      const allUserBadges = await storage.getAllUserBadges();
      res.json(allUserBadges);
    } catch (error) {
      res.status(500).json({ message: "Failed to get all user badges" });
    }
  });

  // Projects Routes (Feature 4)
  app.get("/api/projects", requireAuth, async (req, res) => {
    try {
      const projects = await storage.getAllProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Failed to get projects" });
    }
  });

  app.get("/api/projects/active", async (req, res) => {
    try {
      const projects = await storage.getActiveProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Failed to get active projects" });
    }
  });

  app.get("/api/projects/:id", requireAuth, async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
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
      console.log('Creating project with body:', req.body);
      const validated = insertProjectSchema.parse(req.body);
      console.log('Validated project data:', validated);
      const project = await storage.createProject({
        ...validated,
        createdById: req.user!.id
      });
      res.status(201).json(project);
    } catch (error) {
      console.error('Error creating project:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
      }
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  app.patch("/api/projects/:id", requireAdmin, async (req, res) => {
    try {
      const validated = insertProjectSchema.partial().parse(req.body);
      const project = await storage.updateProject(req.params.id, validated);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      console.error('Error updating project:', error);
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  app.delete("/api/projects/:id", requireAdmin, async (req, res) => {
    try {
      const success = await storage.deleteProject(req.params.id);
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
        storage.getUserTasksCompleted(userId),
        storage.getUserEventsAttended(userId),
        storage.getUserTotalDonations(userId),
        storage.recalculateUserPoints(userId)
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
      let preferences = await storage.getUserPreferences(userId);
      
      // If no preferences exist, create default ones
      if (!preferences) {
        preferences = await storage.createUserPreferences({
          userId,
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
      const { quickAccessShortcuts } = req.body;
      
      // Validate that shortcuts is an array
      if (!Array.isArray(quickAccessShortcuts)) {
        return res.status(400).json({ message: "quickAccessShortcuts must be an array" });
      }
      
      // Check if preferences exist
      let preferences = await storage.getUserPreferences(userId);
      
      if (!preferences) {
        // Create new preferences
        preferences = await storage.createUserPreferences({
          userId,
          quickAccessShortcuts
        });
      } else {
        // Update existing preferences
        preferences = await storage.updateUserPreferences(userId, {
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
      const { status, workGroupId } = req.query;

      let proposals;
      
      if (status) {
        proposals = await storage.getProposalsByStatus(status as string);
      } else if (workGroupId) {
        proposals = await storage.getProposalsByWorkGroup(workGroupId as string);
      } else {
        proposals = await storage.getAllProposals();
      }

      // Filter based on user role
      if (user.isAdmin || user.roles?.includes('clan_io')) {
        // Admins and IO members can see all proposals
        res.json(proposals);
      } else {
        // Regular members can only see proposals from their work groups
        const userWorkGroups = await storage.getUserWorkGroups(user.id);
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
        createdById: user.id
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
      const updated = await storage.updateProposal(req.params.id, validated);
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
        receipts = await storage.getAllReceipts();
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
      const receipt = await storage.getReceipt(req.params.id);
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
      const user = req.user!;
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ message: "Receipt file is required" });
      }
      
      const validated = insertReceiptSchema.parse({
        ...req.body,
        uploadedById: user.id,
        fileName: file.filename,
        fileUrl: `/uploads/${file.filename}`
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
      const updated = await storage.approveReceipt(req.params.id, user.id, reviewComment);
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
      
      const updated = await storage.rejectReceipt(req.params.id, user.id, reviewComment);
      res.json(updated);
    } catch (error) {
      console.error('Error rejecting receipt:', error);
      res.status(500).json({ message: "Failed to reject receipt" });
    }
  });

  // Certificate Templates Routes (Zahvalnice)
  app.get("/api/certificates/templates", requireAdmin, async (req, res) => {
    try {
      const templates = await storage.getAllCertificateTemplates();
      res.json(templates);
    } catch (error) {
      console.error('Error getting certificate templates:', error);
      res.status(500).json({ message: "Failed to get certificate templates" });
    }
  });

  app.post("/api/certificates/templates", requireAdmin, certificateUpload.single('templateImage'), async (req, res) => {
    try {
      const user = req.user as User;
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ message: "Template image is required" });
      }
      
      const validated = insertCertificateTemplateSchema.parse({
        ...req.body,
        templateImagePath: `/uploads/certificates/${file.filename}`,
        textPositionX: parseInt(req.body.textPositionX),
        textPositionY: parseInt(req.body.textPositionY),
        fontSize: parseInt(req.body.fontSize),
        createdById: user.id
      });
      
      const template = await storage.createCertificateTemplate(validated);
      res.status(201).json(template);
    } catch (error) {
      console.error('Error creating certificate template:', error);
      res.status(500).json({ message: "Failed to create certificate template" });
    }
  });

  app.put("/api/certificates/templates/:id", requireAdmin, async (req, res) => {
    try {
      const updates = {
        ...req.body,
        ...(req.body.textPositionX && { textPositionX: parseInt(req.body.textPositionX) }),
        ...(req.body.textPositionY && { textPositionY: parseInt(req.body.textPositionY) }),
        ...(req.body.fontSize && { fontSize: parseInt(req.body.fontSize) })
      };
      
      const updated = await storage.updateCertificateTemplate(req.params.id, updates);
      if (!updated) {
        return res.status(404).json({ message: "Certificate template not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error('Error updating certificate template:', error);
      res.status(500).json({ message: "Failed to update certificate template" });
    }
  });

  app.delete("/api/certificates/templates/:id", requireAdmin, async (req, res) => {
    try {
      const success = await storage.deleteCertificateTemplate(req.params.id);
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
  app.get("/api/certificates/user", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const certificates = await storage.getUserCertificates(user.id);
      res.json(certificates);
    } catch (error) {
      console.error('Error getting user certificates:', error);
      res.status(500).json({ message: "Failed to get user certificates" });
    }
  });

  app.get("/api/certificates/all", requireAdmin, async (req, res) => {
    try {
      const certificates = await storage.getAllUserCertificates();
      res.json(certificates);
    } catch (error) {
      console.error('Error getting all certificates:', error);
      res.status(500).json({ message: "Failed to get all certificates" });
    }
  });

  app.get("/api/certificates/unviewed-count", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const count = await storage.getUnviewedCertificatesCount(user.id);
      res.json({ count });
    } catch (error) {
      console.error('Error getting unviewed certificates count:', error);
      res.status(500).json({ message: "Failed to get unviewed certificates count" });
    }
  });

  app.post("/api/certificates/issue", requireAdmin, async (req, res) => {
    try {
      const { templateId, userIds, customMessage } = req.body;
      
      if (!templateId || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ message: "Template ID and user IDs are required" });
      }
      
      const template = await storage.getCertificateTemplate(templateId);
      if (!template) {
        return res.status(404).json({ message: "Certificate template not found" });
      }
      
      const issuedCertificates = [];
      
      for (const userId of userIds) {
        const user = await storage.getUser(userId);
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
          message: customMessage || null
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

  app.patch("/api/certificates/:id/viewed", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const certificate = await storage.getUserCertificate(req.params.id);
      
      if (!certificate) {
        return res.status(404).json({ message: "Certificate not found" });
      }
      
      if (certificate.userId !== user.id && !user.isAdmin) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updated = await storage.markCertificateAsViewed(req.params.id);
      res.json(updated);
    } catch (error) {
      console.error('Error marking certificate as viewed:', error);
      res.status(500).json({ message: "Failed to mark certificate as viewed" });
    }
  });

  app.delete("/api/certificates/:id", requireAdmin, async (req, res) => {
    try {
      const success = await storage.deleteCertificate(req.params.id);
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
  app.post("/api/membership-applications", async (req, res) => {
    try {
      const validated = insertMembershipApplicationSchema.parse(req.body);
      const application = await storage.createMembershipApplication(validated);
      res.status(201).json(application);
    } catch (error) {
      console.error('Error creating membership application:', error);
      res.status(500).json({ message: "Failed to create membership application" });
    }
  });

  app.get("/api/membership-applications", requireAdmin, async (req, res) => {
    try {
      const applications = await storage.getAllMembershipApplications();
      res.json(applications);
    } catch (error) {
      console.error('Error getting membership applications:', error);
      res.status(500).json({ message: "Failed to get membership applications" });
    }
  });

  app.get("/api/membership-applications/:id", requireAdmin, async (req, res) => {
    try {
      const application = await storage.getMembershipApplication(req.params.id);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      res.json(application);
    } catch (error) {
      console.error('Error getting membership application:', error);
      res.status(500).json({ message: "Failed to get membership application" });
    }
  });

  app.patch("/api/membership-applications/:id", requireAdmin, async (req, res) => {
    try {
      const validated = insertMembershipApplicationSchema.partial().parse(req.body);
      const updated = await storage.updateMembershipApplication(req.params.id, validated);
      if (!updated) {
        return res.status(404).json({ message: "Application not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error('Error updating membership application:', error);
      res.status(500).json({ message: "Failed to update membership application" });
    }
  });

  app.patch("/api/membership-applications/:id/review", requireAdmin, async (req, res) => {
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

  app.delete("/api/membership-applications/:id", requireAdmin, async (req, res) => {
    try {
      const success = await storage.deleteMembershipApplication(req.params.id);
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
  app.post("/api/akika-applications", async (req, res) => {
    try {
      const validated = insertAkikaApplicationSchema.parse(req.body);
      // Add submittedBy if user is logged in
      const applicationData = {
        ...validated,
        submittedBy: req.user?.id || null
      };
      const application = await storage.createAkikaApplication(applicationData);
      res.status(201).json(application);
    } catch (error) {
      console.error('Error creating akika application:', error);
      res.status(500).json({ message: "Failed to create akika application" });
    }
  });

  app.get("/api/akika-applications/my", requireAuth, async (req, res) => {
    try {
      const applications = await storage.getUserAkikaApplications(req.user!.id);
      res.json(applications);
    } catch (error) {
      console.error('Error getting user akika applications:', error);
      res.status(500).json({ message: "Failed to get user akika applications" });
    }
  });

  app.get("/api/akika-applications", requireAdmin, async (req, res) => {
    try {
      const applications = await storage.getAllAkikaApplications();
      res.json(applications);
    } catch (error) {
      console.error('Error getting akika applications:', error);
      res.status(500).json({ message: "Failed to get akika applications" });
    }
  });

  app.get("/api/akika-applications/:id", requireAdmin, async (req, res) => {
    try {
      const application = await storage.getAkikaApplication(req.params.id);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      res.json(application);
    } catch (error) {
      console.error('Error getting akika application:', error);
      res.status(500).json({ message: "Failed to get akika application" });
    }
  });

  app.patch("/api/akika-applications/:id", requireAdmin, async (req, res) => {
    try {
      const validated = insertAkikaApplicationSchema.partial().parse(req.body);
      const updated = await storage.updateAkikaApplication(req.params.id, validated);
      if (!updated) {
        return res.status(404).json({ message: "Application not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error('Error updating akika application:', error);
      res.status(500).json({ message: "Failed to update akika application" });
    }
  });

  app.patch("/api/akika-applications/:id/review", requireAdmin, async (req, res) => {
    try {
      const { status, reviewNotes } = req.body;
      const updated = await storage.reviewAkikaApplication(
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
      console.error('Error reviewing akika application:', error);
      res.status(500).json({ message: "Failed to review akika application" });
    }
  });

  app.delete("/api/akika-applications/:id", requireAdmin, async (req, res) => {
    try {
      const success = await storage.deleteAkikaApplication(req.params.id);
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
  app.post("/api/marriage-applications", async (req, res) => {
    try {
      const validated = insertMarriageApplicationSchema.parse(req.body);
      const application = await storage.createMarriageApplication(validated);
      res.status(201).json(application);
    } catch (error) {
      console.error('Error creating marriage application:', error);
      res.status(500).json({ message: "Failed to create marriage application" });
    }
  });

  app.get("/api/marriage-applications", requireAdmin, async (req, res) => {
    try {
      const applications = await storage.getAllMarriageApplications();
      res.json(applications);
    } catch (error) {
      console.error('Error getting marriage applications:', error);
      res.status(500).json({ message: "Failed to get marriage applications" });
    }
  });

  app.get("/api/marriage-applications/:id", requireAdmin, async (req, res) => {
    try {
      const application = await storage.getMarriageApplication(req.params.id);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      res.json(application);
    } catch (error) {
      console.error('Error getting marriage application:', error);
      res.status(500).json({ message: "Failed to get marriage application" });
    }
  });

  app.patch("/api/marriage-applications/:id", requireAdmin, async (req, res) => {
    try {
      const validated = insertMarriageApplicationSchema.partial().parse(req.body);
      const updated = await storage.updateMarriageApplication(req.params.id, validated);
      if (!updated) {
        return res.status(404).json({ message: "Application not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error('Error updating marriage application:', error);
      res.status(500).json({ message: "Failed to update marriage application" });
    }
  });

  app.patch("/api/marriage-applications/:id/review", requireAdmin, async (req, res) => {
    try {
      const { status, reviewNotes } = req.body;
      const updated = await storage.reviewMarriageApplication(
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
      console.error('Error reviewing marriage application:', error);
      res.status(500).json({ message: "Failed to review marriage application" });
    }
  });

  app.delete("/api/marriage-applications/:id", requireAdmin, async (req, res) => {
    try {
      const success = await storage.deleteMarriageApplication(req.params.id);
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
  app.get("/api/activity-feed", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const activities = await storage.getActivityFeed(limit);
      res.json(activities);
    } catch (error) {
      console.error('Error getting activity feed:', error);
      res.status(500).json({ message: "Failed to get activity feed" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
