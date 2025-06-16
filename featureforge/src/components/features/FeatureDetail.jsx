import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
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
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '../ui/tooltip';
import { useToast } from '../ui/toast';
import featureService, { FEATURE_STATUSES, FEATURE_PRIORITIES } from '../../services/featureService';
import { useAuth } from '../../contexts/AuthContext';
import FeatureForm from './FeatureForm';
import { CommentList } from '../comments';

// Helper function to get status/priority details
const getStatusDetails = (statusValue) => {
  return FEATURE_STATUSES.find(status => status.value === statusValue) || {
    value: statusValue,
    label: statusValue,
    color: 'gray'
  };
};

const getPriorityDetails = (priorityValue) => {
  return FEATURE_PRIORITIES.find(priority => priority.value === priorityValue) || {
    value: priorityValue,
    label: priorityValue,
    color: 'gray'
  };
};

// Helper function to format dates
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const FeatureDetail = () => {
  const { featureId } = useParams();
  const [feature, setFeature] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  
  const navigate = useNavigate();
  const toast = useToast();
  const { currentUser } = useAuth();

  useEffect(() => {
    if (featureId) {
      fetchFeature();
    }
  }, [featureId]);

  // Debug current user
  useEffect(() => {
    if (currentUser) {
      console.log('Current user:', {
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName
      });
    } else {
      console.log('No current user authenticated');
    }
  }, [currentUser]);

  const fetchFeature = async () => {
    try {
      setLoading(true);
      const response = await featureService.getFeatureById(featureId);
      console.log('Feature data loaded:', response.data);
      
      // Check comments specifically 
      if (response.data.comments) {
        console.log('Comments loaded:', response.data.comments.length, 'comments found');
        console.log('First comment (if any):', response.data.comments[0]);
      } else {
        console.log('No comments array found in feature data');
      }
      
      setFeature(response.data);
      setSelectedStatus(response.data.status);
      setError(null);
    } catch (err) {
      console.error('Error fetching feature:', err);
      setError('Failed to fetch feature details');
      toast.toast({
        title: 'Error',
        description: 'Failed to fetch feature details. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async () => {
    try {
      const response = await featureService.voteForFeature(featureId);
      setFeature(response.data);
      toast.toast({
        title: 'Success',
        description: 'Vote recorded successfully!',
        variant: 'default',
      });
    } catch (err) {
      console.error('Error voting for feature:', err);
      toast.toast({
        title: 'Error',
        description: 'Failed to vote for feature. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (newStatus === feature.status) return;
    
    try {
      setChangingStatus(true);
      const response = await featureService.updateFeature(featureId, { 
        status: newStatus 
      }, feature.teamId);
      setFeature(response.data);
      setSelectedStatus(response.data.status);
      toast.toast({
        title: 'Success',
        description: `Feature status updated to ${getStatusDetails(newStatus).label}`,
        variant: 'default',
      });
    } catch (err) {
      console.error('Error updating feature status:', err);
      toast.toast({
        title: 'Error',
        description: 'Failed to update feature status. Please try again.',
        variant: 'destructive',
      });
      // Reset the selected status
      setSelectedStatus(feature.status);
    } finally {
      setChangingStatus(false);
    }
  };

  const handleDelete = async () => {
    try {
      await featureService.deleteFeature(featureId);
      toast.toast({
        title: 'Success',
        description: 'Feature deleted successfully!',
        variant: 'default',
      });
      navigate(`/features`);
    } catch (err) {
      console.error('Error deleting feature:', err);
      toast.toast({
        title: 'Error',
        description: 'Failed to delete feature. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  const handleFeatureUpdate = (updatedFeature) => {
    setFeature(updatedFeature);
    setIsEditDialogOpen(false);
    toast.toast({
      title: 'Success',
      description: 'Feature updated successfully!',
      variant: 'default',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error || !feature) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || 'Feature not found'}</p>
          <Button onClick={() => navigate('/features')}>Back to Features</Button>
        </div>
      </div>
    );
  }

  const statusDetails = getStatusDetails(feature.status);
  const priorityDetails = getPriorityDetails(feature.priority);

  // Status badge color
  const getStatusColor = () => {
    switch (statusDetails.color) {
      case 'blue':
        return 'bg-blue-100 text-blue-800';
      case 'amber':
        return 'bg-amber-100 text-amber-800';
      case 'green':
        return 'bg-green-100 text-green-700';
      case 'purple':
        return 'bg-purple-100 text-purple-800';
      case 'gray':
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Priority badge color
  const getPriorityColor = () => {
    switch (priorityDetails.color) {
      case 'red':
        return 'bg-red-100 text-red-800';
      case 'amber':
        return 'bg-amber-100 text-amber-800';
      case 'blue':
        return 'bg-blue-100 text-blue-800';
      case 'gray':
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate('/features')}
          className="flex items-center gap-1"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          >
            <path d="m15 18-6-6 6-6"/>
          </svg>
          Back to Features
        </Button>
        
        <div className="flex gap-2">
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">Edit Feature</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Edit Feature</DialogTitle>
                <DialogDescription>
                  Make changes to this feature.
                </DialogDescription>
              </DialogHeader>
              <FeatureForm 
                initialData={feature} 
                onSubmit={handleFeatureUpdate} 
                isEdit={true}
              />
            </DialogContent>
          </Dialog>
          
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm">Delete</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Feature</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this feature? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setIsDeleteDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleDelete}
                >
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{feature.title}</CardTitle>
              <CardDescription className="mt-1">
                Created {formatDate(feature.createdAt)}
                {feature.createdAt !== feature.updatedAt && 
                  ` • Updated ${formatDate(feature.updatedAt)}`}
              </CardDescription>
            </div>
            
            <div className="flex flex-col items-center">
              <Button 
                variant="ghost" 
                size="sm" 
                className="rounded-full h-10 w-10 p-0 flex items-center justify-center"
                onClick={handleVote}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                >
                  <path d="m19 14-7-7-7 7"/>
                </svg>
              </Button>
              <span className="text-lg font-medium">{feature.votes}</span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <Badge className={getStatusColor()}>
              {statusDetails.label}
            </Badge>
            
            <Badge className={getPriorityColor()}>
              {priorityDetails.label} Priority
            </Badge>
            
            {feature.tags && feature.tags.map(tag => (
              <Badge key={tag} variant="outline" className="bg-secondary-50">
                {tag}
              </Badge>
            ))}
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">Description</h3>
            <p className="text-secondary-700 whitespace-pre-line">{feature.description}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-secondary-500 mb-1">Status</h3>
              <Select 
                value={selectedStatus} 
                onValueChange={handleStatusChange}
                disabled={changingStatus}
              >
                <SelectTrigger className="w-full">
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
            
            {feature.assignedTo && (
              <div>
                <h3 className="text-sm font-medium text-secondary-500 mb-1">Assigned To</h3>
                <p>{feature.assignedTo}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Comments section */}
      <CommentList featureId={featureId} teamId={feature.teamId} />
    </div>
  );
};

export default FeatureDetail; 