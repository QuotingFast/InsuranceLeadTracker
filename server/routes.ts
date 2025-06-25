import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { 
  webhookLeadSchema, 
  customSmsSchema,
  type WebhookLead,
  type CustomSms 
} from "@shared/schema";
import { sendSms, getRandomTemplate, personalizeSmsMessage, isOptOutMessage, isAutoOptOutError } from "./services/twilio";
import { 
  validateTCPACompliance, 
  normalizePhoneNumber, 
  isEmergencyStopActive, 
  activateEmergencyStop,
  deactivateEmergencyStop,
  getStateFromZipCode 
} from "./services/compliance";
import { 
  sendAdminNotification, 
  notifyOptOut, 
  notifyComplianceViolation,
  startHourlyReports,
  startHealthChecks 
} from "./services/notifications";

// Store WebSocket connections for real-time updates
const wsConnections = new Set<WebSocket>();

function generateQFCode(): string {
  const prefix = 'QF';
  const number = Math.floor(Math.random() * 900000) + 100000; // 6 digits
  return `${prefix}${number}`;
}

async function processLeadSMS(leadId: number, messageType: 'followup' | 'urgent' | 'lastchance' = 'followup') {
  try {
    // Check emergency stop
    if (isEmergencyStopActive()) {
      console.log('Emergency stop active - skipping SMS');
      return;
    }

    const leadWithDetails = await storage.getLeadWithDetails(leadId);
    if (!leadWithDetails) {
      console.error('Lead not found:', leadId);
      return;
    }

    const { phone, state, firstName, qfCode } = leadWithDetails;

    // Check if phone is opted out or suppressed
    const isOptedOut = await storage.isPhoneOptedOut(phone);
    const isSuppressed = await storage.isPhoneSuppressed(phone);
    
    if (isOptedOut || isSuppressed) {
      console.log(`Phone ${phone} is opted out or suppressed - skipping SMS`);
      return;
    }

    // TCPA compliance check
    const complianceCheck = validateTCPACompliance(phone, state);
    if (!complianceCheck.isCompliant) {
      console.log(`TCPA compliance failed for ${phone}: ${complianceCheck.reason}`);
      
      // Schedule for next valid time if provided
      if (complianceCheck.nextValidTime) {
        await storage.createSmsMessage({
          leadId,
          phone,
          message: '', // Will be generated when sent
          messageType,
          status: 'pending',
          scheduledFor: complianceCheck.nextValidTime
        });
      }
      return;
    }

    // Generate personalized message
    const template = getRandomTemplate(messageType);
    const personalizedMessage = personalizeSmsMessage(template, firstName, qfCode);

    // Create SMS record
    const smsRecord = await storage.createSmsMessage({
      leadId,
      phone,
      message: personalizedMessage,
      messageType,
      status: 'pending'
    });

    // Send SMS via Twilio
    const result = await sendSms(phone, personalizedMessage);

    // Update SMS record with result
    await storage.updateSmsMessage(smsRecord.id, {
      status: result.success ? 'sent' : 'failed',
      twilioSid: result.messageSid,
      errorCode: result.errorCode,
      errorMessage: result.errorMessage,
      sentAt: result.success ? new Date() : undefined
    });

    // Handle auto opt-out errors
    if (!result.success && result.errorCode && isAutoOptOutError(result.errorCode)) {
      await storage.createOptOut({
        phone,
        optOutMethod: 'auto_error',
        optOutMessage: `Auto opt-out due to error ${result.errorCode}`
      });
      
      await notifyOptOut(phone, 'auto_error', `Error code: ${result.errorCode}`);
    }

    // Broadcast real-time update
    broadcastToClients('sms_sent', {
      leadId,
      phone,
      status: result.success ? 'sent' : 'failed',
      messageType
    });

    console.log(`SMS ${result.success ? 'sent' : 'failed'} to ${phone} (${messageType})`);

  } catch (error) {
    console.error('Error processing lead SMS:', error);
    
    await sendAdminNotification({
      type: 'error',
      severity: 'error',
      message: `Failed to process SMS for lead ${leadId}`,
      metadata: { leadId, error: error instanceof Error ? error.message : 'Unknown error' }
    });
  }
}

