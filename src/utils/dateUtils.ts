/**
 * Date and Time utilities formatted for Indian Timing Standards (IST, 12-hour AM/PM).
 */

/**
 * Formats time in Indian 12-hour format with uppercase AM/PM (e.g., "08:30 AM", "02:15:45 PM").
 */
export function formatIndianTime(dateInput: string | Date | number, includeSeconds = false): string {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  
  const options: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  };
  if (includeSeconds) {
    options.second = '2-digit';
  }

  return d.toLocaleTimeString('en-IN', options).toUpperCase();
}

/**
 * Formats date in Indian standard (e.g., "09 Sep").
 */
export function formatIndianDate(dateInput: string | Date | number): string {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
  });
}

/**
 * Formats date & time in Indian standard (e.g., "09 Sep, 08:30 AM").
 */
export function formatIndianDateTime(dateInput: string | Date | number): string {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';

  const dateStr = formatIndianDate(d);
  const timeStr = formatIndianTime(d);
  return `${dateStr}, ${timeStr}`;
}

/**
 * Formats full date & time with year in Indian standard (e.g., "09 Sep 2026, 08:30 AM").
 */
export function formatIndianFullDateTime(dateInput: string | Date | number): string {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';

  const dateStr = d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const timeStr = formatIndianTime(d);
  return `${dateStr}, ${timeStr}`;
}
