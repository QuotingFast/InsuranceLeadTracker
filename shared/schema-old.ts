import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar, decimal } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Leads table with 6-digit QF codes
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  qfCode: varchar("qf_code", { length: 8 }).notNull().unique(), // QF123456 format
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  phone: varchar("phone", { length: 15 }).notNull(), // +1XXXXXXXXXX format
  state: varchar("state", { length: 2 }).notNull(),
  zipCode: varchar("zip_code", { length: 10 }),
  currentInsurer: text("current_insurer"),
  monthlyPremium: decimal("monthly_premium", { precision: 10, scale: 2 }),
  rawData: jsonb("raw_data"), // Store original webhook data
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Drivers table with relationship to leads
export const drivers = pgTable("drivers", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").references(() => leads.id).notNull(),
  age: integer("age").notNull(),
  yearsOfExperience: integer("years_of_experience").notNull(),
  violations: integer("violations").default(0),
  relationshipToLead: text("relationship_to_lead").notNull(), // primary, spouse, child, etc.
  licenseStatus: text("license_status").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Vehicles table linked to leads
export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").references(() => leads.id).notNull(),
  year: integer("year").notNull(),
  make: text("make").notNull(),
  model: text("model").notNull(),
  vin: varchar("vin", { length: 17 }),
  usage: text("usage"), // personal, business, etc.
  annualMileage: integer("annual_mileage"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// SMS messages with Twilio SID tracking
export const smsMessages = pgTable("sms_messages", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").references(() => leads.id).notNull(),
  phone: varchar("phone", { length: 15 }).notNull(),
  message: text("message").notNull(),
  messageType: varchar("message_type", { length: 20 }).notNull(), // followup, urgent, lastchance, custom
  twilioSid: varchar("twilio_sid", { length: 34 }), // Twilio message SID
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, sent, delivered, failed, undelivered
  errorCode: varchar("error_code", { length: 10 }),
  errorMessage: text("error_message"),
  scheduledFor: timestamp("scheduled_for"),
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Opt-outs with phone-based management
export const optOuts = pgTable("opt_outs", {
  id: serial("id").primaryKey(),
  phone: varchar("phone", { length: 15 }).notNull().unique(),
  optOutMethod: varchar("opt_out_method", { length: 20 }).notNull(), // sms_reply, manual, webhook
  optOutMessage: text("opt_out_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Suppression list for bulk imports
export const suppressionList = pgTable("suppression_list", {
  id: serial("id").primaryKey(),
  phone: varchar("phone", { length: 15 }).notNull().unique(),
  reason: text("reason"),
  source: varchar("source", { length: 50 }), // bulk_import, manual, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Quote page views and engagement tracking
export const quoteViews = pgTable("quote_views", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").references(() => leads.id).notNull(),
  qfCode: varchar("qf_code", { length: 8 }).notNull(),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  referrer: text("referrer"),
  viewedAt: timestamp("viewed_at").defaultNow().notNull(),
});

// Call tracking for conversion measurement
export const callTracking = pgTable("call_tracking", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").references(() => leads.id).notNull(),
  qfCode: varchar("qf_code", { length: 8 }).notNull(),
  phoneNumber: varchar("phone_number", { length: 15 }).notNull(),
  callDuration: integer("call_duration"), // in seconds
  callStatus: varchar("call_status", { length: 20 }), // completed, busy, no_answer, failed
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// System alerts and notifications
export const systemAlerts = pgTable("system_alerts", {
  id: serial("id").primaryKey(),
  alertType: varchar("alert_type", { length: 50 }).notNull(), // delivery_rate, compliance, error, health_check
  message: text("message").notNull(),
  severity: varchar("severity", { length: 20 }).notNull(), // info, warning, error, critical
  isRead: boolean("is_read").default(false),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const leadsRelations = relations(leads, ({ many }) => ({
  drivers: many(drivers),
  vehicles: many(vehicles),
  smsMessages: many(smsMessages),
  quoteViews: many(quoteViews),
  callTracking: many(callTracking),
}));

export const driversRelations = relations(drivers, ({ one }) => ({
  lead: one(leads, { fields: [drivers.leadId], references: [leads.id] }),
}));

export const vehiclesRelations = relations(vehicles, ({ one }) => ({
  lead: one(leads, { fields: [vehicles.leadId], references: [leads.id] }),
}));

export const smsMessagesRelations = relations(smsMessages, ({ one }) => ({
  lead: one(leads, { fields: [smsMessages.leadId], references: [leads.id] }),
}));

export const quoteViewsRelations = relations(quoteViews, ({ one }) => ({
  lead: one(leads, { fields: [quoteViews.leadId], references: [leads.id] }),
}));

export const callTrackingRelations = relations(callTracking, ({ one }) => ({
  lead: one(leads, { fields: [callTracking.leadId], references: [leads.id] }),
}));

// Insert schemas
export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDriverSchema = createInsertSchema(drivers).omit({
  id: true,
  createdAt: true,
});

export const insertVehicleSchema = createInsertSchema(vehicles).omit({
  id: true,
  createdAt: true,
});

export const insertSmsMessageSchema = createInsertSchema(smsMessages).omit({
  id: true,
  createdAt: true,
});

export const insertOptOutSchema = createInsertSchema(optOuts).omit({
  id: true,
  createdAt: true,
});

export const insertQuoteViewSchema = createInsertSchema(quoteViews).omit({
  id: true,
  viewedAt: true,
});

export const insertCallTrackingSchema = createInsertSchema(callTracking).omit({
  id: true,
  createdAt: true,
});

export const insertSystemAlertSchema = createInsertSchema(systemAlerts).omit({
  id: true,
  createdAt: true,
});

// Types
export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Driver = typeof drivers.$inferSelect;
export type InsertDriver = z.infer<typeof insertDriverSchema>;
export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type SmsMessage = typeof smsMessages.$inferSelect;
export type InsertSmsMessage = z.infer<typeof insertSmsMessageSchema>;
export type OptOut = typeof optOuts.$inferSelect;
export type InsertOptOut = z.infer<typeof insertOptOutSchema>;
export type QuoteView = typeof quoteViews.$inferSelect;
export type InsertQuoteView = z.infer<typeof insertQuoteViewSchema>;
export type CallTracking = typeof callTracking.$inferSelect;
export type InsertCallTracking = z.infer<typeof insertCallTrackingSchema>;
export type SystemAlert = typeof systemAlerts.$inferSelect;
export type InsertSystemAlert = z.infer<typeof insertSystemAlertSchema>;

// Custom schemas for API requests
export const webhookLeadSchema = z.object({
  id: z.number().optional(),
  url: z.string().optional(),
  timestamp: z.string().optional(),
  sell_price: z.string().optional(),
  campaign_id: z.number().optional(),
  meta: z.object({
    trusted_form_cert_url: z.string().optional(),
    tcpa_compliant: z.boolean().optional(),
    originally_created: z.string().optional(),
    one_to_one: z.string().optional(),
    offer_id: z.string().optional(),
    landing_page_url: z.string().optional(),
    user_agent: z.string().optional(),
    source_id: z.string().optional(),
    tcpa_consent_text: z.string().optional(),
    lead_id_code: z.string().optional(),
  }).optional(),
  contact: z.object({
    city: z.string().optional(),
    first_name: z.string(),
    last_name: z.string(),
    phone2: z.string().optional(),
    address2: z.string().optional(),
    phone: z.string(),
    state: z.string(),
    address: z.string().optional(),
    ip_address: z.string().optional(),
    email: z.string().email().optional(),
    zip_code: z.string().optional(),
  }),
  data: z.object({
    drivers: z.array(z.object({
      last_name: z.string().optional(),
      relationship: z.string(),
      requires_sr22: z.boolean().optional(),
      months_at_employer: z.number().optional(),
      license_status: z.string(),
      major_violations: z.array(z.object({
        state: z.string(),
        description: z.string(),
        violation_date: z.string(),
      })).optional(),
      education: z.string().optional(),
      bankruptcy: z.boolean().optional(),
      tickets: z.array(z.object({
        ticket_date: z.string(),
        description: z.string(),
      })).optional(),
      first_name: z.string().optional(),
      accidents: z.array(z.object({
        accident_date: z.string(),
        damage: z.string(),
        at_fault: z.boolean(),
        description: z.string(),
      })).optional(),
      gender: z.string().optional(),
      marital_status: z.string().optional(),
      months_at_residence: z.number().optional(),
      age_licensed: z.number().optional(),
      residence_type: z.string().optional(),
      birth_date: z.string().optional(),
      claims: z.array(z.object({
        claim_date: z.string(),
        paid_amount: z.string(),
        description: z.string(),
      })).optional(),
      license_ever_suspended: z.boolean().optional(),
      occupation: z.string().optional(),
      license_state: z.string().optional(),
    })).optional(),
    vehicles: z.array(z.object({
      vin: z.string().optional(),
      one_way_distance: z.number().optional(),
      collision_deductible: z.string().optional(),
      ownership: z.string().optional(),
      year: z.number(),
      submodel: z.string().optional(),
      rental: z.boolean().optional(),
      primary_use: z.string().optional(),
      four_wheel_drive: z.boolean().optional(),
      annual_miles: z.number().optional(),
      make: z.string(),
      airbags: z.boolean().optional(),
      salvaged: z.boolean().optional(),
      garage: z.string().optional(),
      abs: z.boolean().optional(),
      towing: z.boolean().optional(),
      weekly_commute_days: z.number().optional(),
      comprehensive_deductible: z.string().optional(),
      automatic_seat_belts: z.boolean().optional(),
      model: z.string(),
      alarm: z.string().optional(),
    })).optional(),
    requested_policy: z.object({
      coverage_type: z.string().optional(),
      property_damage: z.number().optional(),
      bodily_injury: z.string().optional(),
    }).optional(),
    current_policy: z.string().nullable(),
  }),
  extra_data: z.object({}).optional(),
});

export const customSmsSchema = z.object({
  phoneNumber: z.string(),
  message: z.string().max(1600),
  scheduleForBusinessHours: z.boolean().default(false),
  templateType: z.enum(['followup', 'urgent', 'lastchance', 'custom']).default('custom'),
});

export type WebhookLead = z.infer<typeof webhookLeadSchema>;
export type CustomSms = z.infer<typeof customSmsSchema>;
