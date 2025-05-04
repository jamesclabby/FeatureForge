import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card';
import { useToast } from '../components/ui/toast';
import teamService from '../services/teamService';
import CreateFeatureDialog from '../components/features/CreateFeatureDialog';

const Dashboard = () => {
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [featureCount, setFeatureCount] = useState(0);
  const [inProgressCount, setInProgressCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { currentUser } = useAuth();
  
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
      // Here we would also fetch feature statistics for this team
      // For now using placeholder data
      setFeatureCount(12);
      setInProgressCount(5);
      setCompletedCount(3);
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

  // Handle feature creation success
  const handleFeatureCreated = (featureData) => {
    // Update feature count
    setFeatureCount(prevCount => prevCount + 1);
    
    // You could fetch updated counts from the API here
    toast({
      title: 'Success',
      description: 'Feature created successfully!',
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
      <div className="flex flex-col space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-lg p-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Welcome to {team.name}
              </h1>
              <p className="text-primary-100">
                {team.description}
              </p>
            </div>
            <Button variant="outline" className="bg-white text-primary-800 hover:bg-primary-100 hover:text-primary-900" onClick={handleSwitchTeam}>
              Switch Team
            </Button>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Feature Requests</CardTitle>
              <CardDescription>Total feature requests</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-primary-600">{featureCount}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">In Progress</CardTitle>
              <CardDescription>Features being worked on</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-amber-500">{inProgressCount}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Completed</CardTitle>
              <CardDescription>Implemented features</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-green-500">{completedCount}</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Create a new feature request or manage your team
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4">
            <CreateFeatureDialog onFeatureCreated={handleFeatureCreated} />
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => navigate(`/teams/${team.id}`)}
            >
              Team Settings
            </Button>
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => navigate('/features')}
            >
              View All Features
            </Button>
          </CardContent>
        </Card>

        {/* Team Info */}
        <Card>
          <CardHeader>
            <CardTitle>Team Information</CardTitle>
            <CardDescription>
              Details about your current team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-secondary-500">Created on</p>
                <p>{new Date(team.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-secondary-500">Members</p>
                <p>{team.memberCount} members</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest updates and changes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-secondary-500">
              <p>No recent activity to display.</p>
              <p className="mt-2">Start by creating your first feature request!</p>
            </div>
          </CardContent>
          <CardFooter className="border-t border-secondary-100 bg-secondary-50 rounded-b-lg">
            <Button variant="ghost" size="sm" className="ml-auto">
              View All Activity
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard; 