import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { useToast } from '../components/ui/toast';
import teamService from '../services/teamService';

const Dashboard = () => {
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // Get teamId from URL query params or localStorage
  const getTeamId = () => {
    const params = new URLSearchParams(location.search);
    const teamId = params.get('teamId') || localStorage.getItem('selectedTeamId');
    
    if (!teamId) {
      // If no team ID is found, redirect to team selector
      navigate('/dashboard');
      return null;
    }
    
    return teamId;
  };

  useEffect(() => {
    const teamId = getTeamId();
    if (teamId) {
      fetchTeamDetails(teamId);
    }
  }, [location.search]);

  const fetchTeamDetails = async (teamId) => {
    try {
      setLoading(true);
      const response = await teamService.getTeamById(teamId);
      setTeam(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch team details');
      toast({
        title: 'Error',
        description: 'Failed to fetch team details. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchTeam = () => {
    // Clear the selected team from localStorage
    localStorage.removeItem('selectedTeamId');
    // Navigate to team selector
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-secondary-500">Team not found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">{team.name}</h1>
          <p className="text-secondary-500 mt-2">{team.description}</p>
        </div>
        <Button variant="outline" onClick={handleSwitchTeam}>
          Switch Team
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Team Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-secondary-500">Created on {new Date(team.createdAt).toLocaleDateString()}</p>
            <p className="mt-2">{team.memberCount} members</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-secondary-500">No recent activity</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => navigate(`/teams/${team.id}`)}
            >
              Team Settings
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => navigate('/features')}
            >
              Manage Features
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard; 