import { pgTable, serial, text, integer, timestamp, boolean, json } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enhanced leads table for comprehensive webhook data
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  qfCode: text("qf_code").unique().notNull(),
  
  // Basic contact info
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  phone: text("phone").notNull(),
  phone2: text("phone2"),
  
  // Address info
  address: text("address"),
  address2: text("address2"),
  city: text("city"),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  ipAddress: text("ip_address"),
  
  // Lead tracking
  leadIdCode: text("lead_id_code"), // UUID from webhook
  campaignId: integer("campaign_id"),
  offerId: text("offer_id"),
  sourceId: text("source_id"),
  sellPrice: text("sell_price"),
  landingPageUrl: text("landing_page_url"),
  userAgent: text("user_agent"),
  
  // Insurance info
  currentPolicy: text("current_policy"), // null means uninsured
  requestedCoverageType: text("requested_coverage_type"),
  requestedPropertyDamage: integer("requested_property_damage"),
  requestedBodilyInjury: text("requested_bodily_injury"),
  
  // TCPA compliance
  tcpaCompliant: boolean("tcpa_compliant").default(false),
  tcpaConsentText: text("tcpa_consent_text"),
  trustedFormCertUrl: text("trusted_form_cert_url"),
  
  // Original data for reference
  rawData: json("raw_data"),
  originallyCreated: timestamp("originally_created"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Enhanced drivers table for comprehensive driver data
export const drivers = pgTable("drivers", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
  firstName: text("first_name"),
  lastName: text("last_name"),
  relationship: text("relationship").notNull(),
  birthDate: text("birth_date"),
  gender: text("gender"),
  maritalStatus: text("marital_status"),
  licenseStatus: text("license_status").notNull(),
  licenseState: text("license_state"),
  ageLicensed: integer("age_licensed"),
  licenseEverSuspended: boolean("license_ever_suspended").default(false),
  requiresSr22: boolean("requires_sr22").default(false),
  education: text("education"),
  occupation: text("occupation"),
  residenceType: text("residence_type"),
  monthsAtResidence: integer("months_at_residence"),
  monthsAtEmployer: integer("months_at_employer"),
  bankruptcy: boolean("bankruptcy").default(false),
  violations: integer("violations").default(0),
  majorViolations: json("major_violations").$type<Array<{
    state: string;
    description: string;
    violation_date: string;
  }>>(),
  tickets: json("tickets").$type<Array<{
    ticket_date: string;
    description: string;
  }>>(),
  accidents: json("accidents").$type<Array<{
    accident_date: string;
    damage: string;
    at_fault: boolean;
    description: string;
  }>>(),
  claims: json("claims").$type<Array<{
    claim_date: string;
    paid_amount: string;
    description: string;
  }>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Enhanced vehicles table for comprehensive vehicle data
export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
  year: integer("year").notNull(),
  make: text("make").notNull(),
  model: text("model").notNull(),
  submodel: text("submodel"),
  vin: text("vin"),
  ownership: text("ownership"), // Own, Lease, Finance
  primaryUse: text("primary_use"), // Pleasure, Commute, Business, etc.
  annualMiles: integer("annual_miles"),
  oneWayDistance: integer("one_way_distance"),
  weeklyCommuteDays: integer("weekly_commute_days"),
  garage: text("garage"), // Garage, Car Port, On Street, No Cover
  collisionDeductible: text("collision_deductible"),
  comprehensiveDeductible: text("comprehensive_deductible"),
  fourWheelDrive: boolean("four_wheel_drive").default(false),
  airbags: boolean("airbags").default(false),
  abs: boolean("abs").default(false),
  automaticSeatBelts: boolean("automatic_seat_belts").default(false),
  alarm: text("alarm"),
  rental: boolean("rental").default(false),
  towing: boolean("towing").default(false),
  salvaged: boolean("salvaged").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Keep existing tables
export const smsMessages = pgTable("sms_messages", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
  phone: text("phone").notNull(),
  message: text("message").notNull(),
  messageType: text("message_type").notNull(), // followup, urgent, lastchance, custom
  templateUsed: text("template_used"),
  status: text("status").notNull().default("pending"), // pending, sent, delivered, failed
  twilioSid: text("twilio_sid"),
  errorCode: text("error_code"),
  errorMessage: text("error_message"),
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const optOuts = pgTable("opt_outs", {
  id: serial("id").primaryKey(),
  phone: text("phone").notNull().unique(),
  optOutMethod: text("opt_out_method").notNull(), // sms_reply, manual, auto_error
  optOutMessage: text("opt_out_message"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const suppressionList = pgTable("suppression_list", {
  id: serial("id").primaryKey(),
  phone: text("phone").notNull().unique(),
  reason: text("reason"),
  source: text("source").default("manual"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const quoteViews = pgTable("quote_views", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
  qfCode: text("qf_code").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  viewedAt: timestamp("viewed_at").defaultNow().notNull()
});

export const callTracking = pgTable("call_tracking", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
  qfCode: text("qf_code").notNull(),
  phoneNumber: text("phone_number").notNull(),
  callStarted: boolean("call_started").default(false),
  callDuration: integer("call_duration"), // seconds
  callStatus: text("call_status"), // completed, busy, no_answer, failed
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const systemAlerts = pgTable("system_alerts", {
  id: serial("id").primaryKey(),
  alertType: text("alert_type").notNull(),
  severity: text("severity").notNull(), // info, warning, error, critical
  message: text("message").notNull(),
  metadata: json("metadata"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull()
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
  updatedAt: true
});

export const insertDriverSchema = createInsertSchema(drivers).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertVehicleSchema = createInsertSchema(vehicles).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertSmsMessageSchema = createInsertSchema(smsMessages).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertOptOutSchema = createInsertSchema(optOuts).omit({
  id: true,
  createdAt: true
});

export const insertQuoteViewSchema = createInsertSchema(quoteViews).omit({
  id: true,
  viewedAt: true
});

export const insertCallTrackingSchema = createInsertSchema(callTracking).omit({
  id: true,
  createdAt: true
});

export const insertSystemAlertSchema = createInsertSchema(systemAlerts).omit({
  id: true,
  createdAt: true
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

// Webhook schema for your actual data structure
export const webhookLeadSchema = z.object({
  id: z.number().optional(),
  url: z.string().optional(),
  timestamp: z.string().optional(),
  sell_price: z.union([z.number(), z.string()]).transform(val => typeof val === 'string' ? parseFloat(val) : val).optional(),
  campaign_id: z.union([z.number(), z.string()]).transform(val => typeof val === 'string' ? val : val.toString()).optional(),
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