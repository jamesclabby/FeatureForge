/**
 * Centralized Design Tokens
 * Single source of truth for colors, spacing, and other design system values
 * Updated for Dracula Classic dark theme
 */

// Status colors - Using semantic dark theme colors
// Used across FeatureCard, KanbanCard, DependencyCard, etc.
export const STATUS_COLORS = {
  backlog: {
    bg: 'bg-background-elevated',
    text: 'text-foreground-secondary',
    border: 'border-border',
    combined: 'bg-background-elevated text-foreground-secondary border-border'
  },
  in_progress: {
    bg: 'bg-info-100',
    text: 'text-info',
    border: 'border-info/30',
    combined: 'bg-info-100 text-info border-info/30'
  },
  review: {
    bg: 'bg-warning-100',
    text: 'text-warning',
    border: 'border-warning/30',
    combined: 'bg-warning-100 text-warning border-warning/30'
  },
  done: {
    bg: 'bg-success-100',
    text: 'text-success',
    border: 'border-success/30',
    combined: 'bg-success-100 text-success border-success/30'
  }
};

// Priority colors - Using semantic dark theme colors
// Used across FeatureCard, KanbanCard, DependencyCard, etc.
export const PRIORITY_COLORS = {
  low: {
    bg: 'bg-background-elevated',
    text: 'text-foreground-muted',
    border: 'border-border-muted',
    combined: 'bg-background-elevated text-foreground-muted border-border-muted'
  },
  medium: {
    bg: 'bg-background-elevated',
    text: 'text-foreground-secondary',
    border: 'border-border',
    combined: 'bg-background-elevated text-foreground-secondary border-border'
  },
  high: {
    bg: 'bg-warning-100',
    text: 'text-warning',
    border: 'border-warning/30',
    combined: 'bg-warning-100 text-warning border-warning/30'
  },
  urgent: {
    bg: 'bg-error-100',
    text: 'text-error',
    border: 'border-error/30',
    combined: 'bg-error-100 text-error border-error/30'
  },
  critical: {
    bg: 'bg-error-100',
    text: 'text-error',
    border: 'border-error/30',
    combined: 'bg-error-100 text-error border-error/30'
  }
};

// Dependency status colors - Using dark theme palette
export const DEPENDENCY_STATUS_COLORS = {
  blocked: {
    icon: 'text-error',
    bg: 'bg-error-50',
    border: 'border-error/30',
    badge: 'bg-error-100 text-error'
  },
  blocking: {
    icon: 'text-warning',
    bg: 'bg-warning-50',
    border: 'border-warning/30',
    badge: 'bg-warning-100 text-warning'
  },
  has_dependencies: {
    icon: 'text-info',
    bg: 'bg-info-50',
    border: 'border-info/30',
    badge: 'bg-info-100 text-info'
  }
};

// Semantic colors for feedback states
export const FEEDBACK_COLORS = {
  error: {
    text: 'text-error',
    bg: 'bg-error-50',
    border: 'border-error/30'
  },
  warning: {
    text: 'text-warning',
    bg: 'bg-warning-50',
    border: 'border-warning/30'
  },
  success: {
    text: 'text-success',
    bg: 'bg-success-50',
    border: 'border-success/30'
  },
  info: {
    text: 'text-info',
    bg: 'bg-info-50',
    border: 'border-info/30'
  }
};

// Standard spacing values (for reference/documentation)
export const SPACING = {
  form: {
    sectionGap: 'space-y-4',
    fieldGap: 'space-y-2'
  },
  card: {
    padding: 'p-6'
  },
  grid: {
    gap: 'gap-4',
    gapLarge: 'gap-6'
  }
};

/**
 * Get status color classes based on status value
 * @param {string} status - Status value (backlog, in_progress, review, done)
 * @returns {object} - Color classes object with bg, text, border, combined properties
 */
export function getStatusColorClasses(status) {
  const normalizedStatus = status?.toLowerCase().replace('-', '_');
  return STATUS_COLORS[normalizedStatus] || STATUS_COLORS.backlog;
}

/**
 * Get priority color classes based on priority value
 * @param {string} priority - Priority value (low, medium, high, urgent, critical)
 * @returns {object} - Color classes object with bg, text, border, combined properties
 */
export function getPriorityColorClasses(priority) {
  const normalizedPriority = priority?.toLowerCase();
  return PRIORITY_COLORS[normalizedPriority] || PRIORITY_COLORS.medium;
}

/**
 * Legacy support: Map color names to Tailwind classes
 * Using dark theme semantic colors
 * @param {string} colorName - Color name from service (blue, amber, green, purple, gray, red)
 * @param {string} type - 'status' or 'priority'
 * @returns {string} - Combined Tailwind classes
 */
export function getColorClassesByName(colorName, type = 'status') {
  const colorMap = {
    blue: 'bg-info-100 text-info',
    amber: 'bg-warning-100 text-warning',
    green: 'bg-success-100 text-success',
    purple: 'bg-accent-100 text-accent',
    gray: 'bg-background-elevated text-foreground-secondary',
    red: 'bg-error-100 text-error',
    orange: 'bg-warning-100 text-warning',
    yellow: 'bg-warning-100 text-warning'
  };
  
  return colorMap[colorName?.toLowerCase()] || colorMap.gray;
}
