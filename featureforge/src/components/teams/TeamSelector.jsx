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
  const { toast } = useToast();

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const response = await teamService.getAllTeams();
      setTeams(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch teams');
      toast({
        title: 'Error',
        description: 'Failed to fetch your teams. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTeamSelect = (teamId) => {
    // Store the selected team ID in localStorage for persistence
    localStorage.setItem('selectedTeamId', teamId);
    // Navigate to the dashboard for the selected team
    navigate(`/dashboard?teamId=${teamId}`);
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teams.map((team) => (
              <Card 
                key={team.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleTeamSelect(team.id)}
              >
                <CardHeader>
                  <CardTitle>{team.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-secondary-500">{team.description}</p>
                  <p className="text-sm mt-2">{team.memberCount} members</p>
                </CardContent>
              </Card>
            ))}
          </div>
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