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
        return 'bg-success-100 text-success';
      case 'in_progress':
        return 'bg-info-100 text-info';
      case 'review':
        return 'bg-warning-100 text-warning';
      case 'backlog':
      default:
        return 'bg-background-elevated text-foreground-secondary';
    }
  };

  const renderDependencyItem = (dependency, type) => {
    const displayFeature = type === 'outgoing' ? dependency.targetFeature : dependency.sourceFeature;
    const dependencyConfig = getDependencyTypeConfig(dependency.dependencyType);
    const featureTypeDetails = getFeatureTypeDetails(displayFeature?.type);

    if (!displayFeature) return null;

    return (
      <div key={dependency.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
        <div className="flex items-center gap-3 flex-1">
          <div className="flex items-center gap-2">
            {React.createElement(dependencyConfig.icon, { 
              className: "h-4 w-4 text-foreground-secondary" 
            })}
            <Badge variant="outline" className="text-xs">
              {dependencyConfig.label}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2 flex-1">
            <span className="text-lg">{featureTypeDetails?.icon}</span>
            <span className="font-medium text-sm text-foreground">{displayFeature.title}</span>
            <Badge className={`text-xs ${getStatusBadgeColor(displayFeature.status)}`}>
              {displayFeature.status?.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-foreground-muted hover:text-info"
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
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent"></div>
      </div>
    );
  }

  const { outgoing = [], incoming = [], stats = {}, isBlocked = false } = dependencies;
  const totalDependencies = outgoing.length + incoming.length;

  if (compact) {
    // Compact view for feature detail pages
    if (totalDependencies === 0) {
      return (
        <div className="text-center py-4 text-foreground-muted">
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
            <div className="flex items-center gap-1 text-warning">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Blocked by {stats.blockedByCount || 0} feature{(stats.blockedByCount || 0) !== 1 ? 's' : ''}</span>
            </div>
          ) : totalDependencies > 0 ? (
            <div className="flex items-center gap-1 text-success">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">All dependencies clear</span>
            </div>
          ) : null}
        </div>

        {/* Outgoing Dependencies */}
        {outgoing.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground-secondary">
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
            <h4 className="text-sm font-medium text-foreground-secondary">
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
              <div className="flex items-center gap-1 text-warning">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">Blocked</span>
              </div>
            )}
            
            {!isBlocked && totalDependencies > 0 && (
              <div className="flex items-center gap-1 text-success">
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
            <div className="text-foreground-muted mb-2">
              <Link className="h-12 w-12 mx-auto mb-4 opacity-50" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">No Dependencies</h3>
            <p className="text-foreground-muted">
              This feature doesn't have any dependencies.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-background-elevated rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-info">{stats.totalOutgoing || 0}</div>
                <div className="text-sm text-foreground-secondary">Outgoing</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-success">{stats.totalIncoming || 0}</div>
                <div className="text-sm text-foreground-secondary">Incoming</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-error">{stats.blockingCount || 0}</div>
                <div className="text-sm text-foreground-secondary">Blocking</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-warning">{stats.blockedByCount || 0}</div>
                <div className="text-sm text-foreground-secondary">Blocked By</div>
              </div>
            </div>

            {/* Outgoing Dependencies */}
            {outgoing.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-foreground-secondary">
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
                <h4 className="text-sm font-medium text-foreground-secondary">
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