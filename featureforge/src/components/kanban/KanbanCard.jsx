import React, { useState } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { getFeatureTypeDetails } from '../../constants/featureTypes';
import { MessageSquare, ThumbsUp, Calendar, Clock, Edit2, Save, X, AlertTriangle } from 'lucide-react';
import featureService from '../../services/featureService';

const KanbanCard = ({ feature, index, bulkMode, isSelected, onSelect, onFeatureUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(feature.title);
  const [editedDescription, setEditedDescription] = useState(feature.description || '');

  const typeDetails = getFeatureTypeDetails(feature.type);

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

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
    }
  };

  const cardContent = (
    <Card 
      className={`cursor-grab active:cursor-grabbing transition-all hover:shadow-md group ${
        isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
      } ${bulkMode ? 'hover:bg-gray-50 cursor-pointer' : 'hover:shadow-sm'}`}
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
                className="w-full text-sm font-medium border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            {/* Type icon */}
            <span className="text-lg">{typeDetails.icon}</span>
            
            {/* Bulk selection checkbox */}
            {bulkMode && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => {
                  e.stopPropagation();
                  onSelect?.(feature.id);
                }}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 ml-1"
              />
            )}
            
            {/* Edit button */}
            {!bulkMode && !isEditing && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded"
              >
                <Edit2 className="h-3 w-3 text-gray-500" />
              </button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-3">
        {/* Description */}
        {(feature.description || isEditing) && (
          <div>
            {isEditing ? (
              <textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                className="w-full text-xs text-gray-600 border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={2}
                onClick={(e) => e.stopPropagation()}
                placeholder="Add description..."
              />
            ) : (
              <p className="text-xs text-gray-600 line-clamp-2">
                {feature.description}
              </p>
            )}
          </div>
        )}

        {/* Edit actions */}
        {isEditing && (
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSave();
              }}
              className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
            >
              <Save className="h-3 w-3" />
              Save
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCancel();
              }}
              className="flex items-center gap-1 px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
            >
              <X className="h-3 w-3" />
              Cancel
            </button>
          </div>
        )}

        {/* Progress bar for parent features */}
        {progress && (
          <div>
            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
              <span>Progress</span>
              <span>{progress.completed}/{progress.total} completed</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Priority and Type Badges */}
        <div className="flex items-center justify-between">
          <Badge 
            variant="outline" 
            className={`text-xs ${getPriorityColor(feature.priority)}`}
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
            <span className="text-xs text-gray-600 truncate">
              {feature.assignee.name || feature.assignee.email}
            </span>
          </div>
        )}

        {/* Due Date with overdue indicator */}
        {feature.due_date && (
          <div className={`flex items-center gap-2 ${
            isOverdue() ? 'text-red-600' : 'text-gray-500'
          }`}>
            {isOverdue() && <AlertTriangle className="h-3 w-3" />}
            <Calendar className="h-3 w-3" />
            <span className="text-xs">
              Due {formatDate(feature.due_date)}
            </span>
          </div>
        )}

        {/* Footer with stats */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center gap-3">
            {/* Votes */}
            {feature.votes_count > 0 && (
              <div className="flex items-center gap-1">
                <ThumbsUp className="h-3 w-3 text-blue-500" />
                <span className="text-xs text-gray-600">{feature.votes_count}</span>
              </div>
            )}
            
            {/* Comments */}
            {feature.comments_count > 0 && (
              <div className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3 text-green-500" />
                <span className="text-xs text-gray-600">{feature.comments_count}</span>
              </div>
            )}
          </div>

          {/* Created date */}
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-gray-400" />
            <span className="text-xs text-gray-400">
              {formatDate(feature.created_at)}
            </span>
          </div>
        </div>

        {/* Parent feature indicator */}
        {feature.parent && (
          <div className="flex items-center gap-1 pt-1">
            <span className="text-xs text-gray-500">Parent:</span>
            <span className="text-xs text-blue-600 truncate">
              {feature.parent.title}
            </span>
          </div>
        )}

        {/* Children count */}
        {feature.children && feature.children.length > 0 && (
          <div className="flex items-center gap-1 pt-1">
            <span className="text-xs text-gray-500">
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