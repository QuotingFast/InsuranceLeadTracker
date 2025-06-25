// TCPA Compliance Service - Critical for legal protection

interface TimezoneInfo {
  state: string;
  timezone: string;
  observesDST: boolean;
}

// State-to-timezone mapping for TCPA compliance
const stateTimezones: TimezoneInfo[] = [
  { state: 'AL', timezone: 'America/Chicago', observesDST: true },
  { state: 'AK', timezone: 'America/Anchorage', observesDST: true },
  { state: 'AZ', timezone: 'America/Phoenix', observesDST: false },
  { state: 'AR', timezone: 'America/Chicago', observesDST: true },
  { state: 'CA', timezone: 'America/Los_Angeles', observesDST: true },
  { state: 'CO', timezone: 'America/Denver', observesDST: true },
  { state: 'CT', timezone: 'America/New_York', observesDST: true },
  { state: 'DE', timezone: 'America/New_York', observesDST: true },
  { state: 'FL', timezone: 'America/New_York', observesDST: true }, // Most of FL
  { state: 'GA', timezone: 'America/New_York', observesDST: true },
  { state: 'HI', timezone: 'Pacific/Honolulu', observesDST: false },
  { state: 'ID', timezone: 'America/Boise', observesDST: true }, // Most of ID
  { state: 'IL', timezone: 'America/Chicago', observesDST: true },
  { state: 'IN', timezone: 'America/Indiana/Indianapolis', observesDST: true },
  { state: 'IA', timezone: 'America/Chicago', observesDST: true },
  { state: 'KS', timezone: 'America/Chicago', observesDST: true }, // Most of KS
  { state: 'KY', timezone: 'America/New_York', observesDST: true }, // Most of KY
  { state: 'LA', timezone: 'America/Chicago', observesDST: true },
  { state: 'ME', timezone: 'America/New_York', observesDST: true },
  { state: 'MD', timezone: 'America/New_York', observesDST: true },
  { state: 'MA', timezone: 'America/New_York', observesDST: true },
  { state: 'MI', timezone: 'America/Detroit', observesDST: true },
  { state: 'MN', timezone: 'America/Chicago', observesDST: true },
  { state: 'MS', timezone: 'America/Chicago', observesDST: true },
  { state: 'MO', timezone: 'America/Chicago', observesDST: true },
  { state: 'MT', timezone: 'America/Denver', observesDST: true },
  { state: 'NE', timezone: 'America/Chicago', observesDST: true }, // Most of NE
  { state: 'NV', timezone: 'America/Los_Angeles', observesDST: true },
  { state: 'NH', timezone: 'America/New_York', observesDST: true },
  { state: 'NJ', timezone: 'America/New_York', observesDST: true },
  { state: 'NM', timezone: 'America/Denver', observesDST: true },
  { state: 'NY', timezone: 'America/New_York', observesDST: true },
  { state: 'NC', timezone: 'America/New_York', observesDST: true },
  { state: 'ND', timezone: 'America/Chicago', observesDST: true }, // Most of ND
  { state: 'OH', timezone: 'America/New_York', observesDST: true },
  { state: 'OK', timezone: 'America/Chicago', observesDST: true },
  { state: 'OR', timezone: 'America/Los_Angeles', observesDST: true }, // Most of OR
  { state: 'PA', timezone: 'America/New_York', observesDST: true },
  { state: 'RI', timezone: 'America/New_York', observesDST: true },
  { state: 'SC', timezone: 'America/New_York', observesDST: true },
  { state: 'SD', timezone: 'America/Chicago', observesDST: true }, // Most of SD
  { state: 'TN', timezone: 'America/Chicago', observesDST: true }, // Most of TN
  { state: 'TX', timezone: 'America/Chicago', observesDST: true }, // Most of TX
  { state: 'UT', timezone: 'America/Denver', observesDST: true },
  { state: 'VT', timezone: 'America/New_York', observesDST: true },
  { state: 'VA', timezone: 'America/New_York', observesDST: true },
  { state: 'WA', timezone: 'America/Los_Angeles', observesDST: true },
  { state: 'WV', timezone: 'America/New_York', observesDST: true },
  { state: 'WI', timezone: 'America/Chicago', observesDST: true },
  { state: 'WY', timezone: 'America/Denver', observesDST: true },
  { state: 'DC', timezone: 'America/New_York', observesDST: true },
];

export interface TCPAValidationResult {
  isCompliant: boolean;
  reason?: string;
  nextValidTime?: Date;
}

export function getStateTimezone(state: string): TimezoneInfo | null {
  return stateTimezones.find(tz => tz.state === state.toUpperCase()) || null;
}

