import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, uuid, decimal, integer, boolean, jsonb, index, foreignKey } from "drizzle-orm/pg-core";
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

// Products table with variant support
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  seller_id: varchar("seller_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  stock_quantity: integer("stock_quantity").notNull().default(0),
  category: text("category"),
  image_url: text("image_url"),
  images: text("images").array(),
  is_active: boolean("is_active").default(true),
  brand: text("brand"),
  condition: text("condition"),
  shipping_policy: text("shipping_policy"),
  shipping_cost: decimal("shipping_cost", { precision: 10, scale: 2 }),
  package_length: decimal("package_length", { precision: 10, scale: 2 }),
  package_width: decimal("package_width", { precision: 10, scale: 2 }),
  package_height: decimal("package_height", { precision: 10, scale: 2 }),
  package_weight: decimal("package_weight", { precision: 10, scale: 2 }),
  // New fields for product variants
  parent_id: varchar("parent_id"), // Self-referencing FK - constraint defined below
  asin: text("asin").unique(), // Amazon Standard Identification Number
  attributes: jsonb("attributes").$type<Record<string, string>>().default(sql`'{}'::jsonb`), // Variant attributes
  // Timestamps
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => ({
  sellerIdIdx: index("products_seller_id_idx").on(table.seller_id),
  categoryIdx: index("products_category_idx").on(table.category),
  isActiveIdx: index("products_is_active_idx").on(table.is_active),
  parentIdIdx: index("products_parent_id_idx").on(table.parent_id),
  asinIdx: index("products_asin_idx").on(table.asin),
  parentIdFk: foreignKey({
    columns: [table.parent_id],
    foreignColumns: [table.id],
    name: "products_parent_id_fkey"
  }).onDelete("cascade"),
}));

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  created_at: true,
  updated_at: true,
}).extend({
  title: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  price: z.string().or(z.number()).transform((val) => Number(val)),
  stock_quantity: z.string().or(z.number()).transform((val) => Number(val)).default(0),
  category: z.string().optional(),
  brand: z.string().optional(),
  condition: z.enum(["new", "like_new", "used", "refurbished", "open_box", "for_parts"]).optional(),
  shipping_policy: z.enum(["buyer_pays", "seller_pays", "shared"]).optional(),
  parent_id: z.string().uuid().optional(),
  asin: z.string().optional(),
  attributes: z.record(z.string(), z.string()).optional(),
});

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

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
