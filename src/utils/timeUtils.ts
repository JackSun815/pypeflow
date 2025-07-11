/**
 * TIME UTILITY FUNCTIONS
 * 
 * Handles all date/time formatting and conversions with:
 * - Strict input validation
 * - Consistent timezone handling (UTC storage/EST display)
 * - Comprehensive error handling
 */

interface TimeFormatOptions {
  showSeconds?: boolean;
  showTimezone?: boolean;
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
 * Extracts and formats time from an ISO date string
 * @param isoString ISO 8601 date string
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
    
    // Convert to EST for display
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
 * @param dateString ISO date string
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
 * Checks if a meeting is in the past (UTC comparison)
 * @param isoString ISO date string
 * @returns boolean indicating if the date is in the past
 */
export function isPastMeeting(isoString: string): boolean {
  if (!isoString) return false;
  
  try {
    const meetingDate = new Date(isoString);
    const now = new Date();
    return meetingDate < now;
  } catch (error) {
    console.error('Error checking date:', error);
    return false;
  }
}

/**
 * Gets the day of week from a date string
 * @param dateString ISO date string
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
 * Calculates the time remaining until a meeting
 * @param isoString ISO date string
 * @returns Human-readable time remaining (e.g., "in 2 days")
 */
export function getTimeRemaining(isoString: string): string {
  if (!isoString) return 'N/A';
  
  try {
    const meetingDate = new Date(isoString);
    const now = new Date();
    
    if (isNaN(meetingDate.getTime())) return 'Invalid Date';
    
    const diffMs = meetingDate.getTime() - now.getTime();
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

// Deprecated functions (keep for backward compatibility)
export const formatTimeFromISOString = extractAndFormatTime;
export const formatDateToEST = formatFullDateEST;