export function isBusinessHours(date: Date, state: string): boolean {
  const timezoneInfo = getStateTimezone(state);
  if (!timezoneInfo) {
    return false; // Reject if state not found - TCPA safety
  }

  // Convert to state's local time
  const localTime = new Date(date.toLocaleString("en-US", { timeZone: timezoneInfo.timezone }));
  
  const hour = localTime.getHours();
  const dayOfWeek = localTime.getDay(); // 0 = Sunday, 6 = Saturday
  
  // TCPA Business hours: 8 AM - 9 PM, Monday-Friday only
  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
  const isValidHour = hour >= 8 && hour < 21; // 8 AM to 9 PM
  
  return isWeekday && isValidHour;
}

export function validateTCPACompliance(
  phone: string,
  state: string,
  scheduledTime?: Date
): TCPAValidationResult {
  // Null state blocking - require state for timezone determination
  if (!state || state.trim().length === 0) {
    return {
      isCompliant: false,
      reason: "State required for TCPA timezone validation"
    };
  }

  const timezoneInfo = getStateTimezone(state);
  if (!timezoneInfo) {
    return {
      isCompliant: false,
      reason: `Invalid state code: ${state}`
    };
  }

  const checkTime = scheduledTime || new Date();
  
  // Night hours protection: Hard block 9:00 PM - 8:00 AM EST
  const estTime = new Date(checkTime.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const estHour = estTime.getHours();
  
  if (estHour >= 21 || estHour < 8) {
    const nextValidTime = new Date(estTime);
    if (estHour >= 21) {
      nextValidTime.setDate(nextValidTime.getDate() + 1);
    }
    nextValidTime.setHours(8, 0, 0, 0);
    
    return {
      isCompliant: false,
      reason: "Outside business hours (9 PM - 8 AM EST blocked)",
      nextValidTime
    };
  }

  // Check business hours in recipient's timezone
  if (!isBusinessHours(checkTime, state)) {
    // Calculate next valid business hour
    const nextValidTime = getNextBusinessHour(state);
    
    return {
      isCompliant: false,
      reason: "Outside business hours (8 AM - 9 PM, Mon-Fri in recipient timezone)",
      nextValidTime
    };
  }

  return { isCompliant: true };
}

export function getNextBusinessHour(state: string): Date {
  const timezoneInfo = getStateTimezone(state);
  if (!timezoneInfo) {
    throw new Error(`Invalid state: ${state}`);
  }

  const now = new Date();
  const localTime = new Date(now.toLocaleString("en-US", { timeZone: timezoneInfo.timezone }));
  
  let nextValid = new Date(localTime);
  
  // If it's weekend, move to Monday
  const dayOfWeek = localTime.getDay();
  if (dayOfWeek === 0) { // Sunday
    nextValid.setDate(nextValid.getDate() + 1);
  } else if (dayOfWeek === 6) { // Saturday
    nextValid.setDate(nextValid.getDate() + 2);
  }
  
  // Set to 8 AM business hours
  nextValid.setHours(8, 0, 0, 0);
  
  // If current time is after 9 PM on weekday, move to next day
  if (dayOfWeek >= 1 && dayOfWeek <= 5 && localTime.getHours() >= 21) {
    nextValid.setDate(nextValid.getDate() + 1);
    nextValid.setHours(8, 0, 0, 0);
  }
  
  // Convert back to UTC
  return new Date(nextValid.toLocaleString("en-US", { timeZone: "UTC" }));
}

export function normalizePhoneNumber(phone: string): string {
  // Clean and format to +1XXXXXXXXXX
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`;
  }
  
  return phone; // Return original if can't normalize
}

// Emergency stop mechanism using file-based flag
export function isEmergencyStopActive(): boolean {
  try {
    const fs = require('fs');
    return fs.existsSync('./EMERGENCY_STOP');
  } catch {
    return false;
  }
}

export function activateEmergencyStop(): void {
  try {
    const fs = require('fs');
    fs.writeFileSync('./EMERGENCY_STOP', new Date().toISOString());
  } catch (error) {
    console.error('Failed to activate emergency stop:', error);
  }
}

export function deactivateEmergencyStop(): void {
  try {
    const fs = require('fs');
    if (fs.existsSync('./EMERGENCY_STOP')) {
      fs.unlinkSync('./EMERGENCY_STOP');
    }
  } catch (error) {
    console.error('Failed to deactivate emergency stop:', error);
  }
}

// ZIP code to state mapping for auto-population
export function getStateFromZipCode(zipCode: string): string | null {
  // Simplified ZIP to state mapping - in production, use a comprehensive database
  const zipRanges: { [key: string]: string } = {
    // Sample ranges - would need complete mapping
    '100': 'NY', '101': 'NY', '102': 'NY', '103': 'NY', '104': 'NY',
    '200': 'DC', '201': 'VA', '202': 'DC', '203': 'VA', '204': 'MD',
    '300': 'GA', '301': 'MD', '302': 'DE', '303': 'GA', '304': 'WV',
    '900': 'CA', '901': 'CA', '902': 'CA', '903': 'TX', '904': 'FL',
    // Add more comprehensive mapping as needed
  };

  const zip3 = zipCode.substring(0, 3);
  return zipRanges[zip3] || null;
}
