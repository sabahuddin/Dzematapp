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
  type InsertProductPurchaseRequest
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
  getEventLocations(): Promise<string[]>;
  
  // Event RSVPs
  createEventRsvp(rsvp: InsertEventRsvp): Promise<EventRsvp>;
  getEventRsvps(eventId: string): Promise<EventRsvp[]>;
  getUserEventRsvp(eventId: string, userId: string): Promise<EventRsvp | null>;
  updateEventRsvp(id: string, updates: { adultsCount?: number; childrenCount?: number }): Promise<EventRsvp | undefined>;
  deleteEventRsvp(id: string): Promise<boolean>;
  
  // Work Groups
  getWorkGroup(id: string): Promise<WorkGroup | undefined>;
  createWorkGroup(workGroup: InsertWorkGroup): Promise<WorkGroup>;
  updateWorkGroup(id: string, workGroup: Partial<InsertWorkGroup>): Promise<WorkGroup | undefined>;
  deleteWorkGroup(id: string): Promise<boolean>;
  getAllWorkGroups(): Promise<WorkGroup[]>;
  
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
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private announcements: Map<string, Announcement> = new Map();
  private events: Map<string, Event> = new Map();
  private eventRsvps: Map<string, EventRsvp> = new Map();
  private workGroups: Map<string, WorkGroup> = new Map();
  private workGroupMembers: Map<string, WorkGroupMember> = new Map();
  private tasks: Map<string, Task> = new Map();
  private accessRequests: Map<string, AccessRequest> = new Map();
  private taskComments: Map<string, TaskComment> = new Map();
  private groupFiles: Map<string, GroupFile> = new Map();
  private announcementFiles: Map<string, AnnouncementFile> = new Map();
  private activities: Map<string, Activity> = new Map();
  private familyRelationships: Map<string, FamilyRelationship> = new Map();
  private messages: Map<string, Message> = new Map();
  private imamQuestions: Map<string, ImamQuestion> = new Map();
  private organizationSettings: OrganizationSettings | null = null;
  private documents: Map<string, Document> = new Map();
  private requests: Map<string, Request> = new Map();
  private shopProducts: Map<string, ShopProduct> = new Map();
  private marketplaceItems: Map<string, MarketplaceItem> = new Map();
  private productPurchaseRequests: Map<string, ProductPurchaseRequest> = new Map();

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
      phone: null,
      photo: null,
      address: null,
      city: null,
      postalCode: null,
      dateOfBirth: null,
      occupation: null,
      membershipDate: new Date(),
      status: "aktivan",
      inactiveReason: null,
      categories: [],
      roles: ["admin"],
      isAdmin: true
    };
    this.users.set(adminUser.id, adminUser);

    // Initialize organization settings
    this.organizationSettings = {
      id: randomUUID(),
      name: "Islamska Zajednica",
      address: "Ulica Džemata 123",
      phone: "+387 33 123 456",
      email: "info@dzemat.ba",
      facebookUrl: null,
      instagramUrl: null,
      youtubeUrl: null,
      twitterUrl: null,
      livestreamUrl: null,
      livestreamEnabled: false,
      livestreamTitle: null,
      updatedAt: new Date()
    };

    // Create sample data
    this.createSampleData();
  }

  private createSampleData() {
    // Sample users
    const sampleUsers = [
      { firstName: "Marko", lastName: "Petrović", username: "marko.petrovic", email: "marko@example.com", roles: ["clan"] },
      { firstName: "Ana", lastName: "Marić", username: "ana.maric", email: "ana@example.com", roles: ["clan_io"] },
      { firstName: "Stefan", lastName: "Jovanović", username: "stefan.jovanovic", email: "stefan@example.com", roles: ["clan"] }
    ];

    sampleUsers.forEach(userData => {
      const user: User = {
        id: randomUUID(),
        firstName: userData.firstName,
        lastName: userData.lastName,
        username: userData.username,
        email: userData.email,
        password: "password123",
        phone: null,
        photo: null,
        address: null,
        city: null,
        postalCode: null,
        dateOfBirth: null,
        occupation: null,
        membershipDate: new Date(),
        status: userData.username === "stefan.jovanovic" ? "pasivan" : "aktivan",
        inactiveReason: userData.username === "stefan.jovanovic" ? "Drugi džemat" : null,
        categories: userData.username === "marko.petrovic" ? ["Muškarci"] : userData.username === "ana.maric" ? ["Žene", "Roditelji"] : [],
        roles: userData.roles,
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

    const workGroupIds: string[] = [];
    workGroupsData.forEach(groupData => {
      const workGroup: WorkGroup = {
        id: randomUUID(),
        ...groupData,
        createdAt: new Date()
      };
      this.workGroups.set(workGroup.id, workGroup);
      workGroupIds.push(workGroup.id);
    });

    // Add sample members and moderators
    const usersList = Array.from(this.users.values()).filter(u => !u.isAdmin);
    if (usersList.length > 0 && workGroupIds.length > 0) {
      // Make first user moderator of first group
      const member1: WorkGroupMember = {
        id: randomUUID(),
        workGroupId: workGroupIds[0],
        userId: usersList[0].id,
        isModerator: true,
        joinedAt: new Date()
      };
      this.workGroupMembers.set(member1.id, member1);

      // Make second user regular member of first group
      if (usersList.length > 1) {
        const member2: WorkGroupMember = {
          id: randomUUID(),
          workGroupId: workGroupIds[0],
          userId: usersList[1].id,
          isModerator: false,
          joinedAt: new Date()
        };
        this.workGroupMembers.set(member2.id, member2);
      }

      // Make second user moderator of second group
      if (usersList.length > 1 && workGroupIds.length > 1) {
        const member3: WorkGroupMember = {
          id: randomUUID(),
          workGroupId: workGroupIds[1],
          userId: usersList[1].id,
          isModerator: true,
          joinedAt: new Date()
        };
        this.workGroupMembers.set(member3.id, member3);
      }
    }

    // Add sample tasks
    if (workGroupIds.length > 0 && usersList.length > 0) {
      const sampleTasks = [
        { 
          title: "Organizacija iftar programa", 
          description: "Potrebno je organizirati iftar program za 100 ljudi",
          workGroupId: workGroupIds[0],
          assignedToId: usersList[0]?.id,
          status: "u_toku",
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
        },
        { 
          title: "Popravka toaleta", 
          description: "Popraviti oštećene toalete u prizemlju",
          workGroupId: workGroupIds[1] || workGroupIds[0],
          assignedToId: usersList[1]?.id,
          status: "na_cekanju",
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days from now
        },
        { 
          title: "Priprema obrazovnog materijala", 
          description: "Kreirati materijale za obrazovne aktivnosti",
          workGroupId: workGroupIds[2] || workGroupIds[0],
          assignedToId: usersList[0]?.id,
          status: "završeno",
          dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
        },
        { 
          title: "Čišćenje prostora nakon događaja", 
          description: "Očistiti prostor nakon završenog događaja",
          workGroupId: workGroupIds[0],
          assignedToId: usersList[1]?.id,
          status: "završeno",
          dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
        },
        { 
          title: "Nabavka nove opreme", 
          description: "Nabaviti novu opremu za održavanje",
          workGroupId: workGroupIds[1] || workGroupIds[0],
          assignedToId: null,
          status: "arhiva",
          dueDate: null
        }
      ];

      sampleTasks.forEach(taskData => {
        const task: Task = {
          id: randomUUID(),
          ...taskData,
          descriptionImage: null,
          createdAt: new Date()
        };
        this.tasks.set(task.id, task);
      });
    }
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
      status: insertUser.status || "aktivan",
      isAdmin: false,
      email: insertUser.email ?? null,
      phone: insertUser.phone ?? null,
      photo: insertUser.photo ?? null,
      address: insertUser.address ?? null,
      city: insertUser.city ?? null,
      postalCode: insertUser.postalCode ?? null,
      dateOfBirth: insertUser.dateOfBirth ?? null,
      occupation: insertUser.occupation ?? null,
      inactiveReason: insertUser.inactiveReason ?? null,
      categories: insertUser.categories ?? [],
      roles: insertUser.roles ?? []
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
      isFeatured: insertAnnouncement.isFeatured || false,
      categories: insertAnnouncement.categories || []
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
      reminderTime: insertEvent.reminderTime || null,
      categories: insertEvent.categories || null,
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

  async getEventLocations(): Promise<string[]> {
    const events = Array.from(this.events.values());
    const locations = events
      .map(event => event.location)
      .filter((location, index, self) => location && self.indexOf(location) === index);
    return locations.sort();
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

  async getUserEventRsvp(eventId: string, userId: string): Promise<EventRsvp | null> {
    const rsvp = Array.from(this.eventRsvps.values()).find(r => r.eventId === eventId && r.userId === userId);
    return rsvp || null;
  }

  async updateEventRsvp(id: string, updates: { adultsCount?: number; childrenCount?: number }): Promise<EventRsvp | undefined> {
    const rsvp = this.eventRsvps.get(id);
    if (!rsvp) return undefined;

    const updatedRsvp = { ...rsvp, ...updates };
    this.eventRsvps.set(id, updatedRsvp);
    return updatedRsvp;
  }

  async deleteEventRsvp(id: string): Promise<boolean> {
    return this.eventRsvps.delete(id);
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

  // Work Group Members
  async addMemberToWorkGroup(workGroupId: string, userId: string): Promise<WorkGroupMember> {
    // Check if user is already a member
    const existingMembership = Array.from(this.workGroupMembers.values())
      .find(member => member.workGroupId === workGroupId && member.userId === userId);
    
    if (existingMembership) {
      return existingMembership;
    }

    const id = randomUUID();
    const workGroupMember: WorkGroupMember = {
      id,
      workGroupId,
      userId,
      isModerator: false,
      joinedAt: new Date()
    };
    this.workGroupMembers.set(id, workGroupMember);
    
    await this.createActivity({
      type: "workgroup",
      description: `Korisnik dodao u radnu grupu`,
      userId
    });
    
    return workGroupMember;
  }

  async removeMemberFromWorkGroup(workGroupId: string, userId: string): Promise<boolean> {
    const member = Array.from(this.workGroupMembers.values())
      .find(m => m.workGroupId === workGroupId && m.userId === userId);
    
    if (member) {
      const deleted = this.workGroupMembers.delete(member.id);
      
      if (deleted) {
        await this.createActivity({
          type: "workgroup",
          description: `Korisnik uklonjen iz radne grupe`,
          userId
        });
      }
      
      return deleted;
    }
    return false;
  }

  async getWorkGroupMembers(workGroupId: string): Promise<WorkGroupMember[]> {
    return Array.from(this.workGroupMembers.values())
      .filter(member => member.workGroupId === workGroupId);
  }

  async getUserWorkGroups(userId: string): Promise<WorkGroupMember[]> {
    return Array.from(this.workGroupMembers.values())
      .filter(member => member.userId === userId);
  }

  async isUserMemberOfWorkGroup(workGroupId: string, userId: string): Promise<boolean> {
    return Array.from(this.workGroupMembers.values())
      .some(member => member.workGroupId === workGroupId && member.userId === userId);
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
      descriptionImage: insertTask.descriptionImage || null,
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

  async getAllTasksWithWorkGroup(userId: string, isAdmin: boolean): Promise<Array<Task & { workGroup: WorkGroup }>> {
    const allTasks = Array.from(this.tasks.values());
    
    if (isAdmin) {
      return allTasks.map(task => {
        const workGroup = this.workGroups.get(task.workGroupId);
        return { ...task, workGroup: workGroup! };
      }).filter(task => task.workGroup);
    } else {
      const userModeratedGroups = Array.from(this.workGroupMembers.values())
        .filter(member => member.userId === userId && member.isModerator)
        .map(member => member.workGroupId);
      
      return allTasks
        .filter(task => userModeratedGroups.includes(task.workGroupId))
        .map(task => {
          const workGroup = this.workGroups.get(task.workGroupId);
          return { ...task, workGroup: workGroup! };
        })
        .filter(task => task.workGroup);
    }
  }

  async moveTaskToWorkGroup(taskId: string, newWorkGroupId: string): Promise<Task | undefined> {
    const task = this.tasks.get(taskId);
    if (!task) return undefined;

    const newWorkGroup = this.workGroups.get(newWorkGroupId);
    if (!newWorkGroup) return undefined;

    const updatedTask = { ...task, workGroupId: newWorkGroupId };
    this.tasks.set(taskId, updatedTask);
    
    return updatedTask;
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

  // Moderator management methods
  async setModerator(workGroupId: string, userId: string, isModerator: boolean): Promise<WorkGroupMember | undefined> {
    const member = Array.from(this.workGroupMembers.values())
      .find(m => m.workGroupId === workGroupId && m.userId === userId);
    
    if (member) {
      const updatedMember = { ...member, isModerator };
      this.workGroupMembers.set(member.id, updatedMember);
      
      await this.createActivity({
        type: "workgroup",
        description: `Korisnik ${isModerator ? 'označen kao moderator' : 'uklonjen kao moderator'}`,
        userId
      });
      
      return updatedMember;
    }
    return undefined;
  }

  async getWorkGroupModerators(workGroupId: string): Promise<WorkGroupMember[]> {
    return Array.from(this.workGroupMembers.values())
      .filter(member => member.workGroupId === workGroupId && member.isModerator);
  }

  async isUserModeratorOfWorkGroup(workGroupId: string, userId: string): Promise<boolean> {
    const member = Array.from(this.workGroupMembers.values())
      .find(m => m.workGroupId === workGroupId && m.userId === userId);
    return member ? !!member.isModerator : false;
  }

  // Task comment methods
  async createTaskComment(insertComment: InsertTaskComment): Promise<TaskComment> {
    const id = randomUUID();
    const comment: TaskComment = {
      id,
      taskId: insertComment.taskId,
      userId: insertComment.userId,
      content: insertComment.content,
      commentImage: insertComment.commentImage || null,
      createdAt: new Date()
    };
    this.taskComments.set(id, comment);
    
    await this.createActivity({
      type: "task",
      description: `Komentar dodao na zadatak`,
      userId: comment.userId
    });
    
    return comment;
  }

  async getTaskComment(id: string): Promise<TaskComment | undefined> {
    return this.taskComments.get(id);
  }

  async getTaskComments(taskId: string): Promise<TaskComment[]> {
    return Array.from(this.taskComments.values())
      .filter(comment => comment.taskId === taskId)
      .sort((a, b) => new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime());
  }

  async deleteTaskComment(id: string): Promise<boolean> {
    return this.taskComments.delete(id);
  }

  // Group file methods
  async createGroupFile(insertFile: InsertGroupFile): Promise<GroupFile> {
    const id = randomUUID();
    const file: GroupFile = {
      id,
      workGroupId: insertFile.workGroupId,
      uploadedById: insertFile.uploadedById,
      fileName: insertFile.fileName,
      fileType: insertFile.fileType,
      fileSize: insertFile.fileSize,
      filePath: insertFile.filePath,
      uploadedAt: new Date()
    };
    this.groupFiles.set(id, file);
    
    await this.createActivity({
      type: "workgroup",
      description: `Fajl učitao: ${file.fileName}`,
      userId: file.uploadedById
    });
    
    return file;
  }

  async getGroupFile(id: string): Promise<GroupFile | undefined> {
    return this.groupFiles.get(id);
  }

  async getGroupFiles(workGroupId: string): Promise<GroupFile[]> {
    return Array.from(this.groupFiles.values())
      .filter(file => file.workGroupId === workGroupId)
      .sort((a, b) => new Date(b.uploadedAt!).getTime() - new Date(a.uploadedAt!).getTime());
  }

  async deleteGroupFile(id: string): Promise<boolean> {
    return this.groupFiles.delete(id);
  }

  // Announcement Files
  async createAnnouncementFile(insertFile: InsertAnnouncementFile): Promise<AnnouncementFile> {
    const id = randomUUID();
    const file: AnnouncementFile = {
      id,
      announcementId: insertFile.announcementId,
      uploadedById: insertFile.uploadedById,
      fileName: insertFile.fileName,
      fileType: insertFile.fileType,
      fileSize: insertFile.fileSize,
      filePath: insertFile.filePath,
      uploadedAt: new Date()
    };
    this.announcementFiles.set(id, file);
    
    await this.createActivity({
      type: "announcement",
      description: `Fajl dodao u obavijest: ${file.fileName}`,
      userId: file.uploadedById
    });
    
    return file;
  }

  async getAnnouncementFile(id: string): Promise<AnnouncementFile | undefined> {
    return this.announcementFiles.get(id);
  }

  async getAnnouncementFiles(announcementId: string): Promise<AnnouncementFile[]> {
    return Array.from(this.announcementFiles.values())
      .filter(file => file.announcementId === announcementId)
      .sort((a, b) => new Date(b.uploadedAt!).getTime() - new Date(a.uploadedAt!).getTime());
  }

  async deleteAnnouncementFile(id: string): Promise<boolean> {
    return this.announcementFiles.delete(id);
  }

  // Family Relationships
  async createFamilyRelationship(insertRelationship: InsertFamilyRelationship): Promise<FamilyRelationship> {
    const id = randomUUID();
    const relationship: FamilyRelationship = {
      id,
      userId: insertRelationship.userId,
      relatedUserId: insertRelationship.relatedUserId,
      relationship: insertRelationship.relationship,
      createdAt: new Date()
    };
    this.familyRelationships.set(id, relationship);
    
    await this.createActivity({
      type: "registration",
      description: `Dodan porodični odnos: ${relationship.relationship}`,
      userId: relationship.userId
    });
    
    return relationship;
  }

  async getFamilyRelationship(id: string): Promise<FamilyRelationship | undefined> {
    return this.familyRelationships.get(id);
  }

  async getUserFamilyRelationships(userId: string): Promise<FamilyRelationship[]> {
    return Array.from(this.familyRelationships.values())
      .filter(rel => rel.userId === userId || rel.relatedUserId === userId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async deleteFamilyRelationship(id: string): Promise<boolean> {
    return this.familyRelationships.delete(id);
  }

  async getFamilyMembersByRelationship(userId: string, relationship: string): Promise<FamilyRelationship[]> {
    return Array.from(this.familyRelationships.values())
      .filter(rel => 
        (rel.userId === userId || rel.relatedUserId === userId) && 
        rel.relationship === relationship
      )
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  // Message methods
  async getMessages(userId: string): Promise<Message[]> {
    const user = await this.getUser(userId);
    const userCategories = user?.categories || [];
    
    return Array.from(this.messages.values())
      .filter(msg => 
        msg.senderId === userId || 
        msg.recipientId === userId || 
        (msg.category && userCategories.includes(msg.category))
      )
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = randomUUID();
    
    // If no threadId provided, this is a new conversation
    const threadId = insertMessage.threadId || id;
    
    const message: Message = {
      id,
      senderId: insertMessage.senderId,
      recipientId: insertMessage.recipientId || null,
      category: insertMessage.category || null,
      subject: insertMessage.subject,
      content: insertMessage.content,
      isRead: false,
      threadId,
      parentMessageId: insertMessage.parentMessageId || null,
      createdAt: new Date()
    };
    this.messages.set(id, message);
    
    await this.createActivity({
      type: "message",
      description: `Poruka poslana: ${message.subject}`,
      userId: message.senderId
    });
    
    return message;
  }

  async markAsRead(messageId: string, userId: string): Promise<Message | undefined> {
    const message = this.messages.get(messageId);
    if (!message) return undefined;
    
    const user = await this.getUser(userId);
    const userCategories = user?.categories || [];
    
    if (message.recipientId === userId || (message.category && userCategories.includes(message.category))) {
      const updatedMessage: Message = {
        ...message,
        isRead: true
      };
      this.messages.set(messageId, updatedMessage);
      return updatedMessage;
    }
    
    return undefined;
  }

  async deleteMessage(messageId: string): Promise<boolean> {
    return this.messages.delete(messageId);
  }

  async getUnreadCount(userId: string): Promise<number> {
    const messages = await this.getMessages(userId);
    return messages.filter(msg => 
      !msg.isRead && 
      (msg.recipientId === userId || msg.category)
    ).length;
  }

  async getMessageThread(threadId: string, userId: string): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(msg => 
        msg.threadId === threadId &&
        (msg.senderId === userId || msg.recipientId === userId)
      )
      .sort((a, b) => new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime());
  }

  async getConversations(userId: string): Promise<Array<{ threadId: string; lastMessage: Message; unreadCount: number; otherUser: User | null }>> {
    const userMessages = await this.getMessages(userId);
    
    // Group messages by threadId
    const threadMap = new Map<string, Message[]>();
    userMessages.forEach(msg => {
      const thread = msg.threadId || msg.id;
      if (!threadMap.has(thread)) {
        threadMap.set(thread, []);
      }
      threadMap.get(thread)!.push(msg);
    });

    // Create conversation list
    const conversations = await Promise.all(
      Array.from(threadMap.entries()).map(async ([threadId, messages]) => {
        // Sort messages by date
        const sortedMessages = messages.sort((a, b) => 
          new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
        );
        
        const lastMessage = sortedMessages[0];
        
        // Count unread messages in this thread
        const unreadCount = messages.filter(msg => 
          !msg.isRead && msg.recipientId === userId
        ).length;

        // Determine the other user in the conversation
        const otherUserId = lastMessage.senderId === userId 
          ? lastMessage.recipientId 
          : lastMessage.senderId;
        
        const otherUser = otherUserId ? await this.getUser(otherUserId) : null;

        return {
          threadId,
          lastMessage,
          unreadCount,
          otherUser
        };
      })
    );

    // Sort conversations by last message date
    return conversations.sort((a, b) => 
      new Date(b.lastMessage.createdAt!).getTime() - new Date(a.lastMessage.createdAt!).getTime()
    );
  }

  async markThreadAsRead(threadId: string, userId: string): Promise<void> {
    const messages = Array.from(this.messages.values())
      .filter(msg => 
        msg.threadId === threadId && 
        msg.recipientId === userId &&
        !msg.isRead
      );
    
    messages.forEach(msg => {
      this.messages.set(msg.id, { ...msg, isRead: true });
    });
  }

  // Imam Questions
  async getImamQuestions(userId?: string): Promise<ImamQuestion[]> {
    const questions = Array.from(this.imamQuestions.values());
    if (userId) {
      return questions.filter(q => q.userId === userId);
    }
    return questions.sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async createImamQuestion(questionData: InsertImamQuestion): Promise<ImamQuestion> {
    const question: ImamQuestion = {
      id: randomUUID(),
      ...questionData,
      answer: null,
      isAnswered: false,
      isRead: false,
      createdAt: new Date().toISOString(),
      answeredAt: null,
    };
    this.imamQuestions.set(question.id, question);
    return question;
  }

  async answerImamQuestion(questionId: string, answer: string): Promise<ImamQuestion | undefined> {
    const question = this.imamQuestions.get(questionId);
    if (!question) return undefined;

    const updatedQuestion: ImamQuestion = {
      ...question,
      answer,
      isAnswered: true,
      answeredAt: new Date().toISOString(),
    };
    this.imamQuestions.set(questionId, updatedQuestion);
    return updatedQuestion;
  }

  async markQuestionAsRead(questionId: string): Promise<ImamQuestion | undefined> {
    const question = this.imamQuestions.get(questionId);
    if (!question) return undefined;

    const updatedQuestion: ImamQuestion = {
      ...question,
      isRead: true,
    };
    this.imamQuestions.set(questionId, updatedQuestion);
    return updatedQuestion;
  }

  async deleteImamQuestion(questionId: string): Promise<boolean> {
    return this.imamQuestions.delete(questionId);
  }

  async getUnansweredQuestionsCount(): Promise<number> {
    return Array.from(this.imamQuestions.values())
      .filter(q => !q.isAnswered).length;
  }

  // Organization Settings
  async getOrganizationSettings(): Promise<OrganizationSettings | undefined> {
    return this.organizationSettings || undefined;
  }

  async updateOrganizationSettings(settings: Partial<InsertOrganizationSettings>): Promise<OrganizationSettings> {
    if (!this.organizationSettings) {
      // Create new settings if none exist
      this.organizationSettings = {
        id: randomUUID(),
        name: settings.name || "Islamska Zajednica",
        address: settings.address || "Ulica Džemata 123",
        phone: settings.phone || "+387 33 123 456",
        email: settings.email || "info@dzemat.ba",
        facebookUrl: settings.facebookUrl || null,
        instagramUrl: settings.instagramUrl || null,
        youtubeUrl: settings.youtubeUrl || null,
        twitterUrl: settings.twitterUrl || null,
        livestreamUrl: settings.livestreamUrl || null,
        livestreamEnabled: settings.livestreamEnabled || false,
        livestreamTitle: settings.livestreamTitle || null,
        updatedAt: new Date()
      };
    } else {
      // Update existing settings
      this.organizationSettings = {
        ...this.organizationSettings,
        ...settings,
        updatedAt: new Date()
      };
    }
    return this.organizationSettings;
  }

  // Documents
  async createDocument(document: InsertDocument): Promise<Document> {
    const newDocument: Document = {
      id: randomUUID(),
      title: document.title,
      description: document.description || null,
      fileName: document.fileName,
      filePath: document.filePath,
      fileSize: document.fileSize,
      uploadedById: document.uploadedById,
      uploadedAt: new Date()
    };
    this.documents.set(newDocument.id, newDocument);
    return newDocument;
  }

  async getDocument(id: string): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async getAllDocuments(): Promise<Document[]> {
    return Array.from(this.documents.values()).sort((a, b) => 
      b.uploadedAt.getTime() - a.uploadedAt.getTime()
    );
  }

  async deleteDocument(id: string): Promise<boolean> {
    return this.documents.delete(id);
  }

  // Requests
  async createRequest(request: InsertRequest): Promise<Request> {
    const newRequest: Request = {
      id: randomUUID(),
      userId: request.userId,
      requestType: request.requestType,
      status: request.status || "pending",
      formData: request.formData,
      createdAt: new Date(),
      reviewedAt: null,
      reviewedById: request.reviewedById || null,
      adminNotes: request.adminNotes || null
    };
    this.requests.set(newRequest.id, newRequest);
    return newRequest;
  }

  async getRequest(id: string): Promise<Request | undefined> {
    return this.requests.get(id);
  }

  async getAllRequests(): Promise<Request[]> {
    return Array.from(this.requests.values()).sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async getUserRequests(userId: string): Promise<Request[]> {
    return Array.from(this.requests.values())
      .filter(request => request.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updateRequest(id: string, updates: Partial<InsertRequest>): Promise<Request | undefined> {
    const request = this.requests.get(id);
    if (!request) return undefined;

    const updatedRequest: Request = {
      ...request,
      ...updates
    };
    this.requests.set(id, updatedRequest);
    return updatedRequest;
  }

  async updateRequestStatus(id: string, status: string, reviewedById?: string, adminNotes?: string): Promise<Request | undefined> {
    const request = this.requests.get(id);
    if (!request) return undefined;

    const updatedRequest: Request = {
      ...request,
      status,
      reviewedAt: new Date(),
      reviewedById: reviewedById || null,
      adminNotes: adminNotes || null
    };
    this.requests.set(id, updatedRequest);
    return updatedRequest;
  }

  // Shop Products
  async createShopProduct(product: InsertShopProduct): Promise<ShopProduct> {
    const newProduct: ShopProduct = {
      id: randomUUID(),
      name: product.name,
      photos: product.photos || null,
      size: product.size || null,
      quantity: product.quantity || 0,
      color: product.color || null,
      notes: product.notes || null,
      price: product.price || null,
      createdById: product.createdById,
      createdAt: new Date()
    };
    this.shopProducts.set(newProduct.id, newProduct);
    return newProduct;
  }

  async getShopProduct(id: string): Promise<ShopProduct | undefined> {
    return this.shopProducts.get(id);
  }

  async getAllShopProducts(): Promise<ShopProduct[]> {
    return Array.from(this.shopProducts.values()).sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async updateShopProduct(id: string, updates: Partial<InsertShopProduct>): Promise<ShopProduct | undefined> {
    const product = this.shopProducts.get(id);
    if (!product) return undefined;

    const updatedProduct: ShopProduct = {
      ...product,
      ...updates
    };
    this.shopProducts.set(id, updatedProduct);
    return updatedProduct;
  }

  async deleteShopProduct(id: string): Promise<boolean> {
    return this.shopProducts.delete(id);
  }

  // Marketplace Items
  async createMarketplaceItem(item: InsertMarketplaceItem): Promise<MarketplaceItem> {
    const newItem: MarketplaceItem = {
      id: randomUUID(),
      name: item.name,
      description: item.description || null,
      photos: item.photos || null,
      type: item.type,
      userId: item.userId,
      createdAt: new Date()
    };
    this.marketplaceItems.set(newItem.id, newItem);
    return newItem;
  }

  async getMarketplaceItem(id: string): Promise<MarketplaceItem | undefined> {
    return this.marketplaceItems.get(id);
  }

  async getAllMarketplaceItems(): Promise<MarketplaceItem[]> {
    return Array.from(this.marketplaceItems.values()).sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async getUserMarketplaceItems(userId: string): Promise<MarketplaceItem[]> {
    return Array.from(this.marketplaceItems.values())
      .filter(item => item.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updateMarketplaceItem(id: string, updates: Partial<InsertMarketplaceItem>): Promise<MarketplaceItem | undefined> {
    const item = this.marketplaceItems.get(id);
    if (!item) return undefined;

    const updatedItem: MarketplaceItem = {
      ...item,
      ...updates
    };
    this.marketplaceItems.set(id, updatedItem);
    return updatedItem;
  }

  async deleteMarketplaceItem(id: string): Promise<boolean> {
    return this.marketplaceItems.delete(id);
  }

  // Product Purchase Requests
  async createProductPurchaseRequest(request: InsertProductPurchaseRequest): Promise<ProductPurchaseRequest> {
    const newRequest: ProductPurchaseRequest = {
      id: randomUUID(),
      productId: request.productId,
      userId: request.userId,
      quantity: request.quantity || 1,
      status: request.status || "pending",
      createdAt: new Date()
    };
    this.productPurchaseRequests.set(newRequest.id, newRequest);
    return newRequest;
  }

  async getAllProductPurchaseRequests(): Promise<ProductPurchaseRequest[]> {
    return Array.from(this.productPurchaseRequests.values()).sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async updateProductPurchaseRequest(id: string, status: string): Promise<ProductPurchaseRequest | undefined> {
    const request = this.productPurchaseRequests.get(id);
    if (!request) return undefined;

    const updatedRequest: ProductPurchaseRequest = {
      ...request,
      status
    };
    this.productPurchaseRequests.set(id, updatedRequest);
    return updatedRequest;
  }
}

export const storage = new MemStorage();
