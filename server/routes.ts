import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSampleRequestSchema, insertClientSchema, updateClientSchema, insertTeamMemberSchema, insertActivitySchema, insertMarketingTransactionSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all clients
  app.get("/api/clients", async (req, res) => {
    try {
      const clients = await storage.getClients();
      res.json(clients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  // Get single client
  app.get("/api/clients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const client = await storage.getClient(id);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      console.error("Error fetching client:", error);
      res.status(500).json({ message: "Failed to fetch client" });
    }
  });

  // Create client
  app.post("/api/clients", async (req, res) => {
    try {
      console.log("Received client data:", JSON.stringify(req.body, null, 2));
      const validatedData = insertClientSchema.parse(req.body);
      console.log("Validated data:", JSON.stringify(validatedData, null, 2));
      const client = await storage.createClient(validatedData);
      res.status(201).json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Validation errors:", error.errors);
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating client:", error);
      res.status(500).json({ message: "Failed to create client" });
    }
  });

  // Update client (PATCH - partial update)
  app.patch("/api/clients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log("PATCH request body:", JSON.stringify(req.body, null, 2));
      const validatedData = updateClientSchema.parse(req.body);
      console.log("Validated PATCH data:", JSON.stringify(validatedData, null, 2));
      const client = await storage.updateClient(id, validatedData);
      res.json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("PATCH Validation errors:", error.errors);
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating client:", error);
      res.status(500).json({ message: "Failed to update client" });
    }
  });

  // Update client (PUT - full update)
  app.put("/api/clients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log("Received PUT update data:", JSON.stringify(req.body, null, 2));
      const validatedData = insertClientSchema.parse(req.body);
      console.log("Validated PUT data:", JSON.stringify(validatedData, null, 2));
      const client = await storage.updateClient(id, validatedData);
      res.json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("PUT Validation errors:", error.errors);
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating client:", error);
      res.status(500).json({ message: "Failed to update client" });
    }
  });

  // Delete client
  app.delete("/api/clients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteClient(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting client:", error);
      res.status(500).json({ message: "Failed to delete client" });
    }
  });

  // Get team members
  app.get("/api/team-members", async (req, res) => {
    try {
      const teamMembers = await storage.getTeamMembers();
      res.json(teamMembers);
    } catch (error) {
      console.error("Error fetching team members:", error);
      res.status(500).json({ message: "Failed to fetch team members" });
    }
  });

  // Create team member
  app.post("/api/team-members", async (req, res) => {
    try {
      const validatedData = insertTeamMemberSchema.parse(req.body);
      const teamMember = await storage.createTeamMember(validatedData);
      res.status(201).json(teamMember);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating team member:", error);
      res.status(500).json({ message: "Failed to create team member" });
    }
  });

  // Get client activities
  app.get("/api/clients/:id/activities", async (req, res) => {
    try {
      const clientId = parseInt(req.params.id);
      const activities = await storage.getClientActivities(clientId);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  // Create activity
  app.post("/api/activities", async (req, res) => {
    try {
      const validatedData = insertActivitySchema.parse(req.body);
      const activity = await storage.createActivity(validatedData);
      res.status(201).json(activity);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating activity:", error);
      res.status(500).json({ message: "Failed to create activity" });
    }
  });

  // Get dashboard metrics
  app.get("/api/dashboard/metrics", async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
  });

  // Get all recent activities
  app.get("/api/activities", async (req, res) => {
    try {
      const activities = await storage.getRecentActivities();
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  // Get transactions
  app.get("/api/transactions", async (req, res) => {
    try {
      const transactions = await storage.getTransactions();
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // Create transaction
  app.post("/api/transactions", async (req, res) => {
    try {
      const transaction = await storage.createTransaction(req.body);
      res.status(201).json(transaction);
    } catch (error) {
      console.error("Error creating transaction:", error);
      res.status(500).json({ message: "Failed to create transaction" });
    }
  });

  // Update transaction (team member assignment and category)
  app.put("/api/transactions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { teamMemberId, category } = req.body;
      const transaction = await storage.updateTransaction(id, { teamMemberId, category });
      res.json(transaction);
    } catch (error) {
      console.error("Error updating transaction:", error);
      res.status(500).json({ message: "Failed to update transaction" });
    }
  });

  // Delete transaction
  app.delete("/api/transactions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteTransaction(id);
      res.json({ message: "Transaction deleted successfully" });
    } catch (error) {
      console.error("Error deleting transaction:", error);
      res.status(500).json({ message: "Failed to delete transaction" });
    }
  });

  // Assign team member to client
  app.post("/api/clients/:id/assign", async (req, res) => {
    try {
      const { id } = req.params;
      const { teamMemberId } = req.body;
      
      if (teamMemberId) {
        await storage.assignTeamMember(parseInt(id), parseInt(teamMemberId));
      }
      res.json({ message: "Team member assigned successfully" });
    } catch (error) {
      console.error("Error assigning team member:", error);
      res.status(500).json({ message: "Failed to assign team member" });
    }
  });

  // Daily image count routes
  app.get("/api/images/today", async (_req, res) => {
    try {
      const count = await storage.getTodayImageCount();
      res.json({ count });
    } catch (error) {
      console.error("Error fetching today's image count:", error);
      res.status(500).json({ error: "Failed to fetch today's image count" });
    }
  });

  app.post("/api/images/today", async (req, res) => {
    try {
      const { count } = req.body;
      if (typeof count !== 'number' || count < 0) {
        return res.status(400).json({ error: "Invalid count value" });
      }
      const result = await storage.updateTodayImageCount(count);
      res.json(result);
    } catch (error) {
      console.error("Error updating today's image count:", error);
      res.status(500).json({ error: "Failed to update today's image count" });
    }
  });

  app.post("/api/images/date", async (req, res) => {
    try {
      const { date, count } = req.body;
      if (typeof count !== 'number' || count < 0) {
        return res.status(400).json({ error: "Invalid count value" });
      }
      if (!date || typeof date !== 'string') {
        return res.status(400).json({ error: "Invalid date value" });
      }
      const result = await storage.updateImageCountForDate(date, count);
      res.json(result);
    } catch (error) {
      console.error("Error updating image count for date:", error);
      res.status(500).json({ error: "Failed to update image count for date" });
    }
  });

  app.get("/api/images/month/:year/:month", async (req, res) => {
    try {
      const year = parseInt(req.params.year);
      const month = parseInt(req.params.month);
      
      if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
        return res.status(400).json({ error: "Invalid year or month" });
      }
      
      const data = await storage.getImageCountByMonth(year, month);
      res.json(data);
    } catch (error) {
      console.error("Error fetching monthly image data:", error);
      res.status(500).json({ error: "Failed to fetch monthly image data" });
    }
  });

  // Sample Requests routes
  app.get("/api/sample-requests", async (req, res) => {
    try {
      const sampleRequests = await storage.getSampleRequests();
      res.json(sampleRequests);
    } catch (error) {
      console.error("Error fetching sample requests:", error);
      res.status(500).json({ message: "Failed to fetch sample requests" });
    }
  });

  app.post("/api/sample-requests", async (req, res) => {
    try {
      const validatedData = insertSampleRequestSchema.parse(req.body);
      const sampleRequest = await storage.createSampleRequest(validatedData);
      res.status(201).json(sampleRequest);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating sample request:", error);
      res.status(500).json({ message: "Failed to create sample request" });
    }
  });

  app.patch("/api/sample-requests/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertSampleRequestSchema.partial().parse(req.body);
      const sampleRequest = await storage.updateSampleRequest(id, validatedData);
      res.json(sampleRequest);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating sample request:", error);
      res.status(500).json({ message: "Failed to update sample request" });
    }
  });

  app.delete("/api/sample-requests/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteSampleRequest(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting sample request:", error);
      res.status(500).json({ message: "Failed to delete sample request" });
    }
  });

  // Work sessions routes
  app.get("/api/work-sessions/today", async (req, res) => {
    try {
      const workSessions = await storage.getTodayWorkSessions();
      res.json(workSessions);
    } catch (error) {
      console.error("Error fetching today's work sessions:", error);
      res.status(500).json({ message: "Failed to fetch work sessions" });
    }
  });

  app.post("/api/work-sessions", async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const workSessionData = {
        clientId: req.body.clientId,
        workDate: today,
        notes: req.body.notes || null,
        duration: req.body.duration || null,
      };
      const workSession = await storage.createWorkSession(workSessionData);
      res.status(201).json(workSession);
    } catch (error) {
      console.error("Error creating work session:", error);
      res.status(500).json({ message: "Failed to create work session" });
    }
  });

  app.delete("/api/work-sessions/:clientId", async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      const today = new Date().toISOString().split('T')[0];
      await storage.deleteWorkSession(clientId, today);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting work session:", error);
      res.status(500).json({ message: "Failed to delete work session" });
    }
  });

  // Marketing Transactions routes
  app.get("/api/marketing-transactions", async (req, res) => {
    try {
      const transactions = await storage.getMarketingTransactions();
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching marketing transactions:", error);
      res.status(500).json({ message: "Failed to fetch marketing transactions" });
    }
  });

  app.post("/api/marketing-transactions", async (req, res) => {
    try {
      const validatedData = insertMarketingTransactionSchema.parse(req.body);
      const transaction = await storage.createMarketingTransaction(validatedData);
      res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Marketing transaction validation errors:", error.errors);
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating marketing transaction:", error);
      res.status(500).json({ message: "Failed to create marketing transaction" });
    }
  });

  app.patch("/api/marketing-transactions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      // Use partial schema for updates (allow optional fields)
      const partialSchema = insertMarketingTransactionSchema.partial();
      const validatedData = partialSchema.parse(req.body);
      const transaction = await storage.updateMarketingTransaction(id, validatedData);
      res.json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Marketing transaction update validation errors:", error.errors);
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating marketing transaction:", error);
      res.status(500).json({ message: "Failed to update marketing transaction" });
    }
  });

  app.delete("/api/marketing-transactions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteMarketingTransaction(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting marketing transaction:", error);
      res.status(500).json({ message: "Failed to delete marketing transaction" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
