import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import featureService, { FEATURE_PRIORITIES } from '../../services/featureService';
import apiService from '../../services/api';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Slider } from '../ui/slider';
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

const CreateFeatureDialog = ({ onFeatureCreated }) => {
  const { currentUser, verifyAuth, refreshToken } = useAuth();
  const toast = useToast();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    impact: 5,
    effort: 5,
    category: 'functionality',
    targetRelease: ''
  });
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
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
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Prevent multiple submissions
    if (loading) {
      console.log('Submission already in progress, ignoring duplicate request');
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
      
      // Log the data being sent
      console.log("Authentication verified. Submitting feature data:", formData);
      
      const response = await featureService.createFeature(teamId, formData);
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
        priority: 'medium',
        impact: 5,
        effort: 5,
        category: 'functionality',
        targetRelease: ''
      });
      
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm" className="flex-1 gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Create New Feature
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Feature Request</DialogTitle>
          <DialogDescription>
            Fill in the details for your feature request. Fields marked with * are required.
          </DialogDescription>
        </DialogHeader>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-md text-sm mb-4">
            {error}
          </div>
        )}
        
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
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the feature in detail, including the problem it solves"
              className="min-h-[120px]"
              required
              disabled={loading}
            />
          </div>
          
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
              <Label htmlFor="targetRelease">Target Release</Label>
              <Input
                id="targetRelease"
                name="targetRelease"
                value={formData.targetRelease}
                onChange={handleChange}
                placeholder="e.g., v2.0, Q3 2023"
                disabled={loading}
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
          
          <DialogFooter className="pt-4">
            <DialogClose asChild>
              <Button variant="outline" type="button" disabled={loading}>Cancel</Button>
            </DialogClose>
            {error && (
              <Button 
                variant="secondary" 
                type="button" 
                onClick={async () => {
                  console.log("Running auth debug...");
                  await apiService.debugAuth();
                }}
                className="mr-2"
              >
                Debug Auth
              </Button>
            )}
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Feature'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateFeatureDialog; 