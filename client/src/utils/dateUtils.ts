/**
 * Parse date from "DD.MM.YYYY." or "DD. MM. YYYY." format to Date object
 * @param dateStr Date string in DD.MM.YYYY format
 * @returns Date object or null if invalid
 */
export function parseDateDDMMYYYY(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  
  const match = dateStr.match(/(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})\.?/);
  if (!match) return null;
  
  const [, day, month, year] = match;
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  
  if (isNaN(date.getTime())) return null;
  
  return date;
}

/**
 * Format date to localized string for display
 * @param dateInput Date string in DD.MM.YYYY or ISO format (YYYY-MM-DD) or Date object
 * @param locale Locale for formatting (default: 'hr-HR')
 * @returns Formatted date string or '-' if invalid
 */
export function formatDateForDisplay(dateInput: string | Date | null | undefined, locale: string = 'hr-HR'): string {
  if (!dateInput) return '-';
  
  // If it's already a Date object, format it
  if (dateInput instanceof Date) {
    return dateInput.toLocaleDateString(locale);
  }
  
  // If in ISO format (YYYY-MM-DD), parse and format
  const isoMatch = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const date = new Date(dateInput);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString(locale);
    }
  }
  
  // If already in DD.MM.YYYY. format, return as is (removing trailing dot)
  const ddmmyyyyMatch = dateInput.match(/^(\d{1,2}\.\s*\d{1,2}\.\s*\d{4})\.?$/);
  if (ddmmyyyyMatch) {
    return ddmmyyyyMatch[1].replace(/\s/g, '');
  }
  
  // Try to parse DD.MM.YYYY format and format
  const date = parseDateDDMMYYYY(dateInput);
  if (date) {
    return date.toLocaleDateString(locale);
  }
  
  return dateInput;
}

/**
 * Get timestamp for sorting dates in DD.MM.YYYY or ISO format or Date object
 * @param dateInput Date string in DD.MM.YYYY or ISO format (YYYY-MM-DD) or Date object
 * @returns Timestamp or 0 if invalid
 */
export function getDateTimestamp(dateInput: string | Date | null | undefined): number {
  if (!dateInput) return 0;
  
  // If it's already a Date object, return its timestamp
  if (dateInput instanceof Date) {
    return dateInput.getTime();
  }
  
  // If in ISO format (YYYY-MM-DD), parse and return timestamp
  const isoMatch = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const date = new Date(dateInput);
    if (!isNaN(date.getTime())) {
      return date.getTime();
    }
  }
  
  // Try DD.MM.YYYY format
  const date = parseDateDDMMYYYY(dateInput);
  return date ? date.getTime() : 0;
}
