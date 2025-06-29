import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/card';
import { useToast } from '../ui/toast';
import { Users, Plus, ArrowRight } from 'lucide-react';
import teamService from '../../services/teamService';

const TeamSelector = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const fetchTeams = useCallback(async () => {
    try {
      setLoading(true);
      const response = await teamService.getAllTeams();
      console.log('Teams fetched:', response.data);
      setTeams(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching teams:', err);
      setError('Failed to fetch teams');
      toast.toast({
        title: 'Error',
        description: 'Failed to fetch your teams. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    // Check if this is a new user signup
    const newUserSignup = localStorage.getItem('isNewUserSignup');
    if (newUserSignup === 'true') {
      setIsNewUser(true);
      // Clear the flag so it doesn't show again
      localStorage.removeItem('isNewUserSignup');
    }
    
    fetchTeams();
  }, [fetchTeams]);

  const handleTeamSelect = (teamId) => {
    console.log('TeamSelector: handleTeamSelect called with teamId:', teamId, 'Type:', typeof teamId);
    
    try {
      // Validate the teamId is a valid UUID
      if (!teamId || typeof teamId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(teamId)) {
        console.error('Invalid team ID format:', teamId);
        toast.toast({
          title: 'Error',
          description: 'Invalid team ID format. Please try again.',
          variant: 'destructive',
        });
        return;
      }
      
      // Store the selected team ID in localStorage for persistence
      localStorage.setItem('selectedTeamId', teamId);
      console.log('TeamSelector: Stored teamId in localStorage:', teamId);
      
      // Navigate to the specific team dashboard instead of the general dashboard
      const teamDashboardUrl = `/team-dashboard/${teamId}?t=${Date.now()}`;
      console.log('TeamSelector: Navigating to', teamDashboardUrl);
      
      toast.toast({
        title: 'Team Selected',
        description: 'Team selected successfully. Loading dashboard...',
        variant: 'default',
      });
      
      // Hard redirect instead of using React Router
      window.location.href = teamDashboardUrl;
    } catch (error) {
      console.error('Error in handleTeamSelect:', error);
      toast.toast({
        title: 'Error',
        description: 'Failed to select team. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleCreateTeam = () => {
    navigate('/teams/new');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Welcome Section for New Users */}
        {isNewUser && (
          <div className="mb-8 bg-gradient-to-r from-primary-600 to-primary-800 rounded-lg p-6 text-white">
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-2">Welcome to FeatureForge! 🎉</h1>
              <p className="text-primary-100 text-lg mb-4">
                You're just one step away from managing your product features like a pro.
              </p>
              <p className="text-primary-200">
                First, let's get you set up with a team. All features in FeatureForge belong to teams.
              </p>
            </div>
          </div>
        )}

        {/* Regular Header for Existing Users */}
        {!isNewUser && (
          <h1 className="text-3xl font-bold mb-8 text-center">Select a Team</h1>
        )}
        
        {teams.length === 0 ? (
          <Card className="text-center">
            <CardContent className="py-12">
              <div className="flex flex-col items-center space-y-4">
                <div className="bg-primary-100 p-4 rounded-full">
                  <Users className="h-12 w-12 text-primary-600" />
                </div>
                {isNewUser ? (
                  <>
                    <h2 className="text-xl font-semibold text-secondary-900">Let's Create Your First Team</h2>
                    <p className="text-secondary-500 max-w-md">
                      Teams help you organize your features and collaborate with others. 
                      You can always create more teams later or join existing ones.
                    </p>
                    <Button 
                      onClick={handleCreateTeam}
                      size="lg"
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-5 w-5" />
                      Create Your First Team
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <h2 className="text-xl font-semibold text-secondary-900">No Teams Found</h2>
                    <p className="text-secondary-500 mb-4">You don't belong to any teams yet.</p>
                    <Button onClick={handleCreateTeam}>Create Your First Team</Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {isNewUser && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800 text-center">
                  <strong>Great!</strong> You already have access to {teams.length === 1 ? 'a team' : 'some teams'}. 
                  Select one below to get started, or create a new team if needed.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teams.map((team) => (
                <Card 
                  key={team.id} 
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleTeamSelect(team.id)}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary-600" />
                      {team.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-secondary-500 mb-3">{team.description}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-secondary-400">{team.memberCount} members</span>
                      <span className="text-xs text-secondary-400">ID: {team.id.slice(0, 8)}...</span>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full flex items-center justify-center gap-2" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTeamSelect(team.id);
                      }}
                    >
                      Select Team
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </>
        )}
        
        <div className="mt-8 text-center">
          <Button 
            variant="outline" 
            onClick={handleCreateTeam}
            className="flex items-center gap-2 mx-auto"
          >
            <Plus className="h-4 w-4" />
            Create a New Team
          </Button>
        </div>

        {/* Diagnostic section - only show for existing users or if there are teams */}
        {!isNewUser && teams.length > 0 && (
          <div className="mt-6 p-4 bg-secondary-50 rounded-lg">
            <h3 className="font-medium mb-2">Diagnostic Information</h3>
            <p className="text-xs mb-2">If clicking on teams doesn't work, try the direct selection below:</p>
            <div className="flex flex-wrap gap-2">
              {teams.map(team => (
                <button
                  key={team.id}
                  className="text-xs px-3 py-1 bg-white border border-secondary-200 rounded hover:bg-secondary-100"
                  onClick={(e) => {
                    e.preventDefault();
                    console.log('Direct team selection for:', team.id);
                    localStorage.setItem('selectedTeamId', team.id);
                    window.location.href = `/team-dashboard/${team.id}`;
                  }}
                >
                  {team.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamSelector; 