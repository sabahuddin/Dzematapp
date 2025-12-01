import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  username: text("username"),
  email: text("email"),
  password: text("password"),
  phone: text("phone"),
  photo: text("photo"), // URL/path to profile photo
  address: text("address"),
  city: text("city"),
  postalCode: text("postal_code"),
  dateOfBirth: text("date_of_birth"),
  occupation: text("occupation"),
  membershipDate: timestamp("membership_date").defaultNow(),
  status: text("status").notNull().default("aktivan"), // aktivan, pasivan, član porodice
  inactiveReason: text("inactive_reason"), // Smrt, Drugi džemat, Isključen, Nepoznato
  categories: text("categories").array(), // Muškarci, Žene, Roditelji, Omladina, custom
  roles: text("roles").array().default(sql`ARRAY['clan']::text[]`), // admin, clan_io, clan, clan_porodice (moderator se dodeljuje u grupi)
  isAdmin: boolean("is_admin").default(false),
  isSuperAdmin: boolean("is_super_admin").default(false), // Global super admin for tenant management
  lastViewedShop: timestamp("last_viewed_shop"),
  lastViewedEvents: timestamp("last_viewed_events"),
  lastViewedAnnouncements: timestamp("last_viewed_announcements"),
  lastViewedImamQuestions: timestamp("last_viewed_imam_questions"),
  lastViewedTasks: timestamp("last_viewed_tasks"),
  skills: text("skills").array(), // Member skills/talents (Feature 3)
  totalPoints: integer("total_points").default(0), // Gamification points (Feature 2)
}, (t) => ({
  usernamePerTenant: unique("users_username_tenant_unique").on(t.username, t.tenantId),
  emailPerTenant: unique("users_email_tenant_unique").on(t.email, t.tenantId),
}));

export const familyRelationships = pgTable("family_relationships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  relatedUserId: varchar("related_user_id").notNull().references(() => users.id),
  relationship: text("relationship").notNull(), // supružnik, dijete, roditelj, brat, sestra, ostalo
  createdAt: timestamp("created_at").defaultNow(),
});

export const announcements = pgTable("announcements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  authorId: varchar("author_id").notNull().references(() => users.id),
  publishDate: timestamp("publish_date").defaultNow(),
  status: text("status").notNull().default("published"), // published, featured, archived
  isFeatured: boolean("is_featured").default(false),
  categories: text("categories").array(), // Džemat, IZBCH, IZ, Ostalo, custom
  photoUrl: text("photo_url"),
});

export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  location: text("location").notNull(),
  dateTime: timestamp("date_time").notNull(),
  photoUrl: text("photo_url"),
  rsvpEnabled: boolean("rsvp_enabled").default(true),
  requireAdultsChildren: boolean("require_adults_children").default(false),
  maxAttendees: integer("max_attendees"),
  reminderTime: text("reminder_time"), // null, "7_days", "24_hours", "2_hours"
  categories: text("categories").array(), // Iftar, Mevlud, Edukacija, Sport, Humanitarno, Omladina, custom
  pointsValue: integer("points_value").default(20), // Variable points for event attendance
  createdById: varchar("created_by_id").references(() => users.id, { onDelete: "setNull" }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const eventRsvps = pgTable("event_rsvps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  eventId: varchar("event_id").notNull().references(() => events.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  adultsCount: integer("adults_count").default(1),
  childrenCount: integer("children_count").default(0),
  rsvpDate: timestamp("rsvp_date").defaultNow(),
});

export const workGroups = pgTable("work_groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  visibility: text("visibility").notNull().default("javna"), // javna, privatna
  archived: boolean("archived").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const workGroupMembers = pgTable("work_group_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  workGroupId: varchar("work_group_id").notNull().references(() => workGroups.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  isModerator: boolean("is_moderator").default(false),
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  descriptionImage: text("description_image"),
  workGroupId: varchar("work_group_id").notNull().references(() => workGroups.id),
  assignedUserIds: text("assigned_user_ids").array(), // Multiple users can be assigned to a task
  status: text("status").notNull().default("u_toku"), // u_toku, na_cekanju, završeno, otkazano, arhiva
  dueDate: timestamp("due_date"),
  estimatedCost: text("estimated_cost"), // Estimated budget/cost in CHF
  pointsValue: integer("points_value").default(50), // Variable points: 10, 20, 30, or custom
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"), // Timestamp when task was completed
});

export const accessRequests = pgTable("access_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  workGroupId: varchar("work_group_id").notNull().references(() => workGroups.id),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  requestDate: timestamp("request_date").defaultNow(),
});

export const taskComments = pgTable("task_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  taskId: varchar("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  commentImage: text("comment_image"),
  createdAt: timestamp("created_at").defaultNow(),
});


