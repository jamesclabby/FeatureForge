import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import KanbanCard from './KanbanCard';

function KanbanColumn({ column, features, updating, bulkMode, selectedCards, onCardSelect, onFeatureUpdate }) {
  return (
    <Card className="h-fit min-h-[500px]">
      <CardHeader className={`${column.color} rounded-t-lg`}>
        <CardTitle className="flex items-center justify-between text-lg">
          <span>{column.title}</span>
          <Badge variant="secondary" className="bg-white text-gray-700">
            {features.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2">
        <Droppable droppableId={column.id}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`space-y-3 min-h-[400px] p-2 rounded-lg transition-colors ${
                snapshot.isDraggingOver 
                  ? 'bg-blue-50 border-2 border-blue-200 border-dashed' 
                  : 'bg-gray-50'
              } ${updating ? 'opacity-75' : ''}`}
            >
              {features.map((feature, index) => (
                <KanbanCard
                  key={feature.id}
                  feature={feature}
                  index={index}
                  bulkMode={bulkMode}
                  isSelected={selectedCards?.has(feature.id)}
                  onSelect={onCardSelect}
                  onFeatureUpdate={onFeatureUpdate}
                />
              ))}
              {provided.placeholder}
              
              {/* Empty state */}
              {features.length === 0 && (
                <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
                  {snapshot.isDraggingOver 
                    ? 'Drop feature here' 
                    : 'No features in this column'
                  }
                </div>
              )}
            </div>
          )}
        </Droppable>
      </CardContent>
    </Card>
  );
}

export default KanbanColumn; 