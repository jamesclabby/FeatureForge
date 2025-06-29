import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Users, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';
import TeamForm from './TeamForm';

const TeamNew = () => {
  const navigate = useNavigate();
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    // Check if this user came from the new user flow
    const newUserSignup = localStorage.getItem('isNewUserSignup');
    if (newUserSignup === 'true') {
      setIsNewUser(true);
    }
  }, []);

  const handleTeamCreated = (teamData) => {
    console.log('TeamNew: Team created successfully:', teamData);
    
    // If this was a new user, navigate them directly to team selector
    // so they can select their newly created team
    if (isNewUser) {
      // Clear the new user flag since they've completed onboarding
      localStorage.removeItem('isNewUserSignup');
      navigate('/selector');
    } else {
      // For existing users, go back to teams list
      navigate('/teams');
    }
  };

  const handleCancel = () => {
    if (isNewUser) {
      // New users should go back to team selector
      navigate('/selector');
    } else {
      // Existing users go back to teams list
      navigate('/teams');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Welcome header for new users */}
        {isNewUser && (
          <div className="mb-6 text-center">
            <div className="bg-primary-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Users className="h-8 w-8 text-primary-600" />
            </div>
            <h1 className="text-2xl font-bold text-secondary-900 mb-2">Create Your First Team</h1>
            <p className="text-secondary-600 max-w-md mx-auto">
              Teams help you organize features and collaborate with others. 
              Give your team a name and description to get started.
            </p>
          </div>
        )}

        {/* Back button for existing users */}
        {!isNewUser && (
          <div className="mb-6">
            <Button 
              variant="outline" 
              onClick={handleCancel}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Teams
            </Button>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>
              {isNewUser ? 'Team Details' : 'Create New Team'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TeamForm 
              onSubmit={handleTeamCreated} 
              onCancel={handleCancel}
              isNewUser={isNewUser}
            />
          </CardContent>
        </Card>

        {/* Helpful tips for new users */}
        {isNewUser && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">💡 Quick Tips</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Choose a name that reflects your product or project</li>
              <li>• You can always change the name and description later</li>
              <li>• You can invite team members after creating the team</li>
              <li>• You can create multiple teams for different projects</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamNew; 