import { 
  leads, drivers, vehicles, smsMessages, optOuts, suppressionList, 
  quoteViews, callTracking, systemAlerts,
  type Lead, type InsertLead, type Driver, type InsertDriver,
  type Vehicle, type InsertVehicle, type SmsMessage, type InsertSmsMessage,
  type OptOut, type InsertOptOut, type QuoteView, type InsertQuoteView,
  type CallTracking, type InsertCallTracking, type SystemAlert, type InsertSystemAlert
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, count, sql, inArray } from "drizzle-orm";

export interface IStorage {
  // Lead management
  createLead(lead: InsertLead): Promise<Lead>;
  getLeadByQfCode(qfCode: string): Promise<Lead | undefined>;
  getRecentLeads(limit?: number): Promise<(Lead & { drivers: Driver[], vehicles: Vehicle[], smsMessages: SmsMessage[] })[]>;
  getLeadWithDetails(id: number): Promise<(Lead & { drivers: Driver[], vehicles: Vehicle[] }) | undefined>;
  
  // Driver management
  createDriver(driver: InsertDriver): Promise<Driver>;
  getDriversByLeadId(leadId: number): Promise<Driver[]>;
  
  // Vehicle management
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  getVehiclesByLeadId(leadId: number): Promise<Vehicle[]>;
  
  // SMS management
  createSmsMessage(sms: InsertSmsMessage): Promise<SmsMessage>;
  updateSmsMessage(id: number, updates: Partial<SmsMessage>): Promise<SmsMessage>;
  getPendingSmsMessages(limit?: number): Promise<SmsMessage[]>;
  getSmsMessagesByLeadId(leadId: number): Promise<SmsMessage[]>;
  getSmsStats(): Promise<{ 
    sentToday: number, 
    deliveredToday: number, 
    failedToday: number,
    deliveryRate: number 
  }>;
  
  // Opt-out management
  createOptOut(optOut: InsertOptOut): Promise<OptOut>;
  isPhoneOptedOut(phone: string): Promise<boolean>;
  getOptOutStats(): Promise<{ today: number, thisWeek: number, total: number }>;
  
  // Suppression list
  addToSuppressionList(phone: string, reason?: string, source?: string): Promise<void>;
  isPhoneSuppressed(phone: string): Promise<boolean>;
  
  // Quote tracking
  createQuoteView(view: InsertQuoteView): Promise<QuoteView>;
  getQuoteViewsByLeadId(leadId: number): Promise<QuoteView[]>;
  getTopPerformingQuotes(limit?: number): Promise<{
    qfCode: string,
    leadName: string,
    state: string,
    views: number,
    calls: number
  }[]>;
  
  // Call tracking
  createCallTracking(call: InsertCallTracking): Promise<CallTracking>;
  getCallConversionStats(): Promise<{ 
    totalCalls: number, 
    completedCalls: number, 
    conversionRate: number 
  }>;
  
  // System alerts
  createSystemAlert(alert: InsertSystemAlert): Promise<SystemAlert>;
  getUnreadAlerts(): Promise<SystemAlert[]>;
  markAlertAsRead(id: number): Promise<void>;
  
  // Dashboard metrics
  getDashboardMetrics(): Promise<{
    totalLeads: number,
    smsSentToday: number,
    quoteViews: number,
    callConversions: number,
    deliveryRate: number,
    conversionRate: number
  }>;
}

export class DatabaseStorage implements IStorage {
  async createLead(insertLead: InsertLead): Promise<Lead> {
    const [lead] = await db
      .insert(leads)
      .values(insertLead)
      .returning();
    return lead;
  }

  async getLeadByQfCode(qfCode: string): Promise<Lead | undefined> {
    const [lead] = await db.select().from(leads).where(eq(leads.qfCode, qfCode));
    return lead || undefined;
  }

  async getRecentLeads(limit = 10): Promise<(Lead & { drivers: Driver[], vehicles: Vehicle[], smsMessages: SmsMessage[] })[]> {
    const recentLeads = await db.query.leads.findMany({
      limit,
      orderBy: [desc(leads.createdAt)],
      with: {
        drivers: true,
        vehicles: true,
        smsMessages: {
          orderBy: [desc(smsMessages.createdAt)],
          limit: 1
        }
      }
    });
    return recentLeads;
  }

