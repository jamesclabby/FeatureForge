import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { CharacterCounter } from '../ui/character-counter';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { DatePicker } from '../ui/date-picker';
import { useToast } from '../ui/toast';
import { FIELD_LIMITS, validateFeatureTitle, validateFeatureDescription, validateTag } from '../../utils/validation';
import featureService, { FEATURE_STATUSES, FEATURE_PRIORITIES } from '../../services/featureService';
import { FEATURE_TYPES_ARRAY } from '../../constants/featureTypes';
import { DependencyFormField } from '../dependencies';
import dependencyService from '../../services/dependencyService';

const FeatureForm = ({ teamId, initialData, onSubmit, isEdit = false }) => {
  const emptyFormData = {
    title: '',
    description: '',
    type: 'task',
    parentId: null,
    status: 'planned',
    priority: 'medium',
    tags: [],
    dueDate: ''
  };
  
  const [formData, setFormData] = useState(isEdit && initialData ? { ...initialData } : emptyFormData);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [tagInput, setTagInput] = useState('');
  const [parentFeatures, setParentFeatures] = useState([]);
  const [dependencies, setDependencies] = useState([]);
  const [loadingDependencies, setLoadingDependencies] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    if (isEdit && initialData) {
      setFormData({ 
        ...initialData,
        dueDate: initialData.dueDate || initialData.due_date || ''
      });
      
      // Load existing dependencies for edit mode
      if (initialData.id) {
        loadExistingDependencies(initialData.id);
      }
    }
  }, [isEdit, initialData]);

  // Load existing dependencies for edit mode
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
        toast.toast({
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
      if (!teamId && !initialData?.teamId) return;
      
      try {
        const currentTeamId = teamId || initialData?.teamId;
        const response = await featureService.getTeamFeatures(currentTeamId);
        // Filter to only show parent features
        const parents = response.data.filter(feature => 
          feature.type === 'parent' && 
          (!isEdit || feature.id !== initialData?.id) // Don't show current feature as parent option
        );
        setParentFeatures(parents);
      } catch (error) {
        console.error('Error fetching parent features:', error);
      }
    };

    fetchParentFeatures();
  }, [teamId, initialData?.teamId, initialData?.id, isEdit]);

  const validateForm = () => {
    const newErrors = {};
    
    const titleError = validateFeatureTitle(formData.title);
    if (titleError) newErrors.title = titleError;
    
    const descriptionError = validateFeatureDescription(formData.description);
    if (descriptionError) newErrors.description = descriptionError;
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
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
      toast.toast({
        title: 'Invalid Tag',
        description: tagError,
        variant: 'destructive',
      });
      return;
    }
    
    // Check if tag already exists
    if (formData.tags && formData.tags.includes(tagInput.trim())) {
      toast.toast({
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!validateForm()) {
      return;
    }

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
      
      let response;
      if (isEdit) {
        response = await featureService.updateFeature(initialData.id, cleanedFormData, initialData.teamId);
        
        // Handle dependency updates for edit mode
        if (dependencies.length > 0) {
          await handleDependencyUpdates(initialData.id);
        }
      } else {
        response = await featureService.createFeature(teamId, cleanedFormData);
        
        // Handle dependencies for new feature
        if (dependencies.length > 0 && response.data?.id) {
          await handleDependencyCreation(response.data.id);
        }
      }
      
      // Notify parent component about successful submission
      if (onSubmit) {
        onSubmit(response.data);
      } else {
        // If no onSubmit handler, navigate to the feature detail page
        toast.toast({
          title: 'Success',
          description: `Feature ${isEdit ? 'updated' : 'created'} successfully!`,
          variant: 'default',
        });
        
        if (!isEdit) {
          navigate(`/features/${response.data.id}`);
        }
      }
    } catch (err) {
      console.error(`Error ${isEdit ? 'updating' : 'creating'} feature:`, err);
      toast.toast({
        title: 'Error',
        description: `Failed to ${isEdit ? 'update' : 'create'} feature. Please try again.`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDependencyCreation = async (featureId) => {
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
        // Don't fail the whole operation for dependency errors
        toast.toast({
          title: 'Warning',
          description: `Could not create dependency to "${dependency.targetFeature.title}".`,
          variant: 'warning',
        });
      }
    }
  };

  const handleDependencyUpdates = async (featureId) => {
    // For simplicity in edit mode, we'll just handle new dependencies
    // Full CRUD operations would require more complex state management
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
        toast.toast({
          title: 'Warning',
          description: `Could not create dependency to "${dependency.targetFeature.title}".`,
          variant: 'warning',
        });
      }
    }
  };

  return (
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
          maxLength={FIELD_LIMITS.FEATURE_TITLE}
          className={errors.title ? 'border-red-500' : ''}
        />
        <div className="flex justify-between items-center">
          <div>
            {errors.title && (
              <p className="text-xs text-red-600">{errors.title}</p>
            )}
          </div>
          <CharacterCounter value={formData.title} limit={FIELD_LIMITS.FEATURE_TITLE} />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Describe the feature in detail"
          className={`min-h-[120px] ${errors.description ? 'border-red-500' : ''}`}
          required
          disabled={loading}
          maxLength={FIELD_LIMITS.FEATURE_DESCRIPTION}
        />
        <div className="flex justify-between items-center">
          <div>
            {errors.description && (
              <p className="text-xs text-red-600">{errors.description}</p>
            )}
          </div>
          <CharacterCounter value={formData.description} limit={FIELD_LIMITS.FEATURE_DESCRIPTION} />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
          <Select
            value={formData.type}
            onValueChange={(value) => handleSelectChange('type', value)}
            disabled={loading || isEdit}
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
          {isEdit && (
            <p className="text-xs text-secondary-500">
              Feature type cannot be changed after creation
            </p>
          )}
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
            <p className="text-xs text-secondary-500">
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
        feature={formData}
        teamId={teamId || initialData?.teamId}
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
                className="ml-1 text-secondary-500 hover:text-secondary-700"
                onClick={() => handleRemoveTag(tag)}
                disabled={loading}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="14" 
                  height="14" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                >
                  <path d="M18 6 6 18M6 6l12 12"/>
                </svg>
              </button>
            </Badge>
          ))}
        </div>
      </div>
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={() => navigate('/features')}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Submitting...' : isEdit ? 'Update Feature' : 'Create Feature'}
        </Button>
      </div>
    </form>
  );
};

export default FeatureForm; 