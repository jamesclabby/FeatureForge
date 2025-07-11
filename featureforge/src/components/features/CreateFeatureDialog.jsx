import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import featureService, { FEATURE_PRIORITIES, FEATURE_STATUSES } from '../../services/featureService';
import { FEATURE_TYPES_ARRAY } from '../../constants/featureTypes';
import apiService from '../../services/api';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { CharacterCounter } from '../ui/character-counter';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Slider } from '../ui/slider';
import { DatePicker } from '../ui/date-picker';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from '../ui/dialog';
import { useToast } from '../ui/toast';
import { FIELD_LIMITS, validateFeatureTitle, validateFeatureDescription } from '../../utils/validation';

const CreateFeatureDialog = ({ onFeatureCreated }) => {
  const { currentUser, verifyAuth, refreshToken } = useAuth();
  const toast = useToast();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'task',
    priority: 'medium',
    status: 'in_progress',
    impact: 5,
    effort: 5,
    category: 'functionality',
    dueDate: '',
    parentId: ''
  });
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [parentFeatures, setParentFeatures] = useState([]);
  const [loadingParents, setLoadingParents] = useState(false);

  // Load parent features when dialog opens
  const loadParentFeatures = async () => {
    const teamId = localStorage.getItem('selectedTeamId');
    if (!teamId) return;

    try {
      setLoadingParents(true);
      const response = await featureService.getTeamFeatures(teamId);
      const features = response.data || response;
      
      // Filter for parent features only
      const parents = features.filter(feature => feature.type === 'parent');
      setParentFeatures(parents);
    } catch (error) {
      console.error('Error loading parent features:', error);
      // Don't show error toast for this as it's not critical
    } finally {
      setLoadingParents(false);
    }
  };

  // Load parent features when dialog opens
  const handleOpenChange = (isOpen) => {
    setOpen(isOpen);
    if (isOpen) {
      loadParentFeatures();
    }
  };

  // Check if current type can have a parent
  const canHaveParent = () => {
    return ['task', 'story', 'research'].includes(formData.type);
  };

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
    setFormData((prev) => ({
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

  const handleDateChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSliderChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value[0]
    }));
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => {
      const newData = {
        ...prev,
        [name]: value
      };
      
      // Clear parentId if type changes to 'parent'
      if (name === 'type' && value === 'parent') {
        newData.parentId = '';
      }
      
      return newData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Prevent multiple submissions
    if (loading) {
      console.log('Submission already in progress, ignoring duplicate request');
      return;
    }
    
    if (!validateForm()) {
      return;
    }
    
    // Check if user is logged in
    if (!currentUser) {
      setError("You must be logged in to create a feature.");
      toast.toast({
        title: "Authentication Error",
        description: "You must be logged in to create a feature.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setLoading(true);
      
      // Check authentication status and refresh token
      console.log('Starting authentication verification...');
      await refreshToken();
      const isAuthenticated = await verifyAuth();
      if (!isAuthenticated) {
        throw new Error("Authentication failed. Please log out and log in again.");
      }
      
      // Get team ID from localStorage
      const teamId = localStorage.getItem('selectedTeamId');
      console.log("Retrieved teamId from localStorage:", teamId);
      
      if (!teamId) {
        throw new Error("No team selected. Please select a team before creating a feature.");
      }
      
      // Validate teamId is a valid UUID
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(teamId)) {
        console.error("Invalid teamId format in localStorage:", teamId);
        throw new Error(`Invalid team ID format. Please try selecting a team again.`);
      }
      
      // Clean up form data before sending
      const cleanedFormData = {
        ...formData,
        // Convert empty strings to null for UUID and date fields
        parentId: formData.parentId && formData.parentId !== 'none' && formData.parentId !== '' ? formData.parentId : null,
        dueDate: formData.dueDate && formData.dueDate.trim() !== '' ? formData.dueDate : null
      };
      
      // Log the data being sent
      console.log("Authentication verified. Submitting feature data:", cleanedFormData);
      
      const response = await featureService.createFeature(teamId, cleanedFormData);
      console.log("Feature created successfully:", response);
      
      toast.toast({
        title: "Success!",
        description: "Feature request has been created.",
        variant: "default"
      });
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        type: 'task',
        priority: 'medium',
        status: 'in_progress',
        impact: 5,
        effort: 5,
        category: 'functionality',
        dueDate: '',
        parentId: ''
      });
      setErrors({});
      
      // Close dialog
      setOpen(false);
      
      // Notify parent component
      if (onFeatureCreated) {
        // Handle both response structures (direct data or data in response.data)
        const featureData = response.data || response;
        onFeatureCreated(featureData);
      }
    } catch (error) {
      console.error('Error creating feature:', error);
      
      // Log detailed error information
      if (error.response) {
        console.error('Server response error:', error.response);
      }
      
      const errorMessage = error.message || "Failed to create feature. Please try again.";
      setError(errorMessage);
      
      toast.toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate the feature score based on priority, impact, and effort
  const calculateScore = () => {
    // Map priority string to numeric value for calculation
    const priorityValue = {
      'low': 3,
      'medium': 5,
      'high': 8,
      'critical': 10
    }[formData.priority] || 5;
    
    return ((priorityValue * 0.4) + (formData.impact * 0.4) - (formData.effort * 0.2)).toFixed(1);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm" className="flex-1 gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Create New Feature
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Create New Feature Request</DialogTitle>
          <DialogDescription>
            Fill in the details for your feature request. Fields marked with * are required.
          </DialogDescription>
        </DialogHeader>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-md text-sm mb-4 flex-shrink-0">
            {error}
          </div>
        )}
        
        <div className="flex-1 overflow-y-auto px-1">
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter a clear, concise title"
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
                placeholder="Describe the feature in detail, including the problem it solves"
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
            
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleSelectChange('type', value)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select feature type" />
                </SelectTrigger>
                <SelectContent>
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
              <p className="text-xs text-secondary-500">
                {FEATURE_TYPES_ARRAY.find(t => t.value === formData.type)?.description}
              </p>
            </div>

            {/* Parent Feature Selection - Only show for child types */}
            {canHaveParent() && (
              <div className="space-y-2">
                <Label htmlFor="parentId">Parent Feature (Optional)</Label>
                <Select
                  value={formData.parentId || 'none'}
                  onValueChange={(value) => handleSelectChange('parentId', value === 'none' ? '' : value)}
                  disabled={loading || loadingParents}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingParents ? "Loading parent features..." : "Select a parent feature (optional)"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Parent</SelectItem>
                    {parentFeatures.map(parent => (
                      <SelectItem key={parent.id} value={parent.id}>
                        <span className="flex items-center gap-2">
                          <span>📋</span>
                          <span>{parent.title}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-secondary-500">
                  Select a parent feature to organize this {formData.type} under a larger initiative.
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleSelectChange('category', value)}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ui">UI</SelectItem>
                    <SelectItem value="performance">Performance</SelectItem>
                    <SelectItem value="functionality">Functionality</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <DatePicker
                  label="Due Date"
                  value={formData.dueDate}
                  onChange={(value) => handleDateChange('dueDate', value)}
                  disabled={loading}
                  placeholder="Select due date"
                />
              </div>
            </div>
            
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="priority">Priority</Label>
                </div>
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
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="status">Status</Label>
                </div>
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
                <div className="flex justify-between items-center">
                  <Label htmlFor="impact">Impact ({formData.impact})</Label>
                  <span className="text-xs text-secondary-500">Higher means more impact</span>
                </div>
                <Slider
                  id="impact"
                  min={1}
                  max={10}
                  step={1}
                  value={[formData.impact]}
                  onValueChange={(value) => handleSliderChange('impact', value)}
                  disabled={loading}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="effort">Effort ({formData.effort})</Label>
                  <span className="text-xs text-secondary-500">Higher means more effort</span>
                </div>
                <Slider
                  id="effort"
                  min={1}
                  max={10}
                  step={1}
                  value={[formData.effort]}
                  onValueChange={(value) => handleSliderChange('effort', value)}
                  disabled={loading}
                />
              </div>

              <div className="p-3 bg-secondary-50 rounded-md">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Feature Score:</span>
                  <span className="text-lg font-semibold">{calculateScore()}</span>
                </div>
                <p className="text-xs text-secondary-500 mt-1">
                  Score is calculated based on priority, impact, and required effort
                </p>
              </div>
            </div>
          </form>
        </div>
        
        <DialogFooter className="flex-shrink-0">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Creating...' : 'Create Feature'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateFeatureDialog; 