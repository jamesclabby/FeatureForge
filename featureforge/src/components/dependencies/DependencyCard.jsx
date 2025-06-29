import React, { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Trash2, MoreHorizontal, ExternalLink } from 'lucide-react';
import { getDependencyTypeConfig, getDependencyStatusColor } from '../../constants/dependencyTypes';
import { getFeatureTypeDetails } from '../../constants/featureTypes';

const DependencyCard = ({ dependency, type, onDelete }) => {
  const [showActions, setShowActions] = useState(false);
  
  // Determine which feature to display based on dependency type
  const displayFeature = type === 'outgoing' ? dependency.targetFeature : dependency.sourceFeature;
  const dependencyConfig = getDependencyTypeConfig(dependency.dependencyType);
  const statusColor = getDependencyStatusColor(dependency);
  const featureTypeDetails = getFeatureTypeDetails(displayFeature?.type);

  if (!displayFeature) {
    return null;
  }

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to remove this dependency?')) {
      onDelete(dependency.id);
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'done':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'review':
        return 'bg-yellow-100 text-yellow-800';
      case 'backlog':
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card 
      className={`transition-all hover:shadow-md border-l-4 ${dependencyConfig.color.split(' ')[2]}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            {/* Dependency Type Badge */}
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className={`${dependencyConfig.badgeColor} flex items-center gap-1`}>
                {React.createElement(dependencyConfig.icon, { className: "h-3 w-3" })}
                {dependencyConfig.label}
              </Badge>
              
              {/* Feature Type Badge */}
              <Badge variant="outline" className={`${featureTypeDetails.color} text-xs`}>
                {featureTypeDetails.label}
              </Badge>
            </div>

            {/* Feature Title */}
            <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">
              {displayFeature.title}
            </h4>

            {/* Feature Details */}
            <div className="flex items-center gap-3 text-sm text-gray-600">
              {/* Status */}
              <Badge 
                variant="outline" 
                className={`${getStatusBadgeColor(displayFeature.status)} text-xs`}
              >
                {displayFeature.status?.replace('_', ' ').toUpperCase()}
              </Badge>

              {/* Priority */}
              <Badge 
                variant="outline" 
                className={`${getPriorityColor(displayFeature.priority)} text-xs`}
              >
                {displayFeature.priority?.toUpperCase() || 'MEDIUM'}
              </Badge>

              {/* Assignee */}
              {displayFeature.assignee && (
                <div className="flex items-center gap-1">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={displayFeature.assignee.avatar} />
                    <AvatarFallback className="text-xs">
                      {displayFeature.assignee.name?.slice(0, 2).toUpperCase() || 
                       displayFeature.assignee.email?.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs truncate max-w-20">
                    {displayFeature.assignee.name || displayFeature.assignee.email}
                  </span>
                </div>
              )}
            </div>

            {/* Description if available */}
            {dependency.description && (
              <p className="text-sm text-gray-600 mt-2 italic">
                "{dependency.description}"
              </p>
            )}

            {/* Created by info */}
            {dependency.creator && (
              <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                <span>Created by {dependency.creator.name || dependency.creator.email}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className={`flex items-center gap-1 ml-4 transition-opacity ${
            showActions ? 'opacity-100' : 'opacity-0'
          }`}>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-gray-400 hover:text-blue-600"
              title="View Feature"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"
              onClick={handleDelete}
              title="Remove Dependency"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DependencyCard; 