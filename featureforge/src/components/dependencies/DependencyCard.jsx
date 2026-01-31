import React, { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Trash2, ExternalLink } from 'lucide-react';
import { getDependencyTypeConfig, getDependencyStatusColor } from '../../constants/dependencyTypes';
import { getFeatureTypeDetails } from '../../constants/featureTypes';
import { getStatusColorClasses, getPriorityColorClasses } from '../../constants/designTokens';

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

  // Get colors from centralized design tokens
  const statusColors = getStatusColorClasses(displayFeature.status);
  const priorityColors = getPriorityColorClasses(displayFeature.priority);

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
            <h4 className="font-medium text-foreground mb-2 line-clamp-2">
              {displayFeature.title}
            </h4>

            {/* Feature Details */}
            <div className="flex items-center gap-3 text-sm text-foreground-secondary">
              {/* Status */}
              <Badge 
                variant="outline" 
                className={`${statusColors.combined} text-xs`}
              >
                {displayFeature.status?.replace('_', ' ').toUpperCase()}
              </Badge>

              {/* Priority */}
              <Badge 
                variant="outline" 
                className={`${priorityColors.combined} text-xs`}
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
              <p className="text-sm text-foreground-secondary mt-2 italic">
                "{dependency.description}"
              </p>
            )}

            {/* Created by info */}
            {dependency.creator && (
              <div className="flex items-center gap-1 mt-2 text-xs text-foreground-muted">
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
              className="h-8 w-8 p-0 text-foreground-muted hover:text-info"
              title="View Feature"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-foreground-muted hover:text-error"
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
