import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import teamService from '../../services/teamService';
import { useToast } from '../ui/toast';

const TeamList = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
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
        description: 'Failed to fetch teams. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = () => {
    setIsCreateDialogOpen(true);
  };

  const handleTeamClick = (teamId) => {
    navigate(`/teams/${teamId}`);
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Teams</h1>
        <Button onClick={handleCreateTeam}>Create Team</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team) => (
          <Card
            key={team.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleTeamClick(team.id)}
          >
            <CardHeader>
              <CardTitle>{team.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-secondary-500 mb-2">{team.description}</p>
              <p className="text-sm text-secondary-400">
                {team.memberCount} members
              </p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <span className="text-sm text-secondary-400">
                Created {new Date(team.createdAt).toLocaleDateString()}
              </span>
              <Button variant="outline" size="sm">
                View Details
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {teams.length === 0 && (
        <div className="text-center py-12">
          <p className="text-secondary-500 mb-4">No teams found</p>
          <Button onClick={handleCreateTeam}>Create your first team</Button>
        </div>
      )}

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Team</DialogTitle>
          </DialogHeader>
          {/* TeamForm component will be added here */}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeamList; 