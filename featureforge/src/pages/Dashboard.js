import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
  const { currentUser } = useAuth();

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      <div className="dashboard-welcome">
        <h2>Welcome, {currentUser?.displayName || currentUser?.email}!</h2>
        <p>This is your FeatureForge dashboard where you can manage and prioritize product features.</p>
      </div>
      
      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>Feature Requests</h3>
          <p className="stat-number">0</p>
        </div>
        <div className="stat-card">
          <h3>In Progress</h3>
          <p className="stat-number">0</p>
        </div>
        <div className="stat-card">
          <h3>Completed</h3>
          <p className="stat-number">0</p>
        </div>
      </div>
      
      <div className="dashboard-actions">
        <button className="action-button primary">Create New Feature Request</button>
        <button className="action-button secondary">View All Features</button>
      </div>
      
      <div className="dashboard-recent">
        <h3>Recent Activity</h3>
        <div className="empty-state">
          <p>No recent activity to display.</p>
          <p>Start by creating your first feature request!</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 