  async getLeadWithDetails(id: number): Promise<(Lead & { drivers: Driver[], vehicles: Vehicle[] }) | undefined> {
    const lead = await db.query.leads.findFirst({
      where: eq(leads.id, id),
      with: {
        drivers: true,
        vehicles: true
      }
    });
    return lead;
  }

  async createDriver(insertDriver: InsertDriver): Promise<Driver> {
    const [driver] = await db
      .insert(drivers)
      .values(insertDriver)
      .returning();
    return driver;
  }

  async getDriversByLeadId(leadId: number): Promise<Driver[]> {
    return await db.select().from(drivers).where(eq(drivers.leadId, leadId));
  }

  async createVehicle(insertVehicle: InsertVehicle): Promise<Vehicle> {
    const [vehicle] = await db
      .insert(vehicles)
      .values(insertVehicle)
      .returning();
    return vehicle;
  }

  async getVehiclesByLeadId(leadId: number): Promise<Vehicle[]> {
    return await db.select().from(vehicles).where(eq(vehicles.leadId, leadId));
  }

  async createSmsMessage(insertSms: InsertSmsMessage): Promise<SmsMessage> {
    const [sms] = await db
      .insert(smsMessages)
      .values(insertSms)
      .returning();
    return sms;
  }

  async updateSmsMessage(id: number, updates: Partial<SmsMessage>): Promise<SmsMessage> {
    const [sms] = await db
      .update(smsMessages)
      .set(updates)
      .where(eq(smsMessages.id, id))
      .returning();
    return sms;
  }

  async getPendingSmsMessages(limit = 50): Promise<SmsMessage[]> {
    return await db.select()
      .from(smsMessages)
      .where(eq(smsMessages.status, 'pending'))
      .orderBy(smsMessages.createdAt)
      .limit(limit);
  }

  async getSmsMessagesByLeadId(leadId: number): Promise<SmsMessage[]> {
    return await db.select()
      .from(smsMessages)
      .where(eq(smsMessages.leadId, leadId))
      .orderBy(desc(smsMessages.createdAt));
  }

  async getSmsStats(): Promise<{ sentToday: number, deliveredToday: number, failedToday: number, deliveryRate: number }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [sentResult] = await db.select({ count: count() })
      .from(smsMessages)
      .where(and(
        gte(smsMessages.sentAt, today),
        inArray(smsMessages.status, ['sent', 'delivered', 'failed'])
      ));
    
    const [deliveredResult] = await db.select({ count: count() })
      .from(smsMessages)
      .where(and(
        gte(smsMessages.deliveredAt, today),
        eq(smsMessages.status, 'delivered')
      ));
    
    const [failedResult] = await db.select({ count: count() })
      .from(smsMessages)
      .where(and(
        gte(smsMessages.sentAt, today),
        eq(smsMessages.status, 'failed')
      ));

    const sentToday = sentResult.count;
    const deliveredToday = deliveredResult.count;
    const failedToday = failedResult.count;
    const deliveryRate = sentToday > 0 ? (deliveredToday / sentToday) * 100 : 0;