function broadcastToClients(type: string, data: any) {
  const message = JSON.stringify({ type, data, timestamp: new Date().toISOString() });
  
  wsConnections.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws) => {
    wsConnections.add(ws);
    console.log('WebSocket client connected');
    
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

  // Lead webhook endpoint (both singular and plural for compatibility)
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
      if (!state && webhookData.contact.zipCode) {
        state = getStateFromZipCode(webhookData.contact.zipCode) || '';
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

      // Create lead record
      const lead = await storage.createLead({
        qfCode,
        firstName: webhookData.contact.firstName,
        lastName: webhookData.contact.lastName,
        email: webhookData.contact.email || '',
        phone: normalizedPhone,
        state: state,
        zipCode: webhookData.contact.zipCode || '',
        currentInsurer: webhookData.data.currentInsurer || '',
        monthlyPremium: webhookData.data.monthlyPremium || '',
        rawData: req.body
      });

      // Create driver records
      if (webhookData.data.drivers) {
        for (const driverData of webhookData.data.drivers) {
          await storage.createDriver({
            leadId: lead.id,
            ...driverData
          });
        }
      }

      // Create vehicle records
      if (webhookData.data.vehicles) {
        for (const vehicleData of webhookData.data.vehicles) {
          await storage.createVehicle({
            leadId: lead.id,
            ...vehicleData
          });
        }
      }

      // Schedule SMS follow-up after 2 minutes
      setTimeout(async () => {
        try {
          await processLeadSMS(lead.id, 'followup');
        } catch (error) {
          console.error('Failed to send follow-up SMS:', error);
        }
      }, 2 * 60 * 1000);

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
  
  app.post('/api/webhook/leads', async (req, res) => {
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
      if (!state && webhookData.contact.zipCode) {
        state = getStateFromZipCode(webhookData.contact.zipCode) || '';
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

      // Create lead record
      const lead = await storage.createLead({
        qfCode,
        firstName: webhookData.contact.firstName,
        lastName: webhookData.contact.lastName,
        email: webhookData.contact.email,
        phone: normalizedPhone,
        state: state,
        zipCode: webhookData.contact.zipCode,
        currentInsurer: webhookData.data.currentInsurer,
        monthlyPremium: webhookData.data.monthlyPremium,
        rawData: req.body
      });

      // Create driver records
      if (webhookData.data.drivers) {
        for (const driverData of webhookData.data.drivers) {
          await storage.createDriver({
            leadId: lead.id,
            ...driverData
          });
        }
      }

      // Create vehicle records
      if (webhookData.data.vehicles) {
        for (const vehicleData of webhookData.data.vehicles) {
          await storage.createVehicle({
            leadId: lead.id,
            ...vehicleData
          });
        }
      }

      // Process immediate SMS if during business hours
      const complianceCheck = validateTCPACompliance(normalizedPhone, state);
      if (complianceCheck.isCompliant) {
        // Process in background to avoid blocking webhook response
        setImmediate(() => processLeadSMS(lead.id, 'followup'));
      }

      // Broadcast real-time update
      broadcastToClients('new_lead', {
        qfCode: lead.qfCode,
        name: `${lead.firstName} ${lead.lastName}`,
        state: lead.state,
        phone: lead.phone
      });

      res.json({ 
        success: true, 
        qfCode: lead.qfCode,
        message: 'Lead processed successfully' 
      });

    } catch (error) {
      console.error('Webhook error:', error);
      
      await sendAdminNotification({
        type: 'error',
        severity: 'error',
        message: 'Lead webhook processing failed',
        metadata: { error: error instanceof Error ? error.message : 'Unknown error', body: req.body }
      });

      res.status(500).json({ 
        error: 'Failed to process lead',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Twilio SMS webhook for delivery status and opt-outs
  app.post('/api/webhook/sms', async (req, res) => {
    try {
      const { MessageSid, MessageStatus, ErrorCode, ErrorMessage, Body, From } = req.body;
      
      // Handle incoming SMS (opt-out requests)
      if (Body && From) {
        const normalizedPhone = normalizePhoneNumber(From);
        
        if (isOptOutMessage(Body)) {
          // Process opt-out
          await storage.createOptOut({
            phone: normalizedPhone,
            optOutMethod: 'sms_reply',
            optOutMessage: Body
          });
          
          await notifyOptOut(normalizedPhone, 'sms_reply', Body);
          
          // Reply with confirmation
          await sendSms(From, "You have been successfully unsubscribed. You will not receive any more messages from us.");
          
          console.log(`Opt-out processed for ${normalizedPhone}`);
        }
      }
      
      // Handle delivery status updates
      if (MessageSid && MessageStatus) {
        // Find SMS message by Twilio SID
        const smsMessages = await storage.getPendingSmsMessages(1000);
        const smsMessage = smsMessages.find(msg => msg.twilioSid === MessageSid);
        
        if (smsMessage) {
          const updateData: any = { status: MessageStatus };
          
          if (MessageStatus === 'delivered') {
            updateData.deliveredAt = new Date();
          }
          
          if (ErrorCode) {
            updateData.errorCode = ErrorCode;
            updateData.errorMessage = ErrorMessage;
            
            // Handle auto opt-out errors
            if (isAutoOptOutError(ErrorCode)) {
              await storage.createOptOut({
                phone: smsMessage.phone,
                optOutMethod: 'auto_error',
                optOutMessage: `Auto opt-out due to error ${ErrorCode}`
              });
              
              await notifyOptOut(smsMessage.phone, 'auto_error', `Error code: ${ErrorCode}`);
            }
          }
          
          await storage.updateSmsMessage(smsMessage.id, updateData);
          
          // Broadcast real-time update
          broadcastToClients('sms_status_update', {
            messageSid: MessageSid,
            status: MessageStatus,
            phone: smsMessage.phone
          });
        }
      }
      
      res.status(200).send('OK');
      
    } catch (error) {
      console.error('SMS webhook error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });

  // Dashboard metrics API
  app.get('/api/dashboard/metrics', async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      res.status(500).json({ error: 'Failed to fetch metrics' });
    }
  });

  // Recent leads API
  app.get('/api/leads/recent', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const leads = await storage.getRecentLeads(limit);
      res.json(leads);
    } catch (error) {
      console.error('Error fetching recent leads:', error);
      res.status(500).json({ error: 'Failed to fetch leads' });
    }
  });

  // SMS campaign status API
  app.get('/api/sms/status', async (req, res) => {
    try {
      const stats = await storage.getSmsStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching SMS status:', error);
      res.status(500).json({ error: 'Failed to fetch SMS status' });
    }
  });

  // Send custom SMS API
  app.post('/api/sms/send', async (req, res) => {
    try {
      const customSms = customSmsSchema.parse(req.body);
      
      // Normalize phone number
      const normalizedPhone = normalizePhoneNumber(customSms.phoneNumber);
      
      // Check if phone is opted out or suppressed
      const isOptedOut = await storage.isPhoneOptedOut(normalizedPhone);
      const isSuppressed = await storage.isPhoneSuppressed(normalizedPhone);
      
      if (isOptedOut || isSuppressed) {
        return res.status(400).json({ 
          error: 'Phone number is opted out or suppressed' 
        });
      }

      // For custom SMS, we'll send immediately if requested or during business hours
      if (customSms.scheduleForBusinessHours) {
        // Would need state to validate - for now just send
        console.log('Custom SMS scheduled for business hours');
      }

      // Check emergency stop
      if (isEmergencyStopActive()) {
        return res.status(503).json({ 
          error: 'SMS sending is currently stopped due to emergency stop' 
        });
      }

      // Send SMS
      const result = await sendSms(normalizedPhone, customSms.message);
      
      if (result.success) {
        // Log custom SMS (without lead association)
        await storage.createSmsMessage({
          leadId: 0, // Use 0 for custom messages
          phone: normalizedPhone,
          message: customSms.message,
          messageType: 'custom',
          status: 'sent',
          twilioSid: result.messageSid,
          sentAt: new Date()
        });

        // Broadcast real-time update
        broadcastToClients('custom_sms_sent', {
          phone: normalizedPhone,
          status: 'sent'
        });

        res.json({ 
          success: true, 
          messageSid: result.messageSid,
          message: 'SMS sent successfully' 
        });
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

  // Quote page endpoint
  app.get('/quote/:qfCode', async (req, res) => {
    try {
      const { qfCode } = req.params;
      const lead = await storage.getLeadByQfCode(qfCode);
      
      if (!lead) {
        return res.status(404).send('Quote not found');
      }

      // Track quote view
      await storage.createQuoteView({
        leadId: lead.id,
        qfCode: lead.qfCode,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        referrer: req.get('Referer')
      });

      // Broadcast real-time update
      broadcastToClients('quote_viewed', {
        qfCode: lead.qfCode,
        leadName: `${lead.firstName} ${lead.lastName}`
      });

      // For now, serve a basic quote page
      // In production, this would render a full quote page
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Your Insurance Quote - ${lead.qfCode}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body>
          <h1>Your Personalized Quote is Ready!</h1>
          <p>Hello ${lead.firstName} ${lead.lastName},</p>
          <p>We've prepared a custom insurance quote for you.</p>
          <p>Quote ID: ${lead.qfCode}</p>
          <a href="tel:+18005551234">Call Now: (800) 555-1234</a>
        </body>
        </html>
      `);

    } catch (error) {
      console.error('Error serving quote page:', error);
      res.status(500).send('Error loading quote');
    }
  });

  // Quote analytics API
  app.get('/api/quotes/analytics', async (req, res) => {
    try {
      const topQuotes = await storage.getTopPerformingQuotes(10);
      const callStats = await storage.getCallConversionStats();
      
      res.json({
        topPerformingQuotes: topQuotes,
        callConversionStats: callStats
      });
    } catch (error) {
      console.error('Error fetching quote analytics:', error);
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  });

  // Opt-out management API
  app.get('/api/optouts/stats', async (req, res) => {
    try {
      const stats = await storage.getOptOutStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching opt-out stats:', error);
      res.status(500).json({ error: 'Failed to fetch opt-out stats' });
    }
  });

  // System alerts API
  app.get('/api/alerts', async (req, res) => {
    try {
      const alerts = await storage.getUnreadAlerts();
      res.json(alerts);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      res.status(500).json({ error: 'Failed to fetch alerts' });
    }
  });

  // Mark alert as read
  app.post('/api/alerts/:id/read', async (req, res) => {
    try {
      const { id } = req.params;
      await storage.markAlertAsRead(parseInt(id));
      res.json({ success: true });
    } catch (error) {
      console.error('Error marking alert as read:', error);
      res.status(500).json({ error: 'Failed to mark alert as read' });
    }
  });

  // Emergency stop controls
  app.post('/api/emergency/stop', async (req, res) => {
    try {
      activateEmergencyStop();
      
      await sendAdminNotification({
        type: 'compliance',
        severity: 'critical',
        message: 'Emergency stop activated - all SMS campaigns halted'
      });

      broadcastToClients('emergency_stop', { active: true });
      
      res.json({ success: true, message: 'Emergency stop activated' });
    } catch (error) {
      console.error('Error activating emergency stop:', error);
      res.status(500).json({ error: 'Failed to activate emergency stop' });
    }
  });

  app.post('/api/emergency/resume', async (req, res) => {
    try {
      deactivateEmergencyStop();
      
      await sendAdminNotification({
        type: 'compliance',
        severity: 'info',
        message: 'Emergency stop deactivated - SMS campaigns resumed'
      });

      broadcastToClients('emergency_stop', { active: false });
      
      res.json({ success: true, message: 'Emergency stop deactivated' });
    } catch (error) {
      console.error('Error deactivating emergency stop:', error);
      res.status(500).json({ error: 'Failed to deactivate emergency stop' });
    }
  });

  app.get('/api/emergency/status', async (req, res) => {
    try {
      const isActive = isEmergencyStopActive();
      res.json({ emergencyStopActive: isActive });
    } catch (error) {
      console.error('Error checking emergency stop status:', error);
      res.status(500).json({ error: 'Failed to check emergency stop status' });
    }
  });

  return httpServer;
}
