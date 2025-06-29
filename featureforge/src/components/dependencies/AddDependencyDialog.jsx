import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Search, Check } from 'lucide-react';
import { useTeamContext } from '../../hooks/useTeamContext';
import dependencyService from '../../services/dependencyService';
import { DEPENDENCY_TYPES, getDependencyTypeConfig } from '../../constants/dependencyTypes';
import { getFeatureTypeDetails } from '../../constants/featureTypes';

const AddDependencyDialog = ({ isOpen, onClose, onAdd, sourceFeature }) => {
  const [selectedDependencyType, setSelectedDependencyType] = useState('depends_on');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  
  const { teamId } = useTeamContext();

  useEffect(() => {
    if (isOpen) {
      // Reset form when dialog opens
      setSelectedDependencyType('depends_on');
      setSearchTerm('');
      setSearchResults([]);
      setSelectedFeature(null);
      setDescription('');
      
      // Load initial features
      searchFeatures('');
    }
  }, [isOpen, teamId]);

  useEffect(() => {
    if (searchTerm) {
      const timeoutId = setTimeout(() => {
        searchFeatures(searchTerm);
      }, 300);
      return () => clearTimeout(timeoutId);
    } else if (isOpen) {
      searchFeatures('');
    }
  }, [searchTerm, isOpen]);

  const searchFeatures = async (term) => {
    if (!teamId) return;
    
    try {
      setSearching(true);
      const response = await dependencyService.searchTeamFeatures(teamId, term);
      
      // Filter out the source feature and features that already have dependencies
      const filteredFeatures = (response.data || response).filter(feature => 
        feature.id !== sourceFeature.id
      );
      
      setSearchResults(filteredFeatures);
    } catch (error) {
      console.error('Error searching features:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFeature || !selectedDependencyType) {
      return;
    }

    setLoading(true);
    
    try {
      await onAdd({
        targetFeatureId: selectedFeature.id,
        dependencyType: selectedDependencyType,
        description: description.trim() || null
      });
    } catch (error) {
      console.error('Error adding dependency:', error);
    } finally {
      setLoading(false);
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Dependency</DialogTitle>
          <DialogDescription>
            Create a dependency relationship for "{sourceFeature?.title}"
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Dependency Type Selection */}
          <div className="space-y-2">
            <Label>Dependency Type</Label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(DEPENDENCY_TYPES).map(([type, config]) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedDependencyType(type)}
                  className={`p-3 text-left border rounded-lg transition-colors ${
                    selectedDependencyType === type
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {React.createElement(config.icon, { className: "h-4 w-4" })}
                    <span className="font-medium text-sm">{config.label}</span>
                  </div>
                  <p className="text-xs text-gray-600">{config.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Feature Search */}
          <div className="space-y-2">
            <Label>Target Feature</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search features..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Selected Feature Display */}
            {selectedFeature && (
              <div className="p-3 border border-blue-200 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className={getFeatureTypeDetails(selectedFeature.type).color}>
                        {getFeatureTypeDetails(selectedFeature.type).label}
                      </Badge>
                      <Badge variant="outline" className={getStatusBadgeColor(selectedFeature.status)}>
                        {selectedFeature.status?.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    <h4 className="font-medium text-sm">{selectedFeature.title}</h4>
                    {selectedFeature.assignee && (
                      <div className="flex items-center gap-1 mt-1">
                        <Avatar className="h-4 w-4">
                          <AvatarImage src={selectedFeature.assignee.avatar} />
                          <AvatarFallback className="text-xs">
                            {selectedFeature.assignee.name?.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-gray-600">
                          {selectedFeature.assignee.name || selectedFeature.assignee.email}
                        </span>
                      </div>
                    )}
                  </div>
                  <Check className="h-5 w-5 text-green-600" />
                </div>
              </div>
            )}

            {/* Search Results */}
            {!selectedFeature && searchResults.length > 0 && (
              <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                {searchResults.map((feature) => (
                  <button
                    key={feature.id}
                    type="button"
                    onClick={() => setSelectedFeature(feature)}
                    className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className={`${getFeatureTypeDetails(feature.type).color} text-xs`}>
                        {getFeatureTypeDetails(feature.type).label}
                      </Badge>
                      <Badge variant="outline" className={`${getStatusBadgeColor(feature.status)} text-xs`}>
                        {feature.status?.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    <h4 className="font-medium text-sm line-clamp-2">{feature.title}</h4>
                    {feature.assignee && (
                      <div className="flex items-center gap-1 mt-1">
                        <Avatar className="h-4 w-4">
                          <AvatarImage src={feature.assignee.avatar} />
                          <AvatarFallback className="text-xs">
                            {feature.assignee.name?.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-gray-600">
                          {feature.assignee.name || feature.assignee.email}
                        </span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {!selectedFeature && searchResults.length === 0 && !searching && (
              <div className="text-center py-4 text-gray-500 text-sm">
                {searchTerm ? 'No features found' : 'Start typing to search features'}
              </div>
            )}

            {searching && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Describe the dependency relationship..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!selectedFeature || loading}
            >
              {loading ? 'Creating...' : 'Create Dependency'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddDependencyDialog; 