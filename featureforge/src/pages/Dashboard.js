import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import CreateFeatureDialog from '../components/features/CreateFeatureDialog';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [featureCount, setFeatureCount] = useState(0);
  const [inProgressCount, setInProgressCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);

  // Handle feature creation success
  const handleFeatureCreated = (featureData) => {
    // Update feature count
    setFeatureCount(prevCount => prevCount + 1);
    
    // You could fetch updated counts from the API here
    // or update other state based on the new feature
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-lg p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {currentUser?.displayName || currentUser?.email}!
          </h1>
          <p className="text-primary-100">
            Manage and prioritize your product features with FeatureForge.
          </p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Feature Requests</CardTitle>
              <CardDescription>Total feature requests</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-primary-600">{featureCount}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">In Progress</CardTitle>
              <CardDescription>Features being worked on</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-amber-500">{inProgressCount}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Completed</CardTitle>
              <CardDescription>Implemented features</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-green-500">{completedCount}</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Create a new feature request or view existing ones
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4">
            <CreateFeatureDialog onFeatureCreated={handleFeatureCreated} />
            <Button variant="outline" className="flex-1">View All Features</Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Your latest actions and updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-secondary-500">
              <p>No recent activity to display.</p>
              <p className="mt-2">Start by creating your first feature request!</p>
            </div>
          </CardContent>
          <CardFooter className="border-t border-secondary-100 bg-secondary-50 rounded-b-lg">
            <Button variant="ghost" size="sm" className="ml-auto">
              View All Activity
            </Button>
          </CardFooter>
        </Card>

        {/* Quick Feature Form - Removed in favor of the dialog */}
      </div>
    </div>
  );
};

export default Dashboard; 