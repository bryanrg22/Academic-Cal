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

/**
 * Normalize assignment/task titles for generating keys
 * Must match the backend normalization in functions/index.js
 */
export function normalizeTitle(title) {
  if (!title) return '';

  let normalized = title.trim();

  // Remove [Lab], [Lecture], [Discussion] prefixes
  normalized = normalized.replace(/^\[(lab|lecture|discussion)\]\s*/i, '');

  // Remove common verb prefixes
  normalized = normalized.replace(/^(submit|complete|finish|do|start|work on|turn in|upload|hand in|deliver|send|post|read|review|prepare|watch|attend)\s+/i, '');

  // Remove course prefix if present
  normalized = normalized.replace(/^[A-Z]{2,4}[-\s]?\d{2,4}[A-Z]?\s+/i, '');

  // Remove trailing details
  normalized = normalized.replace(/\s*\(.*\)\s*$/, '');
  normalized = normalized.replace(/\s+via\s+.*$/i, '');

  // Normalize homework variations
  normalized = normalized.replace(/^(homework|hw)\s*(assignment)?\s*0*(\d+)/i, 'hw$3');

  // Normalize lab variations
  normalized = normalized.replace(/^lab\s*0*(\d+).*$/i, 'lab$1');

  // Normalize problem set variations
  normalized = normalized.replace(/^(problem\s*set|ps)\s*0*(\d+)/i, 'ps$2');

  // Normalize quiz variations
  normalized = normalized.replace(/^quiz\s*0*(\d+)/i, 'quiz$1');

  // Normalize whitespace and lowercase
  normalized = normalized.replace(/\s+/g, ' ').trim().toLowerCase();

  return normalized;
}

/**
 * Generate a normalized key for an item (must match backend)
 * Used to check if an item is in the newItemKeys array
 */
export function getItemKey(item, keyField = 'title') {
  const title = item[keyField] || item.task || item.title || item.assignment || '';
  const normalizedTitle = normalizeTitle(title);
  const normalizedCourse = normalizeCourse(item.course);
  return `${normalizedTitle}-${normalizedCourse}`;
}

/**
 * Check if an item is new (was added in the most recent submission)
 */
export function isNewItem(item, newItemKeys = [], keyField = 'title') {
  if (!newItemKeys || newItemKeys.length === 0) return false;
  const key = getItemKey(item, keyField);
  return newItemKeys.includes(key);
}
