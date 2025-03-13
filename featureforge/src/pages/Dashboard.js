import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

const Dashboard = () => {
  const { currentUser } = useAuth();

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
              <p className="text-4xl font-bold text-primary-600">0</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">In Progress</CardTitle>
              <CardDescription>Features being worked on</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-amber-500">0</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Completed</CardTitle>
              <CardDescription>Implemented features</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-green-500">0</p>
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
            <Button className="flex-1">Create New Feature</Button>
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

        {/* Quick Feature Form */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Feature Request</CardTitle>
            <CardDescription>
              Submit a new feature idea quickly
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Feature Title</Label>
                <Input id="title" placeholder="Enter a title for your feature" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea 
                  id="description" 
                  rows="3" 
                  className="w-full rounded-md border border-secondary-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
                  placeholder="Describe your feature request"
                ></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <select 
                    id="priority" 
                    className="w-full rounded-md border border-secondary-200 bg-white h-10 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <select 
                    id="category" 
                    className="w-full rounded-md border border-secondary-200 bg-white h-10 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
                  >
                    <option value="ui">UI/UX</option>
                    <option value="functionality">Functionality</option>
                    <option value="performance">Performance</option>
                    <option value="security">Security</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-between border-t border-secondary-100 bg-secondary-50 rounded-b-lg">
            <Button variant="ghost">Cancel</Button>
            <Button>Submit Request</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard; 