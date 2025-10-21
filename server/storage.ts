import { 
  type User, 
  type InsertUser,
  type Announcement,
  type InsertAnnouncement,
  type Event,
  type InsertEvent,
  type EventRsvp,
  type InsertEventRsvp,
  type EventRsvpWithUser,
  type EventRsvpStats,
  type WorkGroup,
  type InsertWorkGroup,
  type WorkGroupMember,
  type InsertWorkGroupMember,
  type Task,
  type InsertTask,
  type AccessRequest,
  type InsertAccessRequest,
  type TaskComment,
  type InsertTaskComment,
  type GroupFile,
  type InsertGroupFile,
  type AnnouncementFile,
  type InsertAnnouncementFile,
  type Activity,
  type FamilyRelationship,
  type InsertFamilyRelationship,
  type Message,
  type InsertMessage,
  type ImamQuestion,
  type InsertImamQuestion,
  type OrganizationSettings,
  type InsertOrganizationSettings,
  type Document,
  type InsertDocument,
  type Request,
  type InsertRequest,
  type ShopProduct,
  type InsertShopProduct,
  type MarketplaceItem,
  type InsertMarketplaceItem,
  type ProductPurchaseRequest,
  type InsertProductPurchaseRequest,
  type PrayerTime,
  type InsertPrayerTime,
  users,
  announcements,
  events,
  eventRsvps,
  workGroups,
  workGroupMembers,
  tasks,
  accessRequests,
  taskComments,
  groupFiles,
  announcementFiles,
  activities,
  familyRelationships,
  messages,
  imamQuestions,
  organizationSettings,
  documents,
  requests,
  shopProducts,
  marketplaceItems,
  productPurchaseRequests,
  prayerTimes
} from "@shared/schema";
import { db } from './db';
import { eq, and, or, desc, asc, gt, sql } from 'drizzle-orm';

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
  getEventLocations(): Promise<string[]>;
  
  // Event RSVPs
  createEventRsvp(rsvp: InsertEventRsvp): Promise<EventRsvp>;
  getEventRsvps(eventId: string): Promise<EventRsvpStats>;
  getUserEventRsvp(eventId: string, userId: string): Promise<EventRsvp | null>;
  updateEventRsvp(id: string, updates: { adultsCount?: number; childrenCount?: number }): Promise<EventRsvp | undefined>;
  deleteEventRsvp(id: string): Promise<boolean>;
  
  // Work Groups
  getWorkGroup(id: string): Promise<WorkGroup | undefined>;
  createWorkGroup(workGroup: InsertWorkGroup): Promise<WorkGroup>;
  updateWorkGroup(id: string, workGroup: Partial<InsertWorkGroup>): Promise<WorkGroup | undefined>;
  deleteWorkGroup(id: string): Promise<boolean>;
  getAllWorkGroups(userId?: string, isAdmin?: boolean): Promise<WorkGroup[]>;
  
  // Work Group Members
  addMemberToWorkGroup(workGroupId: string, userId: string): Promise<WorkGroupMember>;
  removeMemberFromWorkGroup(workGroupId: string, userId: string): Promise<boolean>;
  getWorkGroupMembers(workGroupId: string): Promise<WorkGroupMember[]>;
  getUserWorkGroups(userId: string): Promise<WorkGroupMember[]>;
  isUserMemberOfWorkGroup(workGroupId: string, userId: string): Promise<boolean>;
  setModerator(workGroupId: string, userId: string, isModerator: boolean): Promise<WorkGroupMember | undefined>;
  getWorkGroupModerators(workGroupId: string): Promise<WorkGroupMember[]>;
  isUserModeratorOfWorkGroup(workGroupId: string, userId: string): Promise<boolean>;
  
  // Tasks
  getTask(id: string): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<boolean>;
  getTasksByWorkGroup(workGroupId: string): Promise<Task[]>;
  getAllTasksWithWorkGroup(userId: string, isAdmin: boolean): Promise<Array<Task & { workGroup: WorkGroup }>>;
  moveTaskToWorkGroup(taskId: string, newWorkGroupId: string): Promise<Task | undefined>;
  
  // Access Requests
  createAccessRequest(request: InsertAccessRequest): Promise<AccessRequest>;
  updateAccessRequest(id: string, status: string): Promise<AccessRequest | undefined>;
  getAllAccessRequests(): Promise<AccessRequest[]>;
  getUserAccessRequests(userId: string): Promise<AccessRequest[]>;
  
  // Task Comments
  createTaskComment(comment: InsertTaskComment): Promise<TaskComment>;
  getTaskComment(id: string): Promise<TaskComment | undefined>;
  getTaskComments(taskId: string): Promise<TaskComment[]>;
  deleteTaskComment(id: string): Promise<boolean>;
  
  // Group Files
  createGroupFile(file: InsertGroupFile): Promise<GroupFile>;
  getGroupFile(id: string): Promise<GroupFile | undefined>;
  getGroupFiles(workGroupId: string): Promise<GroupFile[]>;
  deleteGroupFile(id: string): Promise<boolean>;
  
  // Announcement Files
  createAnnouncementFile(file: InsertAnnouncementFile): Promise<AnnouncementFile>;
  getAnnouncementFile(id: string): Promise<AnnouncementFile | undefined>;
  getAnnouncementFiles(announcementId: string): Promise<AnnouncementFile[]>;
  deleteAnnouncementFile(id: string): Promise<boolean>;
  
  // Activities
  createActivity(activity: { type: string; description: string; userId?: string }): Promise<Activity>;
  getRecentActivities(limit?: number): Promise<Activity[]>;
  
  // Family Relationships
  createFamilyRelationship(relationship: InsertFamilyRelationship): Promise<FamilyRelationship>;
  getFamilyRelationship(id: string): Promise<FamilyRelationship | undefined>;
  getUserFamilyRelationships(userId: string): Promise<FamilyRelationship[]>;
  deleteFamilyRelationship(id: string): Promise<boolean>;
  getFamilyMembersByRelationship(userId: string, relationship: string): Promise<FamilyRelationship[]>;

  // Messages
  getMessages(userId: string): Promise<Message[]>;
  getConversations(userId: string): Promise<Array<{ threadId: string; lastMessage: Message; unreadCount: number; otherUser: User | null }>>;
  createMessage(messageData: InsertMessage): Promise<Message>;
  markAsRead(messageId: string, userId: string): Promise<Message | undefined>;
  markThreadAsRead(threadId: string, userId: string): Promise<void>;
  deleteMessage(messageId: string): Promise<boolean>;
  getUnreadCount(userId: string): Promise<number>;
  getMessageThread(threadId: string, userId: string): Promise<Message[]>;

  // Imam Questions
  getImamQuestions(userId?: string): Promise<ImamQuestion[]>;
  createImamQuestion(questionData: InsertImamQuestion): Promise<ImamQuestion>;
  answerImamQuestion(questionId: string, answer: string): Promise<ImamQuestion | undefined>;
  markQuestionAsRead(questionId: string): Promise<ImamQuestion | undefined>;
  deleteImamQuestion(questionId: string): Promise<boolean>;
  getUnansweredQuestionsCount(): Promise<number>;

  // Organization Settings
  getOrganizationSettings(): Promise<OrganizationSettings | undefined>;
  updateOrganizationSettings(settings: Partial<InsertOrganizationSettings>): Promise<OrganizationSettings>;

  // Documents
  createDocument(document: InsertDocument): Promise<Document>;
  getDocument(id: string): Promise<Document | undefined>;
  getAllDocuments(): Promise<Document[]>;
  deleteDocument(id: string): Promise<boolean>;

  // Requests
  createRequest(request: InsertRequest): Promise<Request>;
  getRequest(id: string): Promise<Request | undefined>;
  getAllRequests(): Promise<Request[]>;
  getUserRequests(userId: string): Promise<Request[]>;
  updateRequest(id: string, updates: Partial<InsertRequest>): Promise<Request | undefined>;
  updateRequestStatus(id: string, status: string, reviewedById?: string, adminNotes?: string): Promise<Request | undefined>;

  // Shop Products
  createShopProduct(product: InsertShopProduct): Promise<ShopProduct>;
  getShopProduct(id: string): Promise<ShopProduct | undefined>;
  getAllShopProducts(): Promise<ShopProduct[]>;
  updateShopProduct(id: string, updates: Partial<InsertShopProduct>): Promise<ShopProduct | undefined>;
  deleteShopProduct(id: string): Promise<boolean>;

  // Marketplace Items
  createMarketplaceItem(item: InsertMarketplaceItem): Promise<MarketplaceItem>;
  getMarketplaceItem(id: string): Promise<MarketplaceItem | undefined>;
  getAllMarketplaceItems(): Promise<MarketplaceItem[]>;
  getUserMarketplaceItems(userId: string): Promise<MarketplaceItem[]>;
  updateMarketplaceItem(id: string, updates: Partial<InsertMarketplaceItem>): Promise<MarketplaceItem | undefined>;
  deleteMarketplaceItem(id: string): Promise<boolean>;

  // Product Purchase Requests
  createProductPurchaseRequest(request: InsertProductPurchaseRequest): Promise<ProductPurchaseRequest>;
  getAllProductPurchaseRequests(): Promise<ProductPurchaseRequest[]>;
  updateProductPurchaseRequest(id: string, status: string): Promise<ProductPurchaseRequest | undefined>;

  // Statistics
  getUserCount(): Promise<number>;
  getNewAnnouncementsCount(days: number): Promise<number>;
  getUpcomingEventsCount(): Promise<number>;
  getActiveTasksCount(): Promise<number>;

  // Notifications
  updateLastViewed(userId: string, type: 'shop' | 'events' | 'announcements' | 'imamQuestions' | 'tasks'): Promise<User | undefined>;
  getNewItemsCount(userId: string, type: 'shop' | 'events' | 'announcements' | 'imamQuestions' | 'tasks'): Promise<number>;
  getPendingAccessRequestsCount(): Promise<number>;
  getAllNewItemsCounts(userId: string): Promise<{ shop: number; events: number; announcements: number; imamQuestions: number; tasks: number; accessRequests: number }>;

  // Prayer Times
  createPrayerTime(prayerTime: InsertPrayerTime): Promise<PrayerTime>;
  getPrayerTimeByDate(date: string): Promise<PrayerTime | undefined>;
  getAllPrayerTimes(): Promise<PrayerTime[]>;
  bulkCreatePrayerTimes(prayerTimes: InsertPrayerTime[]): Promise<PrayerTime[]>;
  deletePrayerTime(id: string): Promise<boolean>;
  deleteAllPrayerTimes(): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    if (!email) return undefined;
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    
    await this.createActivity({
      type: "registration",
      description: `Novi korisnik registrovan: ${user.firstName} ${user.lastName}`,
      userId: user.id
    });
    
    return user;
  }

  async updateUser(id: string, updateData: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users).set(updateData).where(eq(users.id, id)).returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getAnnouncement(id: string): Promise<Announcement | undefined> {
    const result = await db.select().from(announcements).where(eq(announcements.id, id)).limit(1);
    return result[0];
  }

  async createAnnouncement(insertAnnouncement: InsertAnnouncement): Promise<Announcement> {
    const [announcement] = await db.insert(announcements).values(insertAnnouncement).returning();
    
    await this.createActivity({
      type: "announcement",
      description: `Nova obavijest objavljena: ${announcement.title}`,
      userId: announcement.authorId
    });
    
    return announcement;
  }

  async updateAnnouncement(id: string, updateData: Partial<InsertAnnouncement>): Promise<Announcement | undefined> {
    const [announcement] = await db.update(announcements).set(updateData).where(eq(announcements.id, id)).returning();
    return announcement;
  }

  async deleteAnnouncement(id: string): Promise<boolean> {
    const result = await db.delete(announcements).where(eq(announcements.id, id)).returning();
    return result.length > 0;
  }

  async getAllAnnouncements(): Promise<Announcement[]> {
    return await db.select().from(announcements);
  }

  async getEvent(id: string): Promise<Event | undefined> {
    const result = await db.select().from(events).where(eq(events.id, id)).limit(1);
    return result[0];
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const [event] = await db.insert(events).values(insertEvent).returning();
    
    await this.createActivity({
      type: "event",
      description: `Događaj kreiran: ${event.name}`,
      userId: event.createdById
    });
    
    return event;
  }

  async updateEvent(id: string, updateData: Partial<InsertEvent>): Promise<Event | undefined> {
    const [event] = await db.update(events).set(updateData).where(eq(events.id, id)).returning();
    return event;
  }

  async deleteEvent(id: string): Promise<boolean> {
    const result = await db.delete(events).where(eq(events.id, id)).returning();
    return result.length > 0;
  }

  async getAllEvents(): Promise<Event[]> {
    return await db.select().from(events);
  }

  async getEventLocations(): Promise<string[]> {
    const allEvents = await db.select().from(events);
    const locations = allEvents
      .map(event => event.location)
      .filter((location, index, self) => location && self.indexOf(location) === index);
    return locations.sort();
  }

  async createEventRsvp(insertRsvp: InsertEventRsvp): Promise<EventRsvp> {
    const [rsvp] = await db.insert(eventRsvps).values(insertRsvp).returning();
    return rsvp;
  }

  async getEventRsvps(eventId: string): Promise<EventRsvpStats> {
    const rsvpResults = await db
      .select({
        id: eventRsvps.id,
        eventId: eventRsvps.eventId,
        userId: eventRsvps.userId,
        adultsCount: eventRsvps.adultsCount,
        childrenCount: eventRsvps.childrenCount,
        rsvpDate: eventRsvps.rsvpDate,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(eventRsvps)
      .leftJoin(users, eq(eventRsvps.userId, users.id))
      .where(eq(eventRsvps.eventId, eventId));

    const rsvps: EventRsvpWithUser[] = rsvpResults.map(result => ({
      id: result.id,
      eventId: result.eventId,
      userId: result.userId,
      adultsCount: result.adultsCount ?? 1,
      childrenCount: result.childrenCount ?? 0,
      rsvpDate: result.rsvpDate,
      user: result.user,
    }));

    const totalAdults = rsvps.reduce((sum, rsvp) => sum + (rsvp.adultsCount ?? 1), 0);
    const totalChildren = rsvps.reduce((sum, rsvp) => sum + (rsvp.childrenCount ?? 0), 0);
    const totalAttendees = totalAdults + totalChildren;

    return {
      rsvps,
      totalAdults,
      totalChildren,
      totalAttendees,
    };
  }

  async getUserEventRsvp(eventId: string, userId: string): Promise<EventRsvp | null> {
    const result = await db.select().from(eventRsvps)
      .where(and(eq(eventRsvps.eventId, eventId), eq(eventRsvps.userId, userId)))
      .limit(1);
    return result[0] ?? null;
  }

  async updateEventRsvp(id: string, updates: { adultsCount?: number; childrenCount?: number }): Promise<EventRsvp | undefined> {
    const [rsvp] = await db.update(eventRsvps).set(updates).where(eq(eventRsvps.id, id)).returning();
    return rsvp;
  }

  async deleteEventRsvp(id: string): Promise<boolean> {
    const result = await db.delete(eventRsvps).where(eq(eventRsvps.id, id)).returning();
    return result.length > 0;
  }

  async getWorkGroup(id: string): Promise<WorkGroup | undefined> {
    const result = await db.select().from(workGroups).where(eq(workGroups.id, id)).limit(1);
    return result[0];
  }

  async createWorkGroup(insertWorkGroup: InsertWorkGroup): Promise<WorkGroup> {
    const [workGroup] = await db.insert(workGroups).values(insertWorkGroup).returning();
    return workGroup;
  }

  async updateWorkGroup(id: string, updateData: Partial<InsertWorkGroup>): Promise<WorkGroup | undefined> {
    const [workGroup] = await db.update(workGroups).set(updateData).where(eq(workGroups.id, id)).returning();
    return workGroup;
  }

  async deleteWorkGroup(id: string): Promise<boolean> {
    const result = await db.delete(workGroups).where(eq(workGroups.id, id)).returning();
    return result.length > 0;
  }

  async getAllWorkGroups(userId?: string, isAdmin?: boolean): Promise<WorkGroup[]> {
    const allWorkGroups = await db.select().from(workGroups);
    
    if (!userId || isAdmin) {
      return allWorkGroups;
    }
    
    const userMemberships = await db.select().from(workGroupMembers)
      .where(eq(workGroupMembers.userId, userId));
    const userGroupIds = userMemberships.map(m => m.workGroupId);
    
    return allWorkGroups.filter(wg => 
      wg.visibility === "javna" || userGroupIds.includes(wg.id)
    );
  }

  async addMemberToWorkGroup(workGroupId: string, userId: string): Promise<WorkGroupMember> {
    const existing = await db.select().from(workGroupMembers)
      .where(and(eq(workGroupMembers.workGroupId, workGroupId), eq(workGroupMembers.userId, userId)))
      .limit(1);
    
    if (existing.length > 0) {
      return existing[0];
    }

    const [member] = await db.insert(workGroupMembers).values({
      workGroupId,
      userId,
      isModerator: false
    }).returning();
    
    await this.createActivity({
      type: "workgroup",
      description: `Korisnik dodao u radnu grupu`,
      userId
    });
    
    return member;
  }

  async removeMemberFromWorkGroup(workGroupId: string, userId: string): Promise<boolean> {
    const result = await db.delete(workGroupMembers)
      .where(and(eq(workGroupMembers.workGroupId, workGroupId), eq(workGroupMembers.userId, userId)))
      .returning();
    
    if (result.length > 0) {
      await this.createActivity({
        type: "workgroup",
        description: `Korisnik uklonjen iz radne grupe`,
        userId
      });
    }
    
    return result.length > 0;
  }

  async getWorkGroupMembers(workGroupId: string): Promise<WorkGroupMember[]> {
    return await db.select().from(workGroupMembers).where(eq(workGroupMembers.workGroupId, workGroupId));
  }

  async getUserWorkGroups(userId: string): Promise<WorkGroupMember[]> {
    return await db.select().from(workGroupMembers).where(eq(workGroupMembers.userId, userId));
  }

  async isUserMemberOfWorkGroup(workGroupId: string, userId: string): Promise<boolean> {
    const result = await db.select().from(workGroupMembers)
      .where(and(eq(workGroupMembers.workGroupId, workGroupId), eq(workGroupMembers.userId, userId)))
      .limit(1);
    return result.length > 0;
  }

  async setModerator(workGroupId: string, userId: string, isModerator: boolean): Promise<WorkGroupMember | undefined> {
    const [member] = await db.update(workGroupMembers)
      .set({ isModerator })
      .where(and(eq(workGroupMembers.workGroupId, workGroupId), eq(workGroupMembers.userId, userId)))
      .returning();
    
    if (member) {
      await this.createActivity({
        type: "workgroup",
        description: `Korisnik ${isModerator ? 'označen kao moderator' : 'uklonjen kao moderator'}`,
        userId
      });
    }
    
    return member;
  }

  async getWorkGroupModerators(workGroupId: string): Promise<WorkGroupMember[]> {
    return await db.select().from(workGroupMembers)
      .where(and(eq(workGroupMembers.workGroupId, workGroupId), eq(workGroupMembers.isModerator, true)));
  }

  async isUserModeratorOfWorkGroup(workGroupId: string, userId: string): Promise<boolean> {
    const result = await db.select().from(workGroupMembers)
      .where(and(
        eq(workGroupMembers.workGroupId, workGroupId),
        eq(workGroupMembers.userId, userId),
        eq(workGroupMembers.isModerator, true)
      ))
      .limit(1);
    return result.length > 0;
  }

  async getTask(id: string): Promise<Task | undefined> {
    const result = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
    return result[0];
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const [task] = await db.insert(tasks).values(insertTask).returning();
    
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
    const [task] = await db.update(tasks).set(updateData).where(eq(tasks.id, id)).returning();
    
    if (task && updateData.status === "completed") {
      await this.createActivity({
        type: "task",
        description: `Zadatak završen: ${task.title}`,
        userId: task.assignedToId ?? undefined
      });
    }
    
    return task;
  }

  async deleteTask(id: string): Promise<boolean> {
    const result = await db.delete(tasks).where(eq(tasks.id, id)).returning();
    return result.length > 0;
  }

  async getTasksByWorkGroup(workGroupId: string): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.workGroupId, workGroupId));
  }

  async getAllTasksWithWorkGroup(userId: string, isAdmin: boolean): Promise<Array<Task & { workGroup: WorkGroup }>> {
    const allTasks = await db.select().from(tasks);
    const allWorkGroups = await db.select().from(workGroups);
    const workGroupMap = new Map(allWorkGroups.map(wg => [wg.id, wg]));
    
    if (isAdmin) {
      return allTasks
        .map(task => ({ ...task, workGroup: workGroupMap.get(task.workGroupId)! }))
        .filter(task => task.workGroup);
    } else {
      const userModeratedGroups = await db.select().from(workGroupMembers)
        .where(and(eq(workGroupMembers.userId, userId), eq(workGroupMembers.isModerator, true)));
      const moderatedGroupIds = userModeratedGroups.map(m => m.workGroupId);
      
      return allTasks
        .filter(task => moderatedGroupIds.includes(task.workGroupId))
        .map(task => ({ ...task, workGroup: workGroupMap.get(task.workGroupId)! }))
        .filter(task => task.workGroup);
    }
  }

  async moveTaskToWorkGroup(taskId: string, newWorkGroupId: string): Promise<Task | undefined> {
    const [task] = await db.update(tasks)
      .set({ workGroupId: newWorkGroupId })
      .where(eq(tasks.id, taskId))
      .returning();
    return task;
  }

  async createAccessRequest(insertRequest: InsertAccessRequest): Promise<AccessRequest> {
    const [request] = await db.insert(accessRequests).values(insertRequest).returning();
    return request;
  }

  async updateAccessRequest(id: string, status: string): Promise<AccessRequest | undefined> {
    const [request] = await db.update(accessRequests).set({ status }).where(eq(accessRequests.id, id)).returning();
    return request;
  }

  async getAllAccessRequests(): Promise<AccessRequest[]> {
    return await db.select().from(accessRequests);
  }

  async getUserAccessRequests(userId: string): Promise<AccessRequest[]> {
    return await db.select().from(accessRequests).where(eq(accessRequests.userId, userId));
  }

  async createActivity(activityData: { type: string; description: string; userId?: string }): Promise<Activity> {
    const [activity] = await db.insert(activities).values({
      type: activityData.type,
      description: activityData.description,
      userId: activityData.userId ?? null
    }).returning();
    return activity;
  }

  async getRecentActivities(limit = 10): Promise<Activity[]> {
    return await db.select().from(activities).orderBy(desc(activities.createdAt)).limit(limit);
  }

  async getUserCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(users);
    return Number(result[0]?.count ?? 0);
  }

  async getNewAnnouncementsCount(days: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(announcements)
      .where(gt(announcements.publishDate, cutoffDate));
    return Number(result[0]?.count ?? 0);
  }

  async getUpcomingEventsCount(): Promise<number> {
    const now = new Date();
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(events)
      .where(gt(events.dateTime, now));
    return Number(result[0]?.count ?? 0);
  }

  async getActiveTasksCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(tasks)
      .where(sql`${tasks.status} != 'completed'`);
    return Number(result[0]?.count ?? 0);
  }

  async createTaskComment(insertComment: InsertTaskComment): Promise<TaskComment> {
    const [comment] = await db.insert(taskComments).values(insertComment).returning();
    
    await this.createActivity({
      type: "task",
      description: `Komentar dodao na zadatak`,
      userId: comment.userId
    });
    
    return comment;
  }

  async getTaskComment(id: string): Promise<TaskComment | undefined> {
    const result = await db.select().from(taskComments).where(eq(taskComments.id, id)).limit(1);
    return result[0];
  }

  async getTaskComments(taskId: string): Promise<TaskComment[]> {
    return await db.select().from(taskComments)
      .where(eq(taskComments.taskId, taskId))
      .orderBy(asc(taskComments.createdAt));
  }

  async deleteTaskComment(id: string): Promise<boolean> {
    const result = await db.delete(taskComments).where(eq(taskComments.id, id)).returning();
    return result.length > 0;
  }

  async createGroupFile(insertFile: InsertGroupFile): Promise<GroupFile> {
    const [file] = await db.insert(groupFiles).values(insertFile).returning();
    
    await this.createActivity({
      type: "workgroup",
      description: `Fajl učitao: ${file.fileName}`,
      userId: file.uploadedById
    });
    
    return file;
  }

  async getGroupFile(id: string): Promise<GroupFile | undefined> {
    const result = await db.select().from(groupFiles).where(eq(groupFiles.id, id)).limit(1);
    return result[0];
  }

  async getGroupFiles(workGroupId: string): Promise<GroupFile[]> {
    return await db.select().from(groupFiles)
      .where(eq(groupFiles.workGroupId, workGroupId))
      .orderBy(desc(groupFiles.uploadedAt));
  }

  async deleteGroupFile(id: string): Promise<boolean> {
    const result = await db.delete(groupFiles).where(eq(groupFiles.id, id)).returning();
    return result.length > 0;
  }

  async createAnnouncementFile(insertFile: InsertAnnouncementFile): Promise<AnnouncementFile> {
    const [file] = await db.insert(announcementFiles).values(insertFile).returning();
    
    await this.createActivity({
      type: "announcement",
      description: `Fajl dodao u obavijest: ${file.fileName}`,
      userId: file.uploadedById
    });
    
    return file;
  }

  async getAnnouncementFile(id: string): Promise<AnnouncementFile | undefined> {
    const result = await db.select().from(announcementFiles).where(eq(announcementFiles.id, id)).limit(1);
    return result[0];
  }

  async getAnnouncementFiles(announcementId: string): Promise<AnnouncementFile[]> {
    return await db.select().from(announcementFiles)
      .where(eq(announcementFiles.announcementId, announcementId))
      .orderBy(desc(announcementFiles.uploadedAt));
  }

  async deleteAnnouncementFile(id: string): Promise<boolean> {
    const result = await db.delete(announcementFiles).where(eq(announcementFiles.id, id)).returning();
    return result.length > 0;
  }

  async createFamilyRelationship(insertRelationship: InsertFamilyRelationship): Promise<FamilyRelationship> {
    const [relationship] = await db.insert(familyRelationships).values(insertRelationship).returning();
    
    await this.createActivity({
      type: "registration",
      description: `Dodan porodični odnos: ${relationship.relationship}`,
      userId: relationship.userId
    });
    
    return relationship;
  }

  async getFamilyRelationship(id: string): Promise<FamilyRelationship | undefined> {
    const result = await db.select().from(familyRelationships).where(eq(familyRelationships.id, id)).limit(1);
    return result[0];
  }

  async getUserFamilyRelationships(userId: string): Promise<FamilyRelationship[]> {
    return await db.select().from(familyRelationships)
      .where(or(eq(familyRelationships.userId, userId), eq(familyRelationships.relatedUserId, userId)))
      .orderBy(desc(familyRelationships.createdAt));
  }

  async deleteFamilyRelationship(id: string): Promise<boolean> {
    const result = await db.delete(familyRelationships).where(eq(familyRelationships.id, id)).returning();
    return result.length > 0;
  }

  async getFamilyMembersByRelationship(userId: string, relationship: string): Promise<FamilyRelationship[]> {
    return await db.select().from(familyRelationships)
      .where(and(
        or(eq(familyRelationships.userId, userId), eq(familyRelationships.relatedUserId, userId)),
        eq(familyRelationships.relationship, relationship)
      ))
      .orderBy(desc(familyRelationships.createdAt));
  }

  async getMessages(userId: string): Promise<Message[]> {
    const user = await this.getUser(userId);
    const userCategories = user?.categories ?? [];
    
    const allMessages = await db.select().from(messages);
    
    return allMessages
      .filter(msg => 
        msg.senderId === userId || 
        msg.recipientId === userId || 
        (msg.category && userCategories.includes(msg.category))
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const threadId = insertMessage.threadId ?? undefined;
    
    const [message] = await db.insert(messages).values({
      ...insertMessage,
      threadId: threadId ?? sql`gen_random_uuid()`
    }).returning();
    
    await this.createActivity({
      type: "message",
      description: `Poruka poslana: ${message.subject}`,
      userId: message.senderId
    });
    
    return message;
  }

  async markAsRead(messageId: string, userId: string): Promise<Message | undefined> {
    const message = await db.select().from(messages).where(eq(messages.id, messageId)).limit(1);
    if (!message[0]) return undefined;
    
    const user = await this.getUser(userId);
    const userCategories = user?.categories ?? [];
    
    if (message[0].recipientId === userId || (message[0].category && userCategories.includes(message[0].category))) {
      const [updated] = await db.update(messages)
        .set({ isRead: true })
        .where(eq(messages.id, messageId))
        .returning();
      return updated;
    }
    
    return undefined;
  }

  async deleteMessage(messageId: string): Promise<boolean> {
    const result = await db.delete(messages).where(eq(messages.id, messageId)).returning();
    return result.length > 0;
  }

  async getUnreadCount(userId: string): Promise<number> {
    const allMessages = await this.getMessages(userId);
    return allMessages.filter(msg => 
      !msg.isRead && 
      (msg.recipientId === userId || msg.category)
    ).length;
  }

  async getMessageThread(threadId: string, userId: string): Promise<Message[]> {
    const allMessages = await db.select().from(messages)
      .where(eq(messages.threadId, threadId))
      .orderBy(asc(messages.createdAt));
    
    return allMessages.filter(msg => 
      msg.senderId === userId || msg.recipientId === userId
    );
  }

  async getConversations(userId: string): Promise<Array<{ threadId: string; lastMessage: Message; unreadCount: number; otherUser: User | null }>> {
    const userMessages = await this.getMessages(userId);
    
    const threadMap = new Map<string, Message[]>();
    userMessages.forEach(msg => {
      const thread = msg.threadId ?? msg.id;
      if (!threadMap.has(thread)) {
        threadMap.set(thread, []);
      }
      threadMap.get(thread)!.push(msg);
    });

    const conversations = await Promise.all(
      Array.from(threadMap.entries()).map(async ([threadId, msgs]) => {
        const sortedMessages = msgs.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        const lastMessage = sortedMessages[0];
        const unreadCount = msgs.filter(msg => 
          !msg.isRead && msg.recipientId === userId
        ).length;

        const otherUserId = lastMessage.senderId === userId 
          ? lastMessage.recipientId 
          : lastMessage.senderId;
        
        const otherUser = otherUserId ? (await this.getUser(otherUserId)) ?? null : null;

        return {
          threadId,
          lastMessage,
          unreadCount,
          otherUser
        };
      })
    );

    return conversations.sort((a, b) => 
      new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
    );
  }

  async markThreadAsRead(threadId: string, userId: string): Promise<void> {
    await db.update(messages)
      .set({ isRead: true })
      .where(and(
        eq(messages.threadId, threadId),
        eq(messages.recipientId, userId),
        eq(messages.isRead, false)
      ));
  }

  async getImamQuestions(userId?: string): Promise<ImamQuestion[]> {
    if (userId) {
      return await db.select().from(imamQuestions).where(eq(imamQuestions.userId, userId));
    }
    return await db.select().from(imamQuestions).orderBy(desc(imamQuestions.createdAt));
  }

  async createImamQuestion(questionData: InsertImamQuestion): Promise<ImamQuestion> {
    const [question] = await db.insert(imamQuestions).values(questionData).returning();
    return question;
  }

  async answerImamQuestion(questionId: string, answer: string): Promise<ImamQuestion | undefined> {
    const [question] = await db.update(imamQuestions)
      .set({ answer, isAnswered: true, answeredAt: new Date() })
      .where(eq(imamQuestions.id, questionId))
      .returning();
    return question;
  }

  async markQuestionAsRead(questionId: string): Promise<ImamQuestion | undefined> {
    const [question] = await db.update(imamQuestions)
      .set({ isRead: true })
      .where(eq(imamQuestions.id, questionId))
      .returning();
    return question;
  }

  async deleteImamQuestion(questionId: string): Promise<boolean> {
    const result = await db.delete(imamQuestions).where(eq(imamQuestions.id, questionId)).returning();
    return result.length > 0;
  }

  async getUnansweredQuestionsCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(imamQuestions)
      .where(eq(imamQuestions.isAnswered, false));
    return Number(result[0]?.count ?? 0);
  }

  async getOrganizationSettings(): Promise<OrganizationSettings | undefined> {
    const result = await db.select().from(organizationSettings).limit(1);
    return result[0];
  }

  async updateOrganizationSettings(settings: Partial<InsertOrganizationSettings>): Promise<OrganizationSettings> {
    const existing = await this.getOrganizationSettings();
    
    if (!existing) {
      const [newSettings] = await db.insert(organizationSettings).values(settings as InsertOrganizationSettings).returning();
      return newSettings;
    }
    
    const [updated] = await db.update(organizationSettings)
      .set({ ...settings, updatedAt: new Date() })
      .where(eq(organizationSettings.id, existing.id))
      .returning();
    return updated;
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const [doc] = await db.insert(documents).values(document).returning();
    return doc;
  }

  async getDocument(id: string): Promise<Document | undefined> {
    const result = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
    return result[0];
  }

  async getAllDocuments(): Promise<Document[]> {
    return await db.select().from(documents).orderBy(desc(documents.uploadedAt));
  }

  async deleteDocument(id: string): Promise<boolean> {
    const result = await db.delete(documents).where(eq(documents.id, id)).returning();
    return result.length > 0;
  }

  async createRequest(request: InsertRequest): Promise<Request> {
    const [req] = await db.insert(requests).values(request).returning();
    return req;
  }

  async getRequest(id: string): Promise<Request | undefined> {
    const result = await db.select().from(requests).where(eq(requests.id, id)).limit(1);
    return result[0];
  }

  async getAllRequests(): Promise<Request[]> {
    return await db.select().from(requests).orderBy(desc(requests.createdAt));
  }

  async getUserRequests(userId: string): Promise<Request[]> {
    return await db.select().from(requests)
      .where(eq(requests.userId, userId))
      .orderBy(desc(requests.createdAt));
  }

  async updateRequest(id: string, updates: Partial<InsertRequest>): Promise<Request | undefined> {
    const [request] = await db.update(requests).set(updates).where(eq(requests.id, id)).returning();
    return request;
  }

  async updateRequestStatus(id: string, status: string, reviewedById?: string, adminNotes?: string): Promise<Request | undefined> {
    const [request] = await db.update(requests)
      .set({
        status,
        reviewedAt: new Date(),
        reviewedById: reviewedById ?? null,
        adminNotes: adminNotes ?? null
      })
      .where(eq(requests.id, id))
      .returning();
    return request;
  }

  async createShopProduct(product: InsertShopProduct): Promise<ShopProduct> {
    const [prod] = await db.insert(shopProducts).values(product).returning();
    return prod;
  }

  async getShopProduct(id: string): Promise<ShopProduct | undefined> {
    const result = await db.select().from(shopProducts).where(eq(shopProducts.id, id)).limit(1);
    return result[0];
  }

  async getAllShopProducts(): Promise<ShopProduct[]> {
    return await db.select().from(shopProducts).orderBy(desc(shopProducts.createdAt));
  }

  async updateShopProduct(id: string, updates: Partial<InsertShopProduct>): Promise<ShopProduct | undefined> {
    const [product] = await db.update(shopProducts).set(updates).where(eq(shopProducts.id, id)).returning();
    return product;
  }

  async deleteShopProduct(id: string): Promise<boolean> {
    const result = await db.delete(shopProducts).where(eq(shopProducts.id, id)).returning();
    return result.length > 0;
  }

  async createMarketplaceItem(item: InsertMarketplaceItem): Promise<MarketplaceItem> {
    const [marketItem] = await db.insert(marketplaceItems).values(item).returning();
    return marketItem;
  }

  async getMarketplaceItem(id: string): Promise<MarketplaceItem | undefined> {
    const result = await db.select().from(marketplaceItems).where(eq(marketplaceItems.id, id)).limit(1);
    return result[0];
  }

  async getAllMarketplaceItems(): Promise<MarketplaceItem[]> {
    return await db.select().from(marketplaceItems).orderBy(desc(marketplaceItems.createdAt));
  }

  async getUserMarketplaceItems(userId: string): Promise<MarketplaceItem[]> {
    return await db.select().from(marketplaceItems)
      .where(eq(marketplaceItems.userId, userId))
      .orderBy(desc(marketplaceItems.createdAt));
  }

  async updateMarketplaceItem(id: string, updates: Partial<InsertMarketplaceItem>): Promise<MarketplaceItem | undefined> {
    const [item] = await db.update(marketplaceItems).set(updates).where(eq(marketplaceItems.id, id)).returning();
    return item;
  }

  async deleteMarketplaceItem(id: string): Promise<boolean> {
    const result = await db.delete(marketplaceItems).where(eq(marketplaceItems.id, id)).returning();
    return result.length > 0;
  }

  async createProductPurchaseRequest(request: InsertProductPurchaseRequest): Promise<ProductPurchaseRequest> {
    const [req] = await db.insert(productPurchaseRequests).values(request).returning();
    return req;
  }

  async getAllProductPurchaseRequests(): Promise<ProductPurchaseRequest[]> {
    return await db.select().from(productPurchaseRequests).orderBy(desc(productPurchaseRequests.createdAt));
  }

  async updateProductPurchaseRequest(id: string, status: string): Promise<ProductPurchaseRequest | undefined> {
    const [request] = await db.update(productPurchaseRequests)
      .set({ status })
      .where(eq(productPurchaseRequests.id, id))
      .returning();
    return request;
  }

  async updateLastViewed(userId: string, type: 'shop' | 'events' | 'announcements' | 'imamQuestions' | 'tasks'): Promise<User | undefined> {
    const now = new Date();
    const updates: Partial<InsertUser> = {};

    switch (type) {
      case 'shop':
        updates.lastViewedShop = now;
        break;
      case 'events':
        updates.lastViewedEvents = now;
        break;
      case 'announcements':
        updates.lastViewedAnnouncements = now;
        break;
      case 'imamQuestions':
        updates.lastViewedImamQuestions = now;
        break;
      case 'tasks':
        updates.lastViewedTasks = now;
        break;
    }

    const [user] = await db.update(users).set(updates).where(eq(users.id, userId)).returning();
    return user;
  }

  async getNewItemsCount(userId: string, type: 'shop' | 'events' | 'announcements' | 'imamQuestions' | 'tasks'): Promise<number> {
    const user = await this.getUser(userId);
    if (!user) return 0;

    let lastViewed: Date | null = null;
    let count = 0;

    switch (type) {
      case 'shop':
        lastViewed = user.lastViewedShop;
        if (!lastViewed) {
          const items = await db.select().from(marketplaceItems).where(eq(marketplaceItems.status, 'active'));
          count = items.length;
        } else {
          const result = await db.select({ count: sql<number>`count(*)` })
            .from(marketplaceItems)
            .where(and(eq(marketplaceItems.status, 'active'), gt(marketplaceItems.createdAt, lastViewed)));
          count = Number(result[0]?.count ?? 0);
        }
        break;
      case 'events':
        lastViewed = user.lastViewedEvents;
        if (!lastViewed) {
          const items = await db.select().from(events);
          count = items.length;
        } else {
          const result = await db.select({ count: sql<number>`count(*)` })
            .from(events)
            .where(gt(events.createdAt, lastViewed));
          count = Number(result[0]?.count ?? 0);
        }
        break;
      case 'announcements':
        lastViewed = user.lastViewedAnnouncements;
        if (!lastViewed) {
          const items = await db.select().from(announcements);
          count = items.length;
        } else {
          const result = await db.select({ count: sql<number>`count(*)` })
            .from(announcements)
            .where(gt(announcements.publishDate, lastViewed));
          count = Number(result[0]?.count ?? 0);
        }
        break;
      case 'imamQuestions':
        lastViewed = user.lastViewedImamQuestions;
        if (!lastViewed) {
          const items = await db.select().from(imamQuestions).where(eq(imamQuestions.isRead, false));
          count = items.length;
        } else {
          const result = await db.select({ count: sql<number>`count(*)` })
            .from(imamQuestions)
            .where(and(eq(imamQuestions.isRead, false), gt(imamQuestions.createdAt, lastViewed)));
          count = Number(result[0]?.count ?? 0);
        }
        break;
      case 'tasks':
        lastViewed = user.lastViewedTasks;
        const userWorkGroups = await db.select().from(workGroupMembers).where(eq(workGroupMembers.userId, userId));
        const groupIds = userWorkGroups.map(m => m.workGroupId);
        
        if (groupIds.length === 0) {
          count = 0;
        } else if (!lastViewed) {
          const items = await db.select().from(tasks).where(sql`${tasks.workGroupId} = ANY(${groupIds})`);
          count = items.length;
        } else {
          const result = await db.select({ count: sql<number>`count(*)` })
            .from(tasks)
            .where(and(
              sql`${tasks.workGroupId} = ANY(${groupIds})`,
              gt(tasks.createdAt, lastViewed)
            ));
          count = Number(result[0]?.count ?? 0);
        }
        break;
    }

    return count;
  }

  async getPendingAccessRequestsCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(accessRequests)
      .where(eq(accessRequests.status, 'pending'));
    return Number(result[0]?.count ?? 0);
  }

  async getAllNewItemsCounts(userId: string): Promise<{ shop: number; events: number; announcements: number; imamQuestions: number; tasks: number; accessRequests: number }> {
    const [shop, events, announcements, imamQuestions, tasks, accessRequests] = await Promise.all([
      this.getNewItemsCount(userId, 'shop'),
      this.getNewItemsCount(userId, 'events'),
      this.getNewItemsCount(userId, 'announcements'),
      this.getNewItemsCount(userId, 'imamQuestions'),
      this.getNewItemsCount(userId, 'tasks'),
      this.getPendingAccessRequestsCount()
    ]);

    return { shop, events, announcements, imamQuestions, tasks, accessRequests };
  }

  async createPrayerTime(prayerTime: InsertPrayerTime): Promise<PrayerTime> {
    const [pt] = await db.insert(prayerTimes).values(prayerTime).returning();
    return pt;
  }

  async getPrayerTimeByDate(date: string): Promise<PrayerTime | undefined> {
    const result = await db.select().from(prayerTimes).where(eq(prayerTimes.date, date)).limit(1);
    return result[0];
  }

  async getAllPrayerTimes(): Promise<PrayerTime[]> {
    const allPrayerTimes = await db.select().from(prayerTimes);
    return allPrayerTimes.sort((a, b) => {
      const [dayA, monthA, yearA] = a.date.split('.').map(Number);
      const [dayB, monthB, yearB] = b.date.split('.').map(Number);
      const dateA = new Date(yearA, monthA - 1, dayA);
      const dateB = new Date(yearB, monthB - 1, dayB);
      return dateA.getTime() - dateB.getTime();
    });
  }

  async bulkCreatePrayerTimes(prayerTimesData: InsertPrayerTime[]): Promise<PrayerTime[]> {
    const created: PrayerTime[] = [];
    for (const pt of prayerTimesData) {
      const existing = await this.getPrayerTimeByDate(pt.date);
      if (!existing) {
        const newPt = await this.createPrayerTime(pt);
        created.push(newPt);
      }
    }
    return created;
  }

  async deletePrayerTime(id: string): Promise<boolean> {
    const result = await db.delete(prayerTimes).where(eq(prayerTimes.id, id)).returning();
    return result.length > 0;
  }

  async deleteAllPrayerTimes(): Promise<boolean> {
    await db.delete(prayerTimes);
    return true;
  }
}

export const storage = new DatabaseStorage();
