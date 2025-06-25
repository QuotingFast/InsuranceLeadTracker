import { Twilio } from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID || process.env.TWILIO_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN || process.env.TWILIO_TOKEN;
const phoneNumber = process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_FROM_NUMBER;

if (!accountSid || !authToken || !phoneNumber) {
  throw new Error('Missing Twilio credentials. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER');
}

const client = new Twilio(accountSid, authToken);

export interface SendSmsResult {
  success: boolean;
  messageSid?: string;
  errorCode?: string;
  errorMessage?: string;
}

export async function sendSms(
  to: string,
  message: string,
  webhookUrl?: string
): Promise<SendSmsResult> {
  try {
    const messageOptions: any = {
      body: message,
      from: phoneNumber,
      to: to
    };

    if (webhookUrl) {
      messageOptions.statusCallback = webhookUrl;
    }

    const twilioMessage = await client.messages.create(messageOptions);

    return {
      success: true,
      messageSid: twilioMessage.sid
    };
  } catch (error: any) {
    console.error('Twilio SMS Error:', error);
    
    return {
      success: false,
      errorCode: error.code?.toString() || 'UNKNOWN',
      errorMessage: error.message || 'Unknown error occurred'
    };
  }
}

export async function getMessageStatus(messageSid: string) {
  try {
    const message = await client.messages(messageSid).fetch();
    return {
      status: message.status,
      errorCode: message.errorCode,
      errorMessage: message.errorMessage,
      dateUpdated: message.dateUpdated
    };
  } catch (error: any) {
    console.error('Error fetching message status:', error);
    return null;
  }
}

export function isOptOutMessage(messageBody: string): boolean {
  const optOutKeywords = [
    'STOP', 'STOPALL', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT'
  ];
  
  const normalizedMessage = messageBody.trim().toUpperCase();
  return optOutKeywords.includes(normalizedMessage);
}

export function isAutoOptOutError(errorCode: string): boolean {
  // Twilio error codes that indicate automatic opt-out
  const autoOptOutCodes = ['21610', '21211', '21408'];
  return autoOptOutCodes.includes(errorCode);
}

// Message templates with variations to prevent spam flagging
export const messageTemplates = {
  followup: [
    "Hi {name}! We found you an exclusive insurance quote. Check it out: {quote_link}",
    "Hello {name}, your personalized insurance quote is ready! View it here: {quote_link}",
    "{name}, we've prepared a custom insurance quote just for you: {quote_link}",
    "Hi {name}! Your insurance quote comparison is complete. See savings: {quote_link}",
    "Hello {name}, exclusive insurance rates available for you: {quote_link}",
  ],
  urgent: [
    "⏰ {name}, your quote expires soon! Don't miss out: {quote_link}",
    "⚡ Limited time: Your insurance quote is ready {name}! {quote_link}",
    "🔥 {name}, exclusive rates ending soon. View now: {quote_link}",
    "⏳ Time sensitive: {name}, your personalized quote awaits: {quote_link}",
    "⚠️ {name}, your insurance quote review deadline approaching: {quote_link}",
  ],
  lastchance: [
    "🚨 FINAL NOTICE {name}: Your insurance quote expires today! {quote_link}",
    "⌛ LAST CHANCE {name}: Exclusive rates expire midnight! {quote_link}",
    "🔔 {name}, this is your final insurance quote reminder: {quote_link}",
    "⚡ EXPIRES TODAY {name}: Your personalized insurance quote: {quote_link}",
    "🚨 {name}, final opportunity for these insurance rates: {quote_link}",
  ]
};

export function getRandomTemplate(templateType: keyof typeof messageTemplates): string {
  const templates = messageTemplates[templateType];
  return templates[Math.floor(Math.random() * templates.length)];
}

export function personalizeSmsMessage(
  template: string,
  name: string,
  qfCode: string,
  baseUrl: string = process.env.BASE_URL || 'https://quotingfast.io'
): string {
  const quoteLink = `${baseUrl}/quote/${qfCode}`;
  
  return template
    .replace(/{name}/g, name)
    .replace(/{quote_link}/g, quoteLink);
}
