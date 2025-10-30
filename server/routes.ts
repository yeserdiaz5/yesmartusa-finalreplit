import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSubscriberSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/subscribe", async (req, res) => {
    try {
      const validatedData = insertSubscriberSchema.parse(req.body);
      const subscriber = await storage.createSubscriber(validatedData);
      res.json({ success: true, subscriber });
    } catch (error: any) {
      if (error.message === "Email already subscribed") {
        res.status(409).json({ error: "This email is already subscribed to our newsletter." });
      } else if (error.name === "ZodError") {
        res.status(400).json({ error: "Invalid email address" });
      } else {
        res.status(500).json({ error: "Failed to subscribe. Please try again." });
      }
    }
  });

  app.get("/api/services", async (req, res) => {
    try {
      const services = await storage.getServices();
      res.json(services);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch services" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
