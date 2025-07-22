/**
 * TIME UTILITY FUNCTIONS
 * 
 * Handles all date/time formatting and conversions with:
 * - Strict input validation
 * - Consistent EST timezone handling (EST storage/EST display)
 * - Comprehensive error handling
 */

import { DateTime } from 'luxon';

interface TimeFormatOptions {
  showSeconds?: boolean;
  showTimezone?: boolean;
}

/**
 * Converts a local time to UTC ISO string for EST time storage
 * @param dateString Date string (YYYY-MM-DD)
 * @param timeString Time string (HH:MM)
 * @returns UTC ISO string that will display as EST
 */
export function createESTDateTime(dateString: string, timeString: string): string {
  if (!dateString || !timeString) {
    throw new Error('Date and time are required');
  }
  
  try {
    // Parse the date and time
    const [year, month, day] = dateString.split('-').map(Number);
    const [hours, minutes] = timeString.split(':').map(Number);
    
    // Use EDT (-04:00) for summer months (March to November)
    // Use EST (-05:00) for winter months (November to March)
    const isSummer = month >= 3 && month <= 11;
    const timezoneOffset = isSummer ? '-04:00' : '-05:00';
    
    // Create a date object in EST/EDT timezone
    const estDate = new Date(`${dateString}T${timeString}:00${timezoneOffset}`);
    
    return estDate.toISOString();
  } catch (error) {
    console.error('Error creating EST datetime:', error);
    throw new Error('Invalid date or time format');
  }
}

/**
 * Converts UTC ISO string to EST ISO string
 * @param utcISOString UTC ISO string
 * @returns EST ISO string
 */
export function convertUTCToEST(utcISOString: string): string {
  if (!utcISOString) return '';
  
  try {
    const date = new Date(utcISOString);
    if (isNaN(date.getTime())) return '';
    
    // Convert to EST
    const estDate = new Date(date.toLocaleString('en-US', {
      timeZone: 'America/New_York'
    }));
    
    return estDate.toISOString().replace('Z', '');
  } catch (error) {
    console.error('Error converting UTC to EST:', error);
    return '';
  }
}

/**
 * Formats a time string from 24-hour to 12-hour format with AM/PM
 * @param timeString Time string in "HH:MM" or "HH:MM:SS" format
 * @param options Formatting options
 * @returns Formatted time string (e.g., "2:30 PM EST")
 */
export function formatTime(
  timeString: string, 
  options: TimeFormatOptions = {}
): string {
  if (!timeString?.trim()) return '12:00 AM';
  
  try {
    // Normalize input (handle seconds and timezone if present)
    const [timePart] = timeString.split('+');
    const timeComponents = timePart.split(':').filter(Boolean);
    
    if (timeComponents.length < 2) return '12:00 AM';
    
    const hours = parseInt(timeComponents[0], 10);
    const minutes = parseInt(timeComponents[1], 10);
    const seconds = timeComponents[2] ? parseInt(timeComponents[2], 10) : 0;
    
    if ([hours, minutes, seconds].some(isNaN)) return '12:00 AM';
    
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12; // Convert 0 to 12
    
    let result = `${hours12}:${minutes.toString().padStart(2, '0')}`;
    
    if (options.showSeconds) {
      result += `:${seconds.toString().padStart(2, '0')}`;
    }
    
    result += ` ${period}`;
    
    if (options.showTimezone) {
      result += ' EST';
    }
    
    return result;
  } catch (error) {
    console.error('Error formatting time:', error);
    return '12:00 AM';
  }
}

/**
 * Converts UTC database time to EST for display
 * @param utcISOString UTC ISO string from database
 * @returns EST time string
 */
export function convertUTCToESTForDisplay(utcISOString: string): string {
  if (!utcISOString) return '12:00 AM';
  
  try {
    // Parse the UTC time from database
    const utcDate = new Date(utcISOString);
    if (isNaN(utcDate.getTime())) return '12:00 AM';
    
    // Convert to EST for display
    const estTimeString = utcDate.toLocaleTimeString('en-US', {
      timeZone: 'America/New_York',
      hour12: true,
      hour: 'numeric',
      minute: '2-digit'
    });
    
    return `${estTimeString} EST`;
  } catch (error) {
    console.error('Error converting UTC to EST for display:', error);
    return '12:00 AM';
  }
}

/**
 * Extracts and formats time from an ISO date string (assumes EST)
 * @param isoString ISO 8601 date string (EST)
 * @param options Formatting options
 * @returns Formatted time string
 */
