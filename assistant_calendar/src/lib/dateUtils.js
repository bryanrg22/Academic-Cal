import { format, parseISO, isToday, isPast, differenceInDays } from 'date-fns';

/**
 * Normalize course codes to handle variations like:
 * - "Math 226" vs "MATH-226" vs "MATH226"
 * - "CS 104" vs "CS-104" vs "CS104"
 * Returns uppercase with hyphen separator
 */
export function normalizeCourse(course) {
  if (!course) return 'OTHER';

  // Uppercase and trim
  let normalized = course.toUpperCase().trim();

  // Replace multiple spaces/hyphens with single hyphen
  normalized = normalized.replace(/[\s-]+/g, '-');

  // Handle cases like "MATH226" -> "MATH-226" (letter followed by number)
  normalized = normalized.replace(/([A-Z]+)(\d)/, '$1-$2');

  // Handle CSCI-104 → CS-104
  normalized = normalized.replace(/^CSCI-/, 'CS-');

  // Remove trailing hyphen if any
  normalized = normalized.replace(/-+$/, '');

  return normalized;
}

/**
 * Smart date formatting that handles common academic deadline patterns
 * - If time is midnight (00:00), show date only
 * - If time is 23:59, show "11:59 PM"
 * - Otherwise show the actual time
 */
export function formatDueDate(dateString) {
  if (!dateString) return null;

  const date = parseISO(dateString);
  const hours = date.getHours();
  const minutes = date.getMinutes();

  // Check if it's midnight (likely a date-only input)
  if (hours === 0 && minutes === 0) {
    return format(date, 'EEE, MMM d');
  }

  // Show full date with time
  return format(date, 'EEE, MMM d · h:mm a');
}

/**
 * Format date for action items (shorter format)
 */
export function formatActionDueDate(dateString) {
  if (!dateString) return null;

  const date = parseISO(dateString);
  const hours = date.getHours();
  const minutes = date.getMinutes();

  // Check if it's midnight (likely a date-only input)
  if (hours === 0 && minutes === 0) {
    return format(date, 'MMM d');
  }

  return format(date, 'MMM d, h:mm a');
}

/**
 * Get urgency level for sorting
 * Returns a number where lower = more urgent
 */
export function getUrgencyScore(dateString, status) {
  if (status === 'submitted' || status === 'graded') {
    return 1000; // Submitted items go last
  }

  if (!dateString) {
    return 500; // No due date - middle priority
  }

  const date = parseISO(dateString);
  const now = new Date();
  const daysUntil = differenceInDays(date, now);

  if (isPast(date) && !isToday(date)) {
    return -100 + daysUntil; // Overdue items first (more overdue = lower score)
  }

  if (isToday(date)) {
    return 0; // Due today
  }

  return daysUntil; // Future items sorted by proximity
}

/**
 * Sort items by urgency (due date) first, then by priority
 */
export function sortByUrgency(items, priorityField = 'priority') {
  return [...items].sort((a, b) => {
    const urgencyA = getUrgencyScore(a.dueDate, a.status);
    const urgencyB = getUrgencyScore(b.dueDate, b.status);

    // First sort by urgency
    if (urgencyA !== urgencyB) {
      return urgencyA - urgencyB;
    }

    // Then by priority (lower number = higher priority)
    const priorityA = a[priorityField] || 3;
    const priorityB = b[priorityField] || 3;
    return priorityA - priorityB;
  });
}

/**
 * Check if an item is urgent (overdue or due today)
 */
export function isUrgent(dateString, status) {
  if (status === 'submitted' || status === 'graded') {
    return false;
  }

  if (!dateString) {
    return false;
  }

  const date = parseISO(dateString);
  return isPast(date) || isToday(date);
}
