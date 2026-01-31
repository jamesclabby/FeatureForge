import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useToast } from '../ui/toast';
import teamService from '../../services/teamService';
import TeamMemberList from './TeamMemberList';
import TeamForm from './TeamForm';
import TeamSettings from './TeamSettings';

const TeamDetails = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    fetchTeamDetails();
  }, [teamId]);

  const fetchTeamDetails = async () => {
    try {
      setLoading(true);
      const response = await teamService.getTeamById(teamId);
      setTeam(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch team details');
      toast.toast({
        title: 'Error',
        description: 'Failed to fetch team details. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (window.confirm('Are you sure you want to delete this team? This action cannot be undone.')) {
      try {
        await teamService.deleteTeam(teamId);
        toast.toast({
          title: 'Success',
          description: 'Team deleted successfully',
          variant: 'default'
        });
        navigate('/teams');
      } catch (error) {
        toast.toast({
          title: 'Error',
          description: error.message || 'Failed to delete team',
          variant: 'destructive'
        });
      }
    }
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
      <div className="flex justify-center items-center h-64">
        <p className="text-error">{error}</p>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-foreground-muted">Team not found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{team.name}</h1>
          <p className="text-foreground-muted mt-2">{team.description}</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
            Edit Team
          </Button>
          <Button variant="destructive" onClick={handleDeleteTeam}>
            Delete Team
          </Button>
        </div>
      </div>

      <Tabs defaultValue="members" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="members" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <TeamMemberList teamId={teamId} />
            </div>
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Team Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-foreground-muted">Created</h3>
                    <p className="text-foreground-secondary">{new Date(team.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-foreground-muted">Members</h3>
                    <p className="text-foreground-secondary">{team.memberCount} members</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="settings" className="mt-6">
          <TeamSettings teamId={teamId} />
        </TabsContent>
      </Tabs>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team</DialogTitle>
          </DialogHeader>
          <TeamForm
            team={team}
            onSubmit={() => {
              setIsEditDialogOpen(false);
              fetchTeamDetails();
            }}
            onCancel={() => setIsEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeamDetails;
