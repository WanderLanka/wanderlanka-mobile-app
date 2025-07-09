/**
 * Time formatting utilities for consistent display across the app
 */

/**
 * Format a timestamp to a human-readable relative time
 * @param timestamp - The timestamp to format (Date object, string, or number)
 * @returns Formatted time string (e.g., "12m ago", "3h ago", "2d ago", "3w ago")
 */
export function formatTimeAgo(timestamp: Date | string | number): string {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInMs = now.getTime() - time.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  const diffInWeeks = Math.floor(diffInDays / 7);

  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  } else {
    return `${diffInWeeks}w ago`;
  }
}

/**
 * Format a timestamp to a human-readable relative time (without "ago")
 * @param timestamp - The timestamp to format (Date object, string, or number)
 * @returns Formatted time string (e.g., "12m", "3h", "2d", "3w")
 */
export function formatTimeShort(timestamp: Date | string | number): string {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInMs = now.getTime() - time.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  const diffInWeeks = Math.floor(diffInDays / 7);

  if (diffInMinutes < 60) {
    return `${diffInMinutes}m`;
  } else if (diffInHours < 24) {
    return `${diffInHours}h`;
  } else if (diffInDays < 7) {
    return `${diffInDays}d`;
  } else {
    return `${diffInWeeks}w`;
  }
}

/**
 * Check if a timestamp is recent (within the last 24 hours)
 * @param timestamp - The timestamp to check
 * @returns True if the timestamp is within the last 24 hours
 */
export function isRecent(timestamp: Date | string | number): boolean {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInMs = now.getTime() - time.getTime();
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  return diffInHours < 24;
}

/**
 * Get a timestamp for testing purposes (X time ago)
 * @param amount - The amount of time
 * @param unit - The unit of time ('minutes', 'hours', 'days', 'weeks')
 * @returns A timestamp that is X time ago
 */
export function getTimestampAgo(amount: number, unit: 'minutes' | 'hours' | 'days' | 'weeks'): Date {
  const now = new Date();
  const multipliers = {
    minutes: 60 * 1000,
    hours: 60 * 60 * 1000,
    days: 24 * 60 * 60 * 1000,
    weeks: 7 * 24 * 60 * 60 * 1000,
  };
  
  return new Date(now.getTime() - (amount * multipliers[unit]));
}