    return { sentToday, deliveredToday, failedToday, deliveryRate };
  }

  async createOptOut(insertOptOut: InsertOptOut): Promise<OptOut> {
    const [optOut] = await db
      .insert(optOuts)
      .values(insertOptOut)
      .returning();
    return optOut;
  }

  async isPhoneOptedOut(phone: string): Promise<boolean> {
    const [result] = await db.select().from(optOuts).where(eq(optOuts.phone, phone));
    return !!result;
  }

  async getOptOutStats(): Promise<{ today: number, thisWeek: number, total: number }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);

    const [todayResult] = await db.select({ count: count() })
      .from(optOuts)
      .where(gte(optOuts.createdAt, today));

    const [weekResult] = await db.select({ count: count() })
      .from(optOuts)
      .where(gte(optOuts.createdAt, weekAgo));

    const [totalResult] = await db.select({ count: count() }).from(optOuts);

    return {
      today: todayResult.count,
      thisWeek: weekResult.count,
      total: totalResult.count
    };
  }

  async addToSuppressionList(phone: string, reason?: string, source = 'manual'): Promise<void> {
    await db.insert(suppressionList)
      .values({ phone, reason, source })
      .onConflictDoNothing();
  }

  async isPhoneSuppressed(phone: string): Promise<boolean> {
    const [result] = await db.select().from(suppressionList).where(eq(suppressionList.phone, phone));
    return !!result;
  }

  async createQuoteView(insertView: InsertQuoteView): Promise<QuoteView> {
    const [view] = await db
      .insert(quoteViews)
      .values(insertView)
      .returning();
    return view;
  }

  async getQuoteViewsByLeadId(leadId: number): Promise<QuoteView[]> {
    return await db.select()
      .from(quoteViews)
      .where(eq(quoteViews.leadId, leadId))
      .orderBy(desc(quoteViews.viewedAt));
  }

  async getTopPerformingQuotes(limit = 5): Promise<{
    qfCode: string,
    leadName: string,
    state: string,
    views: number,
    calls: number
  }[]> {
    const results = await db.select({
      qfCode: leads.qfCode,
      leadName: sql<string>`${leads.firstName} || ' ' || ${leads.lastName}`,
      state: leads.state,
      views: count(quoteViews.id),
      calls: sql<number>`COALESCE(call_counts.call_count, 0)`
    })
    .from(leads)
    .leftJoin(quoteViews, eq(leads.id, quoteViews.leadId))
    .leftJoin(
      sql`(SELECT lead_id, COUNT(*) as call_count FROM ${callTracking} GROUP BY lead_id) as call_counts`,
      sql`${leads.id} = call_counts.lead_id`
    )
    .groupBy(leads.id, leads.qfCode, leads.firstName, leads.lastName, leads.state, sql`call_counts.call_count`)
    .orderBy(desc(count(quoteViews.id)))
    .limit(limit);

    return results.map(r => ({
      qfCode: r.qfCode,
      leadName: r.leadName,
      state: r.state,
      views: r.views,
      calls: r.calls
    }));
  }

  async createCallTracking(insertCall: InsertCallTracking): Promise<CallTracking> {
    const [call] = await db
      .insert(callTracking)
      .values(insertCall)
      .returning();
    return call;
  }

  async getCallConversionStats(): Promise<{ totalCalls: number, completedCalls: number, conversionRate: number }> {
    const [totalResult] = await db.select({ count: count() }).from(callTracking);
    const [completedResult] = await db.select({ count: count() })
      .from(callTracking)
      .where(eq(callTracking.callStatus, 'completed'));

    const totalCalls = totalResult.count;
    const completedCalls = completedResult.count;
    const conversionRate = totalCalls > 0 ? (completedCalls / totalCalls) * 100 : 0;

    return { totalCalls, completedCalls, conversionRate };
  }

  async createSystemAlert(insertAlert: InsertSystemAlert): Promise<SystemAlert> {
    const [alert] = await db
      .insert(systemAlerts)
      .values(insertAlert)
      .returning();
    return alert;
  }

  async getUnreadAlerts(): Promise<SystemAlert[]> {
    return await db.select()
      .from(systemAlerts)
      .where(eq(systemAlerts.isRead, false))
      .orderBy(desc(systemAlerts.createdAt));
  }

  async markAlertAsRead(id: number): Promise<void> {
    await db.update(systemAlerts)
      .set({ isRead: true })
      .where(eq(systemAlerts.id, id));
  }

  async getDashboardMetrics(): Promise<{
    totalLeads: number,
    smsSentToday: number,
    quoteViews: number,
    callConversions: number,
    deliveryRate: number,
    conversionRate: number
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [leadsResult] = await db.select({ count: count() }).from(leads);
    const [smsResult] = await db.select({ count: count() })
      .from(smsMessages)
      .where(gte(smsMessages.sentAt, today));
    const [viewsResult] = await db.select({ count: count() })
      .from(quoteViews)
      .where(gte(quoteViews.viewedAt, today));
    const [callsResult] = await db.select({ count: count() })
      .from(callTracking)
      .where(gte(callTracking.createdAt, today));

    const smsStats = await this.getSmsStats();
    const callStats = await this.getCallConversionStats();

    return {
      totalLeads: leadsResult.count,
      smsSentToday: smsResult.count,
      quoteViews: viewsResult.count,
      callConversions: callsResult.count,
      deliveryRate: smsStats.deliveryRate,
      conversionRate: callStats.conversionRate
    };
  }
}

export const storage = new DatabaseStorage();
