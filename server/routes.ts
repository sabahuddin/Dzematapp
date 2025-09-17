import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { requireAuth, requireAdmin } from "./index";
import { insertUserSchema, insertAnnouncementSchema, insertEventSchema, insertWorkGroupSchema, insertWorkGroupMemberSchema, insertTaskSchema, insertAccessRequestSchema, insertTaskCommentSchema, insertGroupFileSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
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

  app.post("/api/tasks", requireAuth, async (req, res) => {
    try {
      const taskData = insertTaskSchema.parse(req.body);
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
      const task = await storage.updateTask(id, taskData);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      res.status(400).json({ message: "Invalid task data" });
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
      const { content, userId } = req.body;

      if (!content || !userId) {
        return res.status(400).json({ message: "Content and userId are required" });
      }

      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if task exists
      const task = await storage.getTask(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      // Check if user is a member of the work group this task belongs to
      const isMember = await storage.isUserMemberOfWorkGroup(task.workGroupId, userId);
      if (!isMember) {
        return res.status(403).json({ message: "Forbidden: Only work group members can comment on tasks" });
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
      const { fileName, fileType, fileSize, uploadedById } = req.body;

      if (!fileName || !fileType || !fileSize || !uploadedById) {
        return res.status(400).json({ message: "fileName, fileType, fileSize, and uploadedById are required" });
      }

      // Validate file type for security
      const allowedFileTypes = ['image', 'pdf', 'document'];
      if (!allowedFileTypes.includes(fileType)) {
        return res.status(400).json({ message: "Invalid file type. Allowed types: image, pdf, document" });
      }

      // Validate file size (10MB limit)
      if (fileSize > 10 * 1024 * 1024) {
        return res.status(400).json({ message: "File size too large. Maximum 10MB allowed" });
      }

      // Check if uploading user exists
      const user = await storage.getUser(uploadedById);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if work group exists
      const workGroup = await storage.getWorkGroup(workGroupId);
      if (!workGroup) {
        return res.status(404).json({ message: "Work group not found" });
      }

      // Check if user is a member of the work group
      const isMember = await storage.isUserMemberOfWorkGroup(workGroupId, uploadedById);
      if (!isMember) {
        return res.status(403).json({ message: "Forbidden: Only work group members can upload files" });
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

  const httpServer = createServer(app);
  return httpServer;
}
