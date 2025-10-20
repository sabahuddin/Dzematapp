import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  username: text("username").notNull().unique(),
  email: text("email").unique(),
  password: text("password").notNull(),
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
});

export const familyRelationships = pgTable("family_relationships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  relatedUserId: varchar("related_user_id").notNull().references(() => users.id),
  relationship: text("relationship").notNull(), // supružnik, dijete, roditelj, brat, sestra, ostalo
  createdAt: timestamp("created_at").defaultNow(),
});

export const announcements = pgTable("announcements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  authorId: varchar("author_id").notNull().references(() => users.id),
  publishDate: timestamp("publish_date").defaultNow(),
  status: text("status").notNull().default("published"), // published, featured, archived
  isFeatured: boolean("is_featured").default(false),
  categories: text("categories").array(), // Džemat, IZBCH, IZ, Ostalo, custom
});

export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  location: text("location").notNull(),
  dateTime: timestamp("date_time").notNull(),
  rsvpEnabled: boolean("rsvp_enabled").default(true),
  requireAdultsChildren: boolean("require_adults_children").default(false),
  maxAttendees: integer("max_attendees"),
  reminderTime: text("reminder_time"), // null, "7_days", "24_hours", "2_hours"
  categories: text("categories").array(), // Iftar, Mevlud, Edukacija, Sport, Humanitarno, Omladina, custom
  createdById: varchar("created_by_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const eventRsvps = pgTable("event_rsvps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  adultsCount: integer("adults_count").default(1),
  childrenCount: integer("children_count").default(0),
  rsvpDate: timestamp("rsvp_date").defaultNow(),
});

export const workGroups = pgTable("work_groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const workGroupMembers = pgTable("work_group_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workGroupId: varchar("work_group_id").notNull().references(() => workGroups.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  isModerator: boolean("is_moderator").default(false),
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  descriptionImage: text("description_image"),
  workGroupId: varchar("work_group_id").notNull().references(() => workGroups.id),
  assignedToId: varchar("assigned_to_id").references(() => users.id),
  status: text("status").notNull().default("u_toku"), // u_toku, na_cekanju, završeno, otkazano, arhiva
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const accessRequests = pgTable("access_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  workGroupId: varchar("work_group_id").notNull().references(() => workGroups.id),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  requestDate: timestamp("request_date").defaultNow(),
});

export const taskComments = pgTable("task_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").notNull().references(() => tasks.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  commentImage: text("comment_image"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const groupFiles = pgTable("group_files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workGroupId: varchar("work_group_id").notNull().references(() => workGroups.id),
  uploadedById: varchar("uploaded_by_id").notNull().references(() => users.id),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(), // image, pdf, document
  fileSize: integer("file_size").notNull(),
  filePath: text("file_path").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

export const announcementFiles = pgTable("announcement_files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
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
  type: text("type").notNull(), // registration, announcement, event, task
  description: text("description").notNull(),
  userId: varchar("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
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

export const organizationSettings = pgTable("organization_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().default("Islamska Zajednica"),
  address: text("address").notNull().default("Ulica Džemata 123"),
  phone: text("phone").notNull().default("+387 33 123 456"),
  email: text("email").notNull().default("info@dzemat.ba"),
  facebookUrl: text("facebook_url"),
  instagramUrl: text("instagram_url"),
  youtubeUrl: text("youtube_url"),
  twitterUrl: text("twitter_url"),
  livestreamUrl: text("livestream_url"),
  livestreamEnabled: boolean("livestream_enabled").default(false).notNull(),
  livestreamTitle: text("livestream_title"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
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
  name: text("name").notNull(),
  photos: text("photos").array(), // array of photo URLs (max 10)
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
  name: text("name").notNull(),
  description: text("description"),
  photos: text("photos").array(), // array of photo URLs (max 3)
  type: text("type").notNull(), // sell, gift
  userId: varchar("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const productPurchaseRequests = pgTable("product_purchase_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => shopProducts.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  quantity: integer("quantity").default(1).notNull(),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  membershipDate: true,
});

export const insertAnnouncementSchema = createInsertSchema(announcements).omit({
  id: true,
  publishDate: true,
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
}).extend({
  dateTime: z.union([
    z.date(),
    z.string().transform((str) => new Date(str))
  ])
});

export const insertEventRsvpSchema = createInsertSchema(eventRsvps).omit({
  id: true,
  rsvpDate: true,
});

export const insertWorkGroupSchema = createInsertSchema(workGroups).omit({
  id: true,
  createdAt: true,
});

export const insertWorkGroupMemberSchema = createInsertSchema(workGroupMembers).omit({
  id: true,
  joinedAt: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
}).extend({
  dueDate: z.union([
    z.date(),
    z.string().transform((str) => new Date(str)),
    z.null()
  ]).optional()
});

export const insertAccessRequestSchema = createInsertSchema(accessRequests).omit({
  id: true,
  requestDate: true,
});

export const insertTaskCommentSchema = createInsertSchema(taskComments).omit({
  id: true,
  createdAt: true,
});

export const insertGroupFileSchema = createInsertSchema(groupFiles).omit({
  id: true,
  uploadedAt: true,
});

export const insertAnnouncementFileSchema = createInsertSchema(announcementFiles).omit({
  id: true,
  uploadedAt: true,
});

export const insertFamilyRelationshipSchema = createInsertSchema(familyRelationships).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  isRead: true,
});

export const insertOrganizationSettingsSchema = createInsertSchema(organizationSettings).omit({
  id: true,
  updatedAt: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  uploadedAt: true,
});

export const insertRequestSchema = createInsertSchema(requests).omit({
  id: true,
  createdAt: true,
  reviewedAt: true,
});

export const insertShopProductSchema = createInsertSchema(shopProducts).omit({
  id: true,
  createdAt: true,
});

export const insertMarketplaceItemSchema = createInsertSchema(marketplaceItems).omit({
  id: true,
  createdAt: true,
});

export const insertProductPurchaseRequestSchema = createInsertSchema(productPurchaseRequests).omit({
  id: true,
  createdAt: true,
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
export type GroupFile = typeof groupFiles.$inferSelect;
export type InsertGroupFile = z.infer<typeof insertGroupFileSchema>;
export type AnnouncementFile = typeof announcementFiles.$inferSelect;
export type InsertAnnouncementFile = z.infer<typeof insertAnnouncementFileSchema>;
export type FamilyRelationship = typeof familyRelationships.$inferSelect;
export type InsertFamilyRelationship = z.infer<typeof insertFamilyRelationshipSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
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

export type ProductPurchaseRequestWithDetails = ProductPurchaseRequest & {
  product: ShopProduct | null;
  user: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
};
