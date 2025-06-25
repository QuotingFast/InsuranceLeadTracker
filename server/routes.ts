import { Request, Response } from "express";
import { Express } from "express";
import { Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { z } from "zod";
import { 
  webhookLeadSchema, 
  customSmsSchema,
  type WebhookLead,
  type CustomSms 
} from "@shared/schema";
import { storage } from "./storage";
import { 
  sendSms, 
  getRandomTemplate, 
  personalizeSmsMessage, 
  isOptOutMessage,
  isAutoOptOutError 
} from "./services/twilio";
import { 
  validateTCPACompliance, 
  normalizePhoneNumber,
  getStateFromZipCode,
  isEmergencyStopActive 
} from "./services/compliance";
import { sendAdminNotification, startHourlyReports, startHealthChecks } from "./services/notifications";

let wsConnections = new Set<WebSocket>();

function generateQFCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'QF';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function processLeadSMS(leadId: number, messageType: 'followup' | 'urgent' | 'lastchance' = 'followup') {
  try {
    const lead = await storage.getLeadWithDetails(leadId);
    if (!lead) return;

    // Check if already opted out
    if (await storage.isPhoneOptedOut(lead.phone)) {
      console.log(`Phone ${lead.phone} is opted out, skipping SMS`);
      return;
    }

    // TCPA compliance check
    const complianceResult = validateTCPACompliance(lead.state, lead.phone);
    if (!complianceResult.isCompliant) {
      console.log(`TCPA compliance failed for ${lead.phone}: ${complianceResult.reason}`);
      return;
    }

    // Get appropriate template
    const template = getRandomTemplate(messageType);
    const personalizedMessage = personalizeSmsMessage(template, lead.firstName, lead.qfCode);

    // Create SMS record
    const smsRecord = await storage.createSmsMessage({
      leadId: lead.id,
      phone: lead.phone,
      message: personalizedMessage,
      messageType,
      templateUsed: template
    });

    // Send SMS
    const result = await sendSms(lead.phone, personalizedMessage);
    
    // Update SMS record with result
    await storage.updateSmsMessage(smsRecord.id, {
      status: result.success ? 'sent' : 'failed',
      twilioSid: result.messageSid,
      errorCode: result.errorCode,
      errorMessage: result.errorMessage,
      sentAt: result.success ? new Date() : undefined
    });

    // Broadcast update
    broadcastToClients('sms_sent', { 
      leadId, 
      phone: lead.phone, 
      status: result.success ? 'sent' : 'failed' 
    });

  } catch (error) {
    console.error(`Error processing SMS for lead ${leadId}:`, error);
  }
}

function broadcastToClients(type: string, data: any) {
  wsConnections.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type, data, timestamp: new Date().toISOString() }));
    }
  });
}