export const announcementFiles = pgTable("announcement_files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  announcementId: varchar("announcement_id").notNull().references(() => announcements.id),
  uploadedById: varchar("uploaded_by_id").notNull().references(() => users.id),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(), // image, pdf, document
  fileSize: integer("file_size").notNull(),
  filePath: text("file_path").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

export const activities = pgTable("activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // registration, announcement, event, task
  description: text("description").notNull(),
  userId: varchar("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  senderId: varchar("sender_id").references(() => users.id).notNull(),
  recipientId: varchar("recipient_id").references(() => users.id),
  category: text("category"),
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  threadId: varchar("thread_id"),
  parentMessageId: varchar("parent_message_id").references((): any => messages.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const imamQuestions = pgTable("imam_questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id).notNull(),
  subject: text("subject").notNull(),
  question: text("question").notNull(),
  answer: text("answer"),
  isAnswered: boolean("is_answered").default(false).notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  answeredAt: timestamp("answered_at"),
});

export const organizationSettings = pgTable("organization_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull().default("Islamska Zajednica"),
  address: text("address").notNull().default("Ulica Džemata 123"),
  phone: text("phone").notNull().default("+387 33 123 456"),
  email: text("email").notNull().default("info@dzemat.ba"),
  currency: text("currency").notNull().default("CHF"), // BAM, CHF, EUR, USD
  facebookUrl: text("facebook_url"),
  instagramUrl: text("instagram_url"),
  youtubeUrl: text("youtube_url"),
  twitterUrl: text("twitter_url"),
  livestreamUrl: text("livestream_url"),
  livestreamEnabled: boolean("livestream_enabled").default(false).notNull(),
  livestreamTitle: text("livestream_title"),
  livestreamDescription: text("livestream_description"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(),
  fileSize: integer("file_size").notNull(),
  uploadedById: varchar("uploaded_by_id").notNull().references(() => users.id),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export const requests = pgTable("requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  requestType: text("request_type").notNull(), // wedding, mekteb, facility, akika
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  formData: text("form_data").notNull(), // JSON string with form data
  createdAt: timestamp("created_at").defaultNow().notNull(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedById: varchar("reviewed_by_id").references(() => users.id),
  adminNotes: text("admin_notes"),
});

export const shopProducts = pgTable("shop_products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  photos: text("photos").array(), // array of photo URLs (max 10)
  category: text("category"), // hrana, piće, odjeća
  weight: text("weight"), // For food: kilogram or KG
  volume: text("volume"), // For drinks: litar
  size: text("size"),
  quantity: integer("quantity").default(0),
  color: text("color"),
  notes: text("notes"),
  price: text("price"), // stored as text to support various formats
  createdById: varchar("created_by_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const marketplaceItems = pgTable("marketplace_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  photos: text("photos").array(), // array of photo URLs (max 3)
  type: text("type").notNull(), // sell, gift
  price: text("price"), // price in CHF (only for sale items)
  status: text("status").notNull().default("active"), // active, completed
  userId: varchar("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const productPurchaseRequests = pgTable("product_purchase_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  productId: varchar("product_id").notNull().references(() => shopProducts.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  quantity: integer("quantity").default(1).notNull(),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
}).extend({
  tenantId: z.string(),
  membershipDate: z.union([
    z.date(),
    z.string().transform((str) => new Date(str)),
    z.undefined()
  ]).optional()
});

export const insertAnnouncementSchema = createInsertSchema(announcements).omit({
  id: true,
  publishDate: true,
}).extend({
  tenantId: z.string()
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
}).extend({
  tenantId: z.string(),
  dateTime: z.union([
    z.date(),
    z.string().transform((str) => new Date(str))
  ])
});

export const insertEventRsvpSchema = createInsertSchema(eventRsvps).omit({
  id: true,
  rsvpDate: true,
}).extend({
  tenantId: z.string()
});

export const insertWorkGroupSchema = createInsertSchema(workGroups).omit({
  id: true,
  createdAt: true,
}).extend({
  tenantId: z.string()
});

export const insertWorkGroupMemberSchema = createInsertSchema(workGroupMembers).omit({
  id: true,
  joinedAt: true,
}).extend({
  tenantId: z.string()
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
}).extend({
  tenantId: z.string(),
  dueDate: z.union([
    z.date(),
    z.string().transform((str) => new Date(str)),
    z.null()
  ]).optional()
});

export const insertAccessRequestSchema = createInsertSchema(accessRequests).omit({
  id: true,
  requestDate: true,
}).extend({
  tenantId: z.string()
});

export const insertTaskCommentSchema = createInsertSchema(taskComments).omit({
  id: true,
  createdAt: true,
}).extend({
  tenantId: z.string()
});


export const insertAnnouncementFileSchema = createInsertSchema(announcementFiles).omit({
  id: true,
  uploadedAt: true,
}).extend({
  tenantId: z.string()
});

export const insertFamilyRelationshipSchema = createInsertSchema(familyRelationships).omit({
  id: true,
  createdAt: true,
}).extend({
  tenantId: z.string()
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  isRead: true,
}).extend({
  tenantId: z.string()
});

export const insertImamQuestionSchema = createInsertSchema(imamQuestions).omit({
  id: true,
  createdAt: true,
  isRead: true,
  isAnswered: true,
  answeredAt: true,
  answer: true,
}).extend({
  tenantId: z.string()
});

export const insertOrganizationSettingsSchema = createInsertSchema(organizationSettings).omit({
  id: true,
  updatedAt: true,
}).extend({
  tenantId: z.string()
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  uploadedAt: true,
}).extend({
  tenantId: z.string()
});

export const insertRequestSchema = createInsertSchema(requests).omit({
  id: true,
  createdAt: true,
  reviewedAt: true,
}).extend({
  tenantId: z.string()
});

export const insertShopProductSchema = createInsertSchema(shopProducts).omit({
  id: true,
  createdAt: true,
}).extend({
  tenantId: z.string()
}).superRefine((data, ctx) => {
  // Validate category-specific fields
  if (data.category === 'hrana') {
    if (!data.weight) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Težina je obavezna za kategoriju hrana",
        path: ['weight']
      });
    }
  }
  if (data.category === 'piće') {
    if (!data.volume) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Zapremina je obavezna za kategoriju piće",
        path: ['volume']
      });
    }
  }
});

export const insertMarketplaceItemSchema = createInsertSchema(marketplaceItems).omit({
  id: true,
  createdAt: true,
  userId: true,
}).extend({
  tenantId: z.string(),
  type: z.enum(["sale", "gift"]),
  status: z.enum(["active", "completed"]).default("active")
});

export const insertProductPurchaseRequestSchema = createInsertSchema(productPurchaseRequests).omit({
  id: true,
  createdAt: true,
}).extend({
  tenantId: z.string()
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type EventRsvp = typeof eventRsvps.$inferSelect;
export type InsertEventRsvp = z.infer<typeof insertEventRsvpSchema>;
export type WorkGroup = typeof workGroups.$inferSelect;
export type InsertWorkGroup = z.infer<typeof insertWorkGroupSchema>;
export type WorkGroupMember = typeof workGroupMembers.$inferSelect;
export type InsertWorkGroupMember = z.infer<typeof insertWorkGroupMemberSchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type AccessRequest = typeof accessRequests.$inferSelect;
export type InsertAccessRequest = z.infer<typeof insertAccessRequestSchema>;
export type TaskComment = typeof taskComments.$inferSelect;
export type InsertTaskComment = z.infer<typeof insertTaskCommentSchema>;
export type AnnouncementFile = typeof announcementFiles.$inferSelect;
export type InsertAnnouncementFile = z.infer<typeof insertAnnouncementFileSchema>;
export type FamilyRelationship = typeof familyRelationships.$inferSelect;
export type InsertFamilyRelationship = z.infer<typeof insertFamilyRelationshipSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type ImamQuestion = typeof imamQuestions.$inferSelect;
export type InsertImamQuestion = z.infer<typeof insertImamQuestionSchema>;
export type OrganizationSettings = typeof organizationSettings.$inferSelect;
export type InsertOrganizationSettings = z.infer<typeof insertOrganizationSettingsSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Request = typeof requests.$inferSelect;
export type InsertRequest = z.infer<typeof insertRequestSchema>;
export type ShopProduct = typeof shopProducts.$inferSelect;
export type InsertShopProduct = z.infer<typeof insertShopProductSchema>;
export type MarketplaceItem = typeof marketplaceItems.$inferSelect;
export type InsertMarketplaceItem = z.infer<typeof insertMarketplaceItemSchema>;
export type ProductPurchaseRequest = typeof productPurchaseRequests.$inferSelect;
export type InsertProductPurchaseRequest = z.infer<typeof insertProductPurchaseRequestSchema>;

// API response types for files with user details
export type AnnouncementFileWithUser = AnnouncementFile & {
  uploadedBy: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
};

export type Activity = typeof activities.$inferSelect;

export type ShopProductWithCreator = ShopProduct & {
  creator: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
};

export type MarketplaceItemWithUser = MarketplaceItem & {
  user: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
};

export type ServiceWithUser = Service & {
  user: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
};

export type ProductPurchaseRequestWithDetails = ProductPurchaseRequest & {
  product: ShopProduct | null;
  user: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
};

export type EventRsvpWithUser = EventRsvp & {
  user: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
};

export type EventRsvpStats = {
  rsvps: EventRsvpWithUser[];
  totalAdults: number;
  totalChildren: number;
  totalAttendees: number;
};

export const prayerTimes = pgTable("prayer_times", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  date: text("date").notNull().unique(), // dd.mm.yyyy
  hijriDate: text("hijri_date"),
  fajr: text("fajr").notNull(),
  sunrise: text("sunrise"),
  dhuhr: text("dhuhr").notNull(),
  asr: text("asr").notNull(),
  maghrib: text("maghrib").notNull(),
  isha: text("isha").notNull(),
  events: text("events"),
});

export const importantDates = pgTable("important_dates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // e.g. "Ramazanski Bajram", "Nova godina"
  date: text("date").notNull(), // dd.mm format (without year, since it repeats)
  isRecurring: boolean("is_recurring").default(true).notNull(), // true if repeats yearly
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Feature 1: Contribution Tracking System
export const contributionPurposes = pgTable("contribution_purposes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // Članarina, Donacija, Vakuf, etc.
  description: text("description"),
  isDefault: boolean("is_default").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdById: varchar("created_by_id").references(() => users.id), // Admin who created it
});

export const financialContributions = pgTable("financial_contributions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  amount: text("amount").notNull(), // decimal as text, in CHF
  paymentDate: timestamp("payment_date").notNull(),
  purpose: text("purpose").notNull(), // Reference to contribution purpose name
  paymentMethod: text("payment_method").notNull(), // Gotovina, Banka
  notes: text("notes"),
  projectId: varchar("project_id").references((): any => projects.id), // Optional link to project (Feature 4)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdById: varchar("created_by_id").references(() => users.id), // Admin who logged it
});

export const activityLog = pgTable("activity_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  activityType: text("activity_type").notNull(), // task_completed, event_attendance
  description: text("description").notNull(),
  points: integer("points").default(0), // Points earned for this activity
  relatedEntityId: varchar("related_entity_id"), // taskId or eventId
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const eventAttendance = pgTable("event_attendance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  eventId: varchar("event_id").notNull().references(() => events.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  attended: boolean("attended").default(true).notNull(),
  recordedById: varchar("recorded_by_id").notNull().references(() => users.id), // Admin who confirmed
  recordedAt: timestamp("recorded_at").defaultNow().notNull(),
});

// Feature 2: Gamification System
export const pointsSettings = pgTable("points_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  pointsPerChf: integer("points_per_chf").default(1).notNull(), // Points per CHF donated
  pointsPerTask: integer("points_per_task").default(50).notNull(), // Points per completed task
  pointsPerEvent: integer("points_per_event").default(20).notNull(), // Points per event attendance
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const badges = pgTable("badges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon"), // Icon name or URL
  criteriaType: text("criteria_type").notNull(), // donation_total, tasks_completed, events_attended, points_total
  criteriaValue: integer("criteria_value").notNull(), // Threshold value
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userBadges = pgTable("user_badges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  badgeId: varchar("badge_id").notNull().references(() => badges.id),
  earnedAt: timestamp("earned_at").defaultNow().notNull(),
});

// Feature 4: Projects Module
export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").notNull(),
  goalAmount: text("goal_amount").notNull(), // decimal as text, in CHF
  currentAmount: text("current_amount").default("0").notNull(), // decimal as text, in CHF
  status: text("status").notNull().default("active"), // active, completed
  createdById: varchar("created_by_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const userPreferences = pgTable("user_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique().references(() => users.id),
  quickAccessShortcuts: text("quick_access_shortcuts").array().default(sql`ARRAY[]::text[]`), // Array of route paths like ['/announcements', '/events', '/tasks']
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Moderator Proposals System
export const proposals = pgTable("proposals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  workGroupId: varchar("work_group_id").notNull().references(() => workGroups.id),
  createdById: varchar("created_by_id").notNull().references(() => users.id), // Moderator
  who: text("who"), // Who will do it (optional)
  what: text("what").notNull(), // What will be done (required)
  where: text("where"), // Where it will happen (optional)
  when: text("when"), // When it will happen (optional)
  how: text("how"), // How it will be done (optional)
  why: text("why"), // Why it's needed (optional)
  budget: text("budget"), // Estimated budget in CHF (optional)
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  reviewedById: varchar("reviewed_by_id").references(() => users.id), // IO member who reviewed
  reviewComment: text("review_comment"), // Comment from reviewer
  createdAt: timestamp("created_at").defaultNow().notNull(),
  reviewedAt: timestamp("reviewed_at"),
});

// Expense Receipts System
export const receipts = pgTable("receipts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  taskId: varchar("task_id").references(() => tasks.id), // Related task
  proposalId: varchar("proposal_id").references(() => proposals.id), // Related proposal
  uploadedById: varchar("uploaded_by_id").notNull().references(() => users.id), // Member who uploads
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(), // Path/URL to uploaded receipt image/PDF
  amount: text("amount").notNull(), // Actual amount spent in CHF
  description: text("description"), // Optional description
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  reviewedById: varchar("reviewed_by_id").references(() => users.id), // Blagajnik/admin who reviews
  reviewComment: text("review_comment"), // Comment from reviewer
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  reviewedAt: timestamp("reviewed_at"),
});

