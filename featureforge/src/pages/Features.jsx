import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { useToast } from '../components/ui/toast';
import { useAuth } from '../contexts/AuthContext';
import FeatureList from '../components/features/FeatureList';
import teamService from '../services/teamService';

const Features = () => {
  const [teamId, setTeamId] = useState(null);
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const { currentUser } = useAuth();

  useEffect(() => {
    // Get the selected team ID from localStorage
    const storedTeamId = localStorage.getItem('selectedTeamId');
    if (storedTeamId) {
      setTeamId(storedTeamId);
      fetchTeamDetails(storedTeamId);
    } else {
      toast.toast({
        title: 'Team Selection Required',
        description: 'Please select a team to view features.',
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
            You need to select a team before you can view and manage features.
          </p>
          <Button onClick={() => window.location.href = '/selector'}>
            Select a Team
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Features</h1>
            <p className="text-secondary-500 mt-1">
              Managing features for <span className="font-semibold text-secondary-700">{team.name}</span>
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/selector'}
          >
            Switch Team
          </Button>
        </div>
      </div>
      <FeatureList teamId={teamId} />
    </div>
  );
};

export default Features; 