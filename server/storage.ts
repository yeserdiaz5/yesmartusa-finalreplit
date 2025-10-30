import { type Subscriber, type InsertSubscriber, type Service } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  createSubscriber(subscriber: InsertSubscriber): Promise<Subscriber>;
  getSubscriberByEmail(email: string): Promise<Subscriber | undefined>;
  getServices(): Promise<Service[]>;
}

export class MemStorage implements IStorage {
  private subscribers: Map<string, Subscriber>;
  private services: Service[];

  constructor() {
    this.subscribers = new Map();
    this.services = [
      {
        id: "starter",
        name: "Starter",
        description: "Perfect for individuals and small projects",
        price: 9,
        billingCycle: "month",
        category: "Cloud Storage",
        features: [
          { name: "10 GB Storage", included: true },
          { name: "Basic Support", included: true },
          { name: "Single User", included: true },
          { name: "API Access", included: false },
          { name: "Advanced Analytics", included: false },
          { name: "Priority Support", included: false },
        ],
      },
      {
        id: "professional",
        name: "Professional",
        description: "For growing teams and businesses",
        price: 29,
        billingCycle: "month",
        category: "Cloud Storage",
        popular: true,
        features: [
          { name: "100 GB Storage", included: true },
          { name: "Priority Support", included: true },
          { name: "Up to 10 Users", included: true },
          { name: "API Access", included: true },
          { name: "Advanced Analytics", included: true },
          { name: "Custom Integrations", included: false },
        ],
      },
      {
        id: "enterprise",
        name: "Enterprise",
        description: "For large organizations with advanced needs",
        price: 99,
        billingCycle: "month",
        category: "Cloud Storage",
        features: [
          { name: "Unlimited Storage", included: true },
          { name: "24/7 Dedicated Support", included: true },
          { name: "Unlimited Users", included: true },
          { name: "Full API Access", included: true },
          { name: "Advanced Analytics", included: true },
          { name: "Custom Integrations", included: true },
        ],
      },
      {
        id: "basic-email",
        name: "Basic Email",
        description: "Essential email marketing tools",
        price: 15,
        billingCycle: "month",
        category: "Email Marketing",
        features: [
          { name: "5,000 Contacts", included: true },
          { name: "Email Templates", included: true },
          { name: "Basic Automation", included: true },
          { name: "A/B Testing", included: false },
          { name: "Advanced Segmentation", included: false },
          { name: "Custom Domains", included: false },
        ],
      },
      {
        id: "pro-email",
        name: "Pro Email",
        description: "Advanced email marketing for professionals",
        price: 49,
        billingCycle: "month",
        category: "Email Marketing",
        popular: true,
        features: [
          { name: "50,000 Contacts", included: true },
          { name: "Premium Templates", included: true },
          { name: "Advanced Automation", included: true },
          { name: "A/B Testing", included: true },
          { name: "Advanced Segmentation", included: true },
          { name: "Custom Domains", included: true },
        ],
      },
      {
        id: "analytics-lite",
        name: "Analytics Lite",
        description: "Essential analytics for small websites",
        price: 12,
        billingCycle: "month",
        category: "Analytics",
        features: [
          { name: "10,000 Page Views/month", included: true },
          { name: "Real-time Dashboard", included: true },
          { name: "Basic Reports", included: true },
          { name: "Goal Tracking", included: false },
          { name: "Funnel Analysis", included: false },
          { name: "API Access", included: false },
        ],
      },
    ];
  }

  async createSubscriber(insertSubscriber: InsertSubscriber): Promise<Subscriber> {
    const existing = await this.getSubscriberByEmail(insertSubscriber.email);
    if (existing) {
      throw new Error("Email already subscribed");
    }

    const id = randomUUID();
    const subscriber: Subscriber = {
      ...insertSubscriber,
      id,
      subscribedAt: new Date(),
    };
    this.subscribers.set(id, subscriber);
    return subscriber;
  }

  async getSubscriberByEmail(email: string): Promise<Subscriber | undefined> {
    return Array.from(this.subscribers.values()).find(
      (sub) => sub.email === email
    );
  }

  async getServices(): Promise<Service[]> {
    return this.services;
  }
}

export const storage = new MemStorage();