export const insertPrayerTimeSchema = createInsertSchema(prayerTimes).omit({
  id: true,
}).extend({
  tenantId: z.string()
});

export const insertImportantDateSchema = createInsertSchema(importantDates).omit({
  id: true,
  createdAt: true,
}).extend({
  tenantId: z.string()
});

export type PrayerTime = typeof prayerTimes.$inferSelect;
export type InsertPrayerTime = z.infer<typeof insertPrayerTimeSchema>;
export type ImportantDate = typeof importantDates.$inferSelect;
export type InsertImportantDate = z.infer<typeof insertImportantDateSchema>;

// Feature 1: Contribution Tracking System
export const insertContributionPurposeSchema = createInsertSchema(contributionPurposes).omit({
  id: true,
  createdAt: true,
  createdById: true,
}).extend({
  tenantId: z.string()
});

export const insertFinancialContributionSchema = createInsertSchema(financialContributions).omit({
  id: true,
  createdAt: true,
}).extend({
  tenantId: z.string(),
  paymentDate: z.union([
    z.date(),
    z.string().transform((str) => new Date(str))
  ])
});

export const insertActivityLogSchema = createInsertSchema(activityLog).omit({
  id: true,
  createdAt: true,
}).extend({
  tenantId: z.string()
});

export const insertEventAttendanceSchema = createInsertSchema(eventAttendance).omit({
  id: true,
  recordedAt: true,
}).extend({
  tenantId: z.string()
});

