import React, { useState } from 'react';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { ChevronDown, ChevronRight, Users, AlertCircle, Tag } from 'lucide-react';
import KanbanCard from './KanbanCard';
import { Card, CardContent, CardHeader } from '../ui/card';

const SWIMLANE_TYPES = {
  assignee: {
    label: 'Assignee',
    icon: Users,
    getGroupKey: (feature) => feature.assignee_id || 'unassigned',
    getGroupLabel: (key, features, teamMembers) => {
      if (key === 'unassigned') return 'Unassigned';
      const member = teamMembers?.find(m => m.id === key);
      return member?.name || 'Unknown';
    },
    getGroupColor: () => 'bg-info-100 border-info/30'
  },
  priority: {
    label: 'Priority',
    icon: AlertCircle,
    getGroupKey: (feature) => feature.priority || 'medium',
    getGroupLabel: (key) => key.charAt(0).toUpperCase() + key.slice(1),
    getGroupColor: (key) => {
      switch (key) {
        case 'urgent': return 'bg-error-100 border-error/30';
        case 'high': return 'bg-warning-100 border-warning/30';
        case 'medium': return 'bg-warning-50 border-warning/20';
        case 'low': return 'bg-background-elevated border-border';
        default: return 'bg-background-elevated border-border';
      }
    }
  },
  type: {
    label: 'Type',
    icon: Tag,
    getGroupKey: (feature) => feature.type || 'story',
    getGroupLabel: (key) => key.charAt(0).toUpperCase() + key.slice(1),
    getGroupColor: (key) => {
      switch (key) {
        case 'story': return 'bg-info-100 border-info/30';
        case 'task': return 'bg-success-100 border-success/30';
        case 'research': return 'bg-accent-100 border-accent/30';
        default: return 'bg-background-elevated border-border';
      }
    }
  }
};

const COLUMNS = [
  { id: 'backlog', title: 'Backlog' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'review', title: 'Review' },
  { id: 'done', title: 'Done' }
];

function KanbanSwimlanes({ 
  features, 
  swimlaneType, 
  onDragEnd, 
  bulkMode, 
  selectedCards, 
  onCardSelect,
  onFeatureUpdate,
  onCardClick,
  teamMembers = [],
  updating 
}) {
  const [collapsedSwimlanes, setCollapsedSwimlanes] = useState(new Set());

  const swimlaneConfig = SWIMLANE_TYPES[swimlaneType];

  // Group features by swimlane
  const groupFeatures = () => {
    const groups = {};
    
    features.forEach(feature => {
      const groupKey = swimlaneConfig.getGroupKey(feature);
      if (!groups[groupKey]) {
        groups[groupKey] = {};
        COLUMNS.forEach(column => {
          groups[groupKey][column.id] = [];
        });
      }
      groups[groupKey][feature.status]?.push(feature);
    });

    return groups;
  };

  const toggleSwimlane = (swimlaneKey) => {
    const newCollapsed = new Set(collapsedSwimlanes);
    if (newCollapsed.has(swimlaneKey)) {
      newCollapsed.delete(swimlaneKey);
    } else {
      newCollapsed.add(swimlaneKey);
    }
    setCollapsedSwimlanes(newCollapsed);
  };

  const getSwimlaneStats = (swimlaneFeatures) => {
    const total = Object.values(swimlaneFeatures).flat().length;
    const done = swimlaneFeatures.done?.length || 0;
    const inProgress = swimlaneFeatures.in_progress?.length || 0;
    
    return { total, done, inProgress };
  };

  const groupedFeatures = groupFeatures();
  const swimlaneKeys = Object.keys(groupedFeatures).sort((a, b) => {
    // Sort unassigned last for assignee grouping
    if (swimlaneType === 'assignee') {
      if (a === 'unassigned') return 1;
      if (b === 'unassigned') return -1;
    }
    return a.localeCompare(b);
  });

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="space-y-4">
        {swimlaneKeys.map(swimlaneKey => {
          const swimlaneFeatures = groupedFeatures[swimlaneKey];
          const isCollapsed = collapsedSwimlanes.has(swimlaneKey);
          const stats = getSwimlaneStats(swimlaneFeatures);
          const groupLabel = swimlaneConfig.getGroupLabel(swimlaneKey, features, teamMembers);
          const groupColor = swimlaneConfig.getGroupColor(swimlaneKey);

          return (
            <Card key={swimlaneKey} className={`border-l-4 ${groupColor}`}>
              <CardHeader 
                className="pb-3 cursor-pointer hover:bg-background-elevated transition-colors"
                onClick={() => toggleSwimlane(swimlaneKey)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {isCollapsed ? (
                        <ChevronRight className="h-4 w-4 text-foreground-muted" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-foreground-muted" />
                      )}
                      {React.createElement(swimlaneConfig.icon, { className: "h-4 w-4 text-foreground-secondary" })}
                      <h3 className="font-medium text-foreground">{groupLabel}</h3>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-foreground-muted">
                      <span>Total: {stats.total}</span>
                      {stats.inProgress > 0 && (
                        <span className="text-info">In Progress: {stats.inProgress}</span>
                      )}
                      {stats.done > 0 && (
                        <span className="text-success">Done: {stats.done}</span>
                      )}
                    </div>
                  </div>

                  {!isCollapsed && (
                    <div className="text-xs text-foreground-muted">
                      Click to collapse
                    </div>
                  )}
                </div>
              </CardHeader>

              {!isCollapsed && (
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {COLUMNS.map(column => (
                      <div key={column.id} className="space-y-2">
                        <div className="flex items-center justify-between p-2 bg-background-elevated rounded">
                          <h4 className="text-sm font-medium text-foreground-secondary">
                            {column.title}
                          </h4>
                          <span className="text-xs text-foreground-muted bg-background-surface rounded-full px-2 py-1">
                            {swimlaneFeatures[column.id]?.length || 0}
                          </span>
                        </div>

                        <Droppable 
                          droppableId={`${swimlaneKey}-${column.id}`}
                          type="FEATURE"
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className={`min-h-32 rounded-lg transition-colors p-2 ${
                                snapshot.isDraggingOver 
                                  ? 'bg-accent-100 border-2 border-accent/30' 
                                  : 'bg-background-base'
                              } ${updating ? 'opacity-50' : ''}`}
                            >
                              <div className="space-y-3">
                                {(swimlaneFeatures[column.id] || []).map((feature, index) => (
                                  <KanbanCard
                                    key={feature.id}
                                    feature={feature}
                                    index={index}
                                    bulkMode={bulkMode}
                                    isSelected={selectedCards?.has(feature.id)}
                                    onSelect={onCardSelect}
                                    onFeatureUpdate={onFeatureUpdate}
                                    onCardClick={onCardClick}
                                  />
                                ))}
                                {provided.placeholder}
                              </div>
                            </div>
                          )}
                        </Droppable>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}

        {swimlaneKeys.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              {React.createElement(swimlaneConfig.icon, { className: "h-12 w-12 text-foreground-muted mx-auto mb-4" })}
              <h3 className="text-lg font-medium text-foreground mb-2">No Features Found</h3>
              <p className="text-foreground-muted">
                There are no features to display in this view.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DragDropContext>
  );
}

export default KanbanSwimlanes; 