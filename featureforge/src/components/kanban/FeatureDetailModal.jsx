import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { DatePicker } from '../ui/date-picker';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { X } from 'lucide-react';
import { useToast } from '../ui/toast';
import featureService, { FEATURE_STATUSES, FEATURE_PRIORITIES } from '../../services/featureService';
import { FEATURE_TYPES_ARRAY } from '../../constants/featureTypes';
import { useTeamContext } from '../../hooks/useTeamContext';
import { DependencyManager, DependencyFormField } from '../dependencies';
import dependencyService from '../../services/dependencyService';
import { FIELD_LIMITS, validateFeatureTitle, validateFeatureDescription, validateTag } from '../../utils/validation';
import { CharacterCounter } from '../ui/character-counter';

const FeatureDetailModal = ({ feature, isOpen, onClose, onFeatureUpdate }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'task',
    parentId: null,
    status: 'planned',
    priority: 'medium',
    tags: [],
    dueDate: ''
  });
  const [loading, setLoading] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [parentFeatures, setParentFeatures] = useState([]);
  const [dependencies, setDependencies] = useState([]);
  const [loadingDependencies, setLoadingDependencies] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const { teamId } = useTeamContext();
  const { toast } = useToast();

  // Initialize form data when feature changes
  useEffect(() => {
    if (feature) {
      setFormData({
        title: feature.title || '',
        description: feature.description || '',
        type: feature.type || 'task',
        parentId: feature.parentId || null,
        status: feature.status || 'planned',
        priority: feature.priority || 'medium',
        tags: feature.tags || [],
        dueDate: feature.dueDate || feature.due_date || ''
      });

      // Load existing dependencies
      if (feature.id) {
        loadExistingDependencies(feature.id);
      }
    }
  }, [feature]);

  // Load existing dependencies
  const loadExistingDependencies = async (featureId) => {
    try {
      setLoadingDependencies(true);
      const response = await dependencyService.getFeatureDependencies(featureId);
      const responseData = response?.data || response || {};
      
      // Convert to format expected by DependencyFormField
      const outgoingDeps = (responseData.outgoing || []).map(dep => ({
        ...dep,
        targetFeature: dep.targetFeature,
        sourceFeature: dep.sourceFeature
      }));
      
      setDependencies(outgoingDeps);
    } catch (error) {
      console.error('Error loading dependencies:', error);
      // Don't show error toast for 404 (no dependencies exist yet)
      if (error.response?.status !== 404) {
        toast({
          title: 'Warning',
          description: 'Could not load existing dependencies.',
          variant: 'warning',
        });
      }
    } finally {
      setLoadingDependencies(false);
    }
  };

  // Fetch parent features when component mounts or teamId changes
  useEffect(() => {
    const fetchParentFeatures = async () => {
      if (!teamId) return;
      
      try {
        const response = await featureService.getTeamFeatures(teamId);
        // Filter to only show parent features and exclude current feature
        const parents = response.data.filter(f => 
          f.type === 'parent' && 
          f.id !== feature?.id
        );
        setParentFeatures(parents);
      } catch (error) {
        console.error('Error fetching parent features:', error);
      }
    };

    if (isOpen) {
      fetchParentFeatures();
    }
  }, [teamId, feature?.id, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: value
      };
      
      // If changing type to 'parent', clear parentId since parents can't have parents
      if (name === 'type' && value === 'parent') {
        newData.parentId = null;
      }
      
      return newData;
    });
  };

  const handleDateChange = (value) => {
    setFormData(prev => ({
      ...prev,
      dueDate: value
    }));
  };

  const handleDependenciesChange = (updatedDependencies) => {
    setDependencies(updatedDependencies);
  };

  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    
    // Validate tag length
    const tagError = validateTag(tagInput);
    if (tagError) {
      toast({
        title: 'Invalid Tag',
        description: tagError,
        variant: 'destructive',
      });
      return;
    }
    
    // Check if tag already exists
    if (formData.tags && formData.tags.includes(tagInput.trim())) {
      toast({
        title: 'Warning',
        description: 'This tag already exists!',
        variant: 'warning',
      });
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      tags: [...(prev.tags || []), tagInput.trim()]
    }));
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleTagInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleDependencyUpdates = async (featureId) => {
    // Handle new dependencies
    const newDependencies = dependencies.filter(dep => dep.isNew);
    
    for (const dependency of newDependencies) {
      try {
        await dependencyService.createDependency(featureId, {
          targetFeatureId: dependency.targetFeature.id,
          dependencyType: dependency.dependencyType,
          description: dependency.description || null
        });
      } catch (error) {
        console.error('Error creating dependency:', error);
        toast({
          title: 'Warning',
          description: `Could not create dependency to "${dependency.targetFeature.title}".`,
          variant: 'warning',
        });
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    try {
      setLoading(true);
      
      // Clean up form data before sending
      const cleanedFormData = {
        ...formData,
        // Convert empty strings to null for UUID fields
        parentId: formData.parentId && formData.parentId !== 'none' ? formData.parentId : null,
        // Convert empty strings to null for date fields
        dueDate: formData.dueDate && formData.dueDate.trim() !== '' ? formData.dueDate : null,
        // Ensure tags is always an array
        tags: Array.isArray(formData.tags) ? formData.tags : []
      };
      
      const response = await featureService.updateFeature(feature.id, cleanedFormData);
      
      // Handle dependency updates
      if (dependencies.some(dep => dep.isNew)) {
        await handleDependencyUpdates(feature.id);
      }
      
      // Notify parent component about successful update
      onFeatureUpdate?.(response.data || response);
      
      toast({
        title: 'Success',
        description: 'Feature updated successfully!',
      });
      
      onClose();
    } catch (err) {
      console.error('Error updating feature:', err);
      toast({
        title: 'Error',
        description: 'Failed to update feature. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to original feature data
    if (feature) {
      setFormData({
        title: feature.title || '',
        description: feature.description || '',
        type: feature.type || 'task',
        parentId: feature.parentId || null,
        status: feature.status || 'planned',
        priority: feature.priority || 'medium',
        tags: feature.tags || [],
        dueDate: feature.dueDate || feature.due_date || ''
      });
      
      // Reset dependencies
      if (feature.id) {
        loadExistingDependencies(feature.id);
      }
    }
    setTagInput('');
    setActiveTab('details');
    onClose();
  };

  const handleDependencyUpdate = (updatedFeature) => {
    // When dependencies change, we don't need to close the modal
    // Just silently update the feature data if needed
    console.log('Dependencies updated for feature:', updatedFeature?.id);
  };

  if (!feature) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Feature Details</DialogTitle>
          <DialogDescription>View and edit feature information and dependencies.</DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter feature title"
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe the feature in detail"
                  className="min-h-[120px]"
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => handleSelectChange('type', value)}
                    disabled={loading}
                  >
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {FEATURE_TYPES_ARRAY.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-foreground-muted">
                    Feature type cannot be changed after creation
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="parentId">Parent Feature</Label>
                  <Select
                    value={formData.parentId || 'none'}
                    onValueChange={(value) => handleSelectChange('parentId', value === 'none' ? null : value)}
                    disabled={loading || formData.type === 'parent'}
                  >
                    <SelectTrigger id="parentId">
                      <SelectValue placeholder={formData.type === 'parent' ? 'Parent features cannot have parents' : 'Select parent feature (optional)'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {parentFeatures.map(feature => (
                        <SelectItem key={feature.id} value={feature.id}>
                          {feature.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.type === 'parent' && (
                    <p className="text-xs text-foreground-muted">
                      Parent features cannot have parent features
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleSelectChange('status', value)}
                    disabled={loading}
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {FEATURE_STATUSES.map(status => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => handleSelectChange('priority', value)}
                    disabled={loading}
                  >
                    <SelectTrigger id="priority">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {FEATURE_PRIORITIES.map(priority => (
                        <SelectItem key={priority.value} value={priority.value}>
                          {priority.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Due Date Field */}
              <DatePicker
                label="Due Date"
                value={formData.dueDate}
                onChange={handleDateChange}
                disabled={loading}
                placeholder="Select due date (optional)"
              />

              {/* Dependencies Field */}
              <DependencyFormField
                feature={feature}
                teamId={teamId}
                dependencies={dependencies}
                onDependenciesChange={handleDependenciesChange}
                disabled={loading || loadingDependencies}
              />
              
              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <div className="flex">
                  <Input
                    id="tags"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add tags (press Enter to add)"
                    className="flex-1"
                    onKeyDown={handleTagInputKeyDown}
                    disabled={loading}
                    maxLength={FIELD_LIMITS.TAG}
                  />
                  <Button
                    type="button"
                    onClick={handleAddTag}
                    className="ml-2"
                    disabled={!tagInput.trim() || loading}
                  >
                    Add
                  </Button>
                </div>
                
                <div className="flex justify-between items-center">
                  <p className="text-xs text-secondary-500">
                    Tags help categorize and filter features
                  </p>
                  <CharacterCounter value={tagInput} limit={FIELD_LIMITS.TAG} />
                </div>
                
                {/* Display tags */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags && formData.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="flex items-center">
                      {tag}
                      <button
                        type="button"
                        className="ml-1 text-foreground-muted hover:text-foreground-secondary"
                        onClick={() => handleRemoveTag(tag)}
                        disabled={loading}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={handleCancel} disabled={loading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Feature'}
                </Button>
              </div>
            </form>
          </TabsContent>
          
          <TabsContent value="dependencies" className="space-y-4">
            <DependencyManager 
              feature={feature} 
              onFeatureUpdate={handleDependencyUpdate}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default FeatureDetailModal; 