// Feature 2: Gamification System
export const insertPointsSettingsSchema = createInsertSchema(pointsSettings).omit({
  id: true,
  updatedAt: true,
}).extend({
  tenantId: z.string()
});

export const insertBadgeSchema = createInsertSchema(badges).omit({
  id: true,
  createdAt: true,
}).extend({
  tenantId: z.string()
});

export const insertUserBadgeSchema = createInsertSchema(userBadges).omit({
  id: true,
  earnedAt: true,
}).extend({
  tenantId: z.string()
});

// Feature 4: Projects Module
export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  completedAt: true,
  createdById: true,
}).extend({
  tenantId: z.string()
});

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({
  id: true,
  updatedAt: true,
}).extend({
  tenantId: z.string().optional()
});

// Moderator Proposals System
export const insertProposalSchema = createInsertSchema(proposals).omit({
  id: true,
  createdAt: true,
  reviewedAt: true,
}).extend({
  tenantId: z.string()
});

// Expense Receipts System
export const insertReceiptSchema = createInsertSchema(receipts).omit({
  id: true,
  uploadedAt: true,
  reviewedAt: true,
}).extend({
  tenantId: z.string()
});

// Types
export type Proposal = typeof proposals.$inferSelect;
export type InsertProposal = z.infer<typeof insertProposalSchema>;
export type Receipt = typeof receipts.$inferSelect;
export type InsertReceipt = z.infer<typeof insertReceiptSchema>;
export type ContributionPurpose = typeof contributionPurposes.$inferSelect;
export type InsertContributionPurpose = z.infer<typeof insertContributionPurposeSchema>;
export type FinancialContribution = typeof financialContributions.$inferSelect;
export type InsertFinancialContribution = z.infer<typeof insertFinancialContributionSchema>;
export type ActivityLog = typeof activityLog.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type EventAttendance = typeof eventAttendance.$inferSelect;
export type InsertEventAttendance = z.infer<typeof insertEventAttendanceSchema>;
export type PointsSettings = typeof pointsSettings.$inferSelect;
export type InsertPointsSettings = z.infer<typeof insertPointsSettingsSchema>;
export type Badge = typeof badges.$inferSelect;
export type InsertBadge = z.infer<typeof insertBadgeSchema>;
export type UserBadge = typeof userBadges.$inferSelect;
export type InsertUserBadge = z.infer<typeof insertUserBadgeSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;

