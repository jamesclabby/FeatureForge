// Feature type constants (matching backend)
export const FEATURE_TYPES = {
  PARENT: 'parent',
  STORY: 'story', 
  TASK: 'task',
  RESEARCH: 'research'
};

// Array version for UI components
export const FEATURE_TYPES_ARRAY = [
  { value: 'parent', label: 'Parent', icon: '📦', description: 'High-level deliverable that contains other features' },
  { value: 'story', label: 'Story', icon: '📖', description: 'User-facing feature or functionality' },
  { value: 'task', label: 'Task', icon: '⚙️', description: 'Technical implementation work' },
  { value: 'research', label: 'Research', icon: '🔍', description: 'Discovery or dependency research work' }
];

export const FEATURE_TYPE_LABELS = {
  [FEATURE_TYPES.PARENT]: 'Parent',
  [FEATURE_TYPES.STORY]: 'Story',
  [FEATURE_TYPES.TASK]: 'Task',
  [FEATURE_TYPES.RESEARCH]: 'Research'
};

export const FEATURE_TYPE_DESCRIPTIONS = {
  [FEATURE_TYPES.PARENT]: 'High-level deliverable that contains other features',
  [FEATURE_TYPES.STORY]: 'User-facing feature or functionality',
  [FEATURE_TYPES.TASK]: 'Technical implementation work',
  [FEATURE_TYPES.RESEARCH]: 'Discovery or dependency research work'
};

export const FEATURE_TYPE_ICONS = {
  [FEATURE_TYPES.PARENT]: '📦', // Package/container
  [FEATURE_TYPES.STORY]: '📖', // Book/story
  [FEATURE_TYPES.TASK]: '⚙️', // Gear/technical
  [FEATURE_TYPES.RESEARCH]: '🔍' // Magnifying glass/research
};

export const FEATURE_TYPE_COLORS = {
  [FEATURE_TYPES.PARENT]: 'bg-purple-100 text-purple-800',
  [FEATURE_TYPES.STORY]: 'bg-blue-100 text-blue-800',
  [FEATURE_TYPES.TASK]: 'bg-green-100 text-green-800',
  [FEATURE_TYPES.RESEARCH]: 'bg-orange-100 text-orange-800'
};

// Validation rules
export const HIERARCHY_RULES = {
  // Only parent types can have children
  CAN_HAVE_CHILDREN: [FEATURE_TYPES.PARENT],
  
  // Only these types can be children
  CAN_BE_CHILDREN: [FEATURE_TYPES.STORY, FEATURE_TYPES.TASK, FEATURE_TYPES.RESEARCH],
  
  // Maximum hierarchy depth
  MAX_DEPTH: 2
};

/**
 * Check if a feature type can have children
 */
export function canHaveChildren(type) {
  return HIERARCHY_RULES.CAN_HAVE_CHILDREN.includes(type);
}

/**
 * Check if a feature type can be a child
 */
export function canBeChild(type) {
  return HIERARCHY_RULES.CAN_BE_CHILDREN.includes(type);
}

/**
 * Get feature type details
 */
export function getFeatureTypeDetails(type) {
  return {
    type,
    label: FEATURE_TYPE_LABELS[type] || type,
    description: FEATURE_TYPE_DESCRIPTIONS[type] || '',
    icon: FEATURE_TYPE_ICONS[type] || '📄',
    color: FEATURE_TYPE_COLORS[type] || 'bg-gray-100 text-gray-800'
  };
} 