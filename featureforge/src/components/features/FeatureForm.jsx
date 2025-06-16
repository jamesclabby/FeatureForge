import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { useToast } from '../ui/toast';
import featureService, { FEATURE_STATUSES, FEATURE_PRIORITIES } from '../../services/featureService';

const FeatureForm = ({ teamId, initialData, onSubmit, isEdit = false }) => {
  const emptyFormData = {
    title: '',
    description: '',
    status: 'planned',
    priority: 'medium',
    tags: []
  };
  
  const [formData, setFormData] = useState(isEdit && initialData ? { ...initialData } : emptyFormData);
  const [loading, setLoading] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    if (isEdit && initialData) {
      setFormData({ ...initialData });
    }
  }, [isEdit, initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    
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

    try {
      setLoading(true);
      
      const dataToSubmit = {
        ...formData
      };
      
      let response;
      if (isEdit) {
        response = await featureService.updateFeature(initialData.id, dataToSubmit, initialData.teamId);
      } else {
        response = await featureService.createFeature(teamId, dataToSubmit);
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