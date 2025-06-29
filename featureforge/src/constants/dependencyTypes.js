import { 
  Ban, 
  AlertTriangle, 
  Link, 
  ArrowRightLeft,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';

export const DEPENDENCY_TYPES = {
  blocks: {
    label: 'Blocks',
    description: 'This feature blocks the target feature',
    icon: Ban,
    color: 'text-red-600 bg-red-50 border-red-200',
    badgeColor: 'bg-red-100 text-red-800',
    inverse: 'blocked_by'
  },
  blocked_by: {
    label: 'Blocked by',
    description: 'This feature is blocked by the target feature',
    icon: AlertTriangle,
    color: 'text-orange-600 bg-orange-50 border-orange-200',
    badgeColor: 'bg-orange-100 text-orange-800',
    inverse: 'blocks'
  },
  depends_on: {
    label: 'Depends on',
    description: 'This feature depends on the target feature',
    icon: Link,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    badgeColor: 'bg-blue-100 text-blue-800',
    inverse: null
  },
  relates_to: {
    label: 'Relates to',
    description: 'This feature is related to the target feature',
    icon: ArrowRightLeft,
    color: 'text-gray-600 bg-gray-50 border-gray-200',
    badgeColor: 'bg-gray-100 text-gray-800',
    inverse: 'relates_to'
  }
};

export const DEPENDENCY_STATUS_ICONS = {
  pending: Clock,
  completed: CheckCircle,
  blocked: XCircle
};

export const getDependencyTypeConfig = (type) => {
  return DEPENDENCY_TYPES[type] || DEPENDENCY_TYPES.relates_to;
};

export const getDependencyStatusColor = (dependency) => {
  if (!dependency.targetFeature && !dependency.sourceFeature) {
    return 'text-gray-500';
  }
  
  const feature = dependency.targetFeature || dependency.sourceFeature;
  
  switch (feature.status) {
    case 'done':
      return 'text-green-600';
    case 'in_progress':
      return 'text-blue-600';
    case 'review':
      return 'text-yellow-600';
    case 'backlog':
    default:
      return 'text-gray-600';
  }
};

export const isFeatureBlocked = (dependencies) => {
  return dependencies.some(dep => 
    ['blocks', 'depends_on'].includes(dep.dependencyType) && 
    dep.sourceFeature?.status !== 'done'
  );
}; 