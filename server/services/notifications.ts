import { sendSms } from './twilio';
import { storage } from '../storage';

const ADMIN_PHONE = '9547905093'; // Admin notification number

export interface NotificationAlert {
  type: 'delivery_rate' | 'compliance' | 'error' | 'health_check' | 'hourly_report';
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  metadata?: any;
}

export async function sendAdminNotification(alert: NotificationAlert): Promise<void> {
  try {
    // Create system alert record
    await storage.createSystemAlert({
      alertType: alert.type,
      message: alert.message,
      severity: alert.severity,
      metadata: alert.metadata,
      isRead: false
    });

    // Send SMS to admin for critical/error alerts
    if (alert.severity === 'critical' || alert.severity === 'error') {
      const smsMessage = `🚨 QuotingFast Alert [${alert.severity.toUpperCase()}]: ${alert.message}`;
      
      await sendSms(
        `+1${ADMIN_PHONE}`,
        smsMessage.substring(0, 160) // SMS length limit
      );
    }

    console.log(`Admin notification sent: ${alert.type} - ${alert.message}`);
  } catch (error) {
    console.error('Failed to send admin notification:', error);
  }
}

export async function sendHourlyStatusReport(): Promise<void> {
  try {
    const metrics = await storage.getDashboardMetrics();
    const smsStats = await storage.getSmsStats();
    const optOutStats = await storage.getOptOutStats();

    const report = `📊 Hourly Report:
SMS: ${smsStats.sentToday} sent, ${smsStats.deliveryRate.toFixed(1)}% delivery
Leads: ${metrics.totalLeads} total
Quotes: ${metrics.quoteViews} views today
Calls: ${metrics.callConversions} conversions
Opt-outs: ${optOutStats.today} today`;

    await sendAdminNotification({
      type: 'hourly_report',
      severity: 'info',
      message: 'Hourly status report generated',
      metadata: {
        smsStats,
        metrics,
        optOutStats
      }
    });

    // Send SMS report
    await sendSms(`+1${ADMIN_PHONE}`, report);

  } catch (error) {
    console.error('Failed to send hourly status report:', error);
    
    await sendAdminNotification({
      type: 'error',
      severity: 'error',
      message: 'Failed to generate hourly status report',
      metadata: { error: error.message }
    });
  }
}

export async function checkSystemHealth(): Promise<void> {
  try {
    const metrics = await storage.getDashboardMetrics();
    const smsStats = await storage.getSmsStats();

    // Check delivery rate threshold
    if (smsStats.deliveryRate < 95 && smsStats.sentToday > 10) {
      await sendAdminNotification({
        type: 'delivery_rate',
        severity: 'warning',
        message: `SMS delivery rate dropped to ${smsStats.deliveryRate.toFixed(1)}%`,
        metadata: { deliveryRate: smsStats.deliveryRate, sentToday: smsStats.sentToday }
      });
    }

    // Check for high failure rate
    if (smsStats.failedToday > 50) {
      await sendAdminNotification({
        type: 'error',
        severity: 'error',
        message: `High SMS failure count: ${smsStats.failedToday} failed today`,
        metadata: { failedToday: smsStats.failedToday }
      });
    }

    // Check database connectivity
    const healthCheck = await storage.getDashboardMetrics();
    if (!healthCheck) {
      throw new Error('Database health check failed');
    }

    console.log('System health check completed successfully');

  } catch (error) {
    console.error('System health check failed:', error);
    
    await sendAdminNotification({
      type: 'health_check',
      severity: 'critical',
      message: 'System health check failed',
      metadata: { error: error.message }
    });
  }
}

export async function notifyComplianceViolation(
  phone: string,
  state: string,
  reason: string
): Promise<void> {
  await sendAdminNotification({
    type: 'compliance',
    severity: 'critical',
    message: `TCPA Compliance Violation: ${reason}`,
    metadata: { phone, state, reason }
  });
}

export async function notifyOptOut(
  phone: string,
  method: string,
  message?: string
): Promise<void> {
  await sendAdminNotification({
    type: 'compliance',
    severity: 'info',
    message: `New opt-out: ${phone} via ${method}`,
    metadata: { phone, method, optOutMessage: message }
  });
}

// Schedule hourly reports
export function startHourlyReports(): NodeJS.Timeout {
  return setInterval(async () => {
    await sendHourlyStatusReport();
  }, 60 * 60 * 1000); // Every hour
}

// Schedule health checks every 2-5 minutes
export function startHealthChecks(): NodeJS.Timeout {
  const interval = Math.floor(Math.random() * 3 + 2) * 60 * 1000; // 2-5 minutes
  
  return setInterval(async () => {
    await checkSystemHealth();
  }, interval);
}
