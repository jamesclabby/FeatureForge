import React, { useState, useEffect } from 'react';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Search, Filter, X, Calendar, Bookmark } from 'lucide-react';
import { FEATURE_TYPES_ARRAY } from '../../constants/featureTypes';
import { useTeamContext } from '../../hooks/useTeamContext';
import teamService from '../../services/teamService';

const KanbanFilters = ({ filters, onFiltersChange }) => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const { teamId } = useTeamContext();
  const [savedPresets, setSavedPresets] = useState([]);
  const [presetName, setPresetName] = useState('');
  const [showPresetSave, setShowPresetSave] = useState(false);

  // Load team members for assignee filter
  useEffect(() => {
    const loadTeamMembers = async () => {
      if (teamId) {
        try {
          const response = await teamService.getTeamMembers(teamId);
          // Extract data property from response and ensure it's an array
          const members = response.data || response || [];
          setTeamMembers(Array.isArray(members) ? members : []);
        } catch (error) {
          console.error('Error loading team members:', error);
          setTeamMembers([]); // Set to empty array on error
        }
      }
    };

    loadTeamMembers();
  }, [teamId]);

  // Load saved presets from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('kanban-filter-presets');
    if (saved) {
      setSavedPresets(JSON.parse(saved));
    }
  }, []);

  const handleFilterChange = (key, value) => {
    onFiltersChange(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearAllFilters = () => {
    onFiltersChange({
      search: '',
      assignee: 'all',
      type: 'all',
      priority: 'all',
      dateRange: { start: '', end: '' }
    });
  };

  const hasActiveFilters = filters.search || 
    filters.assignee !== 'all' || 
    filters.type !== 'all' || 
    filters.priority !== 'all' ||
    filters.dateRange.start ||
    filters.dateRange.end;

  const featureTypes = [
    { value: 'story', label: 'Story', color: 'bg-blue-100 text-blue-800' },
    { value: 'task', label: 'Task', color: 'bg-green-100 text-green-800' },
    { value: 'research', label: 'Research', color: 'bg-purple-100 text-purple-800' }
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-800' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' }
  ];

  const getCurrentFilters = () => ({
    search: filters.search,
    assignee: filters.assignee,
    type: filters.type,
    priority: filters.priority,
    dateRange: filters.dateRange
  });

  const saveFilterPreset = () => {
    if (!presetName.trim()) return;
    
    const newPreset = {
      id: Date.now().toString(),
      name: presetName,
      filters: getCurrentFilters()
    };
    
    const updatedPresets = [...savedPresets, newPreset];
    setSavedPresets(updatedPresets);
    localStorage.setItem('kanban-filter-presets', JSON.stringify(updatedPresets));
    setPresetName('');
    setShowPresetSave(false);
  };

  const applyPreset = (preset) => {
    const { filters } = preset;
    onFiltersChange(prev => ({
      ...prev,
      search: filters.search,
      assignee: filters.assignee,
      type: filters.type,
      priority: filters.priority,
      dateRange: filters.dateRange
    }));
  };

  const deletePreset = (presetId) => {
    const updatedPresets = savedPresets.filter(p => p.id !== presetId);
    setSavedPresets(updatedPresets);
    localStorage.setItem('kanban-filter-presets', JSON.stringify(updatedPresets));
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Search and Filter Toggle Row */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search features..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter Toggle */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5 ml-1">
                    Active
                  </span>
                )}
              </Button>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="flex items-center gap-1 text-gray-500 hover:text-gray-700"
                >
                  <X className="h-3 w-3" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Filter Controls */}
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
              {/* Assignee Filter */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Assignee
                </label>
                <Select
                  value={filters.assignee}
                  onValueChange={(value) => handleFilterChange('assignee', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All assignees" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Assignees</SelectItem>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {Array.isArray(teamMembers) && teamMembers.map(member => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name || member.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Type Filter */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Type
                </label>
                <Select
                  value={filters.type}
                  onValueChange={(value) => handleFilterChange('type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {FEATURE_TYPES_ARRAY.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        <span className="flex items-center gap-2">
                          <span>{type.icon}</span>
                          <span>{type.label}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Priority Filter */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Priority
                </label>
                <Select
                  value={filters.priority}
                  onValueChange={(value) => handleFilterChange('priority', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Date Range
                </label>
                <div className="space-y-2">
                  <input
                    type="date"
                    value={filters.dateRange.start}
                    onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, start: e.target.value })}
                    className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Start date"
                  />
                  <input
                    type="date"
                    value={filters.dateRange.end}
                    onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, end: e.target.value })}
                    className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="End date"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Active Filters Summary */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
              <span className="text-sm text-gray-500">Active filters:</span>
              
              {filters.search && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  Search: "{filters.search}"
                  <button
                    onClick={() => handleFilterChange('search', '')}
                    className="hover:bg-blue-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              {filters.assignee !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  Assignee: {filters.assignee === 'unassigned' ? 'Unassigned' : 
                    (Array.isArray(teamMembers) ? teamMembers.find(m => m.id === filters.assignee)?.name : null) || 'Unknown'}
                  <button
                    onClick={() => handleFilterChange('assignee', 'all')}
                    className="hover:bg-green-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              {filters.type !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                  Type: {FEATURE_TYPES_ARRAY.find(t => t.value === filters.type)?.label}
                  <button
                    onClick={() => handleFilterChange('type', 'all')}
                    className="hover:bg-purple-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              {filters.priority !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                  Priority: {filters.priority.charAt(0).toUpperCase() + filters.priority.slice(1)}
                  <button
                    onClick={() => handleFilterChange('priority', 'all')}
                    className="hover:bg-orange-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              {filters.dateRange.start && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-teal-100 text-teal-800 text-xs rounded-full">
                  Date Range: {filters.dateRange.start} - {filters.dateRange.end}
                  <button
                    onClick={() => handleFilterChange('dateRange', { start: '', end: '' })}
                    className="hover:bg-teal-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>
          )}

          {/* Saved Presets */}
          {showPresetSave && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-700">
                  <Bookmark className="h-4 w-4 inline mr-1" />
                  Saved Filters
                </h4>
                <button
                  onClick={() => setShowPresetSave(!showPresetSave)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Save Current
                </button>
              </div>

              {/* Save Preset Form */}
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  placeholder="Preset name"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={saveFilterPreset}
                  disabled={!presetName.trim()}
                  className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save
                </button>
                <button
                  onClick={() => setShowPresetSave(false)}
                  className="px-3 py-2 text-gray-600 hover:text-gray-800 text-sm"
                >
                  Cancel
                </button>
              </div>

              {/* Preset List */}
              <div className="flex flex-wrap gap-2">
                {savedPresets.map(preset => (
                  <div
                    key={preset.id}
                    className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-md text-sm"
                  >
                    <button
                      onClick={() => applyPreset(preset)}
                      className="text-gray-700 hover:text-gray-900"
                    >
                      {preset.name}
                    </button>
                    <button
                      onClick={() => deletePreset(preset.id)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {savedPresets.length === 0 && (
                  <p className="text-sm text-gray-500">No saved filters yet</p>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default KanbanFilters; 