// API response types
export type FinancialContributionWithUser = FinancialContribution & {
  user: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  project: {
    id: string;
    name: string;
  } | null;
};

export type ActivityLogWithUser = ActivityLog & {
  user: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
};

export type UserBadgeWithBadge = UserBadge & {
  badge: Badge | null;
};

export type ProjectWithCreator = Project & {
  creator: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
};

// Certificate Templates (Zahvalnice Templates)
export const certificateTemplates = pgTable("certificate_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // Naziv template-a (npr. "Zahvala za doprinos", "Priznanje za volontiranje")
  description: text("description"),
  templateImagePath: text("template_image_path").notNull(), // Path do PNG slike
  textPositionX: integer("text_position_x").default(400), // X koordinata gdje će se dodati ime
  textPositionY: integer("text_position_y").default(300), // Y koordinata gdje će se dodati ime
  fontSize: integer("font_size").default(48),
  fontColor: text("font_color").default("#000000"),
  fontFamily: text("font_family").default("Arial"),
  textAlign: text("text_align", { enum: ['left', 'center', 'right'] }).default("center"),
  createdById: varchar("created_by_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// User Certificates (Izdati Certifikati)
export const userCertificates = pgTable("user_certificates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  templateId: varchar("template_id").notNull().references(() => certificateTemplates.id),
  recipientName: text("recipient_name").notNull(), // Ime korisnika na certifikatu
  certificateImagePath: text("certificate_image_path").notNull(), // Path do generisane slike sa imenom
  message: text("message"), // Optional custom message for the certificate
  issuedById: varchar("issued_by_id").notNull().references(() => users.id),
  issuedAt: timestamp("issued_at").defaultNow(),
  viewed: boolean("viewed").default(false), // Da li je korisnik vidio certifikat
});

export const insertCertificateTemplateSchema = createInsertSchema(certificateTemplates).omit({ id: true, createdAt: true }).extend({ tenantId: z.string() });
export const insertUserCertificateSchema = createInsertSchema(userCertificates).omit({ id: true, issuedAt: true }).extend({ tenantId: z.string() });

export type CertificateTemplate = typeof certificateTemplates.$inferSelect;
export type InsertCertificateTemplate = z.infer<typeof insertCertificateTemplateSchema>;
export type UserCertificate = typeof userCertificates.$inferSelect;
export type InsertUserCertificate = z.infer<typeof insertUserCertificateSchema>;

export type UserCertificateWithTemplate = UserCertificate & {
  template: CertificateTemplate | null;
  issuedBy: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
};

// Membership Applications (Pristupnice)
export const membershipApplications = pgTable("membership_applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  // Lični podaci
  lastName: text("last_name").notNull(),
  firstName: text("first_name").notNull(),
  gender: text("gender").notNull(), // M, Ž
  photo: text("photo"), // Profile photo path
  dateOfBirth: text("date_of_birth").notNull(),
  placeOfBirth: text("place_of_birth").notNull(),
  country: text("country").notNull(),
  email: text("email"),
  phone: text("phone").notNull(),
  streetAddress: text("street_address").notNull(),
  postalCode: text("postal_code").notNull(),
  city: text("city").notNull(),
  employmentStatus: text("employment_status").notNull(), // Zaposlen/a, Nezaposlen/a, Penzioner/Renta/Socijala, Učenik/Student
  occupation: text("occupation"),
  skillsHobbies: text("skills_hobbies"), // Hobi, vještina, znanje koje može pomoći džematu
  
  // Informacije o porodici
  maritalStatus: text("marital_status").notNull(), // Neoženjen/Neuddata, Oženjen/Udata, Razveden/a, Hudovac/a
  spouseName: text("spouse_name"),
  spousePhone: text("spouse_phone"),
  childrenInfo: text("children_info"), // Imena djece sa datumom rođenja
  
  // Informacije o članarini
  monthlyFee: integer("monthly_fee").notNull(), // 30, 35, 40, 50, 100
  invoiceDelivery: text("invoice_delivery").notNull(), // Poštom, E-mailom
  membershipStartDate: text("membership_start_date").notNull(),
  
  // Status i metadata
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  reviewedById: varchar("reviewed_by_id").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMembershipApplicationSchema = createInsertSchema(membershipApplications).omit({
  id: true,
  createdAt: true,
  reviewedAt: true,
}).extend({
  tenantId: z.string()
});

export type MembershipApplication = typeof membershipApplications.$inferSelect;
export type InsertMembershipApplication = z.infer<typeof insertMembershipApplicationSchema>;

// Prijave Akike
export const akikaApplications = pgTable("akika_applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  // Da li je član džemata
  isMember: boolean("is_member").notNull().default(true),
  
  // Podaci o roditeljima
  fatherName: text("father_name").notNull(),
  motherName: text("mother_name").notNull(),
  
  // Podaci o djetetu
  childName: text("child_name").notNull(),
  childGender: text("child_gender").notNull(), // muško, žensko
  childDateOfBirth: text("child_date_of_birth").notNull(),
  childPlaceOfBirth: text("child_place_of_birth").notNull(),
  
  // Podaci o željenom mjestu i terminu akike
  location: text("location").notNull(), // Islamski centar GAM, Druga adresa
  organizeCatering: boolean("organize_catering").default(false),
  
  // Dodatna adresa ako nije IC GAM
  customAddress: text("custom_address"),
  customCity: text("custom_city"),
  customCanton: text("custom_canton"),
  customPostalCode: text("custom_postal_code"),
  
  phone: text("phone").notNull(),
  email: text("email"),
  notes: text("notes"),
  
  // Status i metadata
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  isArchived: boolean("is_archived").notNull().default(false),
  submittedBy: varchar("submitted_by").references(() => users.id), // null for guest applications
  reviewedById: varchar("reviewed_by_id").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAkikaApplicationSchema = createInsertSchema(akikaApplications).omit({
  id: true,
  createdAt: true,
  reviewedAt: true,
}).extend({
  tenantId: z.string()
});

export type AkikaApplication = typeof akikaApplications.$inferSelect;
export type InsertAkikaApplication = z.infer<typeof insertAkikaApplicationSchema>;

// Prijave šerijatskog vjenčanja
export const marriageApplications = pgTable("marriage_applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  
  // Podaci o mladoženji
  groomLastName: text("groom_last_name").notNull(),
  groomFirstName: text("groom_first_name").notNull(),
  groomDateOfBirth: text("groom_date_of_birth").notNull(),
  groomPlaceOfBirth: text("groom_place_of_birth").notNull(),
  groomNationality: text("groom_nationality").notNull(),
  groomStreetAddress: text("groom_street_address").notNull(),
  groomPostalCode: text("groom_postal_code").notNull(),
  groomCity: text("groom_city").notNull(),
  groomFatherName: text("groom_father_name").notNull(),
  groomMotherName: text("groom_mother_name").notNull(),
  
  // Podaci o mladi
  brideLastName: text("bride_last_name").notNull(),
  brideFirstName: text("bride_first_name").notNull(),
  brideDateOfBirth: text("bride_date_of_birth").notNull(),
  bridePlaceOfBirth: text("bride_place_of_birth").notNull(),
  brideNationality: text("bride_nationality").notNull(),
  brideStreetAddress: text("bride_street_address").notNull(),
  bridePostalCode: text("bride_postal_code").notNull(),
  brideCity: text("bride_city").notNull(),
  brideFatherName: text("bride_father_name").notNull(),
  brideMotherName: text("bride_mother_name").notNull(),
  
  // Podaci o vjenčanju
  selectedLastName: text("selected_last_name").notNull(),
  mahr: text("mahr").notNull(), // Mehr
  civilMarriageDate: text("civil_marriage_date").notNull(),
  civilMarriageLocation: text("civil_marriage_location").notNull(),
  
  // Svjedoci
  witness1Name: text("witness1_name").notNull(),
  witness2Name: text("witness2_name").notNull(),
  witness3Name: text("witness3_name"),
  witness4Name: text("witness4_name"),
  
  // Datum i vrijeme šerijatskog vjenčanja
  proposedDateTime: text("proposed_date_time").notNull(),
  location: text("location").notNull(), // Islamski centar GAM, Drugo mjesto
  
  // Dodatna adresa ako nije IC GAM
  customAddress: text("custom_address"),
  customCity: text("custom_city"),
  customCanton: text("custom_canton"),
  customPostalCode: text("custom_postal_code"),
  
  phone: text("phone").notNull(),
  civilMarriageProof: text("civil_marriage_proof"), // URL/path to uploaded document
  notes: text("notes"),
  
  // Status i metadata
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  reviewedById: varchar("reviewed_by_id").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMarriageApplicationSchema = createInsertSchema(marriageApplications).omit({
  id: true,
  createdAt: true,
  reviewedAt: true,
}).extend({
  tenantId: z.string()
});

export type MarriageApplication = typeof marriageApplications.$inferSelect;
export type InsertMarriageApplication = z.infer<typeof insertMarriageApplicationSchema>;

// Activity Feed - prikazuje sve što se dešava u džematu
export const activityFeed = pgTable("activity_feed", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  
  type: text("type").notNull(), // new_member, project_completed, shop_item, badge_awarded, certificate_issued, announcement, event, important_date_reminder
  title: text("title").notNull(),
  description: text("description"),
  
  // Povezani entitet (ako postoji)
  relatedEntityId: varchar("related_entity_id"),
  relatedEntityType: text("related_entity_type"), // announcement, event, project, user, shop_item, badge, certificate, media
  
  // Metadata (dodatne informacije u JSON formatu)
  metadata: text("metadata"), // JSON string sa dodatnim podacima
  
  // Klikabilnost
  isClickable: boolean("is_clickable").notNull().default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertActivityFeedSchema = createInsertSchema(activityFeed).omit({
  id: true,
  createdAt: true,
}).extend({
  tenantId: z.string()
});

export type ActivityFeedItem = typeof activityFeed.$inferSelect;
export type InsertActivityFeedItem = z.infer<typeof insertActivityFeedSchema>;

// Services (Usluge) - dodatne usluge koje članovi nude
export const services = pgTable("services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").notNull(),
  photos: text("photos").array(), // array of photo URLs (max 3)
  price: text("price"), // Optional - može biti besplatno
  duration: text("duration"), // "1 sat", "30 min", etc.
  category: text("category"), // "Porodica", "Obrazovanje", "Zdravlje", etc.
  status: text("status").notNull().default("active"), // active, completed
  userId: varchar("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
  userId: true,
  createdAt: true,
}).extend({
  tenantId: z.string()
});

export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;

// ========================================
// MULTI-TENANT ARCHITECTURE
// ========================================

// Tenants - Organizations/Džemati
export const tenants = pgTable("tenants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // Naziv džemata (e.g. "IZ Zürich")
  slug: text("slug").notNull().unique(), // URL-friendly identifier (e.g. "iz-zurich")
  tenantCode: text("tenant_code").notNull().unique(), // Unique code for tenant login (e.g. "DEMO2024", "IZBERN2024")
  subdomain: text("subdomain").unique(), // For subdomain routing (e.g. "zurich.dzemat-app.com")
  
  // Contact & Location
  email: text("email").notNull(),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  country: text("country").notNull().default("Switzerland"), // For GDPR data residency
  
  // Subscription & Billing
  subscriptionTier: text("subscription_tier").notNull().default("basic"), // basic, standard, full
  subscriptionStatus: text("subscription_status").notNull().default("trial"), // trial, active, suspended, cancelled
  trialEndsAt: timestamp("trial_ends_at"),
  subscriptionStartedAt: timestamp("subscription_started_at"),
  
  // Stripe Integration
  stripeCustomerId: text("stripe_customer_id").unique(),
  stripeSubscriptionId: text("stripe_subscription_id").unique(),
  
  // Settings
  isActive: boolean("is_active").default(true).notNull(),
  locale: text("locale").default("bs").notNull(), // Default language
  currency: text("currency").default("CHF").notNull(),
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Subscription Plans - Definicije paketa
export const subscriptionPlans = pgTable("subscription_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // "Basic", "Standard", "Full"
  slug: text("slug").notNull().unique(), // "basic", "standard", "full"
  description: text("description"),
  
  // Pricing
  priceMonthly: text("price_monthly").notNull(), // "29.00", "79.00", "149.00"
  priceYearly: text("price_yearly"), // Optional yearly pricing
  currency: text("currency").default("EUR").notNull(),
  
  // Stripe Product IDs
  stripePriceIdMonthly: text("stripe_price_id_monthly"),
  stripePriceIdYearly: text("stripe_price_id_yearly"),
  stripeProductId: text("stripe_product_id"),
  
  // Module Access (JSON array of enabled module IDs)
  enabledModules: text("enabled_modules").array(), // ["dashboard", "announcements", "events", ...]
  readOnlyModules: text("read_only_modules").array(), // Modules shown as read-only preview
  
  // Limits
  maxUsers: integer("max_users"), // null = unlimited
  maxStorage: integer("max_storage"), // in MB
  
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Tenant Features - Per-tenant module overrides
export const tenantFeatures = pgTable("tenant_features", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  moduleId: text("module_id").notNull(), // "shop", "finances", "tasks", etc.
  
  isEnabled: boolean("is_enabled").default(true).notNull(),
  isReadOnly: boolean("is_read_only").default(false).notNull(), // Show as preview with upgrade CTA
  
  // Custom module settings (JSON)
  settings: text("settings"), // Module-specific configuration
  
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Audit Logs - GDPR Compliance & Security
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Tenant & User Context
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id),
  
  // Action Details
  action: text("action").notNull(), // "create", "read", "update", "delete", "export", "login"
  resourceType: text("resource_type").notNull(), // "user", "announcement", "event", "tenant_data"
  resourceId: varchar("resource_id"),
  
  // Change Tracking
  dataBefore: text("data_before"), // JSON snapshot before change
  dataAfter: text("data_after"), // JSON snapshot after change
  
  // Request Metadata
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  
  // Description
  description: text("description"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert Schemas
export const insertTenantSchema = createInsertSchema(tenants).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({
  id: true,
  createdAt: true,
});

export const insertTenantFeatureSchema = createInsertSchema(tenantFeatures).omit({
  id: true,
  updatedAt: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

// Types
export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = z.infer<typeof insertTenantSchema>;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;
export type TenantFeature = typeof tenantFeatures.$inferSelect;
export type InsertTenantFeature = z.infer<typeof insertTenantFeatureSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
