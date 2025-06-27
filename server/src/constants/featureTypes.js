// Feature type constants and validation
const FEATURE_TYPES = {
  PARENT: 'parent',
  STORY: 'story', 
  TASK: 'task',
  RESEARCH: 'research'
};

const FEATURE_TYPE_LABELS = {
  [FEATURE_TYPES.PARENT]: 'Parent',
  [FEATURE_TYPES.STORY]: 'Story',
  [FEATURE_TYPES.TASK]: 'Task',
  [FEATURE_TYPES.RESEARCH]: 'Research'
};

const FEATURE_TYPE_DESCRIPTIONS = {
  [FEATURE_TYPES.PARENT]: 'High-level deliverable that contains other features',
  [FEATURE_TYPES.STORY]: 'User-facing feature or functionality',
  [FEATURE_TYPES.TASK]: 'Technical implementation work',
  [FEATURE_TYPES.RESEARCH]: 'Discovery or dependency research work'
};

const FEATURE_TYPE_ICONS = {
  [FEATURE_TYPES.PARENT]: '📦', // Package/container
  [FEATURE_TYPES.STORY]: '📖', // Book/story
  [FEATURE_TYPES.TASK]: '⚙️', // Gear/technical
  [FEATURE_TYPES.RESEARCH]: '🔍' // Magnifying glass/research
};

// Validation rules
const HIERARCHY_RULES = {
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
function canHaveChildren(type) {
  return HIERARCHY_RULES.CAN_HAVE_CHILDREN.includes(type);
}

/**
 * Check if a feature type can be a child
 */
function canBeChild(type) {
  return HIERARCHY_RULES.CAN_BE_CHILDREN.includes(type);
}

/**
 * Validate feature hierarchy relationship
 */
function validateHierarchy(parentType, childType) {
  if (!canHaveChildren(parentType)) {
    throw new Error(`${FEATURE_TYPE_LABELS[parentType]} features cannot have children`);
  }
  
  if (!canBeChild(childType)) {
    throw new Error(`${FEATURE_TYPE_LABELS[childType]} features cannot be children`);
  }
  
  return true;
}

module.exports = {
  FEATURE_TYPES,
  FEATURE_TYPE_LABELS,
  FEATURE_TYPE_DESCRIPTIONS,
  FEATURE_TYPE_ICONS,
  HIERARCHY_RULES,
  canHaveChildren,
  canBeChild,
  validateHierarchy
}; 