export async function registerRoutes(app: Express, server: Server): Promise<void> {
  // WebSocket setup
  const wss = new WebSocketServer({ server, path: '/ws' });
  
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    wsConnections.add(ws);
    
    ws.on('close', () => {
      wsConnections.delete(ws);
      console.log('WebSocket client disconnected');
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      wsConnections.delete(ws);
    });
  });

  // Start background services
  startHourlyReports();
  startHealthChecks();


  // Lead webhook endpoint
  app.post('/api/webhook/lead', async (req, res) => {
    try {
      const webhookData = webhookLeadSchema.parse(req.body);
      
      // Normalize phone number
      const normalizedPhone = normalizePhoneNumber(webhookData.contact.phone);
      
      // Check for duplicate
      const existingLead = await storage.getRecentLeads(1000);
      const duplicate = existingLead.find(lead => 
        lead.phone === normalizedPhone || 
        (webhookData.contact.email && lead.email === webhookData.contact.email)
      );
      
      if (duplicate) {
        return res.json({ 
          success: true, 
          message: 'Duplicate lead detected',
          qfCode: duplicate.qfCode 
        });
      }

      // Auto-populate state from ZIP if missing
      let state = webhookData.contact.state || '';
      if (!state && webhookData.contact.zip_code) {
        state = getStateFromZipCode(webhookData.contact.zip_code) || '';
      }

      if (!state) {
        return res.status(400).json({ 
          error: 'State required for TCPA compliance' 
        });
      }

      // Generate unique QF code
      let qfCode: string;
      let isUnique = false;
      do {
        qfCode = generateQFCode();
        const existing = await storage.getLeadByQfCode(qfCode);
        isUnique = !existing;
      } while (!isUnique);

      // Create lead record with comprehensive data
      const lead = await storage.createLead({
        qfCode,
        firstName: webhookData.contact.first_name,
        lastName: webhookData.contact.last_name,
        email: webhookData.contact.email || '',
        phone: normalizedPhone,
        phone2: webhookData.contact.phone2,
        address: webhookData.contact.address,
        address2: webhookData.contact.address2,
        city: webhookData.contact.city,
        state: state,
        zipCode: webhookData.contact.zip_code || '',
        ipAddress: webhookData.contact.ip_address,
        leadIdCode: webhookData.meta?.lead_id_code,
        campaignId: webhookData.campaign_id,
        offerId: webhookData.meta?.offer_id,
        sourceId: webhookData.meta?.source_id,
        sellPrice: webhookData.sell_price,
        landingPageUrl: webhookData.meta?.landing_page_url,
        userAgent: webhookData.meta?.user_agent,
        currentPolicy: webhookData.data.current_policy,
        requestedCoverageType: webhookData.data.requested_policy?.coverage_type,
        requestedPropertyDamage: webhookData.data.requested_policy?.property_damage,
        requestedBodilyInjury: webhookData.data.requested_policy?.bodily_injury,
        tcpaCompliant: webhookData.meta?.tcpa_compliant || false,
        tcpaConsentText: webhookData.meta?.tcpa_consent_text,
        trustedFormCertUrl: webhookData.meta?.trusted_form_cert_url,
        originallyCreated: webhookData.meta?.originally_created ? new Date(webhookData.meta.originally_created) : undefined,
        rawData: req.body
      });

      // Create driver records
      if (webhookData.data.drivers) {
        for (const driverData of webhookData.data.drivers) {
          await storage.createDriver({
            leadId: lead.id,
            firstName: driverData.first_name,
            lastName: driverData.last_name,
            relationship: driverData.relationship,
            birthDate: driverData.birth_date,
            gender: driverData.gender,
            maritalStatus: driverData.marital_status,
            licenseStatus: driverData.license_status,
            licenseState: driverData.license_state,
            ageLicensed: driverData.age_licensed,
            licenseEverSuspended: driverData.license_ever_suspended,
            requiresSr22: driverData.requires_sr22,
            education: driverData.education,
            occupation: driverData.occupation,
            residenceType: driverData.residence_type,
            monthsAtResidence: driverData.months_at_residence,
            monthsAtEmployer: driverData.months_at_employer,
            bankruptcy: driverData.bankruptcy,
            violations: driverData.major_violations?.length || 0,
            majorViolations: driverData.major_violations,
            tickets: driverData.tickets,
            accidents: driverData.accidents,
            claims: driverData.claims
          });
        }
      }

      // Create vehicle records
      if (webhookData.data.vehicles) {
        for (const vehicleData of webhookData.data.vehicles) {
          await storage.createVehicle({
            leadId: lead.id,
            year: vehicleData.year,
            make: vehicleData.make,
            model: vehicleData.model,
            submodel: vehicleData.submodel,
            vin: vehicleData.vin,
            ownership: vehicleData.ownership,
            primaryUse: vehicleData.primary_use,
            annualMiles: vehicleData.annual_miles,
            oneWayDistance: vehicleData.one_way_distance,
            weeklyCommuteDays: vehicleData.weekly_commute_days,
            garage: vehicleData.garage,
            collisionDeductible: vehicleData.collision_deductible,
            comprehensiveDeductible: vehicleData.comprehensive_deductible,
            fourWheelDrive: vehicleData.four_wheel_drive,
            airbags: vehicleData.airbags,
            abs: vehicleData.abs,
            automaticSeatBelts: vehicleData.automatic_seat_belts,
            alarm: vehicleData.alarm,
            rental: vehicleData.rental,
            towing: vehicleData.towing,
            salvaged: vehicleData.salvaged
          });
        }
      }

      // SMS follow-up disabled - only send when explicitly requested
      // setTimeout(async () => {
      //   try {
      //     await processLeadSMS(lead.id, 'followup');
      //   } catch (error) {
      //     console.error('Failed to send follow-up SMS:', error);
      //   }
      // }, 2 * 60 * 1000);

      // Broadcast new lead to connected clients
      broadcastToClients('new_lead', { 
        lead: { ...lead, drivers: [], vehicles: [], smsMessages: [] }
      });

      res.json({ success: true, qfCode, leadId: lead.id });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).json({ error: 'Failed to process lead' });
    }
  });

  // Quote page endpoint
  app.get('/api/quote/:qfCode', async (req, res) => {
    try {
      const { qfCode } = req.params;
      const lead = await storage.getLeadByQfCode(qfCode);
      
      if (!lead) {
        return res.status(404).json({ error: 'Quote not found' });
      }

      // Get drivers and vehicles for this lead
      const drivers = await storage.getDriversByLeadId(lead.id);
      const vehicles = await storage.getVehiclesByLeadId(lead.id);

      // Track quote view
      await storage.createQuoteView({
        leadId: lead.id,
        qfCode: lead.qfCode,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || ''
      });

      res.json({
        ...lead,
        drivers,
        vehicles
      });
    } catch (error) {
      console.error('Error fetching quote:', error);
      res.status(500).json({ error: 'Failed to fetch quote' });
    }
  });

  // Call tracking endpoint
  app.post('/api/calls/track', async (req, res) => {
    try {
      const { leadId, qfCode, phoneNumber } = req.body;
      
      await storage.createCallTracking({
        leadId,
        qfCode,
        phoneNumber,
        callStarted: true
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Error tracking call:', error);
      res.status(500).json({ error: 'Failed to track call' });
    }
  });

  // Additional API routes
  app.get('/api/leads/recent', async (req, res) => {
    try {
      const leads = await storage.getRecentLeads();
      res.json(leads);
    } catch (error) {
      console.error('Error fetching recent leads:', error);
      res.status(500).json({ error: 'Failed to fetch leads' });
    }
  });

  app.get('/api/dashboard/metrics', async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      res.status(500).json({ error: 'Failed to fetch metrics' });
    }
  });

  // Get quote data by QF code
  app.get('/api/quotes/:qfCode', async (req, res) => {
    try {
      const { qfCode } = req.params;
      
      if (!qfCode || !qfCode.startsWith('QF')) {
        return res.status(400).json({ error: 'Invalid quote code' });
      }

      const lead = await storage.getLeadByQfCode(qfCode);
      if (!lead) {
        return res.status(404).json({ error: 'Quote not found or expired' });
      }

      // Get additional details
      const leadWithDetails = await storage.getLeadWithDetails(lead.id);
      if (!leadWithDetails) {
        return res.status(404).json({ error: 'Quote details not found' });
      }

      res.json(leadWithDetails);
    } catch (error) {
      console.error('Error fetching quote:', error);
      res.status(500).json({ error: 'Failed to fetch quote' });
    }
  });

  // Track quote view
  app.post('/api/quotes/view', async (req, res) => {
    try {
      const { qfCode } = req.body;
      
      if (!qfCode) {
        return res.status(400).json({ error: 'QF code is required' });
      }

      const lead = await storage.getLeadByQfCode(qfCode);
      if (!lead) {
        return res.status(404).json({ error: 'Quote not found' });
      }

      // Create quote view record
      await storage.createQuoteView({
        leadId: lead.id,
        userAgent: req.headers['user-agent'] || 'Unknown',
        ipAddress: req.ip || req.connection.remoteAddress || 'Unknown'
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Error tracking quote view:', error);
      res.status(500).json({ error: 'Failed to track view' });
    }
  });

  // Track phone call
  app.post('/api/calls/track', async (req, res) => {
    try {
      const { qfCode, phoneNumber, buttonType, timestamp } = req.body;
      
      if (!qfCode || !phoneNumber) {
        return res.status(400).json({ error: 'QF code and phone number are required' });
      }

      const lead = await storage.getLeadByQfCode(qfCode);
      if (!lead) {
        return res.status(404).json({ error: 'Quote not found' });
      }

      // Create call tracking record
      await storage.createCallTracking({
        leadId: lead.id,
        phoneNumber,
        buttonType: buttonType || 'generic',
        userAgent: req.headers['user-agent'] || 'Unknown',
        ipAddress: req.ip || req.connection.remoteAddress || 'Unknown'
      });

      // Broadcast call tracking to connected clients
      broadcastToClients('call_tracked', {
        qfCode,
        phoneNumber,
        buttonType,
        timestamp: timestamp || new Date().toISOString()
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Error tracking call:', error);
      res.status(500).json({ error: 'Failed to track call' });
    }
  });

  app.post('/api/sms/custom', async (req, res) => {
    try {
      const { phoneNumber, message } = customSmsSchema.parse(req.body);
      
      if (isEmergencyStopActive()) {
        return res.status(503).json({ error: 'Emergency stop is active' });
      }

      const normalizedPhone = normalizePhoneNumber(phoneNumber);
      
      // Check if phone is opted out or suppressed
      const isOptedOut = await storage.isPhoneOptedOut(normalizedPhone);
      const isSuppressed = await storage.isPhoneSuppressed(normalizedPhone);
      
      if (isOptedOut || isSuppressed) {
        return res.status(400).json({ 
          error: 'Cannot send SMS to opted-out or suppressed number' 
        });
      }

      // Automatically append opt-out text if not already present
      let finalMessage = message.trim();
      const optOutText = ' Reply STOP to opt out.';
      const hasOptOut = /reply\s+stop|text\s+stop|stop\s+to/i.test(finalMessage);
      
      if (!hasOptOut) {
        finalMessage += optOutText;
      }

      // Validate TCPA compliance  
      const now = new Date();
      const validation = validateTCPACompliance(normalizedPhone, 'FL', now);
      
      if (!validation.isCompliant) {
        return res.status(400).json({ 
          error: `TCPA Violation: ${validation.reason}`,
          nextValidTime: validation.nextValidTime 
        });
      }

      console.log('Attempting to send SMS to:', normalizedPhone, 'Message:', finalMessage.substring(0, 50) + '...');
      const result = await sendSms(normalizedPhone, finalMessage);
      console.log('SMS Result:', result);
      
      if (result.success) {
        console.log('✅ SMS sent successfully!', result.messageSid);
        // Log the SMS in database if we have a matching lead
        try {
          const recentLeads = await storage.getRecentLeads(1000);
          const matchingLead = recentLeads.find(l => normalizePhoneNumber(l.phone) === normalizedPhone);
          
          if (matchingLead) {
            await storage.createSmsMessage({
              leadId: matchingLead.id,
              phone: normalizedPhone,
              message: finalMessage,
              messageType: 'custom',
              status: 'sent',
              twilioSid: result.messageSid
            });
          }
        } catch (logError) {
          console.warn('Failed to log SMS in database:', logError);
        }

        res.json({ success: true, messageSid: result.messageSid });
      } else {
        res.status(400).json({ 
          error: 'Failed to send SMS',
          details: result.errorMessage 
        });
      }

    } catch (error) {
      console.error('Error sending custom SMS:', error);
      res.status(500).json({ 
        error: 'Failed to send SMS',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });


}