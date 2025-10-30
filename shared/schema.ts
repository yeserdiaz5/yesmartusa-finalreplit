import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const subscribers = pgTable("subscribers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  subscribedAt: timestamp("subscribed_at").defaultNow(),
});

export const insertSubscriberSchema = createInsertSchema(subscribers).omit({
  id: true,
  subscribedAt: true,
}).extend({
  email: z.string().email("Please enter a valid email address"),
});

export type InsertSubscriber = z.infer<typeof insertSubscriberSchema>;
export type Subscriber = typeof subscribers.$inferSelect;

// Service and pricing types (in-memory data)
export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  billingCycle: string;
  features: ServiceFeature[];
  popular?: boolean;
  category: string;
}

export interface ServiceFeature {
  name: string;
  included: boolean;
  description?: string;
}
