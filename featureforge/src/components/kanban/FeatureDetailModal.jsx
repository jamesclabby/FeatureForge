import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { DatePicker } from '../ui/date-picker';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { X } from 'lucide-react';
import { useToast } from '../ui/toast';
import featureService, { FEATURE_STATUSES, FEATURE_PRIORITIES } from '../../services/featureService';
import { FEATURE_TYPES_ARRAY } from '../../constants/featureTypes';
import { useTeamContext } from '../../hooks/useTeamContext';

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
    }
  }, [feature]);

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

  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    
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
    }
    setTagInput('');
    onClose();
  };

  if (!feature) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Feature</DialogTitle>
          <DialogDescription>Make changes to this feature.</DialogDescription>
        </DialogHeader>
        
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
              <p className="text-xs text-gray-500">
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
                <p className="text-xs text-gray-500">
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
            
            {/* Display tags */}
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.tags && formData.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="flex items-center">
                  {tag}
                  <button
                    type="button"
                    className="ml-1 text-gray-500 hover:text-gray-700"
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
      </DialogContent>
    </Dialog>
  );
};

export default FeatureDetailModal; 