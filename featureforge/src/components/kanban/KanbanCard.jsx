import React, { useState } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { getFeatureTypeDetails } from '../../constants/featureTypes';
import { getPriorityColorClasses, DEPENDENCY_STATUS_COLORS } from '../../constants/designTokens';
import { MessageSquare, ThumbsUp, Calendar, Clock, Edit2, Save, X, AlertTriangle, Ban, Link } from 'lucide-react';
import featureService from '../../services/featureService';

const KanbanCard = ({ feature, index, bulkMode, isSelected, onSelect, onFeatureUpdate, onCardClick }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(feature.title);
  const [editedDescription, setEditedDescription] = useState(feature.description || '');

  const typeDetails = getFeatureTypeDetails(feature.type);

  // Get priority color from centralized design tokens
  const priorityColors = getPriorityColorClasses(feature.priority);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Calculate progress for parent features
  const getProgress = () => {
    if (!feature.children || feature.children.length === 0) return null;
    
    const completed = feature.children.filter(child => child.status === 'done').length;
    const total = feature.children.length;
    return { completed, total, percentage: Math.round((completed / total) * 100) };
  };

  const progress = getProgress();

  // Check if feature is overdue (if it has a due date)
  const isOverdue = () => {
    if (!feature.due_date) return false;
    return new Date(feature.due_date) < new Date();
  };

  // Check if feature has dependencies or is blocked
  const getDependencyStatus = () => {
    if (!feature.dependencyStats) return null;
    
    const { isBlocked, totalOutgoing, totalIncoming, blockingCount, blockedByCount } = feature.dependencyStats;
    
    // Priority 1: Feature is blocked by incomplete dependencies (most critical)
    if (isBlocked) {
      return {
        type: 'blocked',
        icon: Ban,
        color: 'text-error',
        bgColor: 'bg-error-50',
        borderColor: 'border-error/30',
        tooltip: `Blocked by ${blockedByCount} incomplete feature${blockedByCount !== 1 ? 's' : ''}`,
        severity: 'critical'
      };
    }
    
    // Priority 2: Feature is blocking others (important but not critical)
    if (blockingCount > 0) {
      return {
        type: 'blocking',
        icon: AlertTriangle,
        color: 'text-warning',
        bgColor: 'bg-warning-50',
        borderColor: 'border-warning/30',
        tooltip: `Blocking ${blockingCount} feature${blockingCount !== 1 ? 's' : ''}`,
        severity: 'warning'
      };
    }
    
    // Priority 3: Feature has dependencies but not blocking/blocked (informational)
    if (totalOutgoing > 0 || totalIncoming > 0) {
      return {
        type: 'has_dependencies',
        icon: Link,
        color: 'text-info',
        bgColor: 'bg-info-50',
        borderColor: 'border-info/30',
        tooltip: `${totalOutgoing + totalIncoming} dependencies`,
        severity: 'info'
      };
    }
    
    return null;
  };

  const dependencyStatus = getDependencyStatus();

  const handleSave = async () => {
    try {
      const updatedFeature = await featureService.updateFeature(feature.id, {
        ...feature,
        title: editedTitle,
        description: editedDescription
      });

      setIsEditing(false);
      // Notify parent of the update with the new data
      onFeatureUpdate?.(updatedFeature.data || updatedFeature);
    } catch (error) {
      console.error('Error updating feature:', error);
    }
  };

  const handleCancel = () => {
    setEditedTitle(feature.title);
    setEditedDescription(feature.description || '');
    setIsEditing(false);
  };

  const handleCardClick = (e) => {
    if (bulkMode && !isEditing) {
      e.preventDefault();
      e.stopPropagation();
      onSelect?.(feature.id);
    } else if (!isEditing && onCardClick) {
      e.preventDefault();
      e.stopPropagation();
      onCardClick(feature);
    }
  };

  const cardContent = (
    <Card 
      className={`cursor-grab active:cursor-grabbing transition-all hover:shadow-md group ${
        isSelected ? 'ring-2 ring-accent bg-accent-50' : ''
      } ${bulkMode ? 'hover:bg-background-elevated cursor-pointer' : 'hover:shadow-sm'}`}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            {isEditing ? (
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="w-full text-sm font-medium border border-border rounded px-2 py-1 bg-background-surface text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            ) : (
              <CardTitle className="text-sm font-medium line-clamp-2">
                {feature.title}
              </CardTitle>
            )}
          </div>
          
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Dependency indicator - only show for has_dependencies type */}
            {dependencyStatus && dependencyStatus.type === 'has_dependencies' && (
              <div 
                className={`${dependencyStatus.color} p-1 rounded hover:${dependencyStatus.bgColor} transition-colors`}
                title={dependencyStatus.tooltip}
              >
                {React.createElement(dependencyStatus.icon, { className: "h-3 w-3" })}
              </div>
            )}
            
            {/* Type icon */}
            <typeDetails.Icon className="h-4 w-4 text-foreground-muted" />
            
            {/* Bulk selection checkbox */}
            {bulkMode && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => {
                  e.stopPropagation();
                  onSelect?.(feature.id);
                }}
                className="rounded border-border text-accent focus:ring-ring ml-1"
              />
            )}
            
            {/* Edit button */}
            {!bulkMode && !isEditing && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-background-elevated rounded"
              >
                <Edit2 className="h-3 w-3 text-foreground-muted" />
              </button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-3">
        {/* Only show has_dependencies banner */}
        {dependencyStatus?.type === 'has_dependencies' && (
          <div className={`flex items-center gap-2 p-2 ${dependencyStatus.bgColor} border ${dependencyStatus.borderColor} rounded text-info text-xs`}>
            <Link className="h-3 w-3" />
            <span>{dependencyStatus.tooltip}</span>
          </div>
        )}

        {/* Description */}
        {(feature.description || isEditing) && (
          <div>
            {isEditing ? (
              <textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                className="w-full text-xs text-foreground-secondary border border-border rounded px-2 py-1 bg-background-surface focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
                rows={2}
                onClick={(e) => e.stopPropagation()}
                placeholder="Add description..."
              />
            ) : (
              <p className="text-xs text-foreground-secondary line-clamp-2">
                {feature.description}
              </p>
            )}
          </div>
        )}

        {/* Edit actions */}
        {isEditing && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleSave();
              }}
              className="h-7 text-xs"
            >
              <Save className="h-3 w-3 mr-1" />
              Save
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleCancel();
              }}
              className="h-7 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Cancel
            </Button>
          </div>
        )}

        {/* Progress bar for parent features */}
        {progress && (
          <div>
            <div className="flex items-center justify-between text-xs text-foreground-secondary mb-1">
              <span>Progress</span>
              <span>{progress.completed}/{progress.total} completed</span>
            </div>
            <div className="w-full bg-background-elevated rounded-full h-2">
              <div 
                className="bg-success h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Priority and Type Badges */}
        <div className="flex items-center justify-between">
          <Badge 
            variant="outline" 
            className={`text-xs ${priorityColors.combined}`}
          >
            {feature.priority?.toUpperCase() || 'MEDIUM'}
          </Badge>
          
          <Badge 
            variant="outline" 
            className={`text-xs ${typeDetails.color}`}
          >
            {typeDetails.label}
          </Badge>
        </div>

        {/* Assignee */}
        {feature.assignee && (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={feature.assignee.avatar} />
              <AvatarFallback className="text-xs">
                {feature.assignee.name?.slice(0, 2).toUpperCase() || 
                 feature.assignee.email?.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-foreground-secondary truncate">
              {feature.assignee.name || feature.assignee.email}
            </span>
          </div>
        )}

        {/* Due Date with overdue indicator */}
        {feature.due_date && (
          <div className={`flex items-center gap-2 ${
            isOverdue() ? 'text-error' : 'text-foreground-muted'
          }`}>
            {isOverdue() && <AlertTriangle className="h-3 w-3" />}
            <Calendar className="h-3 w-3" />
            <span className="text-xs">
              Due {formatDate(feature.due_date)}
            </span>
          </div>
        )}

        {/* Footer with stats */}
        <div className="flex items-center justify-between pt-2 border-t border-border-muted">
          <div className="flex items-center gap-3">
            {/* Subtle blocked indicator in footer */}
            {dependencyStatus?.type === 'blocked' && (
              <div className="flex items-center gap-1 px-2 py-1 bg-error-100 text-error rounded-full">
                <Ban className="h-3 w-3" />
                <span className="text-xs font-medium">Blocked</span>
              </div>
            )}
            
            {/* Subtle blocking indicator */}
            {dependencyStatus?.type === 'blocking' && (
              <div className="flex items-center gap-1 px-2 py-1 bg-warning-100 text-warning rounded-full">
                <AlertTriangle className="h-3 w-3" />
                <span className="text-xs font-medium">Blocking {feature.dependencyStats.blockingCount}</span>
              </div>
            )}
            
            {/* Dependencies count */}
            {dependencyStatus && dependencyStatus.type === 'has_dependencies' && (
              <div className="flex items-center gap-1">
                <Link className="h-3 w-3 text-info" />
                <span className="text-xs text-foreground-secondary">
                  {feature.dependencyStats.totalOutgoing + feature.dependencyStats.totalIncoming}
                </span>
              </div>
            )}
            
            {/* Votes */}
            {feature.votes_count > 0 && (
              <div className="flex items-center gap-1">
                <ThumbsUp className="h-3 w-3 text-info" />
                <span className="text-xs text-foreground-secondary">{feature.votes_count}</span>
              </div>
            )}
            
            {/* Comments */}
            {feature.comments_count > 0 && (
              <div className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3 text-success" />
                <span className="text-xs text-foreground-secondary">{feature.comments_count}</span>
              </div>
            )}
          </div>

          {/* Created date */}
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-foreground-muted" />
            <span className="text-xs text-foreground-muted">
              {formatDate(feature.created_at)}
            </span>
          </div>
        </div>

        {/* Parent feature indicator */}
        {feature.parent && (
          <div className="flex items-center gap-1 pt-1">
            <span className="text-xs text-foreground-muted">Parent:</span>
            <span className="text-xs text-info truncate">
              {feature.parent.title}
            </span>
          </div>
        )}

        {/* Children count */}
        {feature.children && feature.children.length > 0 && (
          <div className="flex items-center gap-1 pt-1">
            <span className="text-xs text-foreground-muted">
              {feature.children.length} child{feature.children.length !== 1 ? 'ren' : ''}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // In bulk mode, don't wrap with Draggable to prevent drag conflicts
  if (bulkMode) {
    return cardContent;
  }

  return (
    <Draggable draggableId={feature.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`${snapshot.isDragging ? 'rotate-2 scale-105' : ''} transition-transform`}
        >
          {cardContent}
        </div>
      )}
    </Draggable>
  );
};

export default KanbanCard;
