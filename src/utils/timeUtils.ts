/**
 * Formats a time string from 24-hour format to 12-hour format with AM/PM
 * @param timeString Time string in format "HH:MM" or "HH:MM:SS"
 * @returns Formatted time string in format "h:MM AM/PM"
 */
export function formatTime(timeString: string): string {
  if (!timeString || !timeString.includes(':')) {
    return '12:00 AM';
  }

  try {
    // Extract hours and minutes
    const [hours, minutes] = timeString.split(':').map(Number);
    
    // Determine period
    const period = hours >= 12 ? 'PM' : 'AM';
    
    // Convert to 12-hour format
    let hours12 = hours % 12;
    if (hours12 === 0) hours12 = 12;
    
    // Format the time
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
  if (!isoString || !isoString.includes('T')) {
    return '00:00';
  }
  
  try {
    // Extract the time part after 'T'
    const timePart = isoString.split('T')[1];
    
    // Return the first 5 characters (HH:MM)
    return timePart.substring(0, 5);
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
  const timeString = extractTimeFromISOString(isoString);
  return formatTime(timeString);
}