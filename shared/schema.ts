import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // company name
  contactPerson: text("contact_person").notNull(),
  phone: text("phone"),
  country: text("country").notNull(),
  countryCode: text("country_code").notNull(),
  contractType: text("contract_type").notNull().default("monthly"), // monthly/one-time
  projectStatus: text("project_status").notNull().default("Planning"),
  contractStartDate: timestamp("contract_start_date").notNull(),
  expectedCompletionDate: timestamp("expected_completion_date").notNull(),
  totalProjectFee: decimal("total_project_fee", { precision: 10, scale: 2 }).notNull(),
  totalProjectFeeUSD: decimal("total_project_fee_usd", { precision: 10, scale: 2 }).notNull(),
  feeCurrency: text("fee_currency").notNull().default("USD"),
  amountPaid: decimal("amount_paid", { precision: 10, scale: 2 }).notNull().default("0.00"),
  amountPaidUSD: decimal("amount_paid_usd", { precision: 10, scale: 2 }).notNull().default("0.00"),
  
  // Progress tracking metrics
  totalImagesToMake: integer("total_images_to_make").notNull().default(0),
  imagesMade: integer("images_made").notNull().default(0),
  totalJewelryArticles: integer("total_jewelry_articles").notNull().default(0),
  jewelryArticlesMade: integer("jewelry_articles_made").notNull().default(0),
  
  // Logo/Profile image
  logoUrl: text("logo_url"),
  
  lastActivity: timestamp("last_activity").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  whatsappNo: text("whatsapp_no").notNull(),
  country: text("country").notNull(),
  role: text("role").notNull(), // cofounder/freelancer/other
  avatar: text("avatar"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Enhanced table for tracking all financial transactions
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => clients.id), // nullable for manual transactions
  teamMemberId: integer("team_member_id").references(() => teamMembers.id), // who received/paid
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  amountUSD: decimal("amount_usd", { precision: 10, scale: 2 }).notNull(), // converted to USD
  currency: text("currency").notNull().default("USD"),
  type: text("type").notNull(), // 'incoming', 'payment_to_team', 'expense', 'manual_income', 'manual_expense'
  category: text("category"), // 'tools', 'software', 'equipment', 'salary', 'freelance', etc.
  description: text("description").notNull(),
  date: timestamp("date").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// New table for tracking projects
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull().default("active"), // active, completed, paused
  startDate: timestamp("start_date").notNull(),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const clientAssignments = pgTable("client_assignments", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id),
  teamMemberId: integer("team_member_id").notNull().references(() => teamMembers.id),
  assignedAt: timestamp("assigned_at").notNull().defaultNow(),
});

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id),
  type: text("type").notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const dailyImageCount = pgTable("daily_image_count", {
  id: serial("id").primaryKey(),
  date: date("date").notNull().unique(),
  imageCount: integer("image_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sampleRequests = pgTable("sample_requests", {
  id: serial("id").primaryKey(),
  companyName: text("company_name").notNull(),
  country: text("country").notNull(),
  requestDate: date("request_date").notNull(),
  status: text("status").notNull().default("pending"), // pending, completed, cancelled
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const workSessions = pgTable("work_sessions", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id),
  workDate: date("work_date").notNull(),
  duration: integer("duration"), // in minutes, optional for now
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const marketingTransactions = pgTable("marketing_transactions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("USD"),
  date: timestamp("date").notNull(),
  logo: text("logo"), // base64 encoded image
  period: text("period").notNull().default("one-time"), // one-time or monthly
  receivedBy: text("received_by"),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const clientsRelations = relations(clients, ({ many }) => ({
  assignments: many(clientAssignments),
  activities: many(activities),
  transactions: many(transactions),
  projects: many(projects),
  workSessions: many(workSessions),
}));

export const teamMembersRelations = relations(teamMembers, ({ many }) => ({
  assignments: many(clientAssignments),
  transactions: many(transactions),
}));

export const clientAssignmentsRelations = relations(clientAssignments, ({ one }) => ({
  client: one(clients, {
    fields: [clientAssignments.clientId],
    references: [clients.id],
  }),
  teamMember: one(teamMembers, {
    fields: [clientAssignments.teamMemberId],
    references: [teamMembers.id],
  }),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  client: one(clients, {
    fields: [activities.clientId],
    references: [clients.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  client: one(clients, {
    fields: [transactions.clientId],
    references: [clients.id],
  }),
  teamMember: one(teamMembers, {
    fields: [transactions.teamMemberId],
    references: [teamMembers.id],
  }),
}));

export const projectsRelations = relations(projects, ({ one }) => ({
  client: one(clients, {
    fields: [projects.clientId],
    references: [clients.id],
  }),
}));

export const workSessionsRelations = relations(workSessions, ({ one }) => ({
  client: one(clients, {
    fields: [workSessions.clientId],
    references: [clients.id],
  }),
}));

// Insert schemas
export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastActivity: true,
}).extend({
  contractStartDate: z.string().transform((str) => new Date(str)),
  expectedCompletionDate: z.string().transform((str) => new Date(str)),
});

// Update schema that allows partial updates including lastActivity
export const updateClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  contractStartDate: z.string().transform((str) => new Date(str)).optional(),
  expectedCompletionDate: z.string().transform((str) => new Date(str)).optional(),
  lastActivity: z.string().transform((str) => new Date(str)).optional(),
  // Allow decimal fields to accept numbers and convert to strings
  totalProjectFee: z.union([z.string(), z.number()]).transform((val) => val.toString()).optional(),
  totalProjectFeeUSD: z.union([z.string(), z.number()]).transform((val) => val.toString()).optional(),
  amountPaid: z.union([z.string(), z.number()]).transform((val) => val.toString()).optional(),
  amountPaidUSD: z.union([z.string(), z.number()]).transform((val) => val.toString()).optional(),
}).partial();

export const insertTeamMemberSchema = createInsertSchema(teamMembers).omit({
  id: true,
  createdAt: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
});

export const insertDailyImageCountSchema = createInsertSchema(dailyImageCount).omit({
  id: true,
  createdAt: true,
});

export const insertSampleRequestSchema = createInsertSchema(sampleRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWorkSessionSchema = createInsertSchema(workSessions).omit({
  id: true,
  createdAt: true,
});

export const insertMarketingTransactionSchema = createInsertSchema(marketingTransactions).omit({
  id: true,
  createdAt: true,
}).extend({
  date: z.string().transform((str) => new Date(str)),
  amount: z.union([z.string(), z.number()]).transform((val) => parseFloat(val.toString())),
});

// Types
export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type ClientAssignment = typeof clientAssignments.$inferSelect;
export type DailyImageCount = typeof dailyImageCount.$inferSelect;
export type InsertDailyImageCount = z.infer<typeof insertDailyImageCountSchema>;
export type SampleRequest = typeof sampleRequests.$inferSelect;
export type InsertSampleRequest = z.infer<typeof insertSampleRequestSchema>;
export type WorkSession = typeof workSessions.$inferSelect;
export type InsertWorkSession = z.infer<typeof insertWorkSessionSchema>;
export type MarketingTransaction = typeof marketingTransactions.$inferSelect;
export type InsertMarketingTransaction = z.infer<typeof insertMarketingTransactionSchema>;

// Extended types with relations
export type ClientWithTeam = Client & {
  assignments: (ClientAssignment & {
    teamMember: TeamMember;
  })[];
};

export type ClientWithActivities = Client & {
  activities: Activity[];
};
