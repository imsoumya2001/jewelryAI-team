import { 
  clients, 
  teamMembers, 
  clientAssignments, 
  activities,
  transactions,
  dailyImageCount,
  sampleRequests,
  workSessions,
  marketingTransactions,
  type Client, 
  type InsertClient,
  type TeamMember,
  type InsertTeamMember,
  type Activity,
  type InsertActivity,
  type ClientWithTeam,
  type DailyImageCount,
  type InsertDailyImageCount,
  type SampleRequest,
  type InsertSampleRequest,
  type WorkSession,
  type InsertWorkSession,
  type MarketingTransaction,
  type InsertMarketingTransaction,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte } from "drizzle-orm";

export interface IStorage {
  // Client operations
  getClients(): Promise<ClientWithTeam[]>;
  getClient(id: number): Promise<ClientWithTeam | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: Partial<InsertClient>): Promise<Client>;
  deleteClient(id: number): Promise<void>;
  
  // Team member operations
  getTeamMembers(): Promise<TeamMember[]>;
  getTeamMember(id: number): Promise<TeamMember | undefined>;
  createTeamMember(teamMember: InsertTeamMember): Promise<TeamMember>;
  
  // Assignment operations
  assignTeamMember(clientId: number, teamMemberId: number): Promise<void>;
  
  // Transaction operations
  getTransactions(): Promise<any[]>;
  createTransaction(transaction: any): Promise<any>;
  updateTransaction(id: number, transaction: any): Promise<any>;
  deleteTransaction(id: number): Promise<void>;
  
  // Activity operations
  getClientActivities(clientId: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  getRecentActivities(): Promise<(Activity & { clientName: string })[]>;
  
  // Dashboard metrics
  getDashboardMetrics(): Promise<{
    totalClients: number;
    activeProjects: number;
    monthlyRevenue: number;
    teamUtilization: number;
  }>;
  
  // Daily image count operations
  getTodayImageCount(): Promise<number>;
  updateTodayImageCount(count: number): Promise<DailyImageCount>;
  updateImageCountForDate(date: string, count: number): Promise<DailyImageCount>;
  getImageCountByMonth(year: number, month: number): Promise<DailyImageCount[]>;
  resetDailyCount(): Promise<void>;
  
  // Sample request operations
  getSampleRequests(): Promise<SampleRequest[]>;
  createSampleRequest(sampleRequest: InsertSampleRequest): Promise<SampleRequest>;
  updateSampleRequest(id: number, sampleRequest: Partial<InsertSampleRequest>): Promise<SampleRequest>;
  deleteSampleRequest(id: number): Promise<void>;
  
  // Work session operations
  getTodayWorkSessions(): Promise<WorkSession[]>;
  createWorkSession(workSession: InsertWorkSession): Promise<WorkSession>;
  deleteWorkSession(clientId: number, workDate: string): Promise<void>;
  
  // Marketing transaction operations
  getMarketingTransactions(): Promise<MarketingTransaction[]>;
  createMarketingTransaction(transaction: InsertMarketingTransaction): Promise<MarketingTransaction>;
  updateMarketingTransaction(id: number, transaction: Partial<InsertMarketingTransaction>): Promise<MarketingTransaction>;
  deleteMarketingTransaction(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getClients(): Promise<ClientWithTeam[]> {
    try {
      const result = await db.query.clients.findMany({
        with: {
          assignments: {
            with: {
              teamMember: true,
            },
          },
        },
        orderBy: [desc(clients.lastActivity)],
      });
      return result;
    } catch (error) {
      console.error('Error fetching clients:', error);
      // Return empty array as fallback
      return [];
    }
  }

  async getClient(id: number): Promise<ClientWithTeam | undefined> {
    const result = await db.query.clients.findFirst({
      where: eq(clients.id, id),
      with: {
        assignments: {
          with: {
            teamMember: true,
          },
        },
      },
    });
    return result || undefined;
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const [client] = await db
      .insert(clients)
      .values(insertClient)
      .returning();
    return client;
  }

  async updateClient(id: number, updateData: Partial<InsertClient>): Promise<Client> {
    const [client] = await db
      .update(clients)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(clients.id, id))
      .returning();
    return client;
  }

  async deleteClient(id: number): Promise<void> {
    await db.delete(clients).where(eq(clients.id, id));
  }

  async getTeamMembers(): Promise<TeamMember[]> {
    return await db.select().from(teamMembers).where(eq(teamMembers.isActive, true));
  }

  async getTeamMember(id: number): Promise<TeamMember | undefined> {
    const [teamMember] = await db.select().from(teamMembers).where(eq(teamMembers.id, id));
    return teamMember || undefined;
  }

  async createTeamMember(insertTeamMember: InsertTeamMember): Promise<TeamMember> {
    const [teamMember] = await db
      .insert(teamMembers)
      .values(insertTeamMember)
      .returning();
    return teamMember;
  }

  async assignTeamMember(clientId: number, teamMemberId: number): Promise<void> {
    await db.insert(clientAssignments).values({
      clientId,
      teamMemberId,
    });
  }

  async getTransactions(): Promise<any[]> {
    return await db.select().from(transactions).orderBy(desc(transactions.date));
  }

  async createTransaction(insertTransaction: any): Promise<any> {
    const [transaction] = await db
      .insert(transactions)
      .values(insertTransaction)
      .returning();
    return transaction;
  }

  async updateTransaction(id: number, updateData: any): Promise<any> {
    const [transaction] = await db
      .update(transactions)
      .set(updateData)
      .where(eq(transactions.id, id))
      .returning();
    return transaction;
  }

  async deleteTransaction(id: number): Promise<void> {
    await db.delete(transactions).where(eq(transactions.id, id));
  }

  async getClientActivities(clientId: number): Promise<Activity[]> {
    return await db
      .select()
      .from(activities)
      .where(eq(activities.clientId, clientId))
      .orderBy(desc(activities.createdAt));
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const [activity] = await db
      .insert(activities)
      .values(insertActivity)
      .returning();
    return activity;
  }

  async getRecentActivities(): Promise<(Activity & { clientName: string })[]> {
    const result = await db
      .select({
        id: activities.id,
        clientId: activities.clientId,
        type: activities.type,
        description: activities.description,
        createdAt: activities.createdAt,
        clientName: clients.name,
      })
      .from(activities)
      .innerJoin(clients, eq(activities.clientId, clients.id))
      .orderBy(desc(activities.createdAt))
      .limit(15);
    
    return result;
  }

  async getDashboardMetrics(): Promise<{
    totalClients: number;
    activeProjects: number;
    monthlyRevenue: number;
    teamUtilization: number;
  }> {
    try {
      const allClients = await db.select().from(clients);
      const activeProjects = allClients.filter(c => 
        c.projectStatus === "In Progress" || c.projectStatus === "Planning" || c.projectStatus === "Testing"
      );
      
      const monthlyRevenue = allClients.reduce((sum, client) => {
        return sum + parseFloat(client.amountPaid.toString());
      }, 0);

      return {
        totalClients: allClients.length,
        activeProjects: activeProjects.length,
        monthlyRevenue,
        teamUtilization: 87, // This would be calculated based on actual workload data
      };
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      // Return default metrics as fallback
      return {
        totalClients: 0,
        activeProjects: 0,
        monthlyRevenue: 0,
        teamUtilization: 0,
      };
    }
  }

  async getTodayImageCount(): Promise<number> {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      const [result] = await db
        .select()
        .from(dailyImageCount)
        .where(eq(dailyImageCount.date, today));
      
      return result?.imageCount || 0;
    } catch (error) {
      console.error('Error fetching today\'s image count:', error);
      // Return 0 as fallback if database is unavailable
      return 0;
    }
  }

  async updateTodayImageCount(count: number): Promise<DailyImageCount> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    return this.updateImageCountForDate(today, count);
  }

  async updateImageCountForDate(date: string, count: number): Promise<DailyImageCount> {
    // Try to update existing record first
    const [existing] = await db
      .select()
      .from(dailyImageCount)
      .where(eq(dailyImageCount.date, date));

    if (existing) {
      const [updated] = await db
        .update(dailyImageCount)
        .set({ imageCount: count })
        .where(eq(dailyImageCount.date, date))
        .returning();
      return updated;
    } else {
      // Create new record
      const [created] = await db
        .insert(dailyImageCount)
        .values({ date, imageCount: count })
        .returning();
      return created;
    }
  }

  async getImageCountByMonth(year: number, month: number): Promise<DailyImageCount[]> {
    // Create date range for the month - use proper last day of month
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate(); // Gets last day of month
    const endDate = `${year}-${month.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;
    
    return await db
      .select()
      .from(dailyImageCount)
      .where(
        and(
          gte(dailyImageCount.date, startDate),
          lte(dailyImageCount.date, endDate)
        )
      )
      .orderBy(dailyImageCount.date);
  }

  async resetDailyCount(): Promise<void> {
    // This method could be called by a cron job at midnight IST
    // For now, it's just a placeholder for future automation
    const today = new Date().toISOString().split('T')[0];
    await this.updateTodayImageCount(0);
  }

  async getSampleRequests(): Promise<SampleRequest[]> {
    return await db.select().from(sampleRequests).orderBy(desc(sampleRequests.requestDate));
  }

  async createSampleRequest(insertSampleRequest: InsertSampleRequest): Promise<SampleRequest> {
    const [sampleRequest] = await db
      .insert(sampleRequests)
      .values(insertSampleRequest)
      .returning();
    return sampleRequest;
  }

  async updateSampleRequest(id: number, updateData: Partial<InsertSampleRequest>): Promise<SampleRequest> {
    const [sampleRequest] = await db
      .update(sampleRequests)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(sampleRequests.id, id))
      .returning();
    return sampleRequest;
  }

  async deleteSampleRequest(id: number): Promise<void> {
    await db.delete(sampleRequests).where(eq(sampleRequests.id, id));
  }

  async getTodayWorkSessions(): Promise<WorkSession[]> {
    const today = new Date().toISOString().split('T')[0];
    return await db
      .select()
      .from(workSessions)
      .where(eq(workSessions.workDate, today))
      .orderBy(workSessions.createdAt);
  }

  async createWorkSession(insertWorkSession: InsertWorkSession): Promise<WorkSession> {
    const [workSession] = await db
      .insert(workSessions)
      .values(insertWorkSession)
      .returning();
    return workSession;
  }

  async deleteWorkSession(clientId: number, workDate: string): Promise<void> {
    await db
      .delete(workSessions)
      .where(
        and(
          eq(workSessions.clientId, clientId),
          eq(workSessions.workDate, workDate)
        )
      );
  }

  async getMarketingTransactions(): Promise<MarketingTransaction[]> {
    return await db
      .select()
      .from(marketingTransactions)
      .orderBy(desc(marketingTransactions.date));
  }

  async createMarketingTransaction(insertTransaction: InsertMarketingTransaction): Promise<MarketingTransaction> {
    const [transaction] = await db
      .insert(marketingTransactions)
      .values(insertTransaction)
      .returning();
    return transaction;
  }

  async updateMarketingTransaction(id: number, updateData: Partial<InsertMarketingTransaction>): Promise<MarketingTransaction> {
    const [transaction] = await db
      .update(marketingTransactions)
      .set(updateData)
      .where(eq(marketingTransactions.id, id))
      .returning();
    return transaction;
  }

  async deleteMarketingTransaction(id: number): Promise<void> {
    await db.delete(marketingTransactions).where(eq(marketingTransactions.id, id));
  }
}

export const storage = new DatabaseStorage();