export function extractAndFormatTime(
  isoString: string,
  options: TimeFormatOptions = {}
): string {
  if (!isoString) return '12:00 AM';
  
  try {
    // Handle both ISO format and database timestamp formats
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '12:00 AM';
    
    // Convert UTC database time to EST for display
    const estTimeString = date.toLocaleTimeString('en-US', {
      timeZone: 'America/New_York',
      hour12: true,
      hour: 'numeric',
      minute: '2-digit',
      second: options.showSeconds ? '2-digit' : undefined
    });
    
    return options.showTimezone 
      ? `${estTimeString} EST`
      : estTimeString;
  } catch (error) {
    console.error('Error extracting time:', error);
    return '12:00 AM';
  }
}

/**
 * Formats a complete date string in EST timezone
 * @param dateString ISO date string (EST)
 * @param options Intl.DateTimeFormat options
 * @returns Formatted date string
 */
export function formatFullDateEST(
  dateString: string,
  options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }
): string {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    // Add timezone to options if not specified
    const formatOptions = {
      ...options,
      timeZone: 'America/New_York'
    };
    
    return date.toLocaleString('en-US', formatOptions);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'N/A';
  }
}

/**
 * Checks if a meeting is in the past (EST comparison)
 * @param isoString ISO date string (EST)
 * @returns boolean indicating if the date is in the past
 */
export function isPastMeeting(isoString: string): boolean {
  if (!isoString) return false;
  
  try {
    const meetingDate = new Date(isoString);
    const now = new Date();
    
    // Convert both to EST for comparison
    const meetingEST = new Date(meetingDate.toLocaleString('en-US', {
      timeZone: 'America/New_York'
    }));
    const nowEST = new Date(now.toLocaleString('en-US', {
      timeZone: 'America/New_York'
    }));
    
    return meetingEST < nowEST;
  } catch (error) {
    console.error('Error checking date:', error);
    return false;
  }
}

/**
 * Gets the day of week from a date string (EST)
 * @param dateString ISO date string (EST)
 * @returns Day name (e.g., "Monday")
 */
export function getDayOfWeek(dateString: string): string {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    return date.toLocaleDateString('en-US', {
      timeZone: 'America/New_York',
      weekday: 'long'
    });
  } catch (error) {
    console.error('Error getting day of week:', error);
    return 'N/A';
  }
}

/**
 * Calculates the time remaining until a meeting (EST)
 * @param isoString ISO date string (EST)
 * @returns Human-readable time remaining (e.g., "in 2 days")
 */
export function getTimeRemaining(isoString: string): string {
  if (!isoString) return 'N/A';
  
  try {
    const meetingDate = new Date(isoString);
    const now = new Date();
    
    if (isNaN(meetingDate.getTime())) return 'Invalid Date';
    
    // Convert both to EST for comparison
    const meetingEST = new Date(meetingDate.toLocaleString('en-US', {
      timeZone: 'America/New_York'
    }));
    const nowEST = new Date(now.toLocaleString('en-US', {
      timeZone: 'America/New_York'
    }));
    
    const diffMs = meetingEST.getTime() - nowEST.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffMs < 0) return 'passed';
    if (diffDays > 0) return `in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
    if (diffHours > 0) return `in ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    return 'soon';
  } catch (error) {
    console.error('Error calculating time remaining:', error);
    return 'N/A';
  }
}

/**
 * Creates an ISO string for a given date, time, and IANA timezone (e.g., America/New_York)
 * @param dateString Date string (YYYY-MM-DD)
 * @param timeString Time string (HH:MM)
 * @param timezone IANA timezone string (e.g., America/New_York)
 * @returns ISO string in the specified timezone
 */
export function createZonedDateTime(dateString: string, timeString: string, timezone: string): string {
  if (!dateString || !timeString || !timezone) {
    throw new Error('Date, time, and timezone are required');
  }
  try {
    const [year, month, day] = dateString.split('-').map(Number);
    const [hour, minute] = timeString.split(':').map(Number);
    const dt = DateTime.fromObject({ year, month, day, hour, minute }, { zone: timezone });
    if (!dt.isValid) throw new Error('Invalid date/time/timezone');
    return dt.toISO();
  } catch (error) {
    console.error('Error creating zoned datetime:', error);
    throw new Error('Invalid date, time, or timezone format');
  }
}

// Deprecated functions (keep for backward compatibility)
export const formatTimeFromISOString = extractAndFormatTime;
export const formatDateToEST = formatFullDateEST;