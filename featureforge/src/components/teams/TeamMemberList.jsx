import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useToast } from '../ui/toast';
import teamService from '../../services/teamService';

const TeamMemberList = ({ teamId }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('member');
  const toast = useToast();

  useEffect(() => {
    fetchMembers();
  }, [teamId]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const response = await teamService.getTeamMembers(teamId);
      setMembers(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch team members');
      toast.toast({
        title: 'Error',
        description: 'Failed to fetch team members. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async () => {
    try {
      await teamService.addTeamMember(teamId, {
        email: newMemberEmail,
        role: newMemberRole
      });
      toast.toast({
        title: 'Success',
        description: 'Member added successfully',
        variant: 'default'
      });
      setIsAddMemberDialogOpen(false);
      setNewMemberEmail('');
      fetchMembers();
    } catch (error) {
      toast.toast({
        title: 'Error',
        description: error.message || 'Failed to add member',
        variant: 'destructive'
      });
    }
  };

  const handleRemoveMember = async (userId) => {
    try {
      await teamService.removeTeamMember(teamId, userId);
      toast.toast({
        title: 'Success',
        description: 'Member removed successfully',
        variant: 'default'
      });
      fetchMembers();
    } catch (error) {
      toast.toast({
        title: 'Error',
        description: error.message || 'Failed to remove member',
        variant: 'destructive'
      });
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      await teamService.updateMemberRole(teamId, userId, newRole);
      toast.toast({
        title: 'Success',
        description: 'Member role updated successfully',
        variant: 'default'
      });
      fetchMembers();
    } catch (error) {
      toast.toast({
        title: 'Error',
        description: error.message || 'Failed to update member role',
        variant: 'destructive'
      });
    }
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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Team Members</h2>
        <Button onClick={() => setIsAddMemberDialogOpen(true)}>
          Add Member
        </Button>
      </div>

      <div className="grid gap-4">
        {members.map((member) => (
          <Card key={member.id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>{member.email}</span>
                <Select
                  value={member.role}
                  onValueChange={(value) => handleUpdateRole(member.userId, value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <span className="text-sm text-secondary-400">
                  Joined {new Date(member.joinedAt).toLocaleDateString()}
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleRemoveMember(member.userId)}
                >
                  Remove
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {members.length === 0 && (
        <div className="text-center py-8">
          <p className="text-secondary-500">No members found</p>
        </div>
      )}

      <Dialog open={isAddMemberDialogOpen} onOpenChange={setIsAddMemberDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <input
                type="email"
                className="w-full px-3 py-2 border rounded-md"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                placeholder="Enter member email"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <Select value={newMemberRole} onValueChange={setNewMemberRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsAddMemberDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleAddMember}>
                Add Member
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeamMemberList; 