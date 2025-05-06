import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/card';
import { useToast } from '../ui/toast';
import teamService from '../../services/teamService';

const TeamSelector = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const response = await teamService.getAllTeams();
      console.log('Teams fetched:', response.data);
      setTeams(response.data);
      setError(null);
      
      // No longer auto-select teams even if there's only one
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
  };

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
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Select a Team</h1>
        
        {teams.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-secondary-500 mb-4">You don't belong to any teams yet.</p>
              <Button onClick={handleCreateTeam}>Create Your First Team</Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teams.map((team) => (
                <Card 
                  key={team.id} 
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader>
                    <CardTitle>{team.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-secondary-500">{team.description}</p>
                    <p className="text-sm mt-2">{team.memberCount} members</p>
                    <p className="text-xs mt-1 text-secondary-400">ID: {team.id}</p>
                    <Button 
                      className="w-full mt-4" 
                      onClick={() => handleTeamSelect(team.id)}
                    >
                      Select Team
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            
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
          </>
        )}
        
        <div className="mt-8 text-center">
          <Button variant="outline" onClick={handleCreateTeam}>
            Create a New Team
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TeamSelector; 