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
    getGroupColor: () => 'bg-blue-50 border-blue-200'
  },
  priority: {
    label: 'Priority',
    icon: AlertCircle,
    getGroupKey: (feature) => feature.priority || 'medium',
    getGroupLabel: (key) => key.charAt(0).toUpperCase() + key.slice(1),
    getGroupColor: (key) => {
      switch (key) {
        case 'urgent': return 'bg-red-50 border-red-200';
        case 'high': return 'bg-orange-50 border-orange-200';
        case 'medium': return 'bg-yellow-50 border-yellow-200';
        case 'low': return 'bg-gray-50 border-gray-200';
        default: return 'bg-gray-50 border-gray-200';
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
        case 'story': return 'bg-blue-50 border-blue-200';
        case 'task': return 'bg-green-50 border-green-200';
        case 'research': return 'bg-purple-50 border-purple-200';
        default: return 'bg-gray-50 border-gray-200';
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
                className="pb-3 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleSwimlane(swimlaneKey)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {isCollapsed ? (
                        <ChevronRight className="h-4 w-4 text-gray-500" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      )}
                      {React.createElement(swimlaneConfig.icon, { className: "h-4 w-4 text-gray-600" })}
                      <h3 className="font-medium text-gray-900">{groupLabel}</h3>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Total: {stats.total}</span>
                      {stats.inProgress > 0 && (
                        <span className="text-blue-600">In Progress: {stats.inProgress}</span>
                      )}
                      {stats.done > 0 && (
                        <span className="text-green-600">Done: {stats.done}</span>
                      )}
                    </div>
                  </div>

                  {!isCollapsed && (
                    <div className="text-xs text-gray-400">
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
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <h4 className="text-sm font-medium text-gray-700">
                            {column.title}
                          </h4>
                          <span className="text-xs text-gray-500 bg-white rounded-full px-2 py-1">
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
                                  ? 'bg-blue-50 border-2 border-blue-200' 
                                  : 'bg-gray-25'
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
              {React.createElement(swimlaneConfig.icon, { className: "h-12 w-12 text-gray-400 mx-auto mb-4" })}
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Features Found</h3>
              <p className="text-gray-500">
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