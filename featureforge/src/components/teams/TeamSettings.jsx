import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/card';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useToast } from '../ui/toast';
import teamService from '../../services/teamService';

const TeamSettings = ({ teamId }) => {
  const [settings, setSettings] = useState({
    visibility: 'private',
    defaultMemberRole: 'member',
    allowMemberInvites: false,
    requireApproval: true,
    notificationPreferences: {
      email: true,
      inApp: true
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, [teamId]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      // This would be replaced with an actual API call when implemented
      // const response = await teamService.getTeamSettings(teamId);
      // setSettings(response.data);
      
      // For now, we'll use mock data
      setSettings({
        visibility: 'private',
        defaultMemberRole: 'member',
        allowMemberInvites: false,
        requireApproval: true,
        notificationPreferences: {
          email: true,
          inApp: true
        }
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load team settings',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // This would be replaced with an actual API call when implemented
      // await teamService.updateTeamSettings(teamId, settings);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast({
        title: 'Success',
        description: 'Team settings updated successfully',
        variant: 'default'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update team settings',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleNotificationChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      notificationPreferences: {
        ...prev.notificationPreferences,
        [key]: value
      }
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Team Settings</h2>
      
      <Card>
        <CardHeader>
          <CardTitle>Visibility</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Team Visibility</Label>
              <Select 
                value={settings.visibility} 
                onValueChange={(value) => handleChange('visibility', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="team">Team Only</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-secondary-500">
                Control who can see and join your team
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Member Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Default Member Role</Label>
            <Select 
              value={settings.defaultMemberRole} 
              onValueChange={(value) => handleChange('defaultMemberRole', value)}
            >
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

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <Label>Allow Member Invites</Label>
                <p className="text-sm text-secondary-500">
                  Let team members invite others
                </p>
              </div>
              <Button
                variant={settings.allowMemberInvites ? "default" : "outline"}
                onClick={() => handleChange('allowMemberInvites', !settings.allowMemberInvites)}
              >
                {settings.allowMemberInvites ? 'Enabled' : 'Disabled'}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <Label>Require Approval</Label>
                <p className="text-sm text-secondary-500">
                  Require admin approval for new members
                </p>
              </div>
              <Button
                variant={settings.requireApproval ? "default" : "outline"}
                onClick={() => handleChange('requireApproval', !settings.requireApproval)}
              >
                {settings.requireApproval ? 'Enabled' : 'Disabled'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <Label>Email Notifications</Label>
                <p className="text-sm text-secondary-500">
                  Receive team updates via email
                </p>
              </div>
              <Button
                variant={settings.notificationPreferences.email ? "default" : "outline"}
                onClick={() => handleNotificationChange('email', !settings.notificationPreferences.email)}
              >
                {settings.notificationPreferences.email ? 'Enabled' : 'Disabled'}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <Label>In-App Notifications</Label>
                <p className="text-sm text-secondary-500">
                  Receive team updates in the app
                </p>
              </div>
              <Button
                variant={settings.notificationPreferences.inApp ? "default" : "outline"}
                onClick={() => handleNotificationChange('inApp', !settings.notificationPreferences.inApp)}
              >
                {settings.notificationPreferences.inApp ? 'Enabled' : 'Disabled'}
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default TeamSettings; 