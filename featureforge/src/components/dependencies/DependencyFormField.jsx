import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent } from '../ui/card';
import { X, Plus, Search, Link } from 'lucide-react';
import { useToast } from '../ui/toast';
import dependencyService from '../../services/dependencyService';
import { DEPENDENCY_TYPES, getDependencyTypeConfig } from '../../constants/dependencyTypes';
import { getFeatureTypeDetails } from '../../constants/featureTypes';
import { getStatusColorClasses } from '../../constants/designTokens';

const DependencyFormField = ({ 
  feature, 
  teamId, 
  dependencies = [], 
  onDependenciesChange,
  disabled = false 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [selectedDependencyType, setSelectedDependencyType] = useState('depends_on');
  const [showAddForm, setShowAddForm] = useState(false);
  const [searching, setSearching] = useState(false);
  const { toast } = useToast();

  // Search for features when search term changes
  useEffect(() => {
    if (searchTerm && teamId) {
      const timeoutId = setTimeout(() => {
        searchFeatures(searchTerm);
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
    }
  }, [searchTerm, teamId]);

  const searchFeatures = async (term) => {
    if (!teamId) return;
    
    try {
      setSearching(true);
      const response = await dependencyService.searchTeamFeatures(teamId, term);
      
      // Filter out the current feature and features that already have dependencies
      const existingDependencyIds = dependencies.map(dep => 
        dep.targetFeature?.id || dep.sourceFeature?.id
      ).filter(Boolean);
      
      const filteredFeatures = (response.data || response).filter(f => 
        f.id !== feature?.id && !existingDependencyIds.includes(f.id)
      );
      
      setSearchResults(filteredFeatures);
    } catch (error) {
      console.error('Error searching features:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleAddDependency = () => {
    if (!selectedFeature || !selectedDependencyType) {
      toast({
        title: "Error",
        description: "Please select a feature and dependency type.",
        variant: "destructive"
      });
      return;
    }

    const newDependency = {
      id: `temp-${Date.now()}`, // Temporary ID for UI purposes
      dependencyType: selectedDependencyType,
      targetFeature: selectedFeature,
      sourceFeature: feature,
      isNew: true // Mark as new for backend processing
    };

    const updatedDependencies = [...dependencies, newDependency];
    onDependenciesChange(updatedDependencies);

    // Reset form
    setSelectedFeature(null);
    setSearchTerm('');
    setSearchResults([]);
    setShowAddForm(false);
    setSelectedDependencyType('depends_on');
  };

  const handleRemoveDependency = (dependencyToRemove) => {
    const updatedDependencies = dependencies.filter(dep => dep.id !== dependencyToRemove.id);
    onDependenciesChange(updatedDependencies);
  };

  const getStatusBadgeColor = (status) => {
    const statusColors = getStatusColorClasses(status);
    return statusColors.combined;
  };

  const handleFeatureSelect = (feature) => {
    setSelectedFeature(feature);
    setSearchTerm(feature.title);
    setSearchResults([]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-foreground">Dependencies</Label>
        {!showAddForm && !disabled && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Dependency
          </Button>
        )}
      </div>

      {/* Existing Dependencies */}
      {dependencies.length > 0 && (
        <div className="space-y-2">
          {dependencies.map((dependency) => {
            const targetFeature = dependency.targetFeature;
            const dependencyConfig = getDependencyTypeConfig(dependency.dependencyType);
            const featureTypeDetails = getFeatureTypeDetails(targetFeature?.type);

            return (
              <Card key={dependency.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex items-center gap-2">
                      {React.createElement(dependencyConfig.icon, { 
                        className: "h-4 w-4 text-foreground-secondary" 
                      })}
                      <Badge variant="outline" className="text-xs">
                        {dependencyConfig.label}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-lg">{featureTypeDetails?.icon}</span>
                      <span className="font-medium text-sm text-foreground">{targetFeature?.title}</span>
                      <Badge className={`text-xs ${getStatusBadgeColor(targetFeature?.status)}`}>
                        {targetFeature?.status?.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  
                  {!disabled && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveDependency(dependency)}
                      className="h-8 w-8 p-0 text-foreground-muted hover:text-error"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Dependency Form */}
      {showAddForm && !disabled && (
        <Card className="p-4 border-dashed">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm text-foreground-secondary">Dependency Type</Label>
                <Select
                  value={selectedDependencyType}
                  onValueChange={setSelectedDependencyType}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(DEPENDENCY_TYPES).map(([type, config]) => (
                      <SelectItem key={type} value={type}>
                        <div className="flex items-center gap-2">
                          {React.createElement(config.icon, { className: "h-4 w-4" })}
                          {config.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-foreground-secondary">Feature</Label>
                <div className="relative">
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search features..."
                    className="pr-8"
                  />
                  <Search className="absolute right-2 top-2.5 h-4 w-4 text-foreground-muted" />
                </div>
              </div>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="max-h-48 overflow-y-auto border border-border rounded-md">
                {searchResults.map((feature) => {
                  const typeDetails = getFeatureTypeDetails(feature.type);
                  return (
                    <div
                      key={feature.id}
                      onClick={() => handleFeatureSelect(feature)}
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

            {searching && (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-accent"></div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={handleAddDependency}
                disabled={!selectedFeature}
                size="sm"
              >
                Add Dependency
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddForm(false);
                  setSelectedFeature(null);
                  setSearchTerm('');
                  setSearchResults([]);
                }}
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {dependencies.length === 0 && !showAddForm && (
        <div className="text-center py-4 text-foreground-muted border border-dashed border-border rounded-lg">
          <Link className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No dependencies added</p>
        </div>
      )}
    </div>
  );
};

export default DependencyFormField;
