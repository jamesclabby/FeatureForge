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
import { CharacterCounter } from '../ui/character-counter';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Search, Check } from 'lucide-react';
import { useTeamContext } from '../../hooks/useTeamContext';
import { FIELD_LIMITS, validateDependencyDescription } from '../../utils/validation';
import dependencyService from '../../services/dependencyService';
import { DEPENDENCY_TYPES, getDependencyTypeConfig } from '../../constants/dependencyTypes';
import { getFeatureTypeDetails } from '../../constants/featureTypes';
import { getStatusColorClasses } from '../../constants/designTokens';

const AddDependencyDialog = ({ isOpen, onClose, onAdd, sourceFeature }) => {
  const [selectedDependencyType, setSelectedDependencyType] = useState('depends_on');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [description, setDescription] = useState('');
  const [descriptionError, setDescriptionError] = useState('');
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
      setDescriptionError('');
      
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

  const validateForm = () => {
    const error = validateDependencyDescription(description);
    setDescriptionError(error || '');
    return !error;
  };

  const handleDescriptionChange = (e) => {
    const value = e.target.value;
    setDescription(value);
    
    // Clear error when user starts typing
    if (descriptionError) {
      setDescriptionError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFeature || !selectedDependencyType) {
      return;
    }

    if (!validateForm()) {
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
    const statusColors = getStatusColorClasses(status);
    return statusColors.combined;
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
                      ? 'border-accent bg-accent-50'
                      : 'border-border hover:border-foreground-muted'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {React.createElement(config.icon, { className: "h-4 w-4" })}
                    <span className="font-medium text-sm text-foreground">{config.label}</span>
                  </div>
                  <p className="text-xs text-foreground-secondary">{config.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Feature Search */}
          <div className="space-y-2">
            <Label>Target Feature</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground-muted" />
              <Input
                placeholder="Search features..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Selected Feature Display */}
            {selectedFeature && (
              <div className="p-3 border border-accent/30 bg-accent-50 rounded-lg">
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
                    <h4 className="font-medium text-sm text-foreground">{selectedFeature.title}</h4>
                  </div>
                  <Check className="h-5 w-5 text-accent" />
                </div>
              </div>
            )}

            {/* Search Results */}
            {!selectedFeature && searchResults.length > 0 && (
              <div className="max-h-48 overflow-y-auto border border-border rounded-lg">
                {searchResults.map((feature) => {
                  const typeDetails = getFeatureTypeDetails(feature.type);
                  return (
                    <div
                      key={feature.id}
                      onClick={() => setSelectedFeature(feature)}
                      className="p-3 hover:bg-background-elevated cursor-pointer border-b border-border-muted last:border-b-0"
                    >
                      <div className="flex items-center gap-3">
                        <typeDetails.Icon className="h-5 w-5 text-foreground-muted" />
                        <div className="flex-1">
                          <div className="font-medium text-sm text-foreground">{feature.title}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={`text-xs ${getStatusBadgeColor(feature.status)}`}>
                              {feature.status?.replace('_', ' ').toUpperCase()}
                            </Badge>
                            <Badge variant="outline" className={`text-xs ${typeDetails.color}`}>
                              {typeDetails.label}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!selectedFeature && searchResults.length === 0 && !searching && (
              <div className="text-center py-4 text-foreground-muted text-sm">
                {searchTerm ? 'No features found' : 'Start typing to search features'}
              </div>
            )}

            {searching && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-accent mx-auto"></div>
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
              onChange={handleDescriptionChange}
              rows={3}
              maxLength={FIELD_LIMITS.DEPENDENCY_DESCRIPTION}
              className={descriptionError ? 'border-error' : ''}
            />
            <div className="flex justify-between items-center">
              <div>
                {descriptionError && (
                  <p className="text-xs text-error">{descriptionError}</p>
                )}
              </div>
              <CharacterCounter value={description} limit={FIELD_LIMITS.DEPENDENCY_DESCRIPTION} />
            </div>
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
