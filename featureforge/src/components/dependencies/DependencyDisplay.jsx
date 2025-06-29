import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Link, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';
import dependencyService from '../../services/dependencyService';
import { getDependencyTypeConfig } from '../../constants/dependencyTypes';
import { getFeatureTypeDetails } from '../../constants/featureTypes';

const DependencyDisplay = ({ feature, compact = false }) => {
  const [dependencies, setDependencies] = useState({ 
    outgoing: [], 
    incoming: [], 
    stats: {}, 
    isBlocked: false 
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (feature?.id) {
      loadDependencies();
    }
  }, [feature?.id]);

  const loadDependencies = async () => {
    try {
      setLoading(true);
      const response = await dependencyService.getFeatureDependencies(feature.id);
      
      // Safely extract data with fallbacks
      const responseData = response?.data || response || {};
      const safeDependencies = {
        outgoing: responseData.outgoing || [],
        incoming: responseData.incoming || [],
        stats: responseData.stats || {},
        isBlocked: responseData.isBlocked || false
      };
      
      setDependencies(safeDependencies);
    } catch (error) {
      console.error('Error loading dependencies:', error);
      
      // Set safe defaults on error
      setDependencies({ 
        outgoing: [], 
        incoming: [], 
        stats: {}, 
        isBlocked: false 
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'done':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'review':
        return 'bg-yellow-100 text-yellow-800';
      case 'backlog':
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderDependencyItem = (dependency, type) => {
    const displayFeature = type === 'outgoing' ? dependency.targetFeature : dependency.sourceFeature;
    const dependencyConfig = getDependencyTypeConfig(dependency.dependencyType);
    const featureTypeDetails = getFeatureTypeDetails(displayFeature?.type);

    if (!displayFeature) return null;

    return (
      <div key={dependency.id} className="flex items-center justify-between p-3 border rounded-lg">
        <div className="flex items-center gap-3 flex-1">
          <div className="flex items-center gap-2">
            {React.createElement(dependencyConfig.icon, { 
              className: "h-4 w-4 text-gray-600" 
            })}
            <Badge variant="outline" className="text-xs">
              {dependencyConfig.label}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2 flex-1">
            <span className="text-lg">{featureTypeDetails?.icon}</span>
            <span className="font-medium text-sm">{displayFeature.title}</span>
            <Badge className={`text-xs ${getStatusBadgeColor(displayFeature.status)}`}>
              {displayFeature.status?.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-gray-400 hover:text-blue-600"
          onClick={() => {
            // Navigate to feature detail - you might want to implement this based on your routing
            window.open(`/features/${displayFeature.id}`, '_blank');
          }}
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const { outgoing = [], incoming = [], stats = {}, isBlocked = false } = dependencies;
  const totalDependencies = outgoing.length + incoming.length;

  if (compact) {
    // Compact view for feature detail pages
    if (totalDependencies === 0) {
      return (
        <div className="text-center py-4 text-gray-500">
          <Link className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No dependencies</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Status indicator */}
        <div className="flex items-center gap-2">
          {isBlocked ? (
            <div className="flex items-center gap-1 text-orange-600">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Blocked by {stats.blockedByCount || 0} feature{(stats.blockedByCount || 0) !== 1 ? 's' : ''}</span>
            </div>
          ) : totalDependencies > 0 ? (
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">All dependencies clear</span>
            </div>
          ) : null}
        </div>

        {/* Outgoing Dependencies */}
        {outgoing.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">
              This feature depends on ({outgoing.length})
            </h4>
            <div className="space-y-2">
              {outgoing.map(dependency => renderDependencyItem(dependency, 'outgoing'))}
            </div>
          </div>
        )}

        {/* Incoming Dependencies */}
        {incoming.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">
              Features that depend on this ({incoming.length})
            </h4>
            <div className="space-y-2">
              {incoming.map(dependency => renderDependencyItem(dependency, 'incoming'))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full card view
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="flex items-center gap-2">
              Dependencies
              {totalDependencies > 0 && (
                <Badge variant="secondary">{totalDependencies}</Badge>
              )}
            </CardTitle>
            
            {isBlocked && (
              <div className="flex items-center gap-1 text-orange-600">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">Blocked</span>
              </div>
            )}
            
            {!isBlocked && totalDependencies > 0 && (
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Clear</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {totalDependencies === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              <Link className="h-12 w-12 mx-auto mb-4 opacity-50" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Dependencies</h3>
            <p className="text-gray-500">
              This feature doesn't have any dependencies.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.totalOutgoing || 0}</div>
                <div className="text-sm text-gray-600">Outgoing</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.totalIncoming || 0}</div>
                <div className="text-sm text-gray-600">Incoming</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.blockingCount || 0}</div>
                <div className="text-sm text-gray-600">Blocking</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.blockedByCount || 0}</div>
                <div className="text-sm text-gray-600">Blocked By</div>
              </div>
            </div>

            {/* Outgoing Dependencies */}
            {outgoing.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700">
                  Outgoing Dependencies ({outgoing.length})
                </h4>
                <div className="space-y-2">
                  {outgoing.map(dependency => renderDependencyItem(dependency, 'outgoing'))}
                </div>
              </div>
            )}

            {/* Incoming Dependencies */}
            {incoming.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700">
                  Incoming Dependencies ({incoming.length})
                </h4>
                <div className="space-y-2">
                  {incoming.map(dependency => renderDependencyItem(dependency, 'incoming'))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DependencyDisplay; 