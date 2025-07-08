// Field length constraints based on database schema
export const FIELD_LIMITS = {
  // Team fields
  TEAM_NAME: 100,
  TEAM_DESCRIPTION: 500,
  
  // Feature fields
  FEATURE_TITLE: 200,
  FEATURE_DESCRIPTION: 2000,
  FEATURE_CATEGORY: 50, // Reasonable limit for category
  FEATURE_TARGET_RELEASE: 50, // Reasonable limit for target release
  
  // Tag fields
  TAG: 50, // Reasonable limit for individual tags
  
  // Comment fields
  COMMENT_CONTENT: 2000,
  
  // Dependency fields
  DEPENDENCY_DESCRIPTION: 500,
  
  // User fields
  USER_NAME: 100, // Reasonable limit for user name
  USER_EMAIL: 255, // Standard email length limit
  USER_PASSWORD_MIN: 6,
  USER_PASSWORD_MAX: 100
};

// Validation functions
export const validateField = (value, fieldName, required = false) => {
  if (!value || value.trim() === '') {
    if (required) {
      return `${fieldName} is required`;
    }
    return null;
  }

  const limit = FIELD_LIMITS[fieldName];
  if (limit && value.length > limit) {
    return `${fieldName} must be ${limit} characters or less`;
  }

  return null;
};

export const validateTeamName = (value) => {
  return validateField(value, 'Team name', true);
};

export const validateTeamDescription = (value) => {
  return validateField(value, 'Team description', false);
};

export const validateFeatureTitle = (value) => {
  return validateField(value, 'Feature title', true);
};

export const validateFeatureDescription = (value) => {
  return validateField(value, 'Feature description', false);
};

export const validateTag = (value) => {
  if (!value || value.trim() === '') {
    return 'Tag cannot be empty';
  }
  
  const trimmed = value.trim();
  if (trimmed.length > FIELD_LIMITS.TAG) {
    return `Tag must be ${FIELD_LIMITS.TAG} characters or less`;
  }
  
  return null;
};

export const validateCommentContent = (value) => {
  return validateField(value, 'Comment content', true);
};

export const validateDependencyDescription = (value) => {
  return validateField(value, 'Dependency description', false);
};

// Helper function to get character count display
export const getCharacterCountDisplay = (value, limit) => {
  const count = value ? value.length : 0;
  const remaining = limit - count;
  const isNearLimit = remaining <= 20;
  const isOverLimit = remaining < 0;
  
  return {
    count,
    remaining,
    isNearLimit,
    isOverLimit,
    display: `${count}/${limit}`
  };
}; 