import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import { promises as fs } from "fs";
import * as XLSX from "xlsx";
import { storage } from "./storage";
import { requireAuth, requireAdmin } from "./index";
import { insertUserSchema, insertAnnouncementSchema, insertEventSchema, insertWorkGroupSchema, insertWorkGroupMemberSchema, insertTaskSchema, insertAccessRequestSchema, insertTaskCommentSchema, insertGroupFileSchema, insertAnnouncementFileSchema, insertFamilyRelationshipSchema, insertMessageSchema, insertOrganizationSettingsSchema } from "@shared/schema";

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

export async function registerRoutes(app: Express): Promise<Server> {
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
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Create session
      req.session.userId = user.id;
      
      res.json({ 
        user: { 
          id: user.id, 
          firstName: user.firstName, 
          lastName: user.lastName, 
          email: user.email,
          roles: user.roles || [],
          isAdmin: user.isAdmin 
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
          isAdmin: req.user.isAdmin 
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

  app.post("/api/users", requireAdmin, async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.json({ ...user, password: undefined });
    } catch (error) {
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  app.put("/api/users/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const userData = insertUserSchema.partial().parse(req.body);
      const user = await storage.updateUser(id, userData);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ ...user, password: undefined });
    } catch (error) {
      res.status(400).json({ message: "Invalid user data" });
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
        ["Ime", "Prezime", "Email", "Telefon", "Zanimanje", "Adresa", "Član od", "Kategorije", "Status članstva", "Razlog pasivnosti"],
        ["Marko", "Marković", "marko@example.com", "+387 61 123 456", "Inženjer", "Sarajevo, BiH", "2024-01-15", "Muškarci", "aktivan", ""],
        ["Ana", "Anić", "ana@example.com", "+387 62 234 567", "Nastavnica", "Zenica, BiH", "2023-06-20", "Žene,Roditelji", "aktivan", ""]
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(templateData);
      
      worksheet['!cols'] = [
        { wch: 15 },
        { wch: 15 },
        { wch: 25 },
        { wch: 18 },
        { wch: 20 },
        { wch: 25 },
        { wch: 15 },
        { wch: 20 },
        { wch: 18 },
        { wch: 20 }
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
        const email = row[2]?.toString().trim() || '';
        const phone = row[3]?.toString().trim() || '';
        const occupation = row[4]?.toString().trim() || '';
        const address = row[5]?.toString().trim() || '';
        const membershipDateStr = row[6]?.toString().trim() || '';
        const categoriesStr = row[7]?.toString().trim() || '';
        const status = row[8]?.toString().trim() || 'aktivan';
        const inactiveReason = row[9]?.toString().trim() || '';

        if (!firstName) {
          errors.push("Ime je obavezno polje");
        }
        if (!lastName) {
          errors.push("Prezime je obavezno polje");
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
              membershipDate = XLSX.SSF.parse_date_code(membershipDateStr);
              membershipDate = new Date(membershipDate.y, membershipDate.m - 1, membershipDate.d);
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

        const categories = categoriesStr ? categoriesStr.split(',').map(c => c.trim()).filter(c => c) : [];

        if (errors.length > 0) {
          results.errors.push({ row: rowNumber, errors });
          continue;
        }

        const username = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`.replace(/\s+/g, '');
        let finalUsername = username;
        let counter = 1;
        
        while (await storage.getUserByUsername(finalUsername)) {
          finalUsername = `${username}${counter}`;
          counter++;
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
            username: finalUsername,
            email: email || undefined,
            password: 'password123',
            phone: phone || undefined,
            occupation: occupation || undefined,
            address: address || undefined,
            membershipDate: membershipDate || undefined,
            categories,
            status: status.toLowerCase() as any,
            inactiveReason: inactiveReason || undefined,
            isAdmin: false,
            photo: undefined,
            city: undefined,
            postalCode: undefined,
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
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch events" });
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
      const rsvps = await storage.getEventRsvps(id);
      res.json(rsvps);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch RSVPs" });
    }
  });

  // Work Groups routes
  app.get("/api/work-groups", async (req, res) => {
    try {
      const workGroups = await storage.getAllWorkGroups();
      res.json(workGroups);
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

      // Authorization check: Only admins or group moderators can update tasks
      // OR assigned users can update status to na_cekanju
      const isAdmin = req.user!.isAdmin;
      const isModerator = await storage.isUserModeratorOfWorkGroup(existingTask.workGroupId, req.user!.id);
      const isAssignedUser = existingTask.assignedToId === req.user!.id;
      
      // If not admin or moderator, only allow assigned user to change status to na_cekanju
      if (!isAdmin && !isModerator) {
        if (!isAssignedUser || Object.keys(taskData).length !== 1 || !taskData.status || taskData.status !== 'na_cekanju') {
          return res.status(403).json({ message: "Forbidden: Only admins or group moderators can update tasks" });
        }
      }

      const task = await storage.updateTask(id, taskData);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
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
      const { content } = req.body;

      if (!content) {
        return res.status(400).json({ message: "Content is required" });
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

      const commentData = insertTaskCommentSchema.parse({ taskId, userId, content });
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

  // Group Files routes
  app.get("/api/work-groups/:workGroupId/files", async (req, res) => {
    try {
      const { workGroupId } = req.params;
      
      // Check if work group exists
      const workGroup = await storage.getWorkGroup(workGroupId);
      if (!workGroup) {
        return res.status(404).json({ message: "Work group not found" });
      }

      const files = await storage.getGroupFiles(workGroupId);
      
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
      res.status(500).json({ message: "Failed to fetch group files" });
    }
  });

  app.post("/api/work-groups/:workGroupId/files", requireAuth, async (req, res) => {
    try {
      const { workGroupId } = req.params;
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

      // Check if work group exists
      const workGroup = await storage.getWorkGroup(workGroupId);
      if (!workGroup) {
        return res.status(404).json({ message: "Work group not found" });
      }

      // Check if user is a member of the work group (admins can upload to any group)
      if (!user.isAdmin) {
        const isMember = await storage.isUserMemberOfWorkGroup(workGroupId, uploadedById);
        if (!isMember) {
          return res.status(403).json({ message: "Forbidden: Only work group members can upload files" });
        }
      }

      // Generate secure file path server-side
      const fileExtension = fileName.split('.').pop() || '';
      const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const timestamp = Date.now();
      const secureFilePath = `/uploads/work-groups/${workGroupId}/${timestamp}_${sanitizedFileName}`;

      const fileData = insertGroupFileSchema.parse({
        workGroupId,
        uploadedById,
        fileName: sanitizedFileName,
        fileType,
        fileSize,
        filePath: secureFilePath
      });
      
      const file = await storage.createGroupFile(fileData);
      
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

  app.delete("/api/files/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;

      // Get the file to check ownership and work group
      const file = await storage.getGroupFile(id);
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }

      // Check authorization: admin, work group moderator, or file uploader
      const isAdmin = req.user!.isAdmin;
      const isModerator = await storage.isUserModeratorOfWorkGroup(file.workGroupId, req.user!.id);
      const isUploader = file.uploadedById === req.user!.id;

      if (!isAdmin && !isModerator && !isUploader) {
        return res.status(403).json({ message: "Forbidden: Only admins, moderators, or file uploaders can delete files" });
      }

      const deleted = await storage.deleteGroupFile(id);
      if (!deleted) {
        return res.status(404).json({ message: "File not found" });
      }
      res.json({ message: "File deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete file" });
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
              photo: relatedUser.photo
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

  const httpServer = createServer(app);
  return httpServer;
}
