import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card';
import { useToast } from '../components/ui/toast';
import teamService from '../services/teamService';
import featureService from '../services/featureService';
import CreateFeatureDialog from '../components/features/CreateFeatureDialog';
import AnalyticsSection from '../components/analytics/AnalyticsSection';
import { FEATURE_TYPE_ICONS } from '../constants/icons';

const Dashboard = () => {
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [featureCount, setFeatureCount] = useState(0);
  const [inProgressCount, setInProgressCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [typeStats, setTypeStats] = useState({ parent: 0, story: 0, task: 0, research: 0 });
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
      
      // Store team name and role in localStorage for useTeamContext
      try {
        localStorage.setItem('selectedTeamName', response.data.name);
        localStorage.setItem('selectedUserRole', 'admin'); // Default role, could be improved with actual role from API
        console.log('Dashboard: Updated team name and role in localStorage');
      } catch (storageError) {
        console.error('Dashboard: Error storing team data in localStorage:', storageError);
      }
      
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
      setCompletedCount(stats.byStatus?.done || 0);
      setTypeStats(stats.byType || { parent: 0, story: 0, task: 0, research: 0 });
    } catch (err) {
      console.error('Error fetching feature statistics:', err);
      // Don't let stats errors affect the main dashboard functionality
      // Just set fallback values and continue
      setFeatureCount(0);
      setInProgressCount(0);
      setCompletedCount(0);
      setTypeStats({ parent: 0, story: 0, task: 0, research: 0 });
    }
  };

  const handleSwitchTeam = () => {
    console.log('Dashboard: Switch Team button clicked');
    // Clear all team-related data from localStorage
    localStorage.removeItem('selectedTeamId');
    localStorage.removeItem('selectedTeamName');
    localStorage.removeItem('selectedUserRole');
    console.log('Dashboard: Cleared all team data from localStorage');
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-64 gap-4 p-6 text-center">
        <p className="text-error mb-2">{error}</p>
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
              // Clear all team-related data and go to selector
              localStorage.removeItem('selectedTeamId');
              localStorage.removeItem('selectedTeamName');
              localStorage.removeItem('selectedUserRole');
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
        <p className="text-foreground-muted">Team not found</p>
        <Button onClick={() => navigate('/selector')}>Select a Team</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col space-y-6">
        {/* Welcome Section */}
        <div className="bg-background-overlay rounded-lg p-6 text-foreground border border-border">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-semibold mb-2">
                {team.name}
              </h1>
              <p className="text-foreground-secondary">
                {team.description}
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => {
                console.log('Switch Team button clicked (inline)');
                localStorage.removeItem('selectedTeamId');
                localStorage.removeItem('selectedTeamName');
                localStorage.removeItem('selectedUserRole');
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
              <p className="text-4xl font-semibold text-foreground">{featureCount}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">In Progress</CardTitle>
              <CardDescription>Features being worked on</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-semibold text-info">{inProgressCount}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Completed</CardTitle>
              <CardDescription>Implemented features</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-semibold text-success">{completedCount}</p>
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
            <Button 
              className="flex-1"
              onClick={() => navigate('/board')}
            >
              Kanban Board
            </Button>
          </CardContent>
        </Card>

        {/* Analytics Section */}
        <div>
          <AnalyticsSection teamId={getTeamId()} />
        </div>

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
              <div className="text-center p-4 bg-background-elevated rounded-lg">
                <div className="text-2xl font-semibold text-foreground">{featureCount}</div>
                <div className="text-sm text-foreground-secondary">Total Features</div>
              </div>
              <div className="text-center p-4 bg-info-50 rounded-lg">
                <div className="text-2xl font-semibold text-info">{inProgressCount}</div>
                <div className="text-sm text-info">In Progress</div>
              </div>
              <div className="text-center p-4 bg-success-50 rounded-lg">
                <div className="text-2xl font-semibold text-success">{completedCount}</div>
                <div className="text-sm text-success">Completed</div>
              </div>
              <div className="text-center p-4 bg-background-elevated rounded-lg">
                <div className="text-2xl font-semibold text-foreground">{featureCount - inProgressCount - completedCount}</div>
                <div className="text-sm text-foreground-secondary">Backlog</div>
              </div>
            </div>
            <div className="mt-4 text-center">
              <Button variant="outline" onClick={() => navigate('/features')}>
                View All Features
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Feature Types Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Feature Types</CardTitle>
            <CardDescription>
              Breakdown by feature type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-background-elevated rounded-lg">
                <div className="text-2xl font-semibold text-foreground">{typeStats.parent}</div>
                <div className="text-sm text-foreground-secondary flex items-center justify-center gap-1">
                  <FEATURE_TYPE_ICONS.parent className="h-4 w-4" /> Parents
                </div>
              </div>
              <div className="text-center p-4 bg-background-elevated rounded-lg">
                <div className="text-2xl font-semibold text-foreground">{typeStats.story}</div>
                <div className="text-sm text-foreground-secondary flex items-center justify-center gap-1">
                  <FEATURE_TYPE_ICONS.story className="h-4 w-4" /> Stories
                </div>
              </div>
              <div className="text-center p-4 bg-background-elevated rounded-lg">
                <div className="text-2xl font-semibold text-foreground">{typeStats.task}</div>
                <div className="text-sm text-foreground-secondary flex items-center justify-center gap-1">
                  <FEATURE_TYPE_ICONS.task className="h-4 w-4" /> Tasks
                </div>
              </div>
              <div className="text-center p-4 bg-warning-50 rounded-lg">
                <div className="text-2xl font-semibold text-warning">{typeStats.research}</div>
                <div className="text-sm text-warning flex items-center justify-center gap-1">
                  <FEATURE_TYPE_ICONS.research className="h-4 w-4" /> Research
                </div>
              </div>
            </div>
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
                <p className="text-sm font-medium text-foreground-muted">Team Name</p>
                <p className="text-lg font-semibold text-foreground">{team.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground-muted">Description</p>
                <p className="text-foreground-secondary">{team.description || 'No description provided'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground-muted">Created on</p>
                <p className="text-foreground-secondary">{new Date(team.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground-muted">Members</p>
                <p className="text-foreground-secondary">{team.memberCount} members</p>
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
            <div className="text-center py-8 text-foreground-muted">
              <p>No recent activity to display.</p>
              <p className="mt-2">Start by creating your first feature request!</p>
            </div>
          </CardContent>
          <CardFooter className="border-t border-border bg-background-elevated rounded-b-lg">
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
