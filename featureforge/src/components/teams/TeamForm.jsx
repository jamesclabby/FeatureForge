import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { CharacterCounter } from '../ui/character-counter';
import { useToast } from '../ui/toast';
import { FIELD_LIMITS, validateTeamName, validateTeamDescription } from '../../utils/validation';
import teamService from '../../services/teamService';

const TeamForm = ({ team, onSubmit, onCancel, isNewUser = false }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const toast = useToast();

  useEffect(() => {
    if (team) {
      setFormData({
        name: team.name,
        description: team.description
      });
    }
  }, [team]);

  const validateForm = () => {
    const newErrors = {};
    
    const nameError = validateTeamName(formData.name);
    if (nameError) newErrors.name = nameError;
    
    const descriptionError = validateTeamDescription(formData.description);
    if (descriptionError) newErrors.description = descriptionError;
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);

    try {
      let result;
      if (team) {
        result = await teamService.updateTeam(team.id, formData);
        toast.toast({
          title: 'Success',
          description: 'Team updated successfully',
          variant: 'default'
        });
      } else {
        result = await teamService.createTeam(formData);
        toast.toast({
          title: 'Success',
          description: isNewUser 
            ? 'Welcome to FeatureForge! Your team has been created successfully.' 
            : 'Team created successfully',
          variant: 'default'
        });
      }
      
      // Pass the created/updated team data to the parent
      onSubmit(result.data || result);
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
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">
          Team Name {isNewUser && <span className="text-error">*</span>}
        </Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder={isNewUser ? "e.g., Product Team, Marketing Team, Development Team" : "Enter team name"}
          required
          maxLength={FIELD_LIMITS.TEAM_NAME}
          className={errors.name ? 'border-error' : ''}
        />
        <div className="flex justify-between items-center">
          <div>
            {errors.name && (
              <p className="text-xs text-error">{errors.name}</p>
            )}
            {isNewUser && !errors.name && (
              <p className="text-xs text-secondary-500">
                Choose a name that clearly identifies your team or project
              </p>
            )}
          </div>
          <CharacterCounter value={formData.name} limit={FIELD_LIMITS.TEAM_NAME} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder={isNewUser 
            ? "Briefly describe what your team works on (optional)" 
            : "Enter team description"
          }
          rows={4}
          maxLength={FIELD_LIMITS.TEAM_DESCRIPTION}
          className={errors.description ? 'border-error' : ''}
        />
        <div className="flex justify-between items-center">
          <div>
            {errors.description && (
              <p className="text-xs text-error">{errors.description}</p>
            )}
            {isNewUser && !errors.description && (
              <p className="text-xs text-secondary-500">
                Help others understand what your team focuses on
              </p>
            )}
          </div>
          <CharacterCounter value={formData.description} limit={FIELD_LIMITS.TEAM_DESCRIPTION} />
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          {isNewUser ? 'Back' : 'Cancel'}
        </Button>
        <Button type="submit" disabled={loading}>
          {loading 
            ? (isNewUser ? 'Creating Team...' : 'Saving...') 
            : (team 
                ? 'Update Team' 
                : (isNewUser ? 'Create Team & Continue' : 'Create Team')
              )
          }
        </Button>
      </div>
    </form>
  );
};

export default TeamForm; 