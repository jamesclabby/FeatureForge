import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import TeamForm from './TeamForm';

const TeamNew = () => {
  const navigate = useNavigate();

  const handleTeamCreated = () => {
    // Navigate to the teams list after team creation
    navigate('/teams');
  };

  const handleCancel = () => {
    // Navigate back to the teams list if creation is cancelled
    navigate('/teams');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Create New Team</CardTitle>
          </CardHeader>
          <CardContent>
            <TeamForm 
              onSubmit={handleTeamCreated} 
              onCancel={handleCancel}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeamNew; 