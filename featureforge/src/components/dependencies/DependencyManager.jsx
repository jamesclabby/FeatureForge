import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useToast } from '../ui/toast';
import { Plus, AlertTriangle, CheckCircle } from 'lucide-react';
import DependencyList from './DependencyList';
import AddDependencyDialog from './AddDependencyDialog';
import dependencyService from '../../services/dependencyService';
import { isFeatureBlocked } from '../../constants/dependencyTypes';

const DependencyManager = ({ feature, onFeatureUpdate }) => {
  const [dependencies, setDependencies] = useState({ outgoing: [], incoming: [], stats: {}, isBlocked: false });
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const { toast } = useToast();

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
      setDependencies({ outgoing: [], incoming: [], stats: {}, isBlocked: false });
      
      // Only show toast for non-404 errors (404 means no dependencies exist yet)
      if (error.response?.status !== 404) {
        toast({
          title: "Error",
          description: "Failed to load dependencies. Please try again.",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddDependency = async (dependencyData) => {
    try {
      await dependencyService.createDependency(feature.id, dependencyData);
      
      toast({
        title: "Success",
        description: "Dependency created successfully.",
      });

      // Reload dependencies to get updated data
      await loadDependencies();
      
      setShowAddDialog(false);
    } catch (error) {
      console.error('Error creating dependency:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create dependency.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteDependency = async (dependencyId) => {
    try {
      await dependencyService.deleteDependency(feature.id, dependencyId);
      
      toast({
        title: "Success",
        description: "Dependency removed successfully.",
      });

      // Reload dependencies
      await loadDependencies();
      
    } catch (error) {
      console.error('Error deleting dependency:', error);
      toast({
        title: "Error",
        description: "Failed to remove dependency.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Dependencies
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Safely destructure with fallbacks
  const { 
    outgoing = [], 
    incoming = [], 
    stats = {}, 
    isBlocked = false 
  } = dependencies || { outgoing: [], incoming: [], stats: {}, isBlocked: false };
  
  const totalDependencies = outgoing.length + incoming.length;

  return (
    <div className="space-y-4">
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
            
            <Button
              onClick={() => setShowAddDialog(true)}
              size="sm"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Dependency
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {totalDependencies === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">
                <Plus className="h-12 w-12 mx-auto mb-4 opacity-50" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Dependencies</h3>
              <p className="text-gray-500 mb-4">
                This feature doesn't have any dependencies yet.
              </p>
              <Button
                onClick={() => setShowAddDialog(true)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add First Dependency
              </Button>
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
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Outgoing Dependencies ({outgoing.length})
                  </h4>
                  <DependencyList
                    dependencies={outgoing}
                    type="outgoing"
                    onDelete={handleDeleteDependency}
                  />
                </div>
              )}

              {/* Incoming Dependencies */}
              {incoming.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Incoming Dependencies ({incoming.length})
                  </h4>
                  <DependencyList
                    dependencies={incoming}
                    type="incoming"
                    onDelete={handleDeleteDependency}
                  />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Dependency Dialog */}
      <AddDependencyDialog
        isOpen={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onAdd={handleAddDependency}
        sourceFeature={feature}
      />
    </div>
  );
};

export default DependencyManager; 