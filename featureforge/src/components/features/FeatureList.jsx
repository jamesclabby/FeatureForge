import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useToast } from '../ui/toast';
import featureService, { FEATURE_STATUSES, FEATURE_PRIORITIES } from '../../services/featureService';
import { FEATURE_TYPES_ARRAY } from '../../constants/featureTypes';
import CreateFeatureDialog from './CreateFeatureDialog';
import FeatureCard from './FeatureCard';
import FeatureHierarchy from './FeatureHierarchy';

const FeatureList = ({ teamId }) => {
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('votes-desc');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'hierarchy'
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    if (teamId) {
      fetchFeatures();
    }
  }, [teamId]);

  const fetchFeatures = async () => {
    try {
      setLoading(true);
      const response = await featureService.getTeamFeatures(teamId);
      setFeatures(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching features:', err);
      setError('Failed to fetch features');
      toast.toast({
        title: 'Error',
        description: 'Failed to fetch features. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFeatureCreated = (featureData) => {
    // Add the new feature to the list
    setFeatures([...features, featureData]);
    toast.toast({
      title: 'Success',
      description: 'Feature created successfully!',
      variant: 'default',
    });
  };

  const handleVote = async (featureId) => {
    try {
      const response = await featureService.voteForFeature(featureId);
      // Update the feature in the list
      setFeatures(features.map(feature => 
        feature.id === featureId ? response.data : feature
      ));
      toast.toast({
        title: 'Success',
        description: 'Vote recorded successfully!',
        variant: 'default',
      });
    } catch (err) {
      console.error('Error voting for feature:', err);
      toast.toast({
        title: 'Error',
        description: 'Failed to vote for feature. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Filter and sort features
  const filteredAndSortedFeatures = () => {
    let result = [...features];
    
    // Apply status filter
    if (filterStatus !== 'all') {
      result = result.filter(feature => feature.status === filterStatus);
    }
    
    // Apply priority filter
    if (filterPriority !== 'all') {
      result = result.filter(feature => feature.priority === filterPriority);
    }
    
    // Apply type filter
    if (filterType !== 'all') {
      result = result.filter(feature => feature.type === filterType);
    }
    
    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(feature => 
        feature.title.toLowerCase().includes(query) || 
        feature.description.toLowerCase().includes(query) ||
        (feature.tags && feature.tags.some(tag => tag.toLowerCase().includes(query)))
      );
    }
    
    // Apply sorting
    switch (sortBy) {
      case 'votes-desc':
        result.sort((a, b) => b.votes - a.votes);
        break;
      case 'votes-asc':
        result.sort((a, b) => a.votes - b.votes);
        break;
      case 'date-desc':
        result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'date-asc':
        result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      default:
        break;
    }
    
    return result;
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
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={fetchFeatures}>Try Again</Button>
        </div>
      </div>
    );
  }

  const displayedFeatures = filteredAndSortedFeatures();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold">Feature Requests</h2>
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === 'list' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              onClick={() => setViewMode('list')}
            >
              List View
            </button>
            <button
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === 'hierarchy' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              onClick={() => setViewMode('hierarchy')}
            >
              Hierarchy
            </button>
          </div>
          <CreateFeatureDialog onFeatureCreated={handleFeatureCreated} />
        </div>
      </div>

      {/* Filters and search */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label htmlFor="search" className="text-sm font-medium text-secondary-700 mb-1 block">
                Search
              </label>
              <Input
                id="search"
                type="text"
                placeholder="Search features..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div>
              <label htmlFor="statusFilter" className="text-sm font-medium text-secondary-700 mb-1 block">
                Status
              </label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger id="statusFilter">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {FEATURE_STATUSES.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label htmlFor="priorityFilter" className="text-sm font-medium text-secondary-700 mb-1 block">
                Priority
              </label>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger id="priorityFilter">
                  <SelectValue placeholder="Filter by priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  {FEATURE_PRIORITIES.map(priority => (
                    <SelectItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label htmlFor="typeFilter" className="text-sm font-medium text-secondary-700 mb-1 block">
                Type
              </label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger id="typeFilter">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {FEATURE_TYPES_ARRAY.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      <span className="flex items-center gap-2">
                        <span>{type.icon}</span>
                        <span>{type.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label htmlFor="sortBy" className="text-sm font-medium text-secondary-700 mb-1 block">
                Sort By
              </label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger id="sortBy">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="votes-desc">Most Votes</SelectItem>
                  <SelectItem value="votes-asc">Least Votes</SelectItem>
                  <SelectItem value="date-desc">Newest</SelectItem>
                  <SelectItem value="date-asc">Oldest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature count */}
      <div className="text-sm text-secondary-500">
        {displayedFeatures.length} {displayedFeatures.length === 1 ? 'feature' : 'features'} found
      </div>

      {/* Feature list */}
      {displayedFeatures.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-secondary-500 mb-4">No features match your criteria.</p>
            <CreateFeatureDialog onFeatureCreated={handleFeatureCreated} />
          </CardContent>
        </Card>
      ) : (
        <>
          {viewMode === 'hierarchy' ? (
            <FeatureHierarchy 
              features={displayedFeatures}
              onFeatureClick={(feature) => navigate(`/features/${feature.id}`)}
              onVote={handleVote}
            />
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {displayedFeatures.map(feature => (
                <FeatureCard 
                  key={feature.id}
                  feature={feature}
                  onVote={handleVote}
                  onClick={() => navigate(`/features/${feature.id}`)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FeatureList; 