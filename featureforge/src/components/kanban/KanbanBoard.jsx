import React, { useState, useEffect } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import { useToast } from '../ui/toast';
import { useTeamContext } from '../../hooks/useTeamContext';
import featureService from '../../services/featureService';
import KanbanColumn from './KanbanColumn';
import KanbanSwimlanes from './KanbanSwimlanes';
import KanbanFilters from './KanbanFilters';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { 
  Columns, 
  Users, 
  AlertCircle, 
  Tag,
  MoreHorizontal 
} from 'lucide-react';

// Define the board columns based on feature statuses
const COLUMNS = [
  { id: 'backlog', title: 'Backlog', color: 'bg-gray-100' },
  { id: 'in_progress', title: 'In Progress', color: 'bg-blue-100' },
  { id: 'review', title: 'Review', color: 'bg-yellow-100' },
  { id: 'done', title: 'Done', color: 'bg-green-100' }
];

const VIEW_MODES = {
  columns: { label: 'Columns', icon: Columns },
  swimlanes_assignee: { label: 'By Assignee', icon: Users },
  swimlanes_priority: { label: 'By Priority', icon: AlertCircle },
  swimlanes_type: { label: 'By Type', icon: Tag }
};

const KanbanBoard = () => {
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    assignee: 'all',
    type: 'all',
    priority: 'all',
    dateRange: { start: '', end: '' }
  });
  const [selectedCards, setSelectedCards] = useState(new Set());
  const [bulkMode, setBulkMode] = useState(false);
  const [viewMode, setViewMode] = useState('columns');
  const [showViewMenu, setShowViewMenu] = useState(false);
  
  const { teamId, teamMembers } = useTeamContext();
  const { toast } = useToast();

  // Load features when component mounts or team changes
  useEffect(() => {
    console.log('KanbanBoard: useEffect triggered, teamId:', teamId);
    if (teamId) {
      loadFeatures();
    }
  }, [teamId]);

  const loadFeatures = async () => {
    try {
      setLoading(true);
      console.log('KanbanBoard: Loading features for teamId:', teamId);
      const response = await featureService.getTeamFeatures(teamId);
      console.log('KanbanBoard: Loaded features response:', response);
      setFeatures(response.data || response);
    } catch (error) {
      console.error('Error loading features:', error);
      toast({
        title: "Error",
        description: "Failed to load features. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle drag and drop
  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    // If dropped outside a droppable area
    if (!destination) return;

    // If dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    let newStatus;
    
    // Handle swimlane drops
    if (destination.droppableId.includes('-')) {
      newStatus = destination.droppableId.split('-')[1];
    } else {
      newStatus = destination.droppableId;
    }

    const featureId = draggableId;

    try {
      setUpdating(true);
      
      // Find the feature being moved
      const feature = features.find(f => f.id === featureId);
      if (!feature) return;

      // Update locally first for immediate feedback
      setFeatures(prev => prev.map(f => 
        f.id === featureId ? { ...f, status: newStatus } : f
      ));

      // Update on server using featureService
      await featureService.updateFeature(featureId, {
        ...feature,
        status: newStatus
      });

      toast({
        title: "Success",
        description: `Feature moved to ${COLUMNS.find(col => col.id === newStatus)?.title}`,
      });

    } catch (error) {
      // Revert on error
      setFeatures(prev => prev.map(f => 
        f.id === featureId ? { ...f, status: source.droppableId.includes('-') ? source.droppableId.split('-')[1] : source.droppableId } : f
      ));
      
      console.error('Error updating feature:', error);
      toast({
        title: "Error",
        description: "Failed to update feature status",
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  };

  // Filter features based on current filters
  const filterFeatures = (features) => {
    return features.filter(feature => {
      // Search filter
      if (filters.search && !feature.title.toLowerCase().includes(filters.search.toLowerCase()) &&
          !feature.description?.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }

      // Assignee filter
      if (filters.assignee !== 'all') {
        if (filters.assignee === 'unassigned') {
          if (feature.assignee_id) return false;
        } else {
          if (feature.assignee_id !== filters.assignee) return false;
        }
      }

      // Type filter
      if (filters.type !== 'all' && feature.type !== filters.type) {
        return false;
      }

      // Priority filter
      if (filters.priority !== 'all' && feature.priority !== filters.priority) {
        return false;
      }

      // Date range filter
      if (filters.dateRange.start || filters.dateRange.end) {
        const featureDate = new Date(feature.created_at);
        const startDate = filters.dateRange.start ? new Date(filters.dateRange.start) : null;
        const endDate = filters.dateRange.end ? new Date(filters.dateRange.end) : null;

        if (startDate && featureDate < startDate) return false;
        if (endDate && featureDate > endDate) return false;
      }

      return true;
    });
  };

  // Group features by status for columns
  const getFeaturesByStatus = (status) => {
    const filteredFeatures = filterFeatures(features);
    return filteredFeatures.filter(feature => feature.status === status);
  };

  const handleCardSelect = (featureId) => {
    if (!bulkMode) return;
    
    const newSelected = new Set(selectedCards);
    if (newSelected.has(featureId)) {
      newSelected.delete(featureId);
    } else {
      newSelected.add(featureId);
    }
    setSelectedCards(newSelected);
  };

  const handleBulkStatusChange = async (newStatus) => {
    if (selectedCards.size === 0) return;

    try {
      const promises = Array.from(selectedCards).map(featureId => {
        const feature = features.find(f => f.id === featureId);
        if (!feature) return null;
        
        return featureService.updateFeature(featureId, {
          ...feature,
          status: newStatus
        });
      }).filter(Boolean);

      await Promise.all(promises);
      
      // Refresh features
      loadFeatures();
      setSelectedCards(new Set());
      setBulkMode(false);
      
      toast({
        title: "Success",
        description: `${selectedCards.size} features moved to ${COLUMNS.find(c => c.id === newStatus)?.title}`,
      });
    } catch (error) {
      console.error('Error updating features:', error);
      toast({
        title: "Error",
        description: "Failed to update features",
        variant: "destructive"
      });
    }
  };

  const getSwimlaneType = () => {
    if (viewMode === 'swimlanes_assignee') return 'assignee';
    if (viewMode === 'swimlanes_priority') return 'priority';
    if (viewMode === 'swimlanes_type') return 'type';
    return null;
  };

  const handleFeatureUpdate = (updatedFeature) => {
    // Update the feature in the local state immediately
    setFeatures(prev => prev.map(f => 
      f.id === updatedFeature.id ? updatedFeature : f
    ));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!teamId) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-secondary-500 mb-4">Please select a team to view the Kanban board.</p>
        </CardContent>
      </Card>
    );
  }

  const filteredFeatures = filterFeatures(features);

  return (
    <div className="h-full flex flex-col">
      <KanbanFilters 
        filters={filters}
        onFiltersChange={setFilters}
      />

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Kanban Board</h1>
          {filteredFeatures.length !== features.length && (
            <span className="text-sm text-gray-500">
              Showing {filteredFeatures.length} of {features.length} features
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {/* View Mode Selector */}
          <div className="relative">
            <Button
              variant="outline"
              onClick={() => setShowViewMenu(!showViewMenu)}
              className="flex items-center gap-2"
            >
              {React.createElement(VIEW_MODES[viewMode].icon, { className: "h-4 w-4" })}
              {VIEW_MODES[viewMode].label}
              <MoreHorizontal className="h-4 w-4" />
            </Button>
            
            {showViewMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-48">
                {Object.entries(VIEW_MODES).map(([mode, config]) => (
                  <button
                    key={mode}
                    onClick={() => {
                      setViewMode(mode);
                      setShowViewMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 ${
                      viewMode === mode ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                    }`}
                  >
                    {React.createElement(config.icon, { className: "h-4 w-4" })}
                    {config.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Bulk Actions */}
          {selectedCards.size > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
              <span className="text-sm font-medium text-blue-900">
                {selectedCards.size} selected
              </span>
              
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleBulkStatusChange(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="text-sm border-0 bg-transparent text-blue-700 font-medium"
                defaultValue=""
              >
                <option value="" disabled>Move to...</option>
                <option value="backlog">Backlog</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Review</option>
                <option value="done">Done</option>
              </select>
              
              <button
                onClick={() => {
                  setSelectedCards(new Set());
                  setBulkMode(false);
                }}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          )}
          
          <Button
            onClick={() => setBulkMode(!bulkMode)}
            variant={bulkMode ? "default" : "outline"}
            className="flex items-center gap-2"
          >
            {bulkMode ? 'Exit Bulk Mode' : 'Bulk Select'}
          </Button>
          
          {/* Statistics */}
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>Total: {filteredFeatures.length}</span>
            <span>Backlog: {getFeaturesByStatus('backlog').length}</span>
            <span>In Progress: {getFeaturesByStatus('in_progress').length}</span>
            <span>Review: {getFeaturesByStatus('review').length}</span>
            <span>Done: {getFeaturesByStatus('done').length}</span>
          </div>
        </div>
      </div>

      <Card className="flex-1">
        <CardContent className="p-6 h-full">
          {viewMode === 'columns' ? (
            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-full">
                {COLUMNS.map(column => (
                  <KanbanColumn
                    key={column.id}
                    column={column}
                    features={getFeaturesByStatus(column.id)}
                    updating={updating}
                    bulkMode={bulkMode}
                    selectedCards={selectedCards}
                    onCardSelect={handleCardSelect}
                    onFeatureUpdate={handleFeatureUpdate}
                  />
                ))}
              </div>
            </DragDropContext>
          ) : (
            <KanbanSwimlanes
              features={filteredFeatures}
              swimlaneType={getSwimlaneType()}
              onDragEnd={handleDragEnd}
              bulkMode={bulkMode}
              selectedCards={selectedCards}
              onCardSelect={handleCardSelect}
              onFeatureUpdate={handleFeatureUpdate}
              teamMembers={teamMembers}
              updating={updating}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default KanbanBoard; 