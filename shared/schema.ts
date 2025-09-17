import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  address: text("address"),
  city: text("city"),
  postalCode: text("postal_code"),
  dateOfBirth: text("date_of_birth"),
  occupation: text("occupation"),
  membershipDate: timestamp("membership_date").defaultNow(),
  status: text("status").notNull().default("active"), // active, inactive
  isAdmin: boolean("is_admin").default(false),
});

export const announcements = pgTable("announcements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  authorId: varchar("author_id").notNull().references(() => users.id),
  publishDate: timestamp("publish_date").defaultNow(),
  status: text("status").notNull().default("published"), // published, featured, archived
  isFeatured: boolean("is_featured").default(false),
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
  workGroupId: varchar("work_group_id").notNull().references(() => workGroups.id),
  assignedToId: varchar("assigned_to_id").references(() => users.id),
  status: text("status").notNull().default("todo"), // todo, in_progress, completed
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

// API response types for files with user details
export type AnnouncementFileWithUser = AnnouncementFile & {
  uploadedBy: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
};

export type Activity = typeof activities.$inferSelect;
