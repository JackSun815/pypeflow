/**
 * Formats a time string from 24-hour format to 12-hour format with AM/PM
 * @param timeString Time string in format "HH:MM" or "HH:MM:SS"
 * @returns Formatted time string in format "h:MM AM/PM"
 */
export function formatTime(timeString: string): string {
  if (!timeString) return '12:00 AM';
  
  try {
    // Normalize input (remove seconds if present)
    const timeParts = timeString.split(':');
    if (timeParts.length < 2) return '12:00 AM';
    
    const hours = parseInt(timeParts[0], 10);
    const minutes = parseInt(timeParts[1], 10);
    
    if (isNaN(hours) || isNaN(minutes)) return '12:00 AM';
    
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12; // Convert 0 to 12
    
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  } catch (error) {
    console.error('Error formatting time:', error);
    return '12:00 AM';
  }
}

/**
 * Extracts the time portion from an ISO date string
 * @param isoString ISO date string (e.g., "2025-02-24T14:30:00")
 * @returns Time string in format "HH:MM"
 */
export function extractTimeFromISOString(isoString: string): string {
  if (!isoString) return '00:00';
  
  try {
    const timePart = isoString.split('T')[1] || '';
    return timePart.substring(0, 5) || '00:00';
  } catch (error) {
    console.error('Error extracting time:', error);
    return '00:00';
  }
}

/**
 * Formats a time from an ISO string to 12-hour format with AM/PM
 * @param isoString ISO date string
 * @returns Formatted time string in format "h:MM AM/PM"
 */
export function formatTimeFromISOString(isoString: string): string {
  return formatTime(extractTimeFromISOString(isoString));
}

/**
 * Formats a date string to EST timezone with custom formatting
 * @param dateString ISO date string
 * @param options Intl.DateTimeFormat options
 * @returns Formatted date string in EST
 */
export function formatDateToEST(
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
    
    return date.toLocaleString('en-US', {
      ...options,
      timeZone: 'America/New_York'
    });
  } catch (error) {
    console.error('Error formatting date to EST:', error);
    return 'N/A';
  }
}