import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useToast } from '../components/ui/toast';
import FeatureForm from '../components/features/FeatureForm';
import teamService from '../services/teamService';

const NewFeature = () => {
  const [teamId, setTeamId] = useState(null);
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    // Get the selected team ID from localStorage
    const storedTeamId = localStorage.getItem('selectedTeamId');
    if (storedTeamId) {
      setTeamId(storedTeamId);
      fetchTeamDetails(storedTeamId);
    } else {
      toast.toast({
        title: 'Team Selection Required',
        description: 'Please select a team before creating a new feature.',
        variant: 'destructive',
      });
      setLoading(false);
    }
  }, []);

  const fetchTeamDetails = async (teamId) => {
    try {
      const response = await teamService.getTeamById(teamId);
      setTeam(response.data);
    } catch (err) {
      console.error('Error fetching team details:', err);
      toast.toast({
        title: 'Error',
        description: 'Failed to fetch team details.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFeatureCreated = (featureData) => {
    toast.toast({
      title: 'Success',
      description: 'Feature created successfully!',
      variant: 'default',
    });
    navigate(`/features/${featureData.id}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!teamId || !team) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">No Team Selected</h1>
          <p className="text-secondary-500 mb-6">
            You need to select a team before you can create a new feature.
          </p>
          <Button onClick={() => navigate('/selector')}>
            Select a Team
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
          <h1 className="text-2xl font-bold">Create New Feature</h1>
            <p className="text-secondary-500 mt-1">
              Creating feature for <span className="font-semibold text-secondary-700">{team.name}</span>
            </p>
          </div>
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
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Feature Details</CardTitle>
            <CardDescription>
              Fill in the details of the new feature you'd like to add to {team.name}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FeatureForm 
              teamId={teamId} 
              onSubmit={handleFeatureCreated} 
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NewFeature; 