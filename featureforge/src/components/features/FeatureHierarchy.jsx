import React from 'react';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { getFeatureTypeDetails } from '../../constants/featureTypes';
import { FEATURE_STATUSES, FEATURE_PRIORITIES } from '../../services/featureService';

// Helper functions
const getStatusDetails = (statusValue) => {
  return FEATURE_STATUSES.find(status => status.value === statusValue) || {
    value: statusValue,
    label: statusValue,
    color: 'gray'
  };
};

const getPriorityDetails = (priorityValue) => {
  return FEATURE_PRIORITIES.find(priority => priority.value === priorityValue) || {
    value: priorityValue,
    label: priorityValue,
    color: 'gray'
  };
};

const getStatusColor = (statusDetails) => {
  switch (statusDetails.color) {
    case 'blue':
      return 'bg-blue-100 text-blue-800';
    case 'amber':
      return 'bg-amber-100 text-amber-800';
    case 'green':
      return 'bg-green-100 text-green-700';
    case 'purple':
      return 'bg-purple-100 text-purple-800';
    case 'gray':
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getPriorityColor = (priorityDetails) => {
  switch (priorityDetails.color) {
    case 'red':
      return 'bg-red-100 text-red-800';
    case 'amber':
      return 'bg-amber-100 text-amber-800';
    case 'blue':
      return 'bg-blue-100 text-blue-800';
    case 'gray':
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const FeatureItem = ({ feature, level = 0, onFeatureClick, onVote }) => {
  const typeDetails = getFeatureTypeDetails(feature.type || 'task');
  const statusDetails = getStatusDetails(feature.status);
  const priorityDetails = getPriorityDetails(feature.priority);

  const indentClass = level > 0 ? `ml-${level * 6}` : '';

  return (
    <div className={`${indentClass} mb-2`}>
      <Card 
        className="cursor-pointer hover:shadow-md transition-shadow border-l-4"
        style={{ borderLeftColor: typeDetails.color.includes('purple') ? '#8b5cf6' : 
                                   typeDetails.color.includes('blue') ? '#3b82f6' :
                                   typeDetails.color.includes('green') ? '#10b981' : '#f59e0b' }}
        onClick={() => onFeatureClick(feature)}
      >
        <CardContent className="py-3 px-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={typeDetails.color}>
                  {typeDetails.icon} {typeDetails.label}
                </Badge>
                <Badge className={getStatusColor(statusDetails)}>
                  {statusDetails.label}
                </Badge>
                <Badge className={getPriorityColor(priorityDetails)}>
                  {priorityDetails.label}
                </Badge>
              </div>
              
              <h4 className="font-medium text-sm mb-1">{feature.title}</h4>
              {feature.description && (
                <p className="text-xs text-gray-600 line-clamp-2">{feature.description}</p>
              )}
              
              {feature.children && feature.children.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  {feature.children.length} child feature{feature.children.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            
            <div 
              className="flex flex-col items-center ml-3"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                className="text-gray-400 hover:text-blue-600 p-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onVote(feature.id);
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m19 14-7-7-7 7"/>
                </svg>
              </button>
              <span className="text-xs font-medium">{feature.votes || 0}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const FeatureHierarchy = ({ features, onFeatureClick, onVote }) => {
  // Organize features into hierarchy
  const organizeHierarchy = (features) => {
    const featureMap = new Map();
    const roots = [];

    // Create a map of all features
    features.forEach(feature => {
      featureMap.set(feature.id, { ...feature, children: [] });
    });

    // Build hierarchy
    features.forEach(feature => {
      if (feature.parentId && featureMap.has(feature.parentId)) {
        // This is a child feature
        const parent = featureMap.get(feature.parentId);
        parent.children.push(featureMap.get(feature.id));
      } else {
        // This is a root feature
        roots.push(featureMap.get(feature.id));
      }
    });

    return roots;
  };

  const renderFeatureTree = (feature, level = 0) => {
    return (
      <div key={feature.id}>
        <FeatureItem 
          feature={feature} 
          level={level}
          onFeatureClick={onFeatureClick}
          onVote={onVote}
        />
        {feature.children && feature.children.length > 0 && (
          <div className="ml-4">
            {feature.children.map(child => renderFeatureTree(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const hierarchicalFeatures = organizeHierarchy(features);

  if (hierarchicalFeatures.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No features to display</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Feature Hierarchy</h3>
        <div className="text-sm text-gray-500">
          {features.length} feature{features.length !== 1 ? 's' : ''} total
        </div>
      </div>
      
      <div className="space-y-2">
        {hierarchicalFeatures.map(feature => renderFeatureTree(feature))}
      </div>
    </div>
  );
};

export default FeatureHierarchy; 