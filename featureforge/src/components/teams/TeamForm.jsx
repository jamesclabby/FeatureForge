import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { useToast } from '../ui/toast';
import teamService from '../../services/teamService';

const TeamForm = ({ team, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (team) {
      setFormData({
        name: team.name,
        description: team.description
      });
    }
  }, [team]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (team) {
        await teamService.updateTeam(team.id, formData);
        toast.toast({
          title: 'Success',
          description: 'Team updated successfully',
          variant: 'default'
        });
      } else {
        await teamService.createTeam(formData);
        toast.toast({
          title: 'Success',
          description: 'Team created successfully',
          variant: 'default'
        });
      }
      onSubmit();
    } catch (error) {
      toast.toast({
        title: 'Error',
        description: error.message || 'Failed to save team',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Team Name</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter team name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Enter team description"
          rows={4}
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : team ? 'Update Team' : 'Create Team'}
        </Button>
      </div>
    </form>
  );
};

export default TeamForm; 