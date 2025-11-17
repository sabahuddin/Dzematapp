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
  type ImportantDate,
  type InsertImportantDate,
  type FinancialContribution,
  type InsertFinancialContribution,
  type ActivityLog,
  type InsertActivityLog,
  type EventAttendance,
  type InsertEventAttendance,
  type PointsSettings,
  type InsertPointsSettings,
  type Badge,
  type InsertBadge,
  type UserBadge,
  type InsertUserBadge,
  type Project,
  type InsertProject,
  type UserPreferences,
  type InsertUserPreferences,
  type Proposal,
  type InsertProposal,
  type Receipt,
  type InsertReceipt,
  type CertificateTemplate,
  type InsertCertificateTemplate,
  type UserCertificate,
  type InsertUserCertificate,
  type MembershipApplication,
  type InsertMembershipApplication,
  type AkikaApplication,
  type InsertAkikaApplication,
  type MarriageApplication,
  type InsertMarriageApplication,
  type ActivityFeedItem,
  type InsertActivityFeedItem,
  type Service,
  type InsertService,
  type ServiceWithUser,
  users,
  announcements,
  events,
  eventRsvps,
  workGroups,
  workGroupMembers,
  tasks,
  accessRequests,
  taskComments,
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
  prayerTimes,
  importantDates,
  financialContributions,
  activityLog,
  eventAttendance,
  pointsSettings,
  badges,
  userBadges,
  projects,
  userPreferences,
  proposals,
  receipts,
  certificateTemplates,
  userCertificates,
  membershipApplications,
  akikaApplications,
  marriageApplications,
  activityFeed,
  services
} from "@shared/schema";
import { db } from './db';
import { eq, and, or, desc, asc, gt, sql, inArray } from 'drizzle-orm';

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
  
  // Announcement Files
  createAnnouncementFile(file: InsertAnnouncementFile): Promise<AnnouncementFile>;
  getAnnouncementFile(id: string): Promise<AnnouncementFile | undefined>;
  getAnnouncementFiles(announcementId: string): Promise<AnnouncementFile[]>;
  deleteAnnouncementFile(id: string): Promise<boolean>;
  updateAnnouncementFeed(announcementId: string): Promise<void>;
  
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

  // Services (Usluge)
  createService(service: InsertService): Promise<Service>;
  getService(id: string): Promise<Service | undefined>;
  getAllServices(): Promise<Service[]>;
  getAllServicesWithUsers(): Promise<ServiceWithUser[]>;
  getUserServices(userId: string): Promise<Service[]>;
  updateService(id: string, updates: Partial<InsertService>): Promise<Service | undefined>;
  deleteService(id: string): Promise<boolean>;

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
  getPendingAccessRequestsCount(lastViewed?: Date | null): Promise<number>;
  getAllNewItemsCounts(userId: string): Promise<{ shop: number; events: number; announcements: number; imamQuestions: number; tasks: number; accessRequests: number }>;

  // Prayer Times
  createPrayerTime(prayerTime: InsertPrayerTime): Promise<PrayerTime>;
  getPrayerTimeByDate(date: string): Promise<PrayerTime | undefined>;
  getAllPrayerTimes(): Promise<PrayerTime[]>;
  bulkCreatePrayerTimes(prayerTimes: InsertPrayerTime[]): Promise<PrayerTime[]>;
  deletePrayerTime(id: string): Promise<boolean>;
  deleteAllPrayerTimes(): Promise<boolean>;

  // Important Dates
  createImportantDate(importantDate: InsertImportantDate): Promise<ImportantDate>;
  getImportantDate(id: string): Promise<ImportantDate | undefined>;
  getAllImportantDates(): Promise<ImportantDate[]>;
  updateImportantDate(id: string, updates: Partial<InsertImportantDate>): Promise<ImportantDate | undefined>;
  deleteImportantDate(id: string): Promise<boolean>;

  // Financial Contributions (Feature 1)
  createFinancialContribution(contribution: InsertFinancialContribution): Promise<FinancialContribution>;
  getFinancialContribution(id: string): Promise<FinancialContribution | undefined>;
  getUserFinancialContributions(userId: string): Promise<FinancialContribution[]>;
  getAllFinancialContributions(): Promise<FinancialContribution[]>;
  updateFinancialContribution(id: string, updates: Partial<InsertFinancialContribution>): Promise<FinancialContribution | undefined>;
  deleteFinancialContribution(id: string): Promise<boolean>;
  deleteContributionWithLogs(contributionId: string): Promise<{ userId: string; projectId: string | null }>;
  getUserTotalDonations(userId: string): Promise<number>;

  // Activity Log (Feature 1)
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  getUserActivityLog(userId: string): Promise<ActivityLog[]>;
  getAllActivityLogs(): Promise<ActivityLog[]>;

  // Event Attendance (Feature 1)
  createEventAttendance(attendance: InsertEventAttendance): Promise<EventAttendance>;
  bulkCreateEventAttendance(attendances: InsertEventAttendance[]): Promise<EventAttendance[]>;
  getEventAttendance(eventId: string): Promise<EventAttendance[]>;
  getUserEventAttendance(userId: string): Promise<EventAttendance[]>;

  // Points Settings (Feature 2)
  getPointsSettings(): Promise<PointsSettings | undefined>;
  updatePointsSettings(settings: Partial<InsertPointsSettings>): Promise<PointsSettings>;

  // Badges (Feature 2)
  createBadge(badge: InsertBadge): Promise<Badge>;
  getBadge(id: string): Promise<Badge | undefined>;
  getAllBadges(): Promise<Badge[]>;
  updateBadge(id: string, updates: Partial<InsertBadge>): Promise<Badge | undefined>;
  deleteBadge(id: string): Promise<boolean>;

  // User Badges (Feature 2)
  awardBadgeToUser(userId: string, badgeId: string): Promise<UserBadge>;
  getUserBadges(userId: string): Promise<UserBadge[]>;
  getAllUserBadges(): Promise<Array<UserBadge & { user: User; badge: Badge }>>;
  checkAndAwardBadges(userId: string): Promise<UserBadge[]>;
  removeUnqualifiedBadges(userId: string): Promise<string[]>;
  deleteActivityLogByRelatedEntity(relatedEntityId: string): Promise<number>;
  deleteActivityLogByUserAndType(userId: string, activityType: string, relatedEntityId: string): Promise<number>;

  // Projects (Feature 4)
  createProject(project: InsertProject & { createdById: string }): Promise<Project>;
  getProject(id: string): Promise<Project | undefined>;
  getAllProjects(): Promise<Project[]>;
  getActiveProjects(): Promise<Project[]>;
  updateProject(id: string, updates: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: string): Promise<boolean>;
  updateProjectAmount(projectId: string, amount: number): Promise<Project | undefined>;

  // User Statistics (Feature 2)
  getUserTasksCompleted(userId: string): Promise<number>;
  getUserEventsAttended(userId: string): Promise<number>;
  recalculateUserPoints(userId: string): Promise<number>;

  // User Preferences (Feature: Quick Access)
  getUserPreferences(userId: string): Promise<import("@shared/schema").UserPreferences | undefined>;
  createUserPreferences(preferences: import("@shared/schema").InsertUserPreferences): Promise<import("@shared/schema").UserPreferences>;
  updateUserPreferences(userId: string, preferences: Partial<import("@shared/schema").InsertUserPreferences>): Promise<import("@shared/schema").UserPreferences | undefined>;

  // Proposals (Moderator Proposals System)
  createProposal(proposal: InsertProposal): Promise<Proposal>;
  getProposal(id: string): Promise<Proposal | undefined>;
  getAllProposals(): Promise<Proposal[]>;
  getProposalsByWorkGroup(workGroupId: string): Promise<Proposal[]>;
  getProposalsByStatus(status: string): Promise<Proposal[]>;
  updateProposal(id: string, updates: Partial<InsertProposal>): Promise<Proposal | undefined>;
  approveProposal(id: string, reviewedById: string, reviewComment?: string): Promise<Proposal | undefined>;
  rejectProposal(id: string, reviewedById: string, reviewComment: string): Promise<Proposal | undefined>;

  // Receipts (Expense Receipts System)
  createReceipt(receipt: InsertReceipt): Promise<Receipt>;
  getReceipt(id: string): Promise<Receipt | undefined>;
  getAllReceipts(): Promise<Receipt[]>;
  getReceiptsByTask(taskId: string): Promise<Receipt[]>;
  getReceiptsByProposal(proposalId: string): Promise<Receipt[]>;
  getReceiptsByStatus(status: string): Promise<Receipt[]>;
  updateReceipt(id: string, updates: Partial<InsertReceipt>): Promise<Receipt | undefined>;
  approveReceipt(id: string, reviewedById: string, reviewComment?: string): Promise<Receipt | undefined>;
  rejectReceipt(id: string, reviewedById: string, reviewComment: string): Promise<Receipt | undefined>;

  // Certificate Templates (Zahvalnice)
  createCertificateTemplate(template: InsertCertificateTemplate): Promise<CertificateTemplate>;
  getCertificateTemplate(id: string): Promise<CertificateTemplate | undefined>;
  getAllCertificateTemplates(): Promise<CertificateTemplate[]>;
  updateCertificateTemplate(id: string, updates: Partial<InsertCertificateTemplate>): Promise<CertificateTemplate | undefined>;
  deleteCertificateTemplate(id: string): Promise<boolean>;

  // User Certificates (Izdati Certifikati)
  createUserCertificate(certificate: InsertUserCertificate): Promise<UserCertificate>;
  getUserCertificate(id: string): Promise<UserCertificate | undefined>;
  getUserCertificates(userId: string): Promise<UserCertificate[]>;
  getAllUserCertificates(): Promise<UserCertificate[]>;
  getUnviewedCertificatesCount(userId: string): Promise<number>;
  markCertificateAsViewed(id: string): Promise<UserCertificate | undefined>;
  deleteCertificate(id: string): Promise<boolean>;

  // Membership Applications (Pristupnice)
  createMembershipApplication(application: InsertMembershipApplication): Promise<MembershipApplication>;
  getMembershipApplication(id: string): Promise<MembershipApplication | undefined>;
  getAllMembershipApplications(): Promise<MembershipApplication[]>;
  updateMembershipApplication(id: string, updates: Partial<InsertMembershipApplication>): Promise<MembershipApplication | undefined>;
  reviewMembershipApplication(id: string, status: string, reviewedById: string, reviewNotes?: string): Promise<MembershipApplication | undefined>;
  deleteMembershipApplication(id: string): Promise<boolean>;

  // Akika Applications (Prijave akike)
  createAkikaApplication(application: InsertAkikaApplication): Promise<AkikaApplication>;
  getAkikaApplication(id: string): Promise<AkikaApplication | undefined>;
  getAllAkikaApplications(): Promise<AkikaApplication[]>;
  updateAkikaApplication(id: string, updates: Partial<InsertAkikaApplication>): Promise<AkikaApplication | undefined>;
  reviewAkikaApplication(id: string, status: string, reviewedById: string, reviewNotes?: string): Promise<AkikaApplication | undefined>;
  getUserAkikaApplications(userId: string): Promise<AkikaApplication[]>;
  deleteAkikaApplication(id: string): Promise<boolean>;

  // Marriage Applications (Prijave šerijatskog vjenčanja)
  createMarriageApplication(application: InsertMarriageApplication): Promise<MarriageApplication>;
  getMarriageApplication(id: string): Promise<MarriageApplication | undefined>;
  getAllMarriageApplications(): Promise<MarriageApplication[]>;
  updateMarriageApplication(id: string, updates: Partial<InsertMarriageApplication>): Promise<MarriageApplication | undefined>;
  reviewMarriageApplication(id: string, status: string, reviewedById: string, reviewNotes?: string): Promise<MarriageApplication | undefined>;
  deleteMarriageApplication(id: string): Promise<boolean>;

  // Activity Feed
  getActivityFeed(limit?: number): Promise<ActivityFeedItem[]>;
  createActivityFeedItem(item: InsertActivityFeedItem): Promise<ActivityFeedItem>;
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
    
    // Add to activity feed
    await this.createActivityFeedItem({
      type: "new_member",
      title: "Novi član džemata",
      description: `${user.firstName} ${user.lastName}`,
      relatedEntityId: user.id,
      relatedEntityType: "user",
      isClickable: false
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

  async updateAnnouncementFeed(announcementId: string) {
    // Get first image from announcement files
    const files = await db.select().from(announcementFiles)
      .where(eq(announcementFiles.announcementId, announcementId))
      .orderBy(asc(announcementFiles.uploadedAt))
      .limit(1);
    
    const imageUrl = files[0]?.fileType === 'image' ? files[0].filePath : null;
    
    // Check if feed item already exists
    const existingFeedItems = await db.select().from(activityFeed)
      .where(and(
        eq(activityFeed.relatedEntityId, announcementId),
        eq(activityFeed.relatedEntityType, 'announcement')
      ))
      .limit(1);

    const announcement = await this.getAnnouncement(announcementId);
    if (!announcement) return;

    if (existingFeedItems.length > 0) {
      // Update existing feed item
      await db.update(activityFeed)
        .set({
          description: announcement.title,
          metadata: JSON.stringify({ imageUrl })
        })
        .where(eq(activityFeed.id, existingFeedItems[0].id));
    } else {
      // Create new feed item
      await this.createActivityFeedItem({
        type: "announcement",
        title: "Nova obavijest",
        description: announcement.title,
        relatedEntityId: announcementId,
        relatedEntityType: "announcement",
        isClickable: true,
        metadata: JSON.stringify({ imageUrl })
      });
    }
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
    
    // Add to activity feed (events don't have photos, use null)
    await this.createActivityFeedItem({
      type: "event",
      title: "Novi događaj",
      description: event.name,
      relatedEntityId: event.id,
      relatedEntityType: "event",
      isClickable: true,
      metadata: JSON.stringify({ imageUrl: null })
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
    // Delete all related records first (in correct order due to foreign keys)
    // 1. Delete all access requests for this work group
    await db.delete(accessRequests).where(eq(accessRequests.workGroupId, id));
    
    // 2. Delete all proposals for this work group
    await db.delete(proposals).where(eq(proposals.workGroupId, id));
    
    // 3. Delete all tasks for this work group
    await db.delete(tasks).where(eq(tasks.workGroupId, id));
    
    // 4. Delete all work group members
    await db.delete(workGroupMembers).where(eq(workGroupMembers.workGroupId, id));
    
    // 5. Finally delete the work group itself
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
    
    if (task.assignedUserIds && task.assignedUserIds.length > 0) {
      for (const userId of task.assignedUserIds) {
        await this.createActivity({
          type: "task",
          description: `Zadatak kreiran: ${task.title}`,
          userId: userId
        });
      }
    }
    
    return task;
  }

  async updateTask(id: string, updateData: Partial<InsertTask>): Promise<Task | undefined> {
    const [task] = await db.update(tasks).set(updateData).where(eq(tasks.id, id)).returning();
    
    if (task && updateData.status === "završeno" && task.assignedUserIds && task.assignedUserIds.length > 0) {
      for (const userId of task.assignedUserIds) {
        await this.createActivity({
          type: "task",
          description: `Zadatak završen: ${task.title}`,
          userId: userId
        });
      }
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


  async createAnnouncementFile(insertFile: InsertAnnouncementFile): Promise<AnnouncementFile> {
    const [file] = await db.insert(announcementFiles).values(insertFile).returning();
    
    await this.createActivity({
      type: "announcement",
      description: `Fajl dodao u obavijest: ${file.fileName}`,
      userId: file.uploadedById
    });
    
    // Update activity feed with new image if it's an image file
    if (file.fileType === 'image') {
      await this.updateAnnouncementFeed(file.announcementId);
    }
    
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
    
    // Add to activity feed
    const typeText = marketItem.type === 'prodajem' ? 'Prodaje se' : 'Poklanja se';
    await this.createActivityFeedItem({
      type: "shop_item",
      title: typeText,
      description: marketItem.name,
      relatedEntityId: marketItem.id,
      relatedEntityType: "shop_item",
      isClickable: false,
      metadata: JSON.stringify({ imageUrl: marketItem.photos?.[0] || null })
    });
    
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

  async createService(service: InsertService): Promise<Service> {
    const [newService] = await db.insert(services).values(service).returning();
    return newService;
  }

  async getService(id: string): Promise<Service | undefined> {
    const result = await db.select().from(services).where(eq(services.id, id)).limit(1);
    return result[0];
  }

  async getAllServices(): Promise<Service[]> {
    return await db.select().from(services).where(eq(services.status, 'active')).orderBy(desc(services.createdAt));
  }

  async getAllServicesWithUsers(): Promise<ServiceWithUser[]> {
    const servicesData = await db.select().from(services)
      .where(eq(services.status, 'active'))
      .orderBy(desc(services.createdAt));
    
    const servicesWithUsers = await Promise.all(
      servicesData.map(async (service) => {
        const user = await this.getUser(service.userId);
        return {
          ...service,
          user: user ? {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
          } : null,
        };
      })
    );
    
    return servicesWithUsers;
  }

  async getUserServices(userId: string): Promise<Service[]> {
    return await db.select().from(services)
      .where(eq(services.userId, userId))
      .orderBy(desc(services.createdAt));
  }

  async updateService(id: string, updates: Partial<InsertService>): Promise<Service | undefined> {
    const [service] = await db.update(services).set(updates).where(eq(services.id, id)).returning();
    return service;
  }

  async deleteService(id: string): Promise<boolean> {
    const result = await db.delete(services).where(eq(services.id, id)).returning();
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
          const items = await db.select().from(tasks).where(inArray(tasks.workGroupId, groupIds));
          count = items.length;
        } else {
          const result = await db.select({ count: sql<number>`count(*)` })
            .from(tasks)
            .where(and(
              inArray(tasks.workGroupId, groupIds),
              gt(tasks.createdAt, lastViewed)
            ));
          count = Number(result[0]?.count ?? 0);
        }
        break;
    }

    return count;
  }

  async getPendingAccessRequestsCount(lastViewed?: Date | null): Promise<number> {
    if (!lastViewed) {
      const result = await db.select({ count: sql<number>`count(*)` })
        .from(accessRequests)
        .where(eq(accessRequests.status, 'pending'));
      return Number(result[0]?.count ?? 0);
    }
    
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(accessRequests)
      .where(and(
        eq(accessRequests.status, 'pending'),
        gt(accessRequests.requestDate, lastViewed)
      ));
    return Number(result[0]?.count ?? 0);
  }

  async getAllNewItemsCounts(userId: string): Promise<{ shop: number; events: number; announcements: number; imamQuestions: number; tasks: number; accessRequests: number }> {
    try {
      const user = await this.getUser(userId);
      const lastViewedTasks = user?.lastViewedTasks || null;
      
      const [shop, events, announcements, imamQuestions, tasks, accessRequests] = await Promise.all([
        this.getNewItemsCount(userId, 'shop').catch(err => { console.error('Error getting shop count:', err); return 0; }),
        this.getNewItemsCount(userId, 'events').catch(err => { console.error('Error getting events count:', err); return 0; }),
        this.getNewItemsCount(userId, 'announcements').catch(err => { console.error('Error getting announcements count:', err); return 0; }),
        this.getNewItemsCount(userId, 'imamQuestions').catch(err => { console.error('Error getting imamQuestions count:', err); return 0; }),
        this.getNewItemsCount(userId, 'tasks').catch(err => { console.error('Error getting tasks count:', err); return 0; }),
        this.getPendingAccessRequestsCount(lastViewedTasks).catch(err => { console.error('Error getting accessRequests count:', err); return 0; })
      ]);

      return { shop, events, announcements, imamQuestions, tasks, accessRequests };
    } catch (error) {
      console.error('Error in getAllNewItemsCounts:', error);
      throw error;
    }
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

  async createImportantDate(importantDate: InsertImportantDate): Promise<ImportantDate> {
    const [date] = await db.insert(importantDates).values(importantDate).returning();
    return date;
  }

  async getImportantDate(id: string): Promise<ImportantDate | undefined> {
    const result = await db.select().from(importantDates).where(eq(importantDates.id, id)).limit(1);
    return result[0];
  }

  async getAllImportantDates(): Promise<ImportantDate[]> {
    const dates = await db.select().from(importantDates).orderBy(asc(importantDates.date));
    return dates;
  }

  async updateImportantDate(id: string, updates: Partial<InsertImportantDate>): Promise<ImportantDate | undefined> {
    const [date] = await db.update(importantDates).set(updates).where(eq(importantDates.id, id)).returning();
    return date;
  }

  async deleteImportantDate(id: string): Promise<boolean> {
    const result = await db.delete(importantDates).where(eq(importantDates.id, id)).returning();
    return result.length > 0;
  }

  // Financial Contributions (Feature 1)
  async createFinancialContribution(contribution: InsertFinancialContribution): Promise<FinancialContribution> {
    const [contrib] = await db.insert(financialContributions).values(contribution).returning();
    
    // NOTE: Project amount is updated in routes.ts to avoid duplicate addition
    
    // Recalculate user points
    await this.recalculateUserPoints(contrib.userId);
    await this.checkAndAwardBadges(contrib.userId);
    
    return contrib;
  }

  async getFinancialContribution(id: string): Promise<FinancialContribution | undefined> {
    const result = await db.select().from(financialContributions).where(eq(financialContributions.id, id)).limit(1);
    return result[0];
  }

  async getUserFinancialContributions(userId: string): Promise<FinancialContribution[]> {
    return await db.select().from(financialContributions)
      .where(eq(financialContributions.userId, userId))
      .orderBy(desc(financialContributions.paymentDate));
  }

  async getAllFinancialContributions(): Promise<FinancialContribution[]> {
    return await db.select().from(financialContributions).orderBy(desc(financialContributions.paymentDate));
  }

  async updateFinancialContribution(id: string, updates: Partial<InsertFinancialContribution>): Promise<FinancialContribution | undefined> {
    const [contrib] = await db.update(financialContributions).set(updates).where(eq(financialContributions.id, id)).returning();
    return contrib;
  }

  async deleteFinancialContribution(id: string): Promise<boolean> {
    const result = await db.delete(financialContributions).where(eq(financialContributions.id, id)).returning();
    return result.length > 0;
  }

  async deleteContributionWithLogs(contributionId: string): Promise<{ userId: string; projectId: string | null }> {
    return await db.transaction(async (tx) => {
      // Get contribution for userId and projectId
      const [contribution] = await tx
        .select()
        .from(financialContributions)
        .where(eq(financialContributions.id, contributionId))
        .limit(1);
      
      if (!contribution) {
        throw new Error('Contribution not found');
      }
      
      // Delete contribution
      await tx.delete(financialContributions).where(eq(financialContributions.id, contributionId));
      
      // Delete all related activity logs (contribution_made, bonus_points, project_contribution)
      await tx.delete(activityLog).where(
        and(
          eq(activityLog.relatedEntityId, contributionId),
          inArray(activityLog.activityType, ['contribution_made', 'bonus_points', 'project_contribution'])
        )
      );
      
      // Update project amount if needed (using SQL arithmetic to avoid floating-point drift and race conditions)
      if (contribution.projectId) {
        await tx.update(projects)
          .set({ 
            currentAmount: sql`greatest(0::numeric, coalesce(current_amount::numeric, 0) - ${contribution.amount}::numeric)::text`
          })
          .where(eq(projects.id, contribution.projectId));
      }
      
      return { userId: contribution.userId, projectId: contribution.projectId };
    });
  }

  async getUserTotalDonations(userId: string): Promise<number> {
    const contributions = await this.getUserFinancialContributions(userId);
    return contributions.reduce((sum, c) => sum + parseFloat(c.amount || '0'), 0);
  }

  // Activity Log (Feature 1)
  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const [activity] = await db.insert(activityLog).values(log).returning();
    
    // Recalculate user points and check for badges
    await this.recalculateUserPoints(activity.userId);
    await this.checkAndAwardBadges(activity.userId);
    
    return activity;
  }

  async getUserActivityLog(userId: string): Promise<ActivityLog[]> {
    return await db.select().from(activityLog)
      .where(eq(activityLog.userId, userId))
      .orderBy(desc(activityLog.createdAt));
  }

  async getAllActivityLogs(): Promise<ActivityLog[]> {
    return await db.select().from(activityLog).orderBy(desc(activityLog.createdAt));
  }

  // Event Attendance (Feature 1)
  async createEventAttendance(attendance: InsertEventAttendance): Promise<EventAttendance> {
    const [attend] = await db.insert(eventAttendance).values(attendance).returning();
    
    // Get points settings
    const settings = await this.getPointsSettings();
    const points = settings?.pointsPerEvent || 20;
    
    // Log activity
    const event = await this.getEvent(attend.eventId);
    await this.createActivityLog({
      userId: attend.userId,
      activityType: 'event_attendance',
      description: `Prisustvo na događaju: ${event?.name || 'Nepoznat događaj'}`,
      points,
      relatedEntityId: attend.eventId,
    });
    
    return attend;
  }

  async bulkCreateEventAttendance(attendances: InsertEventAttendance[]): Promise<EventAttendance[]> {
    const created: EventAttendance[] = [];
    for (const att of attendances) {
      const result = await this.createEventAttendance(att);
      created.push(result);
    }
    return created;
  }

  async getEventAttendance(eventId: string): Promise<EventAttendance[]> {
    return await db.select().from(eventAttendance).where(eq(eventAttendance.eventId, eventId));
  }

  async getUserEventAttendance(userId: string): Promise<EventAttendance[]> {
    return await db.select().from(eventAttendance).where(eq(eventAttendance.userId, userId));
  }

  // Points Settings (Feature 2)
  async getPointsSettings(): Promise<PointsSettings | undefined> {
    const result = await db.select().from(pointsSettings).limit(1);
    if (result.length === 0) {
      // Create default settings
      const [settings] = await db.insert(pointsSettings).values({
        pointsPerChf: 1,
        pointsPerTask: 50,
        pointsPerEvent: 20,
      }).returning();
      return settings;
    }
    return result[0];
  }

  async updatePointsSettings(settings: Partial<InsertPointsSettings>): Promise<PointsSettings> {
    const existing = await this.getPointsSettings();
    if (!existing) {
      const [newSettings] = await db.insert(pointsSettings).values(settings as InsertPointsSettings).returning();
      return newSettings;
    }
    const [updated] = await db.update(pointsSettings).set(settings).where(eq(pointsSettings.id, existing.id)).returning();
    return updated;
  }

  // Badges (Feature 2)
  async createBadge(badge: InsertBadge): Promise<Badge> {
    const [b] = await db.insert(badges).values(badge).returning();
    return b;
  }

  async getBadge(id: string): Promise<Badge | undefined> {
    const result = await db.select().from(badges).where(eq(badges.id, id)).limit(1);
    return result[0];
  }

  async getAllBadges(): Promise<Badge[]> {
    return await db.select().from(badges);
  }

  async updateBadge(id: string, updates: Partial<InsertBadge>): Promise<Badge | undefined> {
    const [badge] = await db.update(badges).set(updates).where(eq(badges.id, id)).returning();
    return badge;
  }

  async deleteBadge(id: string): Promise<boolean> {
    const result = await db.delete(badges).where(eq(badges.id, id)).returning();
    return result.length > 0;
  }

  // User Badges (Feature 2)
  async awardBadgeToUser(userId: string, badgeId: string): Promise<UserBadge> {
    // Check if already awarded
    const existing = await db.select().from(userBadges)
      .where(and(eq(userBadges.userId, userId), eq(userBadges.badgeId, badgeId)))
      .limit(1);
    
    if (existing.length > 0) {
      return existing[0];
    }
    
    const [ub] = await db.insert(userBadges).values({ userId, badgeId }).returning();
    
    // Add to activity feed
    const badge = await this.getBadge(badgeId);
    const user = await this.getUser(userId);
    if (badge && user) {
      const initials = `${user.firstName[0]}. ${user.lastName[0]}.`;
      await this.createActivityFeedItem({
        type: "badge_awarded",
        title: "Dodjeljena značka",
        description: `${badge.name} - ${initials}`,
        relatedEntityId: badgeId,
        relatedEntityType: "badge",
        isClickable: false
      });
    }
    
    return ub;
  }

  async getUserBadges(userId: string): Promise<UserBadge[]> {
    return await db.select().from(userBadges).where(eq(userBadges.userId, userId));
  }

  async getAllUserBadges(): Promise<Array<UserBadge & { user: User; badge: Badge }>> {
    const result = await db.select({
      userBadge: userBadges,
      user: users,
      badge: badges
    })
    .from(userBadges)
    .innerJoin(users, eq(userBadges.userId, users.id))
    .innerJoin(badges, eq(userBadges.badgeId, badges.id))
    .orderBy(desc(userBadges.earnedAt));
    
    return result.map(row => ({
      ...row.userBadge,
      user: row.user,
      badge: row.badge
    }));
  }

  async checkAndAwardBadges(userId: string): Promise<UserBadge[]> {
    const allBadges = await this.getAllBadges();
    const existingBadges = await this.getUserBadges(userId);
    const existingBadgeIds = existingBadges.map(ub => ub.badgeId);
    const awarded: UserBadge[] = [];
    
    for (const badge of allBadges) {
      // Skip if user already has this badge
      if (existingBadgeIds.includes(badge.id)) {
        continue;
      }
      
      let qualifies = false;
      
      switch (badge.criteriaType) {
        case 'contributions_amount': {
          const total = await this.getUserTotalDonations(userId);
          qualifies = total >= badge.criteriaValue;
          break;
        }
        case 'tasks_completed': {
          const count = await this.getUserTasksCompleted(userId);
          qualifies = count >= badge.criteriaValue;
          break;
        }
        case 'events_attended': {
          const count = await this.getUserEventsAttended(userId);
          qualifies = count >= badge.criteriaValue;
          break;
        }
        case 'points_total': {
          const user = await this.getUser(userId);
          qualifies = (user?.totalPoints || 0) >= badge.criteriaValue;
          break;
        }
      }
      
      if (qualifies) {
        const ub = await this.awardBadgeToUser(userId, badge.id);
        awarded.push(ub);
      }
    }
    
    return awarded;
  }

  async removeUnqualifiedBadges(userId: string): Promise<string[]> {
    const allBadges = await this.getAllBadges();
    const awardedBadges = await this.getUserBadges(userId);
    const removedBadgeNames: string[] = [];

    // Check each awarded badge to see if user still qualifies
    for (const userBadge of awardedBadges) {
      const badge = allBadges.find(b => b.id === userBadge.badgeId);
      if (!badge) continue;

      let stillQualifies = false;

      switch (badge.criteriaType) {
        case 'contributions_amount': {
          const total = await this.getUserTotalDonations(userId);
          stillQualifies = total >= badge.criteriaValue;
          break;
        }
        case 'tasks_completed': {
          const count = await this.getUserTasksCompleted(userId);
          stillQualifies = count >= badge.criteriaValue;
          break;
        }
        case 'events_attended': {
          const count = await this.getUserEventsAttended(userId);
          stillQualifies = count >= badge.criteriaValue;
          break;
        }
        case 'points_total': {
          const user = await this.getUser(userId);
          stillQualifies = (user?.totalPoints || 0) >= badge.criteriaValue;
          break;
        }
      }

      // Remove badge if user no longer qualifies
      if (!stillQualifies) {
        await db.delete(userBadges).where(eq(userBadges.id, userBadge.id));
        removedBadgeNames.push(badge.name);
      }
    }

    return removedBadgeNames;
  }

  async deleteActivityLogByRelatedEntity(relatedEntityId: string): Promise<number> {
    const result = await db.delete(activityLog).where(eq(activityLog.relatedEntityId, relatedEntityId));
    return result.rowCount || 0;
  }

  async deleteActivityLogByUserAndType(userId: string, activityType: string, relatedEntityId: string): Promise<number> {
    const result = await db.delete(activityLog).where(
      and(
        eq(activityLog.userId, userId),
        eq(activityLog.activityType, activityType),
        eq(activityLog.relatedEntityId, relatedEntityId)
      )
    );
    return result.rowCount || 0;
  }

  // Projects (Feature 4)
  async createProject(project: InsertProject & { createdById: string }): Promise<Project> {
    const [p] = await db.insert(projects).values(project).returning();
    return p;
  }

  async getProject(id: string): Promise<Project | undefined> {
    const result = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
    return result[0];
  }

  async getAllProjects(): Promise<Project[]> {
    return await db.select().from(projects).orderBy(desc(projects.createdAt));
  }

  async getActiveProjects(): Promise<Project[]> {
    return await db.select().from(projects).where(eq(projects.status, 'active')).orderBy(desc(projects.createdAt));
  }

  async updateProject(id: string, updates: Partial<InsertProject>): Promise<Project | undefined> {
    const oldProject = await this.getProject(id);
    const [project] = await db.update(projects).set(updates).where(eq(projects.id, id)).returning();
    
    // Add to activity feed when project is completed
    if (oldProject && oldProject.status !== 'završen' && project.status === 'završen') {
      await this.createActivityFeedItem({
        type: "project_completed",
        title: "Završen projekat",
        description: project.name,
        relatedEntityId: project.id,
        relatedEntityType: "project",
        isClickable: true
      });
    }
    
    return project;
  }

  async deleteProject(id: string): Promise<boolean> {
    const result = await db.delete(projects).where(eq(projects.id, id)).returning();
    return result.length > 0;
  }

  async updateProjectAmount(projectId: string, amount: number): Promise<Project | undefined> {
    const project = await this.getProject(projectId);
    if (!project) return undefined;
    
    const currentAmount = parseFloat(project.currentAmount || '0');
    const newAmount = currentAmount + amount;
    
    return await this.updateProject(projectId, { 
      currentAmount: newAmount.toString() 
    });
  }

  // User Statistics (Feature 2)
  async getUserTasksCompleted(userId: string): Promise<number> {
    const logs = await db.select({ count: sql<number>`count(*)` })
      .from(activityLog)
      .where(and(
        eq(activityLog.userId, userId),
        eq(activityLog.activityType, 'task_completed')
      ));
    return Number(logs[0]?.count ?? 0);
  }

  async getUserEventsAttended(userId: string): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(eventAttendance)
      .where(eq(eventAttendance.userId, userId));
    return Number(result[0]?.count ?? 0);
  }

  async recalculateUserPoints(userId: string): Promise<number> {
    // Sum all points from activity_log (centralized points ledger)
    const result = await db.select({ total: sql<number>`COALESCE(SUM(${activityLog.points}), 0)` })
      .from(activityLog)
      .where(eq(activityLog.userId, userId));
    
    const totalPoints = Number(result[0]?.total ?? 0);
    
    await this.updateUser(userId, { totalPoints });
    
    // Automatically check and award badges after points update
    await this.checkAndAwardBadges(userId);
    
    return totalPoints;
  }

  // User Preferences (Feature: Quick Access)
  async getUserPreferences(userId: string): Promise<UserPreferences | undefined> {
    const result = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId)).limit(1);
    return result[0];
  }

  async createUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences> {
    const [prefs] = await db.insert(userPreferences).values(preferences).returning();
    return prefs;
  }

  async updateUserPreferences(userId: string, updates: Partial<InsertUserPreferences>): Promise<UserPreferences | undefined> {
    const [prefs] = await db.update(userPreferences)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userPreferences.userId, userId))
      .returning();
    return prefs;
  }

  // Proposals (Moderator Proposals System)
  async createProposal(proposal: InsertProposal): Promise<Proposal> {
    const [p] = await db.insert(proposals).values(proposal).returning();
    return p;
  }

  async getProposal(id: string): Promise<Proposal | undefined> {
    const result = await db.select().from(proposals).where(eq(proposals.id, id)).limit(1);
    return result[0];
  }

  async getAllProposals(): Promise<Proposal[]> {
    return await db.select().from(proposals).orderBy(desc(proposals.createdAt));
  }

  async getProposalsByWorkGroup(workGroupId: string): Promise<Proposal[]> {
    return await db.select().from(proposals)
      .where(eq(proposals.workGroupId, workGroupId))
      .orderBy(desc(proposals.createdAt));
  }

  async getProposalsByStatus(status: string): Promise<Proposal[]> {
    return await db.select().from(proposals)
      .where(eq(proposals.status, status))
      .orderBy(desc(proposals.createdAt));
  }

  async updateProposal(id: string, updates: Partial<InsertProposal>): Promise<Proposal | undefined> {
    const [p] = await db.update(proposals)
      .set(updates)
      .where(eq(proposals.id, id))
      .returning();
    return p;
  }

  async approveProposal(id: string, reviewedById: string, reviewComment?: string): Promise<Proposal | undefined> {
    const [p] = await db.update(proposals)
      .set({ 
        status: 'approved', 
        reviewedById, 
        reviewComment: reviewComment || null,
        reviewedAt: new Date() 
      })
      .where(eq(proposals.id, id))
      .returning();
    return p;
  }

  async rejectProposal(id: string, reviewedById: string, reviewComment: string): Promise<Proposal | undefined> {
    const [p] = await db.update(proposals)
      .set({ 
        status: 'rejected', 
        reviewedById, 
        reviewComment,
        reviewedAt: new Date() 
      })
      .where(eq(proposals.id, id))
      .returning();
    return p;
  }

  // Receipts (Expense Receipts System)
  async createReceipt(receipt: InsertReceipt): Promise<Receipt> {
    const [r] = await db.insert(receipts).values(receipt).returning();
    return r;
  }

  async getReceipt(id: string): Promise<Receipt | undefined> {
    const result = await db.select().from(receipts).where(eq(receipts.id, id)).limit(1);
    return result[0];
  }

  async getAllReceipts(): Promise<Receipt[]> {
    return await db.select().from(receipts).orderBy(desc(receipts.uploadedAt));
  }

  async getReceiptsByTask(taskId: string): Promise<Receipt[]> {
    return await db.select().from(receipts)
      .where(eq(receipts.taskId, taskId))
      .orderBy(desc(receipts.uploadedAt));
  }

  async getReceiptsByProposal(proposalId: string): Promise<Receipt[]> {
    return await db.select().from(receipts)
      .where(eq(receipts.proposalId, proposalId))
      .orderBy(desc(receipts.uploadedAt));
  }

  async getReceiptsByStatus(status: string): Promise<Receipt[]> {
    return await db.select().from(receipts)
      .where(eq(receipts.status, status))
      .orderBy(desc(receipts.uploadedAt));
  }

  async updateReceipt(id: string, updates: Partial<InsertReceipt>): Promise<Receipt | undefined> {
    const [r] = await db.update(receipts)
      .set(updates)
      .where(eq(receipts.id, id))
      .returning();
    return r;
  }

  async approveReceipt(id: string, reviewedById: string, reviewComment?: string): Promise<Receipt | undefined> {
    const [r] = await db.update(receipts)
      .set({ 
        status: 'approved', 
        reviewedById, 
        reviewComment: reviewComment || null,
        reviewedAt: new Date() 
      })
      .where(eq(receipts.id, id))
      .returning();
    return r;
  }

  async rejectReceipt(id: string, reviewedById: string, reviewComment: string): Promise<Receipt | undefined> {
    const [r] = await db.update(receipts)
      .set({ 
        status: 'rejected', 
        reviewedById, 
        reviewComment,
        reviewedAt: new Date() 
      })
      .where(eq(receipts.id, id))
      .returning();
    return r;
  }

  // Certificate Templates (Zahvalnice)
  async createCertificateTemplate(template: InsertCertificateTemplate): Promise<CertificateTemplate> {
    const [t] = await db.insert(certificateTemplates).values(template).returning();
    return t;
  }

  async getCertificateTemplate(id: string): Promise<CertificateTemplate | undefined> {
    const result = await db.select().from(certificateTemplates).where(eq(certificateTemplates.id, id)).limit(1);
    return result[0];
  }

  async getAllCertificateTemplates(): Promise<CertificateTemplate[]> {
    return await db.select().from(certificateTemplates).orderBy(desc(certificateTemplates.createdAt));
  }

  async updateCertificateTemplate(id: string, updates: Partial<InsertCertificateTemplate>): Promise<CertificateTemplate | undefined> {
    const [t] = await db.update(certificateTemplates)
      .set(updates)
      .where(eq(certificateTemplates.id, id))
      .returning();
    return t;
  }

  async deleteCertificateTemplate(id: string): Promise<boolean> {
    const result = await db.delete(certificateTemplates).where(eq(certificateTemplates.id, id)).returning();
    return result.length > 0;
  }

  // User Certificates (Izdati Certifikati)
  async createUserCertificate(certificate: InsertUserCertificate): Promise<UserCertificate> {
    const [c] = await db.insert(userCertificates).values(certificate).returning();
    
    // Add to activity feed
    const user = await this.getUser(certificate.userId);
    if (user) {
      const initials = `${user.firstName[0]}. ${user.lastName[0]}.`;
      await this.createActivityFeedItem({
        type: "certificate_issued",
        title: "Dodjeljena zahvalnica",
        description: initials,
        relatedEntityId: c.id,
        relatedEntityType: "certificate",
        isClickable: false
      });
    }
    
    return c;
  }

  async getUserCertificate(id: string): Promise<UserCertificate | undefined> {
    const result = await db.select().from(userCertificates).where(eq(userCertificates.id, id)).limit(1);
    return result[0];
  }

  async getUserCertificates(userId: string): Promise<UserCertificate[]> {
    return await db.select().from(userCertificates)
      .where(eq(userCertificates.userId, userId))
      .orderBy(desc(userCertificates.issuedAt));
  }

  async getAllUserCertificates(): Promise<UserCertificate[]> {
    return await db.select().from(userCertificates).orderBy(desc(userCertificates.issuedAt));
  }

  async getUnviewedCertificatesCount(userId: string): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(userCertificates)
      .where(and(
        eq(userCertificates.userId, userId),
        eq(userCertificates.viewed, false)
      ));
    return Number(result[0]?.count || 0);
  }

  async markCertificateAsViewed(id: string): Promise<UserCertificate | undefined> {
    const [c] = await db.update(userCertificates)
      .set({ viewed: true })
      .where(eq(userCertificates.id, id))
      .returning();
    return c;
  }

  async deleteCertificate(id: string): Promise<boolean> {
    const result = await db.delete(userCertificates).where(eq(userCertificates.id, id)).returning();
    return result.length > 0;
  }

  // Membership Applications (Pristupnice)
  async createMembershipApplication(application: InsertMembershipApplication): Promise<MembershipApplication> {
    const [app] = await db.insert(membershipApplications).values(application).returning();
    
    await this.createActivity({
      type: "membership_application",
      description: `Nova pristupnica: ${app.firstName} ${app.lastName}`,
    });
    
    return app;
  }

  async getMembershipApplication(id: string): Promise<MembershipApplication | undefined> {
    const result = await db.select().from(membershipApplications).where(eq(membershipApplications.id, id)).limit(1);
    return result[0];
  }

  async getAllMembershipApplications(): Promise<MembershipApplication[]> {
    return await db.select().from(membershipApplications).orderBy(desc(membershipApplications.createdAt));
  }

  async updateMembershipApplication(id: string, updates: Partial<InsertMembershipApplication>): Promise<MembershipApplication | undefined> {
    const [app] = await db.update(membershipApplications)
      .set(updates)
      .where(eq(membershipApplications.id, id))
      .returning();
    return app;
  }

  async reviewMembershipApplication(id: string, status: string, reviewedById: string, reviewNotes?: string): Promise<MembershipApplication | undefined> {
    const [app] = await db.update(membershipApplications)
      .set({ 
        status, 
        reviewedById, 
        reviewNotes: reviewNotes || null,
        reviewedAt: new Date() 
      })
      .where(eq(membershipApplications.id, id))
      .returning();
    return app;
  }

  async deleteMembershipApplication(id: string): Promise<boolean> {
    const result = await db.delete(membershipApplications).where(eq(membershipApplications.id, id)).returning();
    return result.length > 0;
  }

  // Akika Applications (Prijave akike)
  async createAkikaApplication(application: InsertAkikaApplication): Promise<AkikaApplication> {
    const [app] = await db.insert(akikaApplications).values(application).returning();
    
    await this.createActivity({
      type: "akika_application",
      description: `Nova prijava akike: ${app.childName}`,
    });
    
    return app;
  }

  async getAkikaApplication(id: string): Promise<AkikaApplication | undefined> {
    const result = await db.select().from(akikaApplications).where(eq(akikaApplications.id, id)).limit(1);
    return result[0];
  }

  async getAllAkikaApplications(): Promise<AkikaApplication[]> {
    return await db.select().from(akikaApplications).orderBy(desc(akikaApplications.createdAt));
  }

  async updateAkikaApplication(id: string, updates: Partial<InsertAkikaApplication>): Promise<AkikaApplication | undefined> {
    const [app] = await db.update(akikaApplications)
      .set(updates)
      .where(eq(akikaApplications.id, id))
      .returning();
    return app;
  }

  async reviewAkikaApplication(id: string, status: string, reviewedById: string, reviewNotes?: string): Promise<AkikaApplication | undefined> {
    const [app] = await db.update(akikaApplications)
      .set({ 
        status, 
        isArchived: (status === 'approved' || status === 'rejected'), // Automatically archive after decision
        reviewedById, 
        reviewNotes: reviewNotes || null,
        reviewedAt: new Date() 
      })
      .where(eq(akikaApplications.id, id))
      .returning();
    
    // Send notification message to the user who submitted the application
    if ((status === 'approved' || status === 'rejected') && app && app.submittedBy) {
      const statusText = status === 'approved' ? 'odobrena' : 'odbijena';
      const subject = `Akika prijava ${statusText}`;
      let content = `Vaša prijava za akiku djeteta ${app.childName} je ${statusText}.\n\n`;
      
      if (reviewNotes) {
        content += `Odgovor/Napomena:\n${reviewNotes}\n\n`;
      }
      
      content += `Za dodatne informacije, molimo kontaktirajte nas.`;
      
      await this.createMessage({
        senderId: reviewedById,
        recipientId: app.submittedBy,
        subject,
        content,
        category: null
      });
    }
    
    return app;
  }

  async getUserAkikaApplications(userId: string): Promise<AkikaApplication[]> {
    return await db.select()
      .from(akikaApplications)
      .where(eq(akikaApplications.submittedBy, userId))
      .orderBy(desc(akikaApplications.createdAt));
  }

  async deleteAkikaApplication(id: string): Promise<boolean> {
    const result = await db.delete(akikaApplications).where(eq(akikaApplications.id, id)).returning();
    return result.length > 0;
  }

  // Marriage Applications (Prijave šerijatskog vjenčanja)
  async createMarriageApplication(application: InsertMarriageApplication): Promise<MarriageApplication> {
    const [app] = await db.insert(marriageApplications).values(application).returning();
    
    await this.createActivity({
      type: "marriage_application",
      description: `Nova prijava šerijatskog vjenčanja: ${app.groomFirstName} ${app.groomLastName} i ${app.brideFirstName} ${app.brideLastName}`,
    });
    
    return app;
  }

  async getMarriageApplication(id: string): Promise<MarriageApplication | undefined> {
    const result = await db.select().from(marriageApplications).where(eq(marriageApplications.id, id)).limit(1);
    return result[0];
  }

  async getAllMarriageApplications(): Promise<MarriageApplication[]> {
    return await db.select().from(marriageApplications).orderBy(desc(marriageApplications.createdAt));
  }

  async updateMarriageApplication(id: string, updates: Partial<InsertMarriageApplication>): Promise<MarriageApplication | undefined> {
    const [app] = await db.update(marriageApplications)
      .set(updates)
      .where(eq(marriageApplications.id, id))
      .returning();
    return app;
  }

  async reviewMarriageApplication(id: string, status: string, reviewedById: string, reviewNotes?: string): Promise<MarriageApplication | undefined> {
    const [app] = await db.update(marriageApplications)
      .set({ 
        status, 
        reviewedById, 
        reviewNotes: reviewNotes || null,
        reviewedAt: new Date() 
      })
      .where(eq(marriageApplications.id, id))
      .returning();
    return app;
  }

  async deleteMarriageApplication(id: string): Promise<boolean> {
    const result = await db.delete(marriageApplications).where(eq(marriageApplications.id, id)).returning();
    return result.length > 0;
  }

  // Activity Feed
  async getActivityFeed(limit: number = 50): Promise<ActivityFeedItem[]> {
    // Get base activity feed items
    const items = await db.select()
      .from(activityFeed)
      .orderBy(desc(activityFeed.createdAt))
      .limit(limit);

    if (items.length === 0) return items;

    // Group items by entity type for batched lookups
    const announcementIds = items
      .filter(item => item.relatedEntityType === 'announcement' && item.relatedEntityId)
      .map(item => item.relatedEntityId!);

    const marketplaceIds = items
      .filter(item => item.relatedEntityType === 'shop_item' && item.relatedEntityId)
      .map(item => item.relatedEntityId!);

    // Batched lookup for announcement images (first image per announcement)
    const announcementImages = new Map<string, string>();
    if (announcementIds.length > 0) {
      const files = await db.select()
        .from(announcementFiles)
        .where(and(
          inArray(announcementFiles.announcementId, announcementIds),
          eq(announcementFiles.fileType, 'image')
        ))
        .orderBy(asc(announcementFiles.uploadedAt));

      // Get first image per announcement
      for (const file of files) {
        if (!announcementImages.has(file.announcementId)) {
          announcementImages.set(file.announcementId, file.filePath);
        }
      }
    }

    // Batched lookup for marketplace item images (first photo)
    const marketplaceImages = new Map<string, string>();
    if (marketplaceIds.length > 0) {
      const marketItems = await db.select()
        .from(marketplaceItems)
        .where(inArray(marketplaceItems.id, marketplaceIds));

      for (const item of marketItems) {
        if (item.photos && item.photos.length > 0) {
          marketplaceImages.set(item.id, item.photos[0]);
        }
      }
    }

    // Batched lookup for shop product images (first photo)
    const shopProductIds = items
      .filter(item => item.type === 'shop_item' && item.relatedEntityId && item.relatedEntityType !== 'shop_item')
      .map(item => item.relatedEntityId!);

    const shopImages = new Map<string, string>();
    if (shopProductIds.length > 0) {
      const products = await db.select()
        .from(shopProducts)
        .where(inArray(shopProducts.id, shopProductIds));

      for (const product of products) {
        if (product.photos && product.photos.length > 0) {
          shopImages.set(product.id, product.photos[0]);
        }
      }
    }

    // Enrich items with real image URLs
    return items.map(item => {
      let imageUrl: string | null = null;

      // Get real image based on entity type
      if (item.relatedEntityType === 'announcement' && item.relatedEntityId) {
        imageUrl = announcementImages.get(item.relatedEntityId) || null;
      } else if (item.relatedEntityType === 'shop_item' && item.relatedEntityId) {
        imageUrl = marketplaceImages.get(item.relatedEntityId) || shopImages.get(item.relatedEntityId) || null;
      }

      // Parse existing metadata and merge with imageUrl
      let metadata: any = {};
      try {
        if (item.metadata) {
          metadata = JSON.parse(item.metadata);
        }
      } catch {
        // Ignore parse errors
      }

      // Update metadata with real or null imageUrl
      metadata.imageUrl = imageUrl;

      return {
        ...item,
        metadata: JSON.stringify(metadata)
      };
    });
  }

  async createActivityFeedItem(item: InsertActivityFeedItem): Promise<ActivityFeedItem> {
    const [feedItem] = await db.insert(activityFeed).values(item).returning();
    return feedItem;
  }
}

export const storage = new DatabaseStorage();
