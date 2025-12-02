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
  type Tenant,
  type InsertTenant,
  type InsertMarriageApplication,
  type ActivityFeedItem,
  type InsertActivityFeedItem,
  type Service,
  type InsertService,
  type ServiceWithUser,
  type ContributionPurpose,
  type InsertContributionPurpose,
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
  contributionPurposes,
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
  services,
  tenants
} from "@shared/schema";
import { db, pool } from './db';
import { eq, and, or, desc, asc, gt, sql, inArray, ilike } from 'drizzle-orm';

export interface IStorage {
  // Users
  getUser(id: string, tenantId: string): Promise<User | undefined>;
  getUserByUsername(username: string, tenantId: string): Promise<User | undefined>;
  getUserByEmail(email: string, tenantId: string): Promise<User | undefined>;
  getSuperAdminByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, tenantId: string, user: Partial<InsertUser>): Promise<User | undefined>;
  getAllUsers(tenantId: string): Promise<User[]>;
  deleteUser(id: string, tenantId: string): Promise<boolean>;
  deleteAllTenantUsers(tenantId: string): Promise<number>;
  
  // Announcements
  getAnnouncement(id: string, tenantId: string): Promise<Announcement | undefined>;
  createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement>;
  updateAnnouncement(id: string, tenantId: string, announcement: Partial<InsertAnnouncement>): Promise<Announcement | undefined>;
  deleteAnnouncement(id: string, tenantId: string): Promise<boolean>;
  getAllAnnouncements(tenantId: string): Promise<Announcement[]>;
  
  // Events
  getEvent(id: string, tenantId: string): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: string, tenantId: string, event: Partial<InsertEvent>): Promise<Event | undefined>;
  deleteEvent(id: string, tenantId: string): Promise<boolean>;
  getAllEvents(tenantId: string): Promise<Event[]>;
  getEventLocations(tenantId: string): Promise<string[]>;
  
  // Event RSVPs
  createEventRsvp(rsvp: InsertEventRsvp): Promise<EventRsvp>;
  getEventRsvps(eventId: string, tenantId: string): Promise<EventRsvpStats>;
  getUserEventRsvp(eventId: string, userId: string, tenantId: string): Promise<EventRsvp | null>;
  updateEventRsvp(id: string, tenantId: string, updates: { adultsCount?: number; childrenCount?: number }): Promise<EventRsvp | undefined>;
  deleteEventRsvp(id: string, tenantId: string): Promise<boolean>;
  
  // Work Groups
  getWorkGroup(id: string, tenantId: string): Promise<WorkGroup | undefined>;
  createWorkGroup(workGroup: InsertWorkGroup): Promise<WorkGroup>;
  updateWorkGroup(id: string, tenantId: string, workGroup: Partial<InsertWorkGroup>): Promise<WorkGroup | undefined>;
  deleteWorkGroup(id: string, tenantId: string): Promise<boolean>;
  getAllWorkGroups(tenantId: string, userId?: string, isAdmin?: boolean): Promise<WorkGroup[]>;
  
  // Work Group Members
  addMemberToWorkGroup(workGroupId: string, userId: string, tenantId: string): Promise<WorkGroupMember>;
  removeMemberFromWorkGroup(workGroupId: string, userId: string, tenantId: string): Promise<boolean>;
  getWorkGroupMembers(workGroupId: string, tenantId: string): Promise<WorkGroupMember[]>;
  getUserWorkGroups(userId: string, tenantId: string): Promise<WorkGroupMember[]>;
  isUserMemberOfWorkGroup(workGroupId: string, userId: string, tenantId: string): Promise<boolean>;
  setModerator(workGroupId: string, userId: string, tenantId: string, isModerator: boolean): Promise<WorkGroupMember | undefined>;
  getWorkGroupModerators(workGroupId: string, tenantId: string): Promise<WorkGroupMember[]>;
  isUserModeratorOfWorkGroup(workGroupId: string, userId: string, tenantId: string): Promise<boolean>;
  
  // Tasks
  getTask(id: string, tenantId: string): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, tenantId: string, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: string, tenantId: string): Promise<boolean>;
  getTasksByWorkGroup(workGroupId: string, tenantId: string): Promise<Task[]>;
  getAllTasksWithWorkGroup(tenantId: string, userId: string, isAdmin: boolean): Promise<Array<Task & { workGroup: WorkGroup }>>;
  moveTaskToWorkGroup(taskId: string, newWorkGroupId: string, tenantId: string): Promise<Task | undefined>;
  
  // Access Requests
  createAccessRequest(request: InsertAccessRequest): Promise<AccessRequest>;
  updateAccessRequest(id: string, tenantId: string, status: string): Promise<AccessRequest | undefined>;
  getAllAccessRequests(tenantId: string): Promise<AccessRequest[]>;
  getUserAccessRequests(userId: string, tenantId: string): Promise<AccessRequest[]>;
  
  // Task Comments
  createTaskComment(comment: InsertTaskComment): Promise<TaskComment>;
  getTaskComment(id: string, tenantId: string): Promise<TaskComment | undefined>;
  getTaskComments(taskId: string, tenantId: string): Promise<TaskComment[]>;
  deleteTaskComment(id: string, tenantId: string): Promise<boolean>;
  
  // Announcement Files
  createAnnouncementFile(file: InsertAnnouncementFile): Promise<AnnouncementFile>;
  getAnnouncementFile(id: string, tenantId: string): Promise<AnnouncementFile | undefined>;
  getAnnouncementFiles(announcementId: string, tenantId: string): Promise<AnnouncementFile[]>;
  deleteAnnouncementFile(id: string, tenantId: string): Promise<boolean>;
  updateAnnouncementFeed(announcementId: string, tenantId: string): Promise<void>;
  
  // Activities
  createActivity(activity: { type: string; description: string; userId?: string; tenantId: string }): Promise<Activity>;
  getRecentActivities(tenantId: string, limit?: number): Promise<Activity[]>;
  
  // Family Relationships
  createFamilyRelationship(relationship: InsertFamilyRelationship): Promise<FamilyRelationship>;
  getFamilyRelationship(id: string, tenantId: string): Promise<FamilyRelationship | undefined>;
  getUserFamilyRelationships(userId: string, tenantId: string): Promise<FamilyRelationship[]>;
  deleteFamilyRelationship(id: string, tenantId: string): Promise<boolean>;
  getFamilyMembersByRelationship(userId: string, relationship: string, tenantId: string): Promise<FamilyRelationship[]>;

  // Messages
  getMessages(userId: string, tenantId: string): Promise<Message[]>;
  getConversations(userId: string, tenantId: string): Promise<Array<{ threadId: string; lastMessage: Message; unreadCount: number; otherUser: User | null }>>;
  createMessage(messageData: InsertMessage): Promise<Message>;
  markAsRead(messageId: string, userId: string, tenantId: string): Promise<Message | undefined>;
  markThreadAsRead(threadId: string, userId: string, tenantId: string): Promise<void>;
  deleteMessage(messageId: string, tenantId: string): Promise<boolean>;
  getUnreadCount(userId: string, tenantId: string): Promise<number>;
  getMessageThread(threadId: string, userId: string, tenantId: string): Promise<Message[]>;

  // Imam Questions
  getImamQuestions(tenantId: string, userId?: string): Promise<ImamQuestion[]>;
  createImamQuestion(questionData: InsertImamQuestion): Promise<ImamQuestion>;
  answerImamQuestion(questionId: string, tenantId: string, answer: string): Promise<ImamQuestion | undefined>;
  markQuestionAsRead(questionId: string, tenantId: string): Promise<ImamQuestion | undefined>;
  deleteImamQuestion(questionId: string, tenantId: string): Promise<boolean>;
  getUnansweredQuestionsCount(tenantId: string): Promise<number>;

  // Organization Settings
  getOrganizationSettings(tenantId: string): Promise<OrganizationSettings | undefined>;
  updateOrganizationSettings(tenantId: string, settings: Partial<InsertOrganizationSettings>): Promise<OrganizationSettings>;

  // Documents
  createDocument(document: InsertDocument): Promise<Document>;
  getDocument(id: string, tenantId: string): Promise<Document | undefined>;
  getAllDocuments(tenantId: string): Promise<Document[]>;
  deleteDocument(id: string, tenantId: string): Promise<boolean>;

  // Requests
  createRequest(request: InsertRequest): Promise<Request>;
  getRequest(id: string, tenantId: string): Promise<Request | undefined>;
  getAllRequests(tenantId: string): Promise<Request[]>;
  getUserRequests(userId: string, tenantId: string): Promise<Request[]>;
  updateRequest(id: string, tenantId: string, updates: Partial<InsertRequest>): Promise<Request | undefined>;
  updateRequestStatus(id: string, tenantId: string, status: string, reviewedById?: string, adminNotes?: string): Promise<Request | undefined>;

  // Shop Products
  createShopProduct(product: InsertShopProduct): Promise<ShopProduct>;
  getShopProduct(id: string, tenantId: string): Promise<ShopProduct | undefined>;
  getAllShopProducts(tenantId: string): Promise<ShopProduct[]>;
  updateShopProduct(id: string, tenantId: string, updates: Partial<InsertShopProduct>): Promise<ShopProduct | undefined>;
  deleteShopProduct(id: string, tenantId: string): Promise<boolean>;

  // Marketplace Items
  createMarketplaceItem(item: InsertMarketplaceItem): Promise<MarketplaceItem>;
  getMarketplaceItem(id: string, tenantId: string): Promise<MarketplaceItem | undefined>;
  getAllMarketplaceItems(tenantId: string): Promise<MarketplaceItem[]>;
  getUserMarketplaceItems(userId: string, tenantId: string): Promise<MarketplaceItem[]>;
  updateMarketplaceItem(id: string, tenantId: string, updates: Partial<InsertMarketplaceItem>): Promise<MarketplaceItem | undefined>;
  deleteMarketplaceItem(id: string, tenantId: string): Promise<boolean>;

  // Services (Usluge)
  createService(service: InsertService): Promise<Service>;
  getService(id: string, tenantId: string): Promise<Service | undefined>;
  getAllServices(tenantId: string): Promise<Service[]>;
  getAllServicesWithUsers(tenantId: string): Promise<ServiceWithUser[]>;
  getUserServices(userId: string, tenantId: string): Promise<Service[]>;
  updateService(id: string, tenantId: string, updates: Partial<InsertService>): Promise<Service | undefined>;
  deleteService(id: string, tenantId: string): Promise<boolean>;

  // Product Purchase Requests
  createProductPurchaseRequest(request: InsertProductPurchaseRequest): Promise<ProductPurchaseRequest>;
  getAllProductPurchaseRequests(tenantId: string): Promise<ProductPurchaseRequest[]>;
  updateProductPurchaseRequest(id: string, tenantId: string, status: string): Promise<ProductPurchaseRequest | undefined>;

  // Statistics
  getUserCount(tenantId: string): Promise<number>;
  getNewAnnouncementsCount(tenantId: string, days: number): Promise<number>;
  getUpcomingEventsCount(tenantId: string): Promise<number>;
  getActiveTasksCount(tenantId: string): Promise<number>;

  // Notifications
  updateLastViewed(userId: string, tenantId: string, type: 'shop' | 'events' | 'announcements' | 'imamQuestions' | 'tasks'): Promise<User | undefined>;
  getNewItemsCount(userId: string, tenantId: string, type: 'shop' | 'events' | 'announcements' | 'imamQuestions' | 'tasks'): Promise<number>;
  getPendingAccessRequestsCount(tenantId: string, lastViewed?: Date | null): Promise<number>;
  getAllNewItemsCounts(userId: string, tenantId: string): Promise<{ shop: number; events: number; announcements: number; imamQuestions: number; tasks: number; accessRequests: number }>;

  // Prayer Times
  createPrayerTime(prayerTime: InsertPrayerTime): Promise<PrayerTime>;
  getPrayerTimeByDate(date: string, tenantId: string): Promise<PrayerTime | undefined>;
  getAllPrayerTimes(tenantId: string): Promise<PrayerTime[]>;
  bulkCreatePrayerTimes(prayerTimes: InsertPrayerTime[]): Promise<PrayerTime[]>;
  deletePrayerTime(id: string, tenantId: string): Promise<boolean>;
  deleteAllPrayerTimes(tenantId: string): Promise<boolean>;

  // Important Dates
  createImportantDate(importantDate: InsertImportantDate): Promise<ImportantDate>;
  createImportantDateWithTitle(data: { tenantId: string; name?: string; title?: string; date: string; isRecurring?: boolean }): Promise<ImportantDate>;
  getImportantDate(id: string, tenantId: string): Promise<ImportantDate | undefined>;
  getAllImportantDates(tenantId: string): Promise<ImportantDate[]>;
  updateImportantDate(id: string, tenantId: string, updates: Partial<InsertImportantDate>): Promise<ImportantDate | undefined>;
  deleteImportantDate(id: string, tenantId: string): Promise<boolean>;

  // Contribution Purposes (Feature 1)
  getContributionPurposes(tenantId: string): Promise<ContributionPurpose[]>;
  createContributionPurpose(purpose: InsertContributionPurpose & { createdById: string; tenantId: string }): Promise<ContributionPurpose>;
  deleteContributionPurpose(id: string, tenantId: string): Promise<boolean>;

  // Financial Contributions (Feature 1)
  createFinancialContribution(contribution: InsertFinancialContribution): Promise<FinancialContribution>;
  getFinancialContribution(id: string, tenantId: string): Promise<FinancialContribution | undefined>;
  getUserFinancialContributions(userId: string, tenantId: string): Promise<FinancialContribution[]>;
  getAllFinancialContributions(tenantId: string): Promise<FinancialContribution[]>;
  updateFinancialContribution(id: string, tenantId: string, updates: Partial<InsertFinancialContribution>): Promise<FinancialContribution | undefined>;
  deleteFinancialContribution(id: string, tenantId: string): Promise<boolean>;
  deleteContributionWithLogs(contributionId: string, tenantId: string): Promise<{ userId: string; projectId: string | null }>;
  getUserTotalDonations(userId: string, tenantId: string): Promise<number>;

  // Activity Log (Feature 1)
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  getUserActivityLog(userId: string, tenantId: string): Promise<ActivityLog[]>;
  getAllActivityLogs(tenantId: string): Promise<ActivityLog[]>;

  // Event Attendance (Feature 1)
  createEventAttendance(attendance: InsertEventAttendance): Promise<EventAttendance>;
  bulkCreateEventAttendance(attendances: InsertEventAttendance[]): Promise<EventAttendance[]>;
  getEventAttendance(eventId: string, tenantId: string): Promise<EventAttendance[]>;
  getUserEventAttendance(userId: string, tenantId: string): Promise<EventAttendance[]>;

  // Points Settings (Feature 2)
  getPointsSettings(tenantId: string): Promise<PointsSettings | undefined>;
  updatePointsSettings(tenantId: string, settings: Partial<InsertPointsSettings>): Promise<PointsSettings>;

  // Badges (Feature 2)
  createBadge(badge: InsertBadge): Promise<Badge>;
  getBadge(id: string, tenantId: string): Promise<Badge | undefined>;
  getAllBadges(tenantId: string): Promise<Badge[]>;
  updateBadge(id: string, tenantId: string, updates: Partial<InsertBadge>): Promise<Badge | undefined>;
  deleteBadge(id: string, tenantId: string): Promise<boolean>;

  // User Badges (Feature 2)
  awardBadgeToUser(userId: string, badgeId: string, tenantId: string): Promise<UserBadge>;
  getUserBadges(userId: string, tenantId: string): Promise<UserBadge[]>;
  getAllUserBadges(tenantId: string): Promise<Array<UserBadge & { user: User; badge: Badge }>>;
  checkAndAwardBadges(userId: string, tenantId: string): Promise<UserBadge[]>;
  removeUnqualifiedBadges(userId: string, tenantId: string): Promise<string[]>;
  deleteActivityLogByRelatedEntity(relatedEntityId: string, tenantId: string): Promise<number>;
  deleteActivityLogByUserAndType(userId: string, activityType: string, relatedEntityId: string, tenantId: string): Promise<number>;

  // Projects (Feature 4)
  createProject(project: InsertProject & { createdById: string }): Promise<Project>;
  getProject(id: string, tenantId: string): Promise<Project | undefined>;
  getAllProjects(tenantId: string): Promise<Project[]>;
  getActiveProjects(tenantId: string): Promise<Project[]>;
  updateProject(id: string, tenantId: string, updates: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: string, tenantId: string): Promise<boolean>;
  updateProjectAmount(projectId: string, tenantId: string, amount: number): Promise<Project | undefined>;

  // User Statistics (Feature 2)
  getUserTasksCompleted(userId: string, tenantId: string): Promise<number>;
  getUserEventsAttended(userId: string, tenantId: string): Promise<number>;
  recalculateUserPoints(userId: string, tenantId: string): Promise<number>;

  // User Preferences (Feature: Quick Access)
  getUserPreferences(userId: string, tenantId: string): Promise<import("@shared/schema").UserPreferences | undefined>;
  createUserPreferences(preferences: import("@shared/schema").InsertUserPreferences): Promise<import("@shared/schema").UserPreferences>;
  updateUserPreferences(userId: string, tenantId: string, preferences: Partial<import("@shared/schema").InsertUserPreferences>): Promise<import("@shared/schema").UserPreferences | undefined>;

  // Proposals (Moderator Proposals System)
  createProposal(proposal: InsertProposal): Promise<Proposal>;
  getProposal(id: string, tenantId: string): Promise<Proposal | undefined>;
  getAllProposals(tenantId: string): Promise<Proposal[]>;
  getProposalsByWorkGroup(workGroupId: string, tenantId: string): Promise<Proposal[]>;
  getProposalsByStatus(status: string, tenantId: string): Promise<Proposal[]>;
  updateProposal(id: string, tenantId: string, updates: Partial<InsertProposal>): Promise<Proposal | undefined>;
  approveProposal(id: string, tenantId: string, reviewedById: string, reviewComment?: string): Promise<Proposal | undefined>;
  rejectProposal(id: string, tenantId: string, reviewedById: string, reviewComment: string): Promise<Proposal | undefined>;

  // Receipts (Expense Receipts System)
  createReceipt(receipt: InsertReceipt): Promise<Receipt>;
  getReceipt(id: string, tenantId: string): Promise<Receipt | undefined>;
  getAllReceipts(tenantId: string): Promise<Receipt[]>;
  getReceiptsByTask(taskId: string, tenantId: string): Promise<Receipt[]>;
  getReceiptsByProposal(proposalId: string, tenantId: string): Promise<Receipt[]>;
  getReceiptsByStatus(status: string, tenantId: string): Promise<Receipt[]>;
  updateReceipt(id: string, tenantId: string, updates: Partial<InsertReceipt>): Promise<Receipt | undefined>;
  approveReceipt(id: string, tenantId: string, reviewedById: string, reviewComment?: string): Promise<Receipt | undefined>;
  rejectReceipt(id: string, tenantId: string, reviewedById: string, reviewComment: string): Promise<Receipt | undefined>;

  // Certificate Templates (Zahvalnice)
  createCertificateTemplate(template: InsertCertificateTemplate): Promise<CertificateTemplate>;
  getCertificateTemplate(id: string, tenantId: string): Promise<CertificateTemplate | undefined>;
  getAllCertificateTemplates(tenantId: string): Promise<CertificateTemplate[]>;
  updateCertificateTemplate(id: string, tenantId: string, updates: Partial<InsertCertificateTemplate>): Promise<CertificateTemplate | undefined>;
  deleteCertificateTemplate(id: string, tenantId: string): Promise<boolean>;

  // User Certificates (Izdati Certifikati)
  createUserCertificate(certificate: InsertUserCertificate): Promise<UserCertificate>;
  getUserCertificate(id: string, tenantId: string): Promise<UserCertificate | undefined>;
  getUserCertificates(userId: string, tenantId: string): Promise<UserCertificate[]>;
  getAllUserCertificates(tenantId: string): Promise<UserCertificate[]>;
  getUnviewedCertificatesCount(userId: string, tenantId: string): Promise<number>;
  markCertificateAsViewed(id: string, tenantId: string): Promise<UserCertificate | undefined>;
  deleteCertificate(id: string, tenantId: string): Promise<boolean>;

  // Membership Applications (Pristupnice)
  createMembershipApplication(application: InsertMembershipApplication): Promise<MembershipApplication>;
  getMembershipApplication(id: string, tenantId: string): Promise<MembershipApplication | undefined>;
  getAllMembershipApplications(tenantId: string): Promise<MembershipApplication[]>;
  updateMembershipApplication(id: string, tenantId: string, updates: Partial<InsertMembershipApplication>): Promise<MembershipApplication | undefined>;
  reviewMembershipApplication(id: string, tenantId: string, status: string, reviewedById: string, reviewNotes?: string): Promise<MembershipApplication | undefined>;
  deleteMembershipApplication(id: string, tenantId: string): Promise<boolean>;

  // Akika Applications (Prijave akike)
  createAkikaApplication(application: InsertAkikaApplication): Promise<AkikaApplication>;
  getAkikaApplication(id: string, tenantId: string): Promise<AkikaApplication | undefined>;
  getAllAkikaApplications(tenantId: string): Promise<AkikaApplication[]>;
  updateAkikaApplication(id: string, tenantId: string, updates: Partial<InsertAkikaApplication>): Promise<AkikaApplication | undefined>;
  reviewAkikaApplication(id: string, tenantId: string, status: string, reviewedById: string, reviewNotes?: string): Promise<AkikaApplication | undefined>;
  getUserAkikaApplications(userId: string, tenantId: string): Promise<AkikaApplication[]>;
  deleteAkikaApplication(id: string, tenantId: string): Promise<boolean>;

  // Marriage Applications (Prijave šerijatskog vjenčanja)
  createMarriageApplication(application: InsertMarriageApplication): Promise<MarriageApplication>;
  getMarriageApplication(id: string, tenantId: string): Promise<MarriageApplication | undefined>;
  getAllMarriageApplications(tenantId: string): Promise<MarriageApplication[]>;
  updateMarriageApplication(id: string, tenantId: string, updates: Partial<InsertMarriageApplication>): Promise<MarriageApplication | undefined>;
  reviewMarriageApplication(id: string, tenantId: string, status: string, reviewedById: string, reviewNotes?: string): Promise<MarriageApplication | undefined>;
  deleteMarriageApplication(id: string, tenantId: string): Promise<boolean>;

  // Activity Feed
  getActivityFeed(tenantId: string, limit?: number): Promise<ActivityFeedItem[]>;
  createActivityFeedItem(item: InsertActivityFeedItem): Promise<ActivityFeedItem>;

  // Tenants (Super Admin only - global tenant management)
  getAllTenants(): Promise<Tenant[]>;
  getTenant(id: string): Promise<Tenant | undefined>;
  getTenantByCode(tenantCode: string): Promise<Tenant | undefined>;
  createTenant(tenant: InsertTenant): Promise<Tenant>;
  updateTenant(id: string, updates: Partial<InsertTenant>): Promise<Tenant | undefined>;
  updateTenantStatus(id: string, isActive: boolean): Promise<Tenant | undefined>;
  deleteTenant(id: string): Promise<boolean>;
  getTenantStats(id: string): Promise<{ userCount: number; storageUsed: number; activeSubscription: boolean } | undefined>;
  
  // Subscription Plans (public - for pricing page)
  getAllSubscriptionPlans(): Promise<Array<{
    id: string;
    name: string;
    slug: string;
    description: string;
    priceMonthly: string;
    priceYearly: string;
    currency: string;
    enabledModules: string[];
    readOnlyModules: string[];
    maxUsers: number | null;
    maxStorage: number | null;
    isActive: boolean;
  }>>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string, tenantId: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(and(eq(users.id, id), eq(users.tenantId, tenantId))).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string, tenantId: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(and(eq(users.username, username), eq(users.tenantId, tenantId))).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string, tenantId: string): Promise<User | undefined> {
    if (!email) return undefined;
    const result = await db.select().from(users).where(and(eq(users.email, email), eq(users.tenantId, tenantId))).limit(1);
    return result[0];
  }

  // Get SuperAdmin user from the global SuperAdmin tenant
  async getSuperAdminByUsername(username: string): Promise<User | undefined> {
    const SUPERADMIN_TENANT_ID = 'tenant-superadmin-global';
    const result = await db.select().from(users).where(
      and(
        eq(users.username, username),
        eq(users.tenantId, SUPERADMIN_TENANT_ID),
        eq(users.isSuperAdmin, true)
      )
    ).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values({...insertUser, tenantId: insertUser.tenantId}).returning();
    
    await this.createActivity({
      type: "registration",
      description: `Novi korisnik registrovan: ${user.firstName} ${user.lastName}`,
      userId: user.id,
      tenantId: user.tenantId
    });
    
    // Add to activity feed
    await this.createActivityFeedItem({
      type: "new_member",
      title: "Novi član džemata",
      description: `${user.firstName} ${user.lastName}`,
      relatedEntityId: user.id,
      relatedEntityType: "user",
      isClickable: false,
      tenantId: user.tenantId
    });
    
    return user;
  }

  async updateUser(id: string, tenantId: string, updateData: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users).set(updateData).where(and(eq(users.id, id), eq(users.tenantId, tenantId))).returning();
    return user;
  }

  async getAllUsers(tenantId: string): Promise<User[]> {
    return await db.select().from(users).where(
      and(
        eq(users.tenantId, tenantId),
        sql`(${users.isSuperAdmin} IS NULL OR ${users.isSuperAdmin} = false)`
      )
    );
  }

  async deleteUser(id: string, tenantId: string): Promise<boolean> {
    // Delete related data first (respecting foreign keys)
    try {
      await db.delete(messages).where(
        and(
          eq(messages.tenantId, tenantId),
          or(eq(messages.senderId, id), eq(messages.recipientId, id))
        )
      );
    } catch (e) { /* ignore if messages doesn't exist */ }
    
    try {
      await db.delete(eventRsvps).where(and(eq(eventRsvps.userId, id), eq(eventRsvps.tenantId, tenantId)));
    } catch (e) { /* ignore */ }
    
    try {
      await db.delete(taskComments).where(and(eq(taskComments.userId, id), eq(taskComments.tenantId, tenantId)));
    } catch (e) { /* ignore */ }
    
    try {
      await db.delete(workGroupMembers).where(and(eq(workGroupMembers.userId, id), eq(workGroupMembers.tenantId, tenantId)));
    } catch (e) { /* ignore */ }
    
    try {
      // user_badges might not have tenant_id column in older schemas
      await db.delete(userBadges).where(eq(userBadges.userId, id));
    } catch (e) { 
      console.log('[DELETE USER] user_badges deletion skipped:', (e as any).message);
    }
    
    try {
      await db.delete(userCertificates).where(and(eq(userCertificates.userId, id), eq(userCertificates.tenantId, tenantId)));
    } catch (e) { /* ignore */ }
    
    try {
      await db.delete(userPreferences).where(and(eq(userPreferences.userId, id), eq(userPreferences.tenantId, tenantId)));
    } catch (e) { /* ignore */ }
    
    try {
      await db.delete(financialContributions).where(and(eq(financialContributions.userId, id), eq(financialContributions.tenantId, tenantId)));
    } catch (e) { /* ignore */ }
    
    try {
      await db.delete(activityLog).where(and(eq(activityLog.userId, id), eq(activityLog.tenantId, tenantId)));
    } catch (e) { /* ignore */ }
    
    try {
      // Delete activities that reference this user
      await db.delete(activities).where(and(eq(activities.userId, id), eq(activities.tenantId, tenantId)));
    } catch (e) { /* ignore */ }
    
    // Now delete the user
    try {
      const result = await db.delete(users).where(
        and(eq(users.id, id), eq(users.tenantId, tenantId))
      ).returning();
      return result.length > 0;
    } catch (e) {
      console.error('[DELETE USER] Error deleting user:', (e as any).message);
      return false;
    }
  }

  async deleteAllTenantUsers(tenantId: string): Promise<number> {
    // First delete all related data that references users
    const tenantUsers = await this.getAllUsers(tenantId);
    const userIds = tenantUsers.map(u => u.id);
    
    if (userIds.length === 0) return 0;
    
    // Delete in order to respect foreign keys - wrap all in try-catch to handle schema variations
    try {
      await db.delete(messages).where(
        and(
          eq(messages.tenantId, tenantId),
          or(
            inArray(messages.senderId, userIds),
            sql`${messages.recipientId} IN (${sql.join(userIds.map(id => sql`${id}`), sql`, `)})`
          )
        )
      );
    } catch (e) { /* ignore */ }
    
    try {
      await db.delete(eventRsvps).where(eq(eventRsvps.tenantId, tenantId));
    } catch (e) { /* ignore */ }
    
    try {
      await db.delete(taskComments).where(eq(taskComments.tenantId, tenantId));
    } catch (e) { /* ignore */ }
    
    try {
      await db.delete(workGroupMembers).where(eq(workGroupMembers.tenantId, tenantId));
    } catch (e) { /* ignore */ }
    
    try {
      // user_badges might not have tenant_id column - try with tenantId first
      await db.delete(userBadges).where(eq(userBadges.tenantId, tenantId));
    } catch (e) { 
      try {
        // Fallback: delete by userId for all tenant users
        if (userIds.length > 0) {
          await db.delete(userBadges).where(inArray(userBadges.userId, userIds));
        }
      } catch (e2) {
        console.log('[DELETE ALL USERS] user_badges deletion failed:', (e2 as any).message);
      }
    }
    
    try {
      await db.delete(userCertificates).where(eq(userCertificates.tenantId, tenantId));
    } catch (e) { /* ignore */ }
    
    try {
      await db.delete(userPreferences).where(eq(userPreferences.tenantId, tenantId));
    } catch (e) { /* ignore */ }
    
    try {
      await db.delete(familyRelationships).where(eq(familyRelationships.tenantId, tenantId));
    } catch (e) { /* ignore */ }
    
    try {
      await db.delete(activityLog).where(eq(activityLog.tenantId, tenantId));
    } catch (e) { /* ignore */ }
    
    try {
      await db.delete(activities).where(eq(activities.tenantId, tenantId));
    } catch (e) { /* ignore */ }
    
    try {
      await db.delete(activityFeed).where(eq(activityFeed.tenantId, tenantId));
    } catch (e) { /* ignore */ }
    
    // Now delete users (EXCLUDE admin users to protect tenant access)
    try {
      const result = await db.delete(users).where(
        and(
          eq(users.tenantId, tenantId),
          sql`(${users.isSuperAdmin} IS NULL OR ${users.isSuperAdmin} = false)`,
          sql`${users.username} != 'admin'`
        )
      );
      console.log('[DELETE ALL USERS] ✅ Deleted', result, 'users, PROTECTED admin user');
    } catch (e) {
      console.error('[DELETE ALL USERS] Error deleting users:', (e as any).message);
    }
    
    return userIds.length;
  }

  async getAnnouncement(id: string, tenantId: string): Promise<Announcement | undefined> {
    const result = await db.select().from(announcements).where(and(eq(announcements.id, id), eq(announcements.tenantId, tenantId))).limit(1);
    return result[0];
  }

  async createAnnouncement(insertAnnouncement: InsertAnnouncement): Promise<Announcement> {
    const [announcement] = await db.insert(announcements).values({...insertAnnouncement, tenantId: insertAnnouncement.tenantId}).returning();
    
    await this.createActivity({
      type: "announcement",
      description: `Nova obavijest objavljena: ${announcement.title}`,
      userId: announcement.authorId,
      tenantId: announcement.tenantId
    });
    
    return announcement;
  }

  async updateAnnouncementFeed(announcementId: string, tenantId: string) {
    // Get first image from announcement files
    const files = await db.select().from(announcementFiles)
      .where(and(eq(announcementFiles.announcementId, announcementId), eq(announcementFiles.tenantId, tenantId)))
      .orderBy(asc(announcementFiles.uploadedAt))
      .limit(1);
    
    const imageUrl = files[0]?.fileType === 'image' ? files[0].filePath : null;
    
    // Check if feed item already exists
    const existingFeedItems = await db.select().from(activityFeed)
      .where(and(
        eq(activityFeed.relatedEntityId, announcementId),
        eq(activityFeed.relatedEntityType, 'announcement'),
        eq(activityFeed.tenantId, tenantId)
      ))
      .limit(1);

    const announcement = await this.getAnnouncement(announcementId, tenantId);
    if (!announcement) return;

    if (existingFeedItems.length > 0) {
      // Update existing feed item
      await db.update(activityFeed)
        .set({
          title: announcement.title,
          description: "",
          metadata: JSON.stringify({ imageUrl })
        })
        .where(and(eq(activityFeed.id, existingFeedItems[0].id), eq(activityFeed.tenantId, tenantId)));
    } else {
      // Create new feed item
      await this.createActivityFeedItem({
        tenantId,
        type: "announcement",
        title: announcement.title,
        description: "",
        relatedEntityId: announcementId,
        relatedEntityType: "announcement",
        isClickable: true,
        metadata: JSON.stringify({ imageUrl })
      });
    }
  }

  async updateAnnouncement(id: string, tenantId: string, updateData: Partial<InsertAnnouncement>): Promise<Announcement | undefined> {
    const [announcement] = await db.update(announcements).set(updateData).where(and(eq(announcements.id, id), eq(announcements.tenantId, tenantId))).returning();
    return announcement;
  }

  async deleteAnnouncement(id: string, tenantId: string): Promise<boolean> {
    const result = await db.delete(announcements).where(and(eq(announcements.id, id), eq(announcements.tenantId, tenantId))).returning();
    return result.length > 0;
  }

  async getAllAnnouncements(tenantId: string): Promise<Announcement[]> {
    return await db.select().from(announcements).where(eq(announcements.tenantId, tenantId)).orderBy(desc(announcements.publishDate));
  }

  async getEvent(id: string, tenantId: string): Promise<Event | undefined> {
    const result = await db.select().from(events).where(and(eq(events.id, id), eq(events.tenantId, tenantId))).limit(1);
    return result[0];
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const [event] = await db.insert(events).values({...insertEvent, tenantId: insertEvent.tenantId}).returning();
    
    // Only create activity if createdById is available (not null)
    if (event.createdById) {
      await this.createActivity({
        type: "event",
        description: `Događaj kreiran: ${event.name}`,
        userId: event.createdById,
        tenantId: event.tenantId
      });
    }
    
    // Add to activity feed with photoUrl from event
    await this.createActivityFeedItem({
      type: "event",
      title: event.name,
      description: event.location || "",
      relatedEntityId: event.id,
      relatedEntityType: "event",
      isClickable: true,
      tenantId: event.tenantId,
      metadata: JSON.stringify({ imageUrl: event.photoUrl || null })
    });
    
    return event;
  }

  async updateEvent(id: string, tenantId: string, updateData: Partial<InsertEvent>): Promise<Event | undefined> {
    const [event] = await db.update(events).set(updateData).where(and(eq(events.id, id), eq(events.tenantId, tenantId))).returning();
    return event;
  }

  async deleteEvent(id: string, tenantId: string): Promise<boolean> {
    const result = await db.delete(events).where(and(eq(events.id, id), eq(events.tenantId, tenantId))).returning();
    return result.length > 0;
  }

  async getAllEvents(tenantId: string): Promise<Event[]> {
    return await db.select().from(events).where(eq(events.tenantId, tenantId));
  }

  async getEventLocations(tenantId: string): Promise<string[]> {
    const allEvents = await db.select().from(events).where(eq(events.tenantId, tenantId));
    const locations = allEvents
      .map(event => event.location)
      .filter((location, index, self) => location && self.indexOf(location) === index);
    return locations.sort();
  }

  async createEventRsvp(insertRsvp: InsertEventRsvp): Promise<EventRsvp> {
    const [rsvp] = await db.insert(eventRsvps).values({...insertRsvp, tenantId: insertRsvp.tenantId}).returning();
    return rsvp;
  }

  async getEventRsvps(eventId: string, tenantId: string): Promise<EventRsvpStats> {
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
      .where(and(eq(eventRsvps.eventId, eventId), eq(eventRsvps.tenantId, tenantId)));

    const rsvps: EventRsvpWithUser[] = rsvpResults.map(result => ({
      id: result.id,
      tenantId: tenantId,
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

  async getUserEventRsvp(eventId: string, userId: string, tenantId: string): Promise<EventRsvp | null> {
    const result = await db.select().from(eventRsvps)
      .where(and(eq(eventRsvps.eventId, eventId), eq(eventRsvps.userId, userId), eq(eventRsvps.tenantId, tenantId)))
      .limit(1);
    return result[0] ?? null;
  }

  async updateEventRsvp(id: string, tenantId: string, updates: { adultsCount?: number; childrenCount?: number }): Promise<EventRsvp | undefined> {
    const [rsvp] = await db.update(eventRsvps).set(updates).where(and(eq(eventRsvps.id, id), eq(eventRsvps.tenantId, tenantId))).returning();
    return rsvp;
  }

  async deleteEventRsvp(id: string, tenantId: string): Promise<boolean> {
    const result = await db.delete(eventRsvps).where(and(eq(eventRsvps.id, id), eq(eventRsvps.tenantId, tenantId))).returning();
    return result.length > 0;
  }

  async getWorkGroup(id: string, tenantId: string): Promise<WorkGroup | undefined> {
    const result = await db.select().from(workGroups).where(and(eq(workGroups.id, id), eq(workGroups.tenantId, tenantId))).limit(1);
    return result[0];
  }

  async createWorkGroup(insertWorkGroup: InsertWorkGroup): Promise<WorkGroup> {
    const [workGroup] = await db.insert(workGroups).values({...insertWorkGroup, tenantId: insertWorkGroup.tenantId}).returning();
    return workGroup;
  }

  async updateWorkGroup(id: string, tenantId: string, updateData: Partial<InsertWorkGroup>): Promise<WorkGroup | undefined> {
    const [workGroup] = await db.update(workGroups).set(updateData).where(and(eq(workGroups.id, id), eq(workGroups.tenantId, tenantId))).returning();
    return workGroup;
  }

  async deleteWorkGroup(id: string, tenantId: string): Promise<boolean> {
    // Delete all related records first (in correct order due to foreign keys)
    // 1. Delete all access requests for this work group
    await db.delete(accessRequests).where(and(eq(accessRequests.workGroupId, id), eq(accessRequests.tenantId, tenantId)));
    
    // 2. Delete all proposals for this work group (proposals table doesn't have tenant_id)
    await db.delete(proposals).where(eq(proposals.workGroupId, id));
    
    // 3. Delete all tasks for this work group
    await db.delete(tasks).where(and(eq(tasks.workGroupId, id), eq(tasks.tenantId, tenantId)));
    
    // 4. Delete all work group members
    await db.delete(workGroupMembers).where(and(eq(workGroupMembers.workGroupId, id), eq(workGroupMembers.tenantId, tenantId)));
    
    // 5. Finally delete the work group itself
    const result = await db.delete(workGroups).where(and(eq(workGroups.id, id), eq(workGroups.tenantId, tenantId))).returning();
    return result.length > 0;
  }

  async getAllWorkGroups(tenantId: string, userId?: string, isAdmin?: boolean): Promise<WorkGroup[]> {
    const allWorkGroups = await db.select().from(workGroups).where(eq(workGroups.tenantId, tenantId));
    
    if (!userId || isAdmin) {
      return allWorkGroups;
    }
    
    const userMemberships = await db.select().from(workGroupMembers)
      .where(and(eq(workGroupMembers.userId, userId), eq(workGroupMembers.tenantId, tenantId)));
    const userGroupIds = userMemberships.map(m => m.workGroupId);
    
    return allWorkGroups.filter(wg => 
      wg.visibility === "javna" || userGroupIds.includes(wg.id)
    );
  }

  async addMemberToWorkGroup(workGroupId: string, userId: string, tenantId: string): Promise<WorkGroupMember> {
    const existing = await db.select().from(workGroupMembers)
      .where(and(eq(workGroupMembers.workGroupId, workGroupId), eq(workGroupMembers.userId, userId), eq(workGroupMembers.tenantId, tenantId)))
      .limit(1);
    
    if (existing.length > 0) {
      return existing[0];
    }

    const [member] = await db.insert(workGroupMembers).values({
      workGroupId,
      userId,
      isModerator: false,
      tenantId
    }).returning();
    
    await this.createActivity({
      type: "workgroup",
      description: `Korisnik dodao u radnu grupu`,
      userId,
      tenantId
    });
    
    return member;
  }

  async removeMemberFromWorkGroup(workGroupId: string, userId: string, tenantId: string): Promise<boolean> {
    const result = await db.delete(workGroupMembers)
      .where(and(eq(workGroupMembers.workGroupId, workGroupId), eq(workGroupMembers.userId, userId), eq(workGroupMembers.tenantId, tenantId)))
      .returning();
    
    if (result.length > 0) {
      await this.createActivity({
        type: "workgroup",
        description: `Korisnik uklonjen iz radne grupe`,
        userId,
        tenantId
      });
    }
    
    return result.length > 0;
  }

  async getWorkGroupMembers(workGroupId: string, tenantId: string): Promise<WorkGroupMember[]> {
    return await db.select().from(workGroupMembers).where(and(eq(workGroupMembers.workGroupId, workGroupId), eq(workGroupMembers.tenantId, tenantId)));
  }

  async getUserWorkGroups(userId: string, tenantId: string): Promise<WorkGroupMember[]> {
    return await db.select().from(workGroupMembers).where(and(eq(workGroupMembers.userId, userId), eq(workGroupMembers.tenantId, tenantId)));
  }

  async isUserMemberOfWorkGroup(workGroupId: string, userId: string, tenantId: string): Promise<boolean> {
    const result = await db.select().from(workGroupMembers)
      .where(and(eq(workGroupMembers.workGroupId, workGroupId), eq(workGroupMembers.userId, userId), eq(workGroupMembers.tenantId, tenantId)))
      .limit(1);
    return result.length > 0;
  }

  async setModerator(workGroupId: string, userId: string, tenantId: string, isModerator: boolean): Promise<WorkGroupMember | undefined> {
    const [member] = await db.update(workGroupMembers)
      .set({ isModerator })
      .where(and(eq(workGroupMembers.workGroupId, workGroupId), eq(workGroupMembers.userId, userId), eq(workGroupMembers.tenantId, tenantId)))
      .returning();
    
    if (member) {
      await this.createActivity({
        type: "workgroup",
        description: `Korisnik ${isModerator ? 'označen kao moderator' : 'uklonjen kao moderator'}`,
        userId,
        tenantId
      });
    }
    
    return member;
  }

  async getWorkGroupModerators(workGroupId: string, tenantId: string): Promise<WorkGroupMember[]> {
    return await db.select().from(workGroupMembers)
      .where(and(eq(workGroupMembers.workGroupId, workGroupId), eq(workGroupMembers.isModerator, true), eq(workGroupMembers.tenantId, tenantId)));
  }

  async isUserModeratorOfWorkGroup(workGroupId: string, userId: string, tenantId: string): Promise<boolean> {
    const result = await db.select().from(workGroupMembers)
      .where(and(
        eq(workGroupMembers.workGroupId, workGroupId),
        eq(workGroupMembers.userId, userId),
        eq(workGroupMembers.isModerator, true),
        eq(workGroupMembers.tenantId, tenantId)
      ))
      .limit(1);
    return result.length > 0;
  }

  async getTask(id: string, tenantId: string): Promise<Task | undefined> {
    const result = await db.select().from(tasks).where(and(eq(tasks.id, id), eq(tasks.tenantId, tenantId))).limit(1);
    return result[0];
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const [task] = await db.insert(tasks).values({...insertTask, tenantId: insertTask.tenantId}).returning();
    
    if (task.assignedUserIds && task.assignedUserIds.length > 0) {
      for (const userId of task.assignedUserIds) {
        await this.createActivity({
          type: "task",
          description: `Zadatak kreiran: ${task.title}`,
          userId: userId,
          tenantId: task.tenantId
        });
      }
    }
    
    return task;
  }

  async updateTask(id: string, tenantId: string, updateData: Partial<InsertTask>): Promise<Task | undefined> {
    const [task] = await db.update(tasks).set(updateData).where(and(eq(tasks.id, id), eq(tasks.tenantId, tenantId))).returning();
    
    if (task && updateData.status === "završeno" && task.assignedUserIds && task.assignedUserIds.length > 0) {
      for (const userId of task.assignedUserIds) {
        await this.createActivity({
          type: "task",
          description: `Zadatak završen: ${task.title}`,
          userId: userId,
          tenantId: task.tenantId
        });
      }
    }
    
    return task;
  }

  async deleteTask(id: string, tenantId: string): Promise<boolean> {
    const result = await db.delete(tasks).where(and(eq(tasks.id, id), eq(tasks.tenantId, tenantId))).returning();
    return result.length > 0;
  }

  async getTasksByWorkGroup(workGroupId: string, tenantId: string): Promise<Task[]> {
    return await db.select().from(tasks).where(and(eq(tasks.workGroupId, workGroupId), eq(tasks.tenantId, tenantId)));
  }

  async getAllTasksWithWorkGroup(tenantId: string, userId: string, isAdmin: boolean): Promise<Array<Task & { workGroup: WorkGroup }>> {
    const allTasks = await db.select().from(tasks).where(eq(tasks.tenantId, tenantId));
    const allWorkGroups = await db.select().from(workGroups).where(eq(workGroups.tenantId, tenantId));
    const workGroupMap = new Map(allWorkGroups.map(wg => [wg.id, wg]));
    
    if (isAdmin) {
      return allTasks
        .map(task => ({ ...task, workGroup: workGroupMap.get(task.workGroupId)! }))
        .filter(task => task.workGroup);
    } else {
      const userModeratedGroups = await db.select().from(workGroupMembers)
        .where(and(eq(workGroupMembers.userId, userId), eq(workGroupMembers.isModerator, true), eq(workGroupMembers.tenantId, tenantId)));
      const moderatedGroupIds = userModeratedGroups.map(m => m.workGroupId);
      
      return allTasks
        .filter(task => moderatedGroupIds.includes(task.workGroupId))
        .map(task => ({ ...task, workGroup: workGroupMap.get(task.workGroupId)! }))
        .filter(task => task.workGroup);
    }
  }

  async moveTaskToWorkGroup(taskId: string, newWorkGroupId: string, tenantId: string): Promise<Task | undefined> {
    const [task] = await db.update(tasks)
      .set({ workGroupId: newWorkGroupId })
      .where(and(eq(tasks.id, taskId), eq(tasks.tenantId, tenantId)))
      .returning();
    return task;
  }

  async createAccessRequest(insertRequest: InsertAccessRequest): Promise<AccessRequest> {
    const [request] = await db.insert(accessRequests).values({...insertRequest, tenantId: insertRequest.tenantId}).returning();
    return request;
  }

  async updateAccessRequest(id: string, tenantId: string, status: string): Promise<AccessRequest | undefined> {
    const [request] = await db.update(accessRequests).set({ status }).where(and(eq(accessRequests.id, id), eq(accessRequests.tenantId, tenantId))).returning();
    return request;
  }

  async getAllAccessRequests(tenantId: string): Promise<AccessRequest[]> {
    return await db.select().from(accessRequests).where(eq(accessRequests.tenantId, tenantId));
  }

  async getUserAccessRequests(userId: string, tenantId: string): Promise<AccessRequest[]> {
    return await db.select().from(accessRequests).where(and(eq(accessRequests.userId, userId), eq(accessRequests.tenantId, tenantId)));
  }

  async createActivity(activityData: { type: string; description: string; userId?: string; tenantId: string }): Promise<Activity> {
    const [activity] = await db.insert(activities).values({
      type: activityData.type,
      description: activityData.description,
      userId: activityData.userId ?? null,
      tenantId: activityData.tenantId
    }).returning();
    return activity;
  }

  async getRecentActivities(tenantId: string, limit = 10): Promise<Activity[]> {
    return await db.select().from(activities).where(eq(activities.tenantId, tenantId)).orderBy(desc(activities.createdAt)).limit(limit);
  }

  async getUserCount(tenantId: string): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.tenantId, tenantId));
    return Number(result[0]?.count ?? 0);
  }

  async getNewAnnouncementsCount(tenantId: string, days: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(announcements)
      .where(and(gt(announcements.publishDate, cutoffDate), eq(announcements.tenantId, tenantId)));
    return Number(result[0]?.count ?? 0);
  }

  async getUpcomingEventsCount(tenantId: string): Promise<number> {
    const now = new Date();
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(events)
      .where(and(gt(events.dateTime, now), eq(events.tenantId, tenantId)));
    return Number(result[0]?.count ?? 0);
  }

  async getActiveTasksCount(tenantId: string): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(tasks)
      .where(and(sql`${tasks.status} != 'completed'`, eq(tasks.tenantId, tenantId)));
    return Number(result[0]?.count ?? 0);
  }

  async createTaskComment(insertComment: InsertTaskComment): Promise<TaskComment> {
    const [comment] = await db.insert(taskComments).values({...insertComment, tenantId: insertComment.tenantId}).returning();
    
    await this.createActivity({
      type: "task",
      description: `Komentar dodao na zadatak`,
      userId: comment.userId,
      tenantId: comment.tenantId
    });
    
    return comment;
  }

  async getTaskComment(id: string, tenantId: string): Promise<TaskComment | undefined> {
    const result = await db.select().from(taskComments).where(and(eq(taskComments.id, id), eq(taskComments.tenantId, tenantId))).limit(1);
    return result[0];
  }

  async getTaskComments(taskId: string, tenantId: string): Promise<TaskComment[]> {
    return await db.select().from(taskComments)
      .where(and(eq(taskComments.taskId, taskId), eq(taskComments.tenantId, tenantId)))
      .orderBy(asc(taskComments.createdAt));
  }

  async deleteTaskComment(id: string, tenantId: string): Promise<boolean> {
    const result = await db.delete(taskComments).where(and(eq(taskComments.id, id), eq(taskComments.tenantId, tenantId))).returning();
    return result.length > 0;
  }


  async createAnnouncementFile(insertFile: InsertAnnouncementFile): Promise<AnnouncementFile> {
    const [file] = await db.insert(announcementFiles).values({...insertFile, tenantId: insertFile.tenantId}).returning();
    
    await this.createActivity({
      type: "announcement",
      description: `Fajl dodao u obavijest: ${file.fileName}`,
      userId: file.uploadedById,
      tenantId: file.tenantId
    });
    
    // Update activity feed with new image if it's an image file
    if (file.fileType === 'image') {
      await this.updateAnnouncementFeed(file.announcementId, file.tenantId);
    }
    
    return file;
  }

  async getAnnouncementFile(id: string, tenantId: string): Promise<AnnouncementFile | undefined> {
    const result = await db.select().from(announcementFiles).where(and(eq(announcementFiles.id, id), eq(announcementFiles.tenantId, tenantId))).limit(1);
    return result[0];
  }

  async getAnnouncementFiles(announcementId: string, tenantId: string): Promise<AnnouncementFile[]> {
    return await db.select().from(announcementFiles)
      .where(and(eq(announcementFiles.announcementId, announcementId), eq(announcementFiles.tenantId, tenantId)))
      .orderBy(desc(announcementFiles.uploadedAt));
  }

  async deleteAnnouncementFile(id: string, tenantId: string): Promise<boolean> {
    const result = await db.delete(announcementFiles).where(and(eq(announcementFiles.id, id), eq(announcementFiles.tenantId, tenantId))).returning();
    return result.length > 0;
  }

  async createFamilyRelationship(insertRelationship: InsertFamilyRelationship): Promise<FamilyRelationship> {
    const [relationship] = await db.insert(familyRelationships).values({...insertRelationship, tenantId: insertRelationship.tenantId}).returning();
    
    await this.createActivity({
      type: "registration",
      description: `Dodan porodični odnos: ${relationship.relationship}`,
      userId: relationship.userId,
      tenantId: relationship.tenantId
    });
    
    return relationship;
  }

  async getFamilyRelationship(id: string, tenantId: string): Promise<FamilyRelationship | undefined> {
    const result = await db.select().from(familyRelationships).where(and(eq(familyRelationships.id, id), eq(familyRelationships.tenantId, tenantId))).limit(1);
    return result[0];
  }

  async getUserFamilyRelationships(userId: string, tenantId: string): Promise<FamilyRelationship[]> {
    return await db.select().from(familyRelationships)
      .where(and(or(eq(familyRelationships.userId, userId), eq(familyRelationships.relatedUserId, userId)), eq(familyRelationships.tenantId, tenantId)))
      .orderBy(desc(familyRelationships.createdAt));
  }

  async deleteFamilyRelationship(id: string, tenantId: string): Promise<boolean> {
    const result = await db.delete(familyRelationships).where(and(eq(familyRelationships.id, id), eq(familyRelationships.tenantId, tenantId))).returning();
    return result.length > 0;
  }

  async getFamilyMembersByRelationship(userId: string, relationship: string, tenantId: string): Promise<FamilyRelationship[]> {
    return await db.select().from(familyRelationships)
      .where(and(
        or(eq(familyRelationships.userId, userId), eq(familyRelationships.relatedUserId, userId)),
        eq(familyRelationships.relationship, relationship),
        eq(familyRelationships.tenantId, tenantId)
      ))
      .orderBy(desc(familyRelationships.createdAt));
  }

  async getMessages(userId: string, tenantId: string): Promise<Message[]> {
    const user = await this.getUser(userId, tenantId);
    const userCategories = user?.categories ?? [];
    
    const allMessages = await db.select().from(messages).where(eq(messages.tenantId, tenantId));
    
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
      tenantId: insertMessage.tenantId,
      threadId: threadId ?? sql`gen_random_uuid()`
    }).returning();
    
    await this.createActivity({
      type: "message",
      description: `Poruka poslana: ${message.subject}`,
      userId: message.senderId,
      tenantId: message.tenantId
    });
    
    return message;
  }

  async markAsRead(messageId: string, userId: string, tenantId: string): Promise<Message | undefined> {
    const message = await db.select().from(messages).where(and(eq(messages.id, messageId), eq(messages.tenantId, tenantId))).limit(1);
    if (!message[0]) return undefined;
    
    const user = await this.getUser(userId, tenantId);
    const userCategories = user?.categories ?? [];
    
    if (message[0].recipientId === userId || (message[0].category && userCategories.includes(message[0].category))) {
      const [updated] = await db.update(messages)
        .set({ isRead: true })
        .where(and(eq(messages.id, messageId), eq(messages.tenantId, tenantId)))
        .returning();
      return updated;
    }
    
    return undefined;
  }

  async deleteMessage(messageId: string, tenantId: string): Promise<boolean> {
    const result = await db.delete(messages).where(and(eq(messages.id, messageId), eq(messages.tenantId, tenantId))).returning();
    return result.length > 0;
  }

  async getUnreadCount(userId: string, tenantId: string): Promise<number> {
    const allMessages = await this.getMessages(userId, tenantId);
    return allMessages.filter(msg => 
      !msg.isRead && 
      (msg.recipientId === userId || msg.category)
    ).length;
  }

  async getMessageThread(threadId: string, userId: string, tenantId: string): Promise<Message[]> {
    const allMessages = await db.select().from(messages)
      .where(and(eq(messages.threadId, threadId), eq(messages.tenantId, tenantId)))
      .orderBy(asc(messages.createdAt));
    
    return allMessages.filter(msg => 
      msg.senderId === userId || msg.recipientId === userId
    );
  }

  async getConversations(userId: string, tenantId: string): Promise<Array<{ threadId: string; lastMessage: Message; unreadCount: number; otherUser: User | null }>> {
    const userMessages = await this.getMessages(userId, tenantId);
    
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
        
        const otherUser = otherUserId ? (await this.getUser(otherUserId, tenantId)) ?? null : null;

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

  async markThreadAsRead(threadId: string, userId: string, tenantId: string): Promise<void> {
    await db.update(messages)
      .set({ isRead: true })
      .where(and(
        eq(messages.threadId, threadId),
        eq(messages.recipientId, userId),
        eq(messages.isRead, false),
        eq(messages.tenantId, tenantId)
      ));
  }

  async getImamQuestions(tenantId: string, userId?: string): Promise<ImamQuestion[]> {
    if (userId) {
      return await db.select().from(imamQuestions).where(and(eq(imamQuestions.userId, userId), eq(imamQuestions.tenantId, tenantId)));
    }
    return await db.select().from(imamQuestions).where(eq(imamQuestions.tenantId, tenantId)).orderBy(desc(imamQuestions.createdAt));
  }

  async createImamQuestion(questionData: InsertImamQuestion): Promise<ImamQuestion> {
    const [question] = await db.insert(imamQuestions).values({...questionData, tenantId: questionData.tenantId}).returning();
    return question;
  }

  async answerImamQuestion(questionId: string, tenantId: string, answer: string): Promise<ImamQuestion | undefined> {
    const [question] = await db.update(imamQuestions)
      .set({ answer, isAnswered: true, answeredAt: new Date() })
      .where(and(eq(imamQuestions.id, questionId), eq(imamQuestions.tenantId, tenantId)))
      .returning();
    return question;
  }

  async markQuestionAsRead(questionId: string, tenantId: string): Promise<ImamQuestion | undefined> {
    const [question] = await db.update(imamQuestions)
      .set({ isRead: true })
      .where(and(eq(imamQuestions.id, questionId), eq(imamQuestions.tenantId, tenantId)))
      .returning();
    return question;
  }

  async deleteImamQuestion(questionId: string, tenantId: string): Promise<boolean> {
    const result = await db.delete(imamQuestions).where(and(eq(imamQuestions.id, questionId), eq(imamQuestions.tenantId, tenantId))).returning();
    return result.length > 0;
  }

  async getUnansweredQuestionsCount(tenantId: string): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(imamQuestions)
      .where(and(eq(imamQuestions.isAnswered, false), eq(imamQuestions.tenantId, tenantId)));
    return Number(result[0]?.count ?? 0);
  }

  async getOrganizationSettings(tenantId: string): Promise<OrganizationSettings> {
    try {
      const result = await db.select().from(organizationSettings).where(eq(organizationSettings.tenantId, tenantId)).limit(1);
      
      if (!result[0]) {
        console.log('[STORAGE] Creating default org settings for tenant:', tenantId);
        // Auto-create default organization settings if not found
        const insertResult = await db.insert(organizationSettings).values({
          tenantId,
          name: "Islamska Zajednica",
          address: "Ulica Džemata 123",
          phone: "+387 33 123 456",
          email: "info@dzemat.ba",
          currency: "CHF",
          livestreamEnabled: false,
          livestreamTitle: null,
          livestreamUrl: null,
          livestreamDescription: null,
          facebookUrl: null,
          instagramUrl: null,
          youtubeUrl: null,
          twitterUrl: null,
        } as InsertOrganizationSettings).returning();
        
        if (!insertResult[0]) {
          console.error('[STORAGE] ❌ Failed to create org settings - no result returned');
          throw new Error('Failed to create organization settings');
        }
        console.log('[STORAGE] ✅ Created org settings:', insertResult[0].id);
        return insertResult[0];
      }
      
      console.log('[STORAGE] ✅ Found existing org settings:', result[0].id);
      return result[0];
    } catch (error) {
      console.error('[STORAGE] ❌ getOrganizationSettings error:', error);
      throw error;
    }
  }

  async updateOrganizationSettings(tenantId: string, settings: Partial<InsertOrganizationSettings>): Promise<OrganizationSettings> {
    const existing = await this.getOrganizationSettings(tenantId);
    
    if (!existing) {
      const [newSettings] = await db.insert(organizationSettings).values({ ...settings, tenantId } as InsertOrganizationSettings).returning();
      return newSettings;
    }
    
    const [updated] = await db.update(organizationSettings)
      .set({ ...settings, updatedAt: new Date() })
      .where(and(eq(organizationSettings.id, existing.id), eq(organizationSettings.tenantId, tenantId)))
      .returning();
    return updated;
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const [doc] = await db.insert(documents).values({...document, tenantId: document.tenantId}).returning();
    return doc;
  }

  async getDocument(id: string, tenantId: string): Promise<Document | undefined> {
    const result = await db.select().from(documents).where(and(eq(documents.id, id), eq(documents.tenantId, tenantId))).limit(1);
    return result[0];
  }

  async getAllDocuments(tenantId: string): Promise<Document[]> {
    return await db.select().from(documents).where(eq(documents.tenantId, tenantId)).orderBy(desc(documents.uploadedAt));
  }

  async deleteDocument(id: string, tenantId: string): Promise<boolean> {
    const result = await db.delete(documents).where(and(eq(documents.id, id), eq(documents.tenantId, tenantId))).returning();
    return result.length > 0;
  }

  async createRequest(request: InsertRequest): Promise<Request> {
    const [req] = await db.insert(requests).values({...request, tenantId: request.tenantId}).returning();
    return req;
  }

  async getRequest(id: string, tenantId: string): Promise<Request | undefined> {
    const result = await db.select().from(requests).where(and(eq(requests.id, id), eq(requests.tenantId, tenantId))).limit(1);
    return result[0];
  }

  async getAllRequests(tenantId: string): Promise<Request[]> {
    return await db.select().from(requests).where(eq(requests.tenantId, tenantId)).orderBy(desc(requests.createdAt));
  }

  async getUserRequests(userId: string, tenantId: string): Promise<Request[]> {
    return await db.select().from(requests)
      .where(and(eq(requests.userId, userId), eq(requests.tenantId, tenantId)))
      .orderBy(desc(requests.createdAt));
  }

  async updateRequest(id: string, tenantId: string, updates: Partial<InsertRequest>): Promise<Request | undefined> {
    const [request] = await db.update(requests).set(updates).where(and(eq(requests.id, id), eq(requests.tenantId, tenantId))).returning();
    return request;
  }

  async updateRequestStatus(id: string, tenantId: string, status: string, reviewedById?: string, adminNotes?: string): Promise<Request | undefined> {
    const [request] = await db.update(requests)
      .set({
        status,
        reviewedAt: new Date(),
        reviewedById: reviewedById ?? null,
        adminNotes: adminNotes ?? null
      })
      .where(and(eq(requests.id, id), eq(requests.tenantId, tenantId)))
      .returning();
    return request;
  }

  async createShopProduct(product: InsertShopProduct): Promise<ShopProduct> {
    const [prod] = await db.insert(shopProducts).values({...product, tenantId: product.tenantId}).returning();
    return prod;
  }

  async getShopProduct(id: string, tenantId: string): Promise<ShopProduct | undefined> {
    const result = await db.select().from(shopProducts).where(and(eq(shopProducts.id, id), eq(shopProducts.tenantId, tenantId))).limit(1);
    return result[0];
  }

  async getAllShopProducts(tenantId: string): Promise<ShopProduct[]> {
    return await db.select().from(shopProducts).where(eq(shopProducts.tenantId, tenantId)).orderBy(desc(shopProducts.createdAt));
  }

  async updateShopProduct(id: string, tenantId: string, updates: Partial<InsertShopProduct>): Promise<ShopProduct | undefined> {
    const [product] = await db.update(shopProducts).set(updates).where(and(eq(shopProducts.id, id), eq(shopProducts.tenantId, tenantId))).returning();
    return product;
  }

  async deleteShopProduct(id: string, tenantId: string): Promise<boolean> {
    const result = await db.delete(shopProducts).where(and(eq(shopProducts.id, id), eq(shopProducts.tenantId, tenantId))).returning();
    return result.length > 0;
  }

  async createMarketplaceItem(item: InsertMarketplaceItem): Promise<MarketplaceItem> {
    const [marketItem] = await db.insert(marketplaceItems).values({...item, tenantId: item.tenantId}).returning();
    
    // Add to activity feed
    const typeText = marketItem.type === 'sale' ? 'Prodaje se' : 'Poklanja se';
    await this.createActivityFeedItem({
      tenantId: marketItem.tenantId,
      type: "shop_item",
      title: typeText,
      description: marketItem.name,
      relatedEntityId: marketItem.id,
      relatedEntityType: "shop_item",
      isClickable: true,
      metadata: JSON.stringify({ imageUrl: marketItem.photos?.[0] || null })
    });
    
    return marketItem;
  }

  async getMarketplaceItem(id: string, tenantId: string): Promise<MarketplaceItem | undefined> {
    const result = await db.select().from(marketplaceItems).where(and(eq(marketplaceItems.id, id), eq(marketplaceItems.tenantId, tenantId))).limit(1);
    return result[0];
  }

  async getAllMarketplaceItems(tenantId: string): Promise<MarketplaceItem[]> {
    return await db.select().from(marketplaceItems).where(eq(marketplaceItems.tenantId, tenantId)).orderBy(desc(marketplaceItems.createdAt));
  }

  async getUserMarketplaceItems(userId: string, tenantId: string): Promise<MarketplaceItem[]> {
    return await db.select().from(marketplaceItems)
      .where(and(eq(marketplaceItems.userId, userId), eq(marketplaceItems.tenantId, tenantId)))
      .orderBy(desc(marketplaceItems.createdAt));
  }

  async updateMarketplaceItem(id: string, tenantId: string, updates: Partial<InsertMarketplaceItem>): Promise<MarketplaceItem | undefined> {
    const [item] = await db.update(marketplaceItems).set(updates).where(and(eq(marketplaceItems.id, id), eq(marketplaceItems.tenantId, tenantId))).returning();
    return item;
  }

  async deleteMarketplaceItem(id: string, tenantId: string): Promise<boolean> {
    const result = await db.delete(marketplaceItems).where(and(eq(marketplaceItems.id, id), eq(marketplaceItems.tenantId, tenantId))).returning();
    return result.length > 0;
  }

  async createService(service: InsertService): Promise<Service> {
    const [newService] = await db.insert(services).values({...service, tenantId: service.tenantId}).returning();
    
    // Add to activity feed
    await this.createActivityFeedItem({
      tenantId: newService.tenantId,
      type: "shop_item",
      title: "Nova usluga",
      description: newService.name,
      relatedEntityId: newService.id,
      relatedEntityType: "service",
      isClickable: true,
      metadata: JSON.stringify({ imageUrl: newService.photos?.[0] || null })
    });
    
    return newService;
  }

  async getService(id: string, tenantId: string): Promise<Service | undefined> {
    const result = await db.select().from(services).where(and(eq(services.id, id), eq(services.tenantId, tenantId))).limit(1);
    return result[0];
  }

  async getAllServices(tenantId: string): Promise<Service[]> {
    return await db.select().from(services).where(and(eq(services.status, 'active'), eq(services.tenantId, tenantId))).orderBy(desc(services.createdAt));
  }

  async getAllServicesWithUsers(tenantId: string): Promise<ServiceWithUser[]> {
    const servicesData = await db.select().from(services)
      .where(and(eq(services.status, 'active'), eq(services.tenantId, tenantId)))
      .orderBy(desc(services.createdAt));
    
    const servicesWithUsers = await Promise.all(
      servicesData.map(async (service) => {
        const user = await this.getUser(service.userId, tenantId);
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

  async getUserServices(userId: string, tenantId: string): Promise<Service[]> {
    return await db.select().from(services)
      .where(and(eq(services.userId, userId), eq(services.tenantId, tenantId)))
      .orderBy(desc(services.createdAt));
  }

  async updateService(id: string, tenantId: string, updates: Partial<InsertService>): Promise<Service | undefined> {
    const [service] = await db.update(services).set(updates).where(and(eq(services.id, id), eq(services.tenantId, tenantId))).returning();
    return service;
  }

  async deleteService(id: string, tenantId: string): Promise<boolean> {
    const result = await db.delete(services).where(and(eq(services.id, id), eq(services.tenantId, tenantId))).returning();
    return result.length > 0;
  }

  async createProductPurchaseRequest(request: InsertProductPurchaseRequest): Promise<ProductPurchaseRequest> {
    const [req] = await db.insert(productPurchaseRequests).values({...request, tenantId: request.tenantId}).returning();
    return req;
  }

  async getAllProductPurchaseRequests(tenantId: string): Promise<ProductPurchaseRequest[]> {
    return await db.select().from(productPurchaseRequests).where(eq(productPurchaseRequests.tenantId, tenantId)).orderBy(desc(productPurchaseRequests.createdAt));
  }

  async updateProductPurchaseRequest(id: string, tenantId: string, status: string): Promise<ProductPurchaseRequest | undefined> {
    const [request] = await db.update(productPurchaseRequests)
      .set({ status })
      .where(and(eq(productPurchaseRequests.id, id), eq(productPurchaseRequests.tenantId, tenantId)))
      .returning();
    return request;
  }

  async updateLastViewed(userId: string, tenantId: string, type: 'shop' | 'events' | 'announcements' | 'imamQuestions' | 'tasks'): Promise<User | undefined> {
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

    const [user] = await db.update(users).set(updates).where(and(eq(users.id, userId), eq(users.tenantId, tenantId))).returning();
    return user;
  }

  async getNewItemsCount(userId: string, tenantId: string, type: 'shop' | 'events' | 'announcements' | 'imamQuestions' | 'tasks'): Promise<number> {
    const user = await this.getUser(userId, tenantId);
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

  async getPendingAccessRequestsCount(tenantId: string, lastViewed?: Date | null): Promise<number> {
    if (!lastViewed) {
      const result = await db.select({ count: sql<number>`count(*)` })
        .from(accessRequests)
        .where(and(eq(accessRequests.status, 'pending'), eq(accessRequests.tenantId, tenantId)));
      return Number(result[0]?.count ?? 0);
    }
    
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(accessRequests)
      .where(and(
        eq(accessRequests.status, 'pending'),
        eq(accessRequests.tenantId, tenantId),
        gt(accessRequests.requestDate, lastViewed)
      ));
    return Number(result[0]?.count ?? 0);
  }

  async getAllNewItemsCounts(userId: string, tenantId: string): Promise<{ shop: number; events: number; announcements: number; imamQuestions: number; tasks: number; accessRequests: number }> {
    try {
      const user = await this.getUser(userId, tenantId);
      const lastViewedTasks = user?.lastViewedTasks || null;
      
      const [shop, events, announcements, imamQuestions, tasks, accessRequests] = await Promise.all([
        this.getNewItemsCount(userId, tenantId, 'shop').catch(err => { console.error('Error getting shop count:', err); return 0; }),
        this.getNewItemsCount(userId, tenantId, 'events').catch(err => { console.error('Error getting events count:', err); return 0; }),
        this.getNewItemsCount(userId, tenantId, 'announcements').catch(err => { console.error('Error getting announcements count:', err); return 0; }),
        this.getNewItemsCount(userId, tenantId, 'imamQuestions').catch(err => { console.error('Error getting imamQuestions count:', err); return 0; }),
        this.getNewItemsCount(userId, tenantId, 'tasks').catch(err => { console.error('Error getting tasks count:', err); return 0; }),
        this.getPendingAccessRequestsCount(tenantId, lastViewedTasks).catch(err => { console.error('Error getting accessRequests count:', err); return 0; })
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

  async getPrayerTimeByDate(date: string, tenantId: string): Promise<PrayerTime | undefined> {
    const result = await db.select().from(prayerTimes).where(and(eq(prayerTimes.date, date), eq(prayerTimes.tenantId, tenantId))).limit(1);
    return result[0];
  }

  async getAllPrayerTimes(tenantId: string): Promise<PrayerTime[]> {
    const allPrayerTimes = await db.select().from(prayerTimes).where(eq(prayerTimes.tenantId, tenantId));
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
      const existing = await this.getPrayerTimeByDate(pt.date, pt.tenantId);
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

  async createImportantDate(importantDate: InsertImportantDate & { tenantId: string }): Promise<ImportantDate> {
    const [date] = await db.insert(importantDates).values({...importantDate, tenantId: importantDate.tenantId}).returning();
    return date;
  }

  // Production DB compatibility: handles 'title' column that exists in prod but not in schema
  async createImportantDateWithTitle(data: { tenantId: string; name?: string; title?: string; date: string; isRecurring?: boolean }): Promise<ImportantDate> {
    const titleValue = data.name || data.title || '';
    const nameValue = data.name || data.title || '';
    
    // Use raw SQL to insert with both 'name' AND 'title' columns for production compatibility
    const result = await db.execute(sql`
      INSERT INTO important_dates (tenant_id, name, title, date, is_recurring, created_at)
      VALUES (${data.tenantId}, ${nameValue}, ${titleValue}, ${data.date}, ${data.isRecurring ?? true}, now())
      RETURNING *
    `);
    
    const row = result.rows[0] as any;
    return {
      id: row.id,
      tenantId: row.tenant_id,
      name: row.name || row.title,
      date: row.date,
      isRecurring: row.is_recurring,
      createdAt: row.created_at,
    };
  }

  async getImportantDate(id: string, tenantId: string): Promise<ImportantDate | undefined> {
    const result = await db.select().from(importantDates).where(and(eq(importantDates.id, id), eq(importantDates.tenantId, tenantId))).limit(1);
    return result[0];
  }

  async getAllImportantDates(tenantId: string): Promise<ImportantDate[]> {
    const dates = await db.select().from(importantDates).where(eq(importantDates.tenantId, tenantId)).orderBy(asc(importantDates.date));
    return dates;
  }

  async updateImportantDate(id: string, tenantId: string, updates: Partial<InsertImportantDate>): Promise<ImportantDate | undefined> {
    const [date] = await db.update(importantDates).set(updates).where(and(eq(importantDates.id, id), eq(importantDates.tenantId, tenantId))).returning();
    return date;
  }

  async deleteImportantDate(id: string, tenantId: string): Promise<boolean> {
    const result = await db.delete(importantDates).where(and(eq(importantDates.id, id), eq(importantDates.tenantId, tenantId))).returning();
    return result.length > 0;
  }

  // Financial Contributions (Feature 1)
  async createFinancialContribution(contribution: InsertFinancialContribution): Promise<FinancialContribution> {
    const [contrib] = await db.insert(financialContributions).values(contribution).returning();
    
    // NOTE: Project amount is updated in routes.ts to avoid duplicate addition
    
    // Recalculate user points (tenantId from contribution)
    const tenantId = contribution.tenantId;
    if (tenantId) {
      await this.recalculateUserPoints(contrib.userId, tenantId);
      await this.checkAndAwardBadges(contrib.userId, tenantId);
    }
    
    return contrib;
  }

  async getFinancialContribution(id: string, tenantId: string): Promise<FinancialContribution | undefined> {
    const result = await db.select().from(financialContributions).where(and(eq(financialContributions.id, id), eq(financialContributions.tenantId, tenantId))).limit(1);
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

  async updateFinancialContribution(id: string, tenantId: string, updates: Partial<InsertFinancialContribution>): Promise<FinancialContribution | undefined> {
    const [contrib] = await db.update(financialContributions).set(updates).where(and(eq(financialContributions.id, id), eq(financialContributions.tenantId, tenantId))).returning();
    return contrib;
  }

  async deleteFinancialContribution(id: string, tenantId: string): Promise<boolean> {
    const result = await db.delete(financialContributions).where(and(eq(financialContributions.id, id), eq(financialContributions.tenantId, tenantId))).returning();
    return result.length > 0;
  }

  async deleteContributionWithLogs(contributionId: string, tenantId: string): Promise<{ userId: string; projectId: string | null }> {
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
      
      // Delete all related activity logs (contribution_made, project_contribution)
      await tx.delete(activityLog).where(
        and(
          eq(activityLog.relatedEntityId, contributionId),
          inArray(activityLog.activityType, ['contribution_made', 'project_contribution'])
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

  async getUserTotalDonations(userId: string, tenantId: string): Promise<number> {
    const contributions = await this.getUserFinancialContributions(userId, tenantId);
    return contributions.reduce((sum, c) => sum + parseFloat(c.amount || '0'), 0);
  }

  // Contribution Purposes (Feature 1)
  async getContributionPurposes(tenantId: string): Promise<ContributionPurpose[]> {
    return await db.select().from(contributionPurposes).where(eq(contributionPurposes.tenantId, tenantId)).orderBy(asc(contributionPurposes.name));
  }

  async createContributionPurpose(purpose: InsertContributionPurpose & { createdById: string; tenantId: string }): Promise<ContributionPurpose> {
    const [newPurpose] = await db.insert(contributionPurposes).values(purpose).returning();
    return newPurpose;
  }

  async deleteContributionPurpose(id: string, tenantId: string): Promise<boolean> {
    const result = await db.delete(contributionPurposes).where(and(eq(contributionPurposes.id, id), eq(contributionPurposes.tenantId, tenantId))).returning();
    return result.length > 0;
  }

  // Activity Log (Feature 1)
  async createActivityLog(log: InsertActivityLog & { tenantId: string }): Promise<ActivityLog> {
    const [activity] = await db.insert(activityLog).values({...log, tenantId: log.tenantId}).returning();
    
    // Recalculate user points and check for badges
    await this.recalculateUserPoints(activity.userId, log.tenantId);
    await this.checkAndAwardBadges(activity.userId, log.tenantId);
    
    return activity;
  }

  async getUserActivityLog(userId: string, tenantId: string): Promise<ActivityLog[]> {
    return await db.select().from(activityLog)
      .where(and(eq(activityLog.userId, userId), eq(activityLog.tenantId, tenantId)))
      .orderBy(desc(activityLog.createdAt));
  }

  async getAllActivityLogs(tenantId: string): Promise<ActivityLog[]> {
    return await db.select().from(activityLog).where(eq(activityLog.tenantId, tenantId)).orderBy(desc(activityLog.createdAt));
  }

  // Event Attendance (Feature 1)
  async createEventAttendance(attendance: InsertEventAttendance & { tenantId: string }): Promise<EventAttendance> {
    const [attend] = await db.insert(eventAttendance).values({...attendance, tenantId: attendance.tenantId}).returning();
    
    // Get points settings
    const settings = await this.getPointsSettings(attendance.tenantId);
    const points = settings?.pointsPerEvent || 20;
    
    // Log activity
    const event = await this.getEvent(attend.eventId, attendance.tenantId);
    await this.createActivityLog({
      userId: attend.userId,
      activityType: 'event_attendance',
      description: `Prisustvo na događaju: ${event?.name || 'Nepoznat događaj'}`,
      points,
      relatedEntityId: attend.eventId,
      tenantId: attendance.tenantId,
    });
    
    return attend;
  }

  async bulkCreateEventAttendance(attendances: (InsertEventAttendance & { tenantId: string })[]): Promise<EventAttendance[]> {
    const created: EventAttendance[] = [];
    for (const att of attendances) {
      const result = await this.createEventAttendance(att);
      created.push(result);
    }
    return created;
  }

  async getEventAttendance(eventId: string, tenantId: string): Promise<EventAttendance[]> {
    return await db.select().from(eventAttendance).where(and(eq(eventAttendance.eventId, eventId), eq(eventAttendance.tenantId, tenantId)));
  }

  async getUserEventAttendance(userId: string, tenantId: string): Promise<EventAttendance[]> {
    return await db.select().from(eventAttendance).where(and(eq(eventAttendance.userId, userId), eq(eventAttendance.tenantId, tenantId)));
  }

  // Points Settings (Feature 2)
  async getPointsSettings(tenantId: string): Promise<PointsSettings | undefined> {
    const result = await db.select().from(pointsSettings).where(eq(pointsSettings.tenantId, tenantId)).limit(1);
    if (result.length === 0) {
      // Create default settings
      const [settings] = await db.insert(pointsSettings).values({
        pointsPerChf: 1,
        pointsPerTask: 50,
        pointsPerEvent: 20,
        tenantId,
      }).returning();
      return settings;
    }
    return result[0];
  }

  async updatePointsSettings(tenantId: string, settings: Partial<InsertPointsSettings>): Promise<PointsSettings> {
    const existing = await this.getPointsSettings(tenantId);
    if (!existing) {
      const [newSettings] = await db.insert(pointsSettings).values({...settings, tenantId} as InsertPointsSettings).returning();
      return newSettings;
    }
    const [updated] = await db.update(pointsSettings).set(settings).where(and(eq(pointsSettings.id, existing.id), eq(pointsSettings.tenantId, tenantId))).returning();
    return updated;
  }

  // Badges (Feature 2)
  async createBadge(badge: InsertBadge & { tenantId: string }): Promise<Badge> {
    const [b] = await db.insert(badges).values({...badge, tenantId: badge.tenantId}).returning();
    return b;
  }

  async getBadge(id: string, tenantId: string): Promise<Badge | undefined> {
    const result = await db.select().from(badges).where(and(eq(badges.id, id), eq(badges.tenantId, tenantId))).limit(1);
    return result[0];
  }

  async getAllBadges(tenantId: string): Promise<Badge[]> {
    return await db.select().from(badges).where(eq(badges.tenantId, tenantId));
  }

  async updateBadge(id: string, tenantId: string, updates: Partial<InsertBadge>): Promise<Badge | undefined> {
    const [badge] = await db.update(badges).set(updates).where(and(eq(badges.id, id), eq(badges.tenantId, tenantId))).returning();
    return badge;
  }

  async deleteBadge(id: string, tenantId: string): Promise<boolean> {
    const result = await db.delete(badges).where(and(eq(badges.id, id), eq(badges.tenantId, tenantId))).returning();
    return result.length > 0;
  }

  // User Badges (Feature 2)
  async awardBadgeToUser(userId: string, badgeId: string, tenantId: string): Promise<UserBadge> {
    // Check if already awarded
    const existing = await db.select().from(userBadges)
      .where(and(eq(userBadges.userId, userId), eq(userBadges.badgeId, badgeId)))
      .limit(1);
    
    if (existing.length > 0) {
      return existing[0];
    }
    
    const [ub] = await db.insert(userBadges).values({ userId, badgeId, tenantId }).returning();
    
    // Add to activity feed
    const badge = await this.getBadge(badgeId, tenantId);
    const user = await this.getUser(userId, tenantId);
    if (badge && user) {
      const initials = `${user.firstName[0]}. ${user.lastName[0]}.`;
      await this.createActivityFeedItem({
        tenantId,
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

  async getUserBadges(userId: string, tenantId: string): Promise<UserBadge[]> {
    return await db.select().from(userBadges).where(eq(userBadges.userId, userId));
  }

  async getAllUserBadges(tenantId: string): Promise<Array<UserBadge & { user: User; badge: Badge }>> {
    const result = await db.select({
      userBadge: userBadges,
      user: users,
      badge: badges
    })
    .from(userBadges)
    .innerJoin(users, eq(userBadges.userId, users.id))
    .innerJoin(badges, eq(userBadges.badgeId, badges.id))
    .where(eq(badges.tenantId, tenantId))
    .orderBy(desc(userBadges.earnedAt));
    
    return result.map(row => ({
      ...row.userBadge,
      user: row.user,
      badge: row.badge
    }));
  }

  async checkAndAwardBadges(userId: string, tenantId: string): Promise<UserBadge[]> {
    const allBadges = await this.getAllBadges(tenantId);
    const existingBadges = await this.getUserBadges(userId, tenantId);
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
          const total = await this.getUserTotalDonations(userId, tenantId);
          qualifies = total >= badge.criteriaValue;
          break;
        }
        case 'tasks_completed': {
          const count = await this.getUserTasksCompleted(userId, tenantId);
          qualifies = count >= badge.criteriaValue;
          break;
        }
        case 'events_attended': {
          const count = await this.getUserEventsAttended(userId, tenantId);
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
        const ub = await this.awardBadgeToUser(userId, badge.id, tenantId);
        awarded.push(ub);
      }
    }
    
    return awarded;
  }

  async removeUnqualifiedBadges(userId: string, tenantId: string): Promise<string[]> {
    const allBadges = await this.getAllBadges(tenantId);
    const awardedBadges = await this.getUserBadges(userId, tenantId);
    const removedBadgeNames: string[] = [];

    // Check each awarded badge to see if user still qualifies
    for (const userBadge of awardedBadges) {
      const badge = allBadges.find(b => b.id === userBadge.badgeId);
      if (!badge) continue;

      let stillQualifies = false;

      switch (badge.criteriaType) {
        case 'contributions_amount': {
          const total = await this.getUserTotalDonations(userId, tenantId);
          stillQualifies = total >= badge.criteriaValue;
          break;
        }
        case 'tasks_completed': {
          const count = await this.getUserTasksCompleted(userId, tenantId);
          stillQualifies = count >= badge.criteriaValue;
          break;
        }
        case 'events_attended': {
          const count = await this.getUserEventsAttended(userId, tenantId);
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

  async deleteActivityLogByRelatedEntity(relatedEntityId: string, tenantId: string): Promise<number> {
    const result = await db.delete(activityLog).where(and(eq(activityLog.relatedEntityId, relatedEntityId), eq(activityLog.tenantId, tenantId)));
    return result.rowCount || 0;
  }

  async deleteActivityLogByUserAndType(userId: string, activityType: string, relatedEntityId: string, tenantId: string): Promise<number> {
    const result = await db.delete(activityLog).where(
      and(
        eq(activityLog.userId, userId),
        eq(activityLog.activityType, activityType),
        eq(activityLog.relatedEntityId, relatedEntityId),
        eq(activityLog.tenantId, tenantId)
      )
    );
    return result.rowCount || 0;
  }

  // Projects (Feature 4)
  async createProject(project: InsertProject & { createdById: string; tenantId: string }): Promise<Project> {
    const [p] = await db.insert(projects).values({...project, tenantId: project.tenantId}).returning();
    return p;
  }

  async getProject(id: string, tenantId: string): Promise<Project | undefined> {
    const result = await db.select().from(projects).where(and(eq(projects.id, id), eq(projects.tenantId, tenantId))).limit(1);
    return result[0];
  }

  async getAllProjects(tenantId: string): Promise<Project[]> {
    return await db.select().from(projects).where(eq(projects.tenantId, tenantId)).orderBy(desc(projects.createdAt));
  }

  async getActiveProjects(tenantId: string): Promise<Project[]> {
    return await db.select().from(projects).where(and(eq(projects.tenantId, tenantId), eq(projects.status, 'active'))).orderBy(desc(projects.createdAt));
  }

  async updateProject(id: string, tenantId: string, updates: Partial<InsertProject>): Promise<Project | undefined> {
    const oldProject = await this.getProject(id, tenantId);
    const [project] = await db.update(projects).set(updates).where(and(eq(projects.id, id), eq(projects.tenantId, tenantId))).returning();
    
    // Add to activity feed when project is completed
    if (oldProject && oldProject.status !== 'završen' && project.status === 'završen') {
      await this.createActivityFeedItem({
        type: "project_completed",
        title: "Završen projekat",
        description: project.name,
        relatedEntityId: project.id,
        relatedEntityType: "project",
        isClickable: true,
        tenantId: tenantId
      });
    }
    
    return project;
  }

  async deleteProject(id: string, tenantId: string): Promise<boolean> {
    const result = await db.delete(projects).where(and(eq(projects.id, id), eq(projects.tenantId, tenantId))).returning();
    return result.length > 0;
  }

  async updateProjectAmount(projectId: string, tenantId: string, amount: number): Promise<Project | undefined> {
    const project = await this.getProject(projectId, tenantId);
    if (!project) return undefined;
    
    const currentAmount = parseFloat(project.currentAmount || '0');
    const newAmount = currentAmount + amount;
    
    return await this.updateProject(projectId, tenantId, { 
      currentAmount: newAmount.toString() 
    });
  }

  // User Statistics (Feature 2)
  async getUserTasksCompleted(userId: string, tenantId: string): Promise<number> {
    const logs = await db.select({ count: sql<number>`count(*)` })
      .from(activityLog)
      .where(and(
        eq(activityLog.userId, userId),
        eq(activityLog.activityType, 'task_completed'),
        eq(activityLog.tenantId, tenantId)
      ));
    return Number(logs[0]?.count ?? 0);
  }

  async getUserEventsAttended(userId: string, tenantId: string): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(eventAttendance)
      .where(and(eq(eventAttendance.userId, userId), eq(eventAttendance.tenantId, tenantId)));
    return Number(result[0]?.count ?? 0);
  }

  async recalculateUserPoints(userId: string, tenantId: string): Promise<number> {
    // Sum all points from activity_log (centralized points ledger)
    const result = await db.select({ total: sql<number>`COALESCE(SUM(${activityLog.points}), 0)` })
      .from(activityLog)
      .where(and(eq(activityLog.userId, userId), eq(activityLog.tenantId, tenantId)));
    
    const totalPoints = Number(result[0]?.total ?? 0);
    
    await this.updateUser(userId, tenantId, { totalPoints });
    
    // Automatically check and award badges after points update
    await this.checkAndAwardBadges(userId, tenantId);
    
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

  async updateUserPreferences(userId: string, tenantId: string, updates: Partial<InsertUserPreferences>): Promise<UserPreferences | undefined> {
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

  async getProposal(id: string, tenantId: string): Promise<Proposal | undefined> {
    const result = await db.select().from(proposals).where(and(eq(proposals.id, id), eq(proposals.tenantId, tenantId))).limit(1);
    return result[0];
  }

  async getAllProposals(tenantId: string): Promise<Proposal[]> {
    return await db.select().from(proposals).where(eq(proposals.tenantId, tenantId)).orderBy(desc(proposals.createdAt));
  }

  async getProposalsByWorkGroup(workGroupId: string, tenantId: string): Promise<Proposal[]> {
    return await db.select().from(proposals)
      .where(and(eq(proposals.workGroupId, workGroupId), eq(proposals.tenantId, tenantId)))
      .orderBy(desc(proposals.createdAt));
  }

  async getProposalsByStatus(status: string, tenantId: string): Promise<Proposal[]> {
    return await db.select().from(proposals)
      .where(and(eq(proposals.status, status), eq(proposals.tenantId, tenantId)))
      .orderBy(desc(proposals.createdAt));
  }

  async updateProposal(id: string, tenantId: string, updates: Partial<InsertProposal>): Promise<Proposal | undefined> {
    const [p] = await db.update(proposals)
      .set(updates)
      .where(and(eq(proposals.id, id), eq(proposals.tenantId, tenantId)))
      .returning();
    return p;
  }

  async approveProposal(id: string, tenantId: string, reviewedById: string, reviewComment?: string): Promise<Proposal | undefined> {
    const [p] = await db.update(proposals)
      .set({ 
        status: 'approved', 
        reviewedById, 
        reviewComment: reviewComment || null,
        reviewedAt: new Date() 
      })
      .where(and(eq(proposals.id, id), eq(proposals.tenantId, tenantId)))
      .returning();
    return p;
  }

  async rejectProposal(id: string, tenantId: string, reviewedById: string, reviewComment: string): Promise<Proposal | undefined> {
    const [p] = await db.update(proposals)
      .set({ 
        status: 'rejected', 
        reviewedById, 
        reviewComment,
        reviewedAt: new Date() 
      })
      .where(and(eq(proposals.id, id), eq(proposals.tenantId, tenantId)))
      .returning();
    return p;
  }

  // Receipts (Expense Receipts System)
  async createReceipt(receipt: InsertReceipt): Promise<Receipt> {
    const [r] = await db.insert(receipts).values(receipt).returning();
    return r;
  }

  async getReceipt(id: string, tenantId: string): Promise<Receipt | undefined> {
    const result = await db.select().from(receipts).where(and(eq(receipts.id, id), eq(receipts.tenantId, tenantId))).limit(1);
    return result[0];
  }

  async getAllReceipts(tenantId: string): Promise<Receipt[]> {
    return await db.select().from(receipts).where(eq(receipts.tenantId, tenantId)).orderBy(desc(receipts.uploadedAt));
  }

  async getReceiptsByTask(taskId: string, tenantId: string): Promise<Receipt[]> {
    return await db.select().from(receipts)
      .where(and(eq(receipts.taskId, taskId), eq(receipts.tenantId, tenantId)))
      .orderBy(desc(receipts.uploadedAt));
  }

  async getReceiptsByProposal(proposalId: string, tenantId: string): Promise<Receipt[]> {
    return await db.select().from(receipts)
      .where(and(eq(receipts.proposalId, proposalId), eq(receipts.tenantId, tenantId)))
      .orderBy(desc(receipts.uploadedAt));
  }

  async getReceiptsByStatus(status: string, tenantId: string): Promise<Receipt[]> {
    return await db.select().from(receipts)
      .where(and(eq(receipts.status, status), eq(receipts.tenantId, tenantId)))
      .orderBy(desc(receipts.uploadedAt));
  }

  async updateReceipt(id: string, tenantId: string, updates: Partial<InsertReceipt>): Promise<Receipt | undefined> {
    const [r] = await db.update(receipts)
      .set(updates)
      .where(and(eq(receipts.id, id), eq(receipts.tenantId, tenantId)))
      .returning();
    return r;
  }

  async approveReceipt(id: string, tenantId: string, reviewedById: string, reviewComment?: string): Promise<Receipt | undefined> {
    const [r] = await db.update(receipts)
      .set({ 
        status: 'approved', 
        reviewedById, 
        reviewComment: reviewComment || null,
        reviewedAt: new Date() 
      })
      .where(and(eq(receipts.id, id), eq(receipts.tenantId, tenantId)))
      .returning();
    return r;
  }

  async rejectReceipt(id: string, tenantId: string, reviewedById: string, reviewComment: string): Promise<Receipt | undefined> {
    const [r] = await db.update(receipts)
      .set({ 
        status: 'rejected', 
        reviewedById, 
        reviewComment,
        reviewedAt: new Date() 
      })
      .where(and(eq(receipts.id, id), eq(receipts.tenantId, tenantId)))
      .returning();
    return r;
  }

  // Certificate Templates (Zahvalnice)
  async createCertificateTemplate(template: InsertCertificateTemplate, tenantId: string): Promise<CertificateTemplate> {
    const [t] = await db.insert(certificateTemplates).values({ ...template, tenantId }).returning();
    return t;
  }

  async getCertificateTemplate(id: string, tenantId: string): Promise<CertificateTemplate | undefined> {
    const result = await db.select().from(certificateTemplates).where(and(eq(certificateTemplates.id, id), eq(certificateTemplates.tenantId, tenantId))).limit(1);
    return result[0];
  }

  async getAllCertificateTemplates(tenantId: string): Promise<CertificateTemplate[]> {
    return await db.select().from(certificateTemplates).where(eq(certificateTemplates.tenantId, tenantId)).orderBy(desc(certificateTemplates.createdAt));
  }

  async updateCertificateTemplate(id: string, tenantId: string, updates: Partial<InsertCertificateTemplate>): Promise<CertificateTemplate | undefined> {
    const [t] = await db.update(certificateTemplates)
      .set(updates)
      .where(and(eq(certificateTemplates.id, id), eq(certificateTemplates.tenantId, tenantId)))
      .returning();
    return t;
  }

  async deleteCertificateTemplate(id: string, tenantId: string): Promise<boolean> {
    const result = await db.delete(certificateTemplates).where(and(eq(certificateTemplates.id, id), eq(certificateTemplates.tenantId, tenantId))).returning();
    return result.length > 0;
  }

  // User Certificates (Izdati Certifikati)
  async createUserCertificate(certificate: InsertUserCertificate): Promise<UserCertificate> {
    const [c] = await db.insert(userCertificates).values(certificate).returning();
    
    // Add to activity feed
    const user = await this.getUser(certificate.userId, certificate.tenantId);
    if (user) {
      const initials = `${user.firstName[0]}. ${user.lastName[0]}.`;
      await this.createActivityFeedItem({
        type: "certificate_issued",
        title: "Dodjeljena zahvalnica",
        description: initials,
        relatedEntityId: c.id,
        relatedEntityType: "certificate",
        isClickable: false,
        tenantId: certificate.tenantId
      });
    }
    
    return c;
  }

  async getUserCertificate(id: string, tenantId: string): Promise<UserCertificate | undefined> {
    const result = await db.select().from(userCertificates).where(and(eq(userCertificates.id, id), eq(userCertificates.tenantId, tenantId))).limit(1);
    return result[0];
  }

  async getUserCertificates(userId: string, tenantId: string): Promise<UserCertificate[]> {
    return await db.select().from(userCertificates)
      .where(and(eq(userCertificates.userId, userId), eq(userCertificates.tenantId, tenantId)))
      .orderBy(desc(userCertificates.issuedAt));
  }

  async getAllUserCertificates(tenantId: string): Promise<UserCertificate[]> {
    return await db.select().from(userCertificates).where(eq(userCertificates.tenantId, tenantId)).orderBy(desc(userCertificates.issuedAt));
  }

  async getUnviewedCertificatesCount(userId: string, tenantId: string): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(userCertificates)
      .where(and(
        eq(userCertificates.userId, userId),
        eq(userCertificates.viewed, false)
      ));
    return Number(result[0]?.count || 0);
  }

  async markCertificateAsViewed(id: string, tenantId: string): Promise<UserCertificate | undefined> {
    const [c] = await db.update(userCertificates)
      .set({ viewed: true })
      .where(and(eq(userCertificates.id, id), eq(userCertificates.tenantId, tenantId)))
      .returning();
    return c;
  }

  async deleteCertificate(id: string, tenantId: string): Promise<boolean> {
    const result = await db.delete(userCertificates).where(and(eq(userCertificates.id, id), eq(userCertificates.tenantId, tenantId))).returning();
    return result.length > 0;
  }

  // Membership Applications (Pristupnice)
  async createMembershipApplication(application: InsertMembershipApplication): Promise<MembershipApplication> {
    const [app] = await db.insert(membershipApplications).values(application).returning();
    
    await this.createActivity({
      type: "membership_application",
      userId: app.applicantId,
      description: `Nova pristupnica: ${app.firstName} ${app.lastName}`,
      tenantId: application.tenantId
    });
    
    return app;
  }

  async getMembershipApplication(id: string, tenantId: string): Promise<MembershipApplication | undefined> {
    const result = await db.select().from(membershipApplications).where(and(eq(membershipApplications.id, id), eq(membershipApplications.tenantId, tenantId))).limit(1);
    return result[0];
  }

  async getAllMembershipApplications(tenantId: string): Promise<MembershipApplication[]> {
    return await db.select().from(membershipApplications).where(eq(membershipApplications.tenantId, tenantId)).orderBy(desc(membershipApplications.createdAt));
  }

  async updateMembershipApplication(id: string, tenantId: string, updates: Partial<InsertMembershipApplication>): Promise<MembershipApplication | undefined> {
    const [app] = await db.update(membershipApplications)
      .set(updates)
      .where(and(eq(membershipApplications.id, id), eq(membershipApplications.tenantId, tenantId)))
      .returning();
    return app;
  }

  async reviewMembershipApplication(id: string, tenantId: string, status: string, reviewedById: string, reviewNotes?: string): Promise<MembershipApplication | undefined> {
    const [app] = await db.update(membershipApplications)
      .set({ 
        status, 
        reviewedById, 
        reviewNotes: reviewNotes || null,
        reviewedAt: new Date() 
      })
      .where(and(eq(membershipApplications.id, id), eq(membershipApplications.tenantId, tenantId)))
      .returning();
    return app;
  }

  async deleteMembershipApplication(id: string, tenantId: string): Promise<boolean> {
    const result = await db.delete(membershipApplications).where(and(eq(membershipApplications.id, id), eq(membershipApplications.tenantId, tenantId))).returning();
    return result.length > 0;
  }

  // Akika Applications (Prijave akike)
  async createAkikaApplication(application: InsertAkikaApplication): Promise<AkikaApplication> {
    const [app] = await db.insert(akikaApplications).values(application).returning();
    
    await this.createActivity({
      type: "akika_application",
      userId: app.applicantId,
      description: `Nova prijava akike: ${app.childName}`,
      tenantId: application.tenantId
    });
    
    return app;
  }

  async getAkikaApplication(id: string, tenantId: string): Promise<AkikaApplication | undefined> {
    const result = await db.select().from(akikaApplications).where(and(eq(akikaApplications.id, id), eq(akikaApplications.tenantId, tenantId))).limit(1);
    return result[0];
  }

  async getAllAkikaApplications(tenantId: string): Promise<AkikaApplication[]> {
    return await db.select().from(akikaApplications).where(eq(akikaApplications.tenantId, tenantId)).orderBy(desc(akikaApplications.createdAt));
  }

  async updateAkikaApplication(id: string, tenantId: string, updates: Partial<InsertAkikaApplication>): Promise<AkikaApplication | undefined> {
    const [app] = await db.update(akikaApplications)
      .set(updates)
      .where(and(eq(akikaApplications.id, id), eq(akikaApplications.tenantId, tenantId)))
      .returning();
    return app;
  }

  async reviewAkikaApplication(id: string, tenantId: string, status: string, reviewedById: string, reviewNotes?: string): Promise<AkikaApplication | undefined> {
    const [app] = await db.update(akikaApplications)
      .set({ 
        status, 
        isArchived: (status === 'approved' || status === 'rejected'), // Automatically archive after decision
        reviewedById, 
        reviewNotes: reviewNotes || null,
        reviewedAt: new Date() 
      })
      .where(and(eq(akikaApplications.id, id), eq(akikaApplications.tenantId, tenantId)))
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

  async getUserAkikaApplications(userId: string, tenantId: string): Promise<AkikaApplication[]> {
    return await db.select()
      .from(akikaApplications)
      .where(eq(akikaApplications.submittedBy, userId))
      .orderBy(desc(akikaApplications.createdAt));
  }

  async deleteAkikaApplication(id: string, tenantId: string): Promise<boolean> {
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

  async getMarriageApplication(id: string, tenantId: string): Promise<MarriageApplication | undefined> {
    const result = await db.select().from(marriageApplications).where(and(eq(marriageApplications.id, id), eq(marriageApplications.tenantId, tenantId))).limit(1);
    return result[0];
  }

  async getAllMarriageApplications(tenantId: string): Promise<MarriageApplication[]> {
    return await db.select().from(marriageApplications).where(eq(marriageApplications.tenantId, tenantId)).orderBy(desc(marriageApplications.createdAt));
  }

  async updateMarriageApplication(id: string, tenantId: string, updates: Partial<InsertMarriageApplication>): Promise<MarriageApplication | undefined> {
    const [app] = await db.update(marriageApplications)
      .set(updates)
      .where(and(eq(marriageApplications.id, id), eq(marriageApplications.tenantId, tenantId)))
      .returning();
    return app;
  }

  async reviewMarriageApplication(id: string, tenantId: string, status: string, reviewedById: string, reviewNotes?: string): Promise<MarriageApplication | undefined> {
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

  async deleteMarriageApplication(id: string, tenantId: string): Promise<boolean> {
    const result = await db.delete(marriageApplications).where(eq(marriageApplications.id, id)).returning();
    return result.length > 0;
  }

  // Activity Feed
  async getActivityFeed(tenantId: string, limit: number = 50): Promise<ActivityFeedItem[]> {
    // Get base activity feed items
    const items = await db.select()
      .from(activityFeed)
      .where(eq(activityFeed.tenantId, tenantId))
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

    // Batched lookup for event images (photoUrl or first image from description HTML)
    const eventIds = items
      .filter(item => item.relatedEntityType === 'event' && item.relatedEntityId)
      .map(item => item.relatedEntityId!);

    const eventImages = new Map<string, string>();
    if (eventIds.length > 0) {
      const eventRecords = await db.select()
        .from(events)
        .where(inArray(events.id, eventIds));

      for (const event of eventRecords) {
        let imageUrl = event.photoUrl;
        
        // If no photoUrl, try to extract first image from HTML description
        if (!imageUrl && event.description) {
          const imgMatch = event.description.match(/<img[^>]+src=["']([^"']+)["']/i);
          if (imgMatch && imgMatch[1]) {
            imageUrl = imgMatch[1];
          }
        }
        
        if (imageUrl) {
          eventImages.set(event.id, imageUrl);
        }
      }
    }

    // Enrich items with real image URLs
    return items.map(item => {
      let imageUrl: string | null = null;

      // Get real image based on entity type
      if (item.relatedEntityType === 'announcement' && item.relatedEntityId) {
        imageUrl = announcementImages.get(item.relatedEntityId) || null;
      } else if (item.relatedEntityType === 'event' && item.relatedEntityId) {
        imageUrl = eventImages.get(item.relatedEntityId) || null;
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

  // Tenant Management (Super Admin only)
  async getAllTenants(): Promise<Tenant[]> {
    // Exclude the global SuperAdmin tenant from regular tenant lists
    const SUPERADMIN_TENANT_ID = 'tenant-superadmin-global';
    return await db.select().from(tenants)
      .where(sql`${tenants.id} != ${SUPERADMIN_TENANT_ID}`)
      .orderBy(tenants.createdAt);
  }

  async getTenant(id: string): Promise<Tenant | undefined> {
    const result = await db.select().from(tenants).where(eq(tenants.id, id)).limit(1);
    return result[0];
  }

  async getTenantByCode(tenantCode: string): Promise<Tenant | undefined> {
    try {
      const result = await db.select().from(tenants).where(
        sql`UPPER(${tenants.tenantCode}) = UPPER(${tenantCode})`
      ).limit(1);
      return result?.[0];
    } catch (error) {
      console.error('[getTenantByCode] Error:', error);
      return undefined;
    }
  }

  async createTenant(insertTenant: InsertTenant): Promise<Tenant> {
    const [tenant] = await db.insert(tenants).values(insertTenant).returning();
    return tenant;
  }

  async updateTenant(id: string, updates: Partial<InsertTenant>): Promise<Tenant | undefined> {
    const [tenant] = await db.update(tenants)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(tenants.id, id))
      .returning();
    return tenant;
  }

  async updateTenantStatus(id: string, isActive: boolean): Promise<Tenant | undefined> {
    const [tenant] = await db.update(tenants)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(tenants.id, id))
      .returning();
    return tenant;
  }

  async deleteTenant(id: string): Promise<boolean> {
    const result = await db.delete(tenants).where(eq(tenants.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getTenantStats(id: string): Promise<{ userCount: number; storageUsed: number; activeSubscription: boolean } | undefined> {
    // Check if tenant exists
    const tenant = await this.getTenant(id);
    if (!tenant) return undefined;

    // Count users
    const userCountResult = await db.select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(eq(users.tenantId, id));
    const userCount = userCountResult[0]?.count || 0;

    // Calculate storage usage (documents + photos)
    // For now, return a placeholder - you can implement actual storage calculation later
    const storageUsed = 0; // TODO: Calculate actual storage usage

    // Check subscription status
    const activeSubscription = tenant.subscriptionStatus === 'active' || tenant.subscriptionStatus === 'trial';

    return {
      userCount,
      storageUsed,
      activeSubscription
    };
  }

  async getAllSubscriptionPlans() {
    const { subscriptionPlans } = await import("@shared/schema");
    const plans = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.isActive, true));
    return plans;
  }
}

export const storage = new DatabaseStorage();
