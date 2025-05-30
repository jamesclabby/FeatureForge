import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card';
import { useToast } from '../components/ui/toast';
import teamService from '../services/teamService';
import featureService from '../services/featureService';
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
  const { teamId: urlTeamId } = useParams(); // Get teamId from URL parameter
  const toast = useToast();
  const { currentUser } = useAuth();
  
  // Get teamId, preferring the URL parameter over localStorage
  const getTeamId = () => {
    // First, check URL parameter
    if (urlTeamId) {
      console.log('Dashboard: Using teamId from URL parameter:', urlTeamId);
      
      // Since we're using a URL parameter, also store it in localStorage
      // This ensures RequireSelectedTeam will allow access to other team features
      try {
        localStorage.setItem('selectedTeamId', urlTeamId);
        console.log('Dashboard: Updated localStorage with teamId from URL');
      } catch (error) {
        console.error('Dashboard: Error storing teamId in localStorage:', error);
      }
      
      return urlTeamId;
    }
    
    // Fallback to localStorage (for backward compatibility)
    try {
      const storedTeamId = localStorage.getItem('selectedTeamId');
      console.log('Dashboard: Using teamId from localStorage:', storedTeamId);
      return storedTeamId;
    } catch (error) {
      console.error('Dashboard: Error accessing localStorage:', error);
      return null;
    }
  };

  useEffect(() => {
    const teamId = getTeamId();
    if (teamId) {
      fetchTeamDetails(teamId);
      fetchFeatureStats(teamId);
    } else {
      console.log('Dashboard: No teamId available, redirecting to selector');
      navigate('/selector');
    }
  }, [urlTeamId]); // Re-run when URL parameter changes

  const fetchTeamDetails = async (teamId) => {
    try {
      setLoading(true);
      console.log('Fetching team details for teamId:', teamId);
      const response = await teamService.getTeamById(teamId);
      console.log('Team details response:', response);
      
      if (!response || !response.data) {
        throw new Error('Invalid response data');
      }
      
      setTeam(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching team details:', err);
      
      // Don't immediately clear selectedTeamId and redirect
      // Instead, show a retry option
      setError('Failed to fetch team details. The team may not exist or the server is not responding.');
      toast.toast({
        title: 'Error',
        description: 'Failed to fetch team details. Please try again or select a different team.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchFeatureStats = async (teamId) => {
    try {
      const response = await featureService.getFeatureStats(teamId);
      
      // Safely access the stats properties with fallbacks
      const stats = response?.data || {};
      
      setFeatureCount(stats.total || 0);
      setInProgressCount(stats.byStatus?.inProgress || 0);
      setCompletedCount(stats.byStatus?.completed || 0);
    } catch (err) {
      console.error('Error fetching feature statistics:', err);
      // Don't let stats errors affect the main dashboard functionality
      // Just set fallback values and continue
      setFeatureCount(0);
      setInProgressCount(0);
      setCompletedCount(0);
    }
  };

  const handleSwitchTeam = () => {
    console.log('Dashboard: Switch Team button clicked');
    // Clear the selected team from localStorage
    localStorage.removeItem('selectedTeamId');
    console.log('Dashboard: Cleared selectedTeamId from localStorage');
    // Navigate directly to the team selector
    console.log('Dashboard: Navigating to /selector');
    navigate('/selector');
  };

  // Handle feature creation success
  const handleFeatureCreated = (featureData) => {
    // Update feature count
    setFeatureCount(prevCount => prevCount + 1);
    
    // You could fetch updated counts from the API here
    toast.toast({
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
      <div className="flex flex-col justify-center items-center h-64 gap-4 p-6 text-center">
        <p className="text-red-500 mb-2">{error}</p>
        <div className="flex gap-4">
          <Button 
            onClick={() => {
              const teamId = getTeamId();
              if (teamId) {
                fetchTeamDetails(teamId);
                fetchFeatureStats(teamId);
              }
            }}
            variant="default"
          >
            Retry
          </Button>
          <Button
            onClick={() => {
              // Clear the selected team and go to selector
              localStorage.removeItem('selectedTeamId');
              navigate('/selector');
            }}
            variant="outline"
          >
            Select Different Team
          </Button>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="flex flex-col justify-center items-center h-64 space-y-4">
        <p className="text-secondary-500">Team not found</p>
        <Button onClick={() => navigate('/selector')}>Select a Team</Button>
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
            <Button 
              variant="outline" 
              className="bg-white text-primary-800 hover:bg-primary-100 hover:text-primary-900" 
              onClick={() => {
                console.log('Switch Team button clicked (inline)');
                localStorage.removeItem('selectedTeamId');
                navigate('/selector');
              }}
            >
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
              className="flex-1"
              onClick={() => navigate('/features')}
            >
              Manage Features
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
                <p className="text-sm font-medium text-secondary-500">Team Name</p>
                <p className="text-lg font-semibold">{team.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-secondary-500">Description</p>
                <p>{team.description || 'No description provided'}</p>
              </div>
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

        {/* Feature Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Feature Summary</CardTitle>
            <CardDescription>
              Overview of your team's feature requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-primary-50 rounded-lg">
                <div className="text-2xl font-bold text-primary-600">{featureCount}</div>
                <div className="text-sm text-primary-700">Total Features</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{inProgressCount}</div>
                <div className="text-sm text-blue-700">In Progress</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{completedCount}</div>
                <div className="text-sm text-green-700">Completed</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-600">{featureCount - inProgressCount - completedCount}</div>
                <div className="text-sm text-gray-700">Backlog</div>
              </div>
            </div>
            <div className="mt-4 text-center">
              <Button variant="outline" onClick={() => navigate('/features')}>
                View All Features
              </Button>
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