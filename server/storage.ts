import { 
  type User, 
  type InsertUser,
  type Announcement,
  type InsertAnnouncement,
  type Event,
  type InsertEvent,
  type EventRsvp,
  type InsertEventRsvp,
  type WorkGroup,
  type InsertWorkGroup,
  type Task,
  type InsertTask,
  type AccessRequest,
  type InsertAccessRequest,
  type Activity
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  
  // Announcements
  getAnnouncement(id: string): Promise<Announcement | undefined>;
  createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement>;
  updateAnnouncement(id: string, announcement: Partial<InsertAnnouncement>): Promise<Announcement | undefined>;
  deleteAnnouncement(id: string): Promise<boolean>;
  getAllAnnouncements(): Promise<Announcement[]>;
  
  // Events
  getEvent(id: string): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: string, event: Partial<InsertEvent>): Promise<Event | undefined>;
  deleteEvent(id: string): Promise<boolean>;
  getAllEvents(): Promise<Event[]>;
  
  // Event RSVPs
  createEventRsvp(rsvp: InsertEventRsvp): Promise<EventRsvp>;
  getEventRsvps(eventId: string): Promise<EventRsvp[]>;
  deleteEventRsvp(eventId: string, userId: string): Promise<boolean>;
  
  // Work Groups
  getWorkGroup(id: string): Promise<WorkGroup | undefined>;
  createWorkGroup(workGroup: InsertWorkGroup): Promise<WorkGroup>;
  updateWorkGroup(id: string, workGroup: Partial<InsertWorkGroup>): Promise<WorkGroup | undefined>;
  deleteWorkGroup(id: string): Promise<boolean>;
  getAllWorkGroups(): Promise<WorkGroup[]>;
  
  // Tasks
  getTask(id: string): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<boolean>;
  getTasksByWorkGroup(workGroupId: string): Promise<Task[]>;
  
  // Access Requests
  createAccessRequest(request: InsertAccessRequest): Promise<AccessRequest>;
  updateAccessRequest(id: string, status: string): Promise<AccessRequest | undefined>;
  getAllAccessRequests(): Promise<AccessRequest[]>;
  
  // Activities
  createActivity(activity: { type: string; description: string; userId?: string }): Promise<Activity>;
  getRecentActivities(limit?: number): Promise<Activity[]>;
  
  // Statistics
  getUserCount(): Promise<number>;
  getNewAnnouncementsCount(days: number): Promise<number>;
  getUpcomingEventsCount(): Promise<number>;
  getActiveTasksCount(): Promise<number>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private announcements: Map<string, Announcement> = new Map();
  private events: Map<string, Event> = new Map();
  private eventRsvps: Map<string, EventRsvp> = new Map();
  private workGroups: Map<string, WorkGroup> = new Map();
  private tasks: Map<string, Task> = new Map();
  private accessRequests: Map<string, AccessRequest> = new Map();
  private activities: Map<string, Activity> = new Map();

  constructor() {
    this.initializeData();
  }

  private initializeData() {
    // Create admin user
    const adminUser: User = {
      id: randomUUID(),
      firstName: "Admin",
      lastName: "User",
      username: "admin",
      email: "admin@jamathub.com",
      password: "admin123", // In real app, this would be hashed
      address: null,
      city: null,
      postalCode: null,
      dateOfBirth: null,
      occupation: null,
      membershipDate: new Date(),
      status: "active",
      isAdmin: true
    };
    this.users.set(adminUser.id, adminUser);

    // Create sample data
    this.createSampleData();
  }

  private createSampleData() {
    // Sample users
    const sampleUsers = [
      { firstName: "Marko", lastName: "Petrović", username: "marko.petrovic", email: "marko@example.com" },
      { firstName: "Ana", lastName: "Marić", username: "ana.maric", email: "ana@example.com" },
      { firstName: "Stefan", lastName: "Jovanović", username: "stefan.jovanovic", email: "stefan@example.com" }
    ];

    sampleUsers.forEach(userData => {
      const user: User = {
        id: randomUUID(),
        firstName: userData.firstName,
        lastName: userData.lastName,
        username: userData.username,
        email: userData.email,
        password: "password123",
        address: null,
        city: null,
        postalCode: null,
        dateOfBirth: null,
        occupation: null,
        membershipDate: new Date(),
        status: userData.username === "stefan.jovanovic" ? "inactive" : "active",
        isAdmin: false
      };
      this.users.set(user.id, user);
    });

    // Sample work groups
    const workGroupsData = [
      { name: "Organizacija događaja", description: "Grupa odgovorna za organizaciju i koordinaciju svih događaja u džamiji." },
      { name: "Održavanje objekta", description: "Tim zadužen za održavanje i poboljšanje infrastrukture džamije." },
      { name: "Edukacija i program", description: "Grupa koja se bavi edukacijskim aktivnostima i programima za djecu i odrasle." }
    ];

    workGroupsData.forEach(groupData => {
      const workGroup: WorkGroup = {
        id: randomUUID(),
        ...groupData,
        createdAt: new Date()
      };
      this.workGroups.set(workGroup.id, workGroup);
    });
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      membershipDate: new Date(),
      status: insertUser.status || "active",
      isAdmin: false
    };
    this.users.set(id, user);
    
    await this.createActivity({
      type: "registration",
      description: `Novi korisnik registrovan: ${user.firstName} ${user.lastName}`,
      userId: id
    });
    
    return user;
  }

  async updateUser(id: string, updateData: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...updateData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Announcements
  async getAnnouncement(id: string): Promise<Announcement | undefined> {
    return this.announcements.get(id);
  }

  async createAnnouncement(insertAnnouncement: InsertAnnouncement): Promise<Announcement> {
    const id = randomUUID();
    const announcement: Announcement = {
      id,
      title: insertAnnouncement.title,
      content: insertAnnouncement.content,
      authorId: insertAnnouncement.authorId,
      publishDate: new Date(),
      status: insertAnnouncement.status || "published",
      isFeatured: insertAnnouncement.isFeatured || false
    };
    this.announcements.set(id, announcement);
    
    await this.createActivity({
      type: "announcement",
      description: `Nova obavijest objavljena: ${announcement.title}`,
      userId: announcement.authorId
    });
    
    return announcement;
  }

  async updateAnnouncement(id: string, updateData: Partial<InsertAnnouncement>): Promise<Announcement | undefined> {
    const announcement = this.announcements.get(id);
    if (!announcement) return undefined;

    const updatedAnnouncement = { ...announcement, ...updateData };
    this.announcements.set(id, updatedAnnouncement);
    return updatedAnnouncement;
  }

  async deleteAnnouncement(id: string): Promise<boolean> {
    return this.announcements.delete(id);
  }

  async getAllAnnouncements(): Promise<Announcement[]> {
    return Array.from(this.announcements.values());
  }

  // Events
  async getEvent(id: string): Promise<Event | undefined> {
    return this.events.get(id);
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const id = randomUUID();
    const event: Event = {
      id,
      name: insertEvent.name,
      description: insertEvent.description || null,
      location: insertEvent.location,
      dateTime: insertEvent.dateTime,
      rsvpEnabled: insertEvent.rsvpEnabled !== undefined ? insertEvent.rsvpEnabled : true,
      requireAdultsChildren: insertEvent.requireAdultsChildren !== undefined ? insertEvent.requireAdultsChildren : false,
      maxAttendees: insertEvent.maxAttendees || null,
      createdById: insertEvent.createdById,
      createdAt: new Date()
    };
    this.events.set(id, event);
    
    await this.createActivity({
      type: "event",
      description: `Događaj kreiran: ${event.name}`,
      userId: event.createdById
    });
    
    return event;
  }

  async updateEvent(id: string, updateData: Partial<InsertEvent>): Promise<Event | undefined> {
    const event = this.events.get(id);
    if (!event) return undefined;

    const updatedEvent = { ...event, ...updateData };
    this.events.set(id, updatedEvent);
    return updatedEvent;
  }

  async deleteEvent(id: string): Promise<boolean> {
    return this.events.delete(id);
  }

  async getAllEvents(): Promise<Event[]> {
    return Array.from(this.events.values());
  }

  // Event RSVPs
  async createEventRsvp(insertRsvp: InsertEventRsvp): Promise<EventRsvp> {
    const id = randomUUID();
    const rsvp: EventRsvp = {
      id,
      eventId: insertRsvp.eventId,
      userId: insertRsvp.userId,
      adultsCount: insertRsvp.adultsCount !== undefined ? insertRsvp.adultsCount : 1,
      childrenCount: insertRsvp.childrenCount !== undefined ? insertRsvp.childrenCount : 0,
      rsvpDate: new Date()
    };
    this.eventRsvps.set(id, rsvp);
    return rsvp;
  }

  async getEventRsvps(eventId: string): Promise<EventRsvp[]> {
    return Array.from(this.eventRsvps.values()).filter(rsvp => rsvp.eventId === eventId);
  }

  async deleteEventRsvp(eventId: string, userId: string): Promise<boolean> {
    const rsvp = Array.from(this.eventRsvps.values()).find(r => r.eventId === eventId && r.userId === userId);
    if (rsvp) {
      return this.eventRsvps.delete(rsvp.id);
    }
    return false;
  }

  // Work Groups
  async getWorkGroup(id: string): Promise<WorkGroup | undefined> {
    return this.workGroups.get(id);
  }

  async createWorkGroup(insertWorkGroup: InsertWorkGroup): Promise<WorkGroup> {
    const id = randomUUID();
    const workGroup: WorkGroup = {
      id,
      name: insertWorkGroup.name,
      description: insertWorkGroup.description || null,
      createdAt: new Date()
    };
    this.workGroups.set(id, workGroup);
    return workGroup;
  }

  async updateWorkGroup(id: string, updateData: Partial<InsertWorkGroup>): Promise<WorkGroup | undefined> {
    const workGroup = this.workGroups.get(id);
    if (!workGroup) return undefined;

    const updatedWorkGroup = { ...workGroup, ...updateData };
    this.workGroups.set(id, updatedWorkGroup);
    return updatedWorkGroup;
  }

  async deleteWorkGroup(id: string): Promise<boolean> {
    return this.workGroups.delete(id);
  }

  async getAllWorkGroups(): Promise<WorkGroup[]> {
    return Array.from(this.workGroups.values());
  }

  // Tasks
  async getTask(id: string): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = randomUUID();
    const task: Task = {
      id,
      title: insertTask.title,
      description: insertTask.description || null,
      workGroupId: insertTask.workGroupId,
      assignedToId: insertTask.assignedToId || null,
      status: insertTask.status || "todo",
      dueDate: insertTask.dueDate || null,
      createdAt: new Date()
    };
    this.tasks.set(id, task);
    
    if (task.assignedToId) {
      await this.createActivity({
        type: "task",
        description: `Zadatak kreiran: ${task.title}`,
        userId: task.assignedToId
      });
    }
    
    return task;
  }

  async updateTask(id: string, updateData: Partial<InsertTask>): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;

    const updatedTask = { ...task, ...updateData };
    this.tasks.set(id, updatedTask);
    
    if (updateData.status === "completed") {
      await this.createActivity({
        type: "task",
        description: `Zadatak završen: ${updatedTask.title}`,
        userId: updatedTask.assignedToId || undefined
      });
    }
    
    return updatedTask;
  }

  async deleteTask(id: string): Promise<boolean> {
    return this.tasks.delete(id);
  }

  async getTasksByWorkGroup(workGroupId: string): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(task => task.workGroupId === workGroupId);
  }

  // Access Requests
  async createAccessRequest(insertRequest: InsertAccessRequest): Promise<AccessRequest> {
    const id = randomUUID();
    const request: AccessRequest = {
      id,
      userId: insertRequest.userId,
      workGroupId: insertRequest.workGroupId,
      status: insertRequest.status || "pending",
      requestDate: new Date()
    };
    this.accessRequests.set(id, request);
    return request;
  }

  async updateAccessRequest(id: string, status: string): Promise<AccessRequest | undefined> {
    const request = this.accessRequests.get(id);
    if (!request) return undefined;

    const updatedRequest = { ...request, status };
    this.accessRequests.set(id, updatedRequest);
    return updatedRequest;
  }

  async getAllAccessRequests(): Promise<AccessRequest[]> {
    return Array.from(this.accessRequests.values());
  }

  // Activities
  async createActivity(activityData: { type: string; description: string; userId?: string }): Promise<Activity> {
    const id = randomUUID();
    const activity: Activity = {
      id,
      type: activityData.type,
      description: activityData.description,
      userId: activityData.userId || null,
      createdAt: new Date()
    };
    this.activities.set(id, activity);
    return activity;
  }

  async getRecentActivities(limit = 10): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
      .slice(0, limit);
  }

  // Statistics
  async getUserCount(): Promise<number> {
    return this.users.size;
  }

  async getNewAnnouncementsCount(days: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    return Array.from(this.announcements.values())
      .filter(announcement => new Date(announcement.publishDate!) >= cutoffDate).length;
  }

  async getUpcomingEventsCount(): Promise<number> {
    const now = new Date();
    return Array.from(this.events.values())
      .filter(event => new Date(event.dateTime) > now).length;
  }

  async getActiveTasksCount(): Promise<number> {
    return Array.from(this.tasks.values())
      .filter(task => task.status !== "completed").length;
  }
}

export const storage = new MemStorage();
