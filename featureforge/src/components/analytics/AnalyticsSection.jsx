import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { analyticsService } from '../../services/analyticsService';
import StatusDistributionChart from './StatusDistributionChart';
import FeatureVelocityChart from './FeatureVelocityChart';
import StatusTimelineChart from './StatusTimelineChart';
import PriorityImpactMatrix from './PriorityImpactMatrix';
import EffortImpactAnalysis from './EffortImpactAnalysis';

const AnalyticsSection = ({ teamId }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for selected chart types
  const [flowChartType, setFlowChartType] = useState('status-distribution');
  const [impactChartType, setImpactChartType] = useState('priority-impact-matrix');
  
  // State for collapsible sections
  const [flowExpanded, setFlowExpanded] = useState(true);
  const [impactExpanded, setImpactExpanded] = useState(true);

  useEffect(() => {
    if (teamId) {
      fetchAnalytics();
    }
  }, [teamId]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await analyticsService.getTeamAnalytics(teamId);
      setAnalytics(response.data);
    } catch (err) {
      setError('Failed to load analytics data');
      console.error('Analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Chart type options
  const flowChartOptions = [
    { value: 'status-distribution', label: 'Feature Status Distribution' },
    { value: 'type-distribution', label: 'Feature Type Distribution' },
    { value: 'feature-velocity', label: 'Feature Velocity' },
    { value: 'status-timeline', label: 'Status Timeline' }
  ];

  const impactChartOptions = [
    { value: 'priority-impact-matrix', label: 'Priority vs Impact Matrix' },
    { value: 'effort-impact-analysis', label: 'Effort vs Impact Analysis' }
  ];

  const renderFlowChart = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex justify-center items-center h-64 text-foreground-muted">
          <p>Unable to load chart data</p>
        </div>
      );
    }

    if (!analytics) {
      return (
        <div className="flex justify-center items-center h-64 text-foreground-muted">
          <p>No analytics data available</p>
        </div>
      );
    }

    // Show real charts based on selected chart type
    switch (flowChartType) {
      case 'status-distribution':
        if (analytics.statusDistribution && Array.isArray(analytics.statusDistribution)) {
          return <StatusDistributionChart data={analytics.statusDistribution} />;
        } else {
          return (
            <div className="h-64 flex items-center justify-center text-foreground-muted">
              <p>No status data available</p>
            </div>
          );
        }
      case 'type-distribution':
        if (analytics.typeDistribution && Array.isArray(analytics.typeDistribution)) {
          return <StatusDistributionChart data={analytics.typeDistribution} title="Feature Type Distribution" />;
        } else {
          return (
            <div className="h-64 flex items-center justify-center text-foreground-muted">
              <p>No type data available</p>
            </div>
          );
        }
      case 'feature-velocity':
        if (analytics.velocity && analytics.velocity.weeklyData) {
          return <FeatureVelocityChart data={analytics.velocity} />;
        } else {
          return (
            <div className="h-80 flex items-center justify-center text-foreground-muted">
              <p>No velocity data available</p>
            </div>
          );
        }
      case 'status-timeline':
        if (analytics.timelineAnalytics && analytics.timelineAnalytics.monthlyData) {
          return <StatusTimelineChart data={analytics.timelineAnalytics} />;
        } else {
          return (
            <div className="h-80 flex items-center justify-center text-foreground-muted">
              <p>No timeline data available</p>
            </div>
          );
        }
      default:
        return <div className="h-64 flex items-center justify-center text-foreground-muted">Select a chart type</div>;
    }
  };

  const renderImpactChart = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-80">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex justify-center items-center h-80 text-foreground-muted">
          <p>Unable to load chart data</p>
        </div>
      );
    }

    if (!analytics) {
      return (
        <div className="flex justify-center items-center h-80 text-foreground-muted">
          <p>No analytics data available</p>
        </div>
      );
    }

    // Show real charts based on selected chart type
    switch (impactChartType) {
      case 'priority-impact-matrix':
        if (analytics.priorityAnalysis && Array.isArray(analytics.priorityAnalysis)) {
          return <PriorityImpactMatrix data={analytics.priorityAnalysis} />;
        } else {
          return (
            <div className="h-80 flex items-center justify-center text-foreground-muted">
              <p>No priority analysis data available</p>
            </div>
          );
        }
      case 'effort-impact-analysis':
        if (analytics.effortImpactMatrix && Array.isArray(analytics.effortImpactMatrix)) {
          return <EffortImpactAnalysis data={analytics.effortImpactMatrix} />;
        } else {
          return (
            <div className="h-96 flex items-center justify-center text-foreground-muted">
              <p>No effort/impact data available</p>
            </div>
          );
        }
      default:
        return <div className="h-80 flex items-center justify-center text-foreground-muted">Select a chart type</div>;
    }
  };

  // Placeholder chart renderers (we'll replace these with actual charts)
  const renderVelocityPlaceholder = () => (
    <div className="h-64 flex flex-col items-center justify-center bg-background-elevated rounded-lg">
      <div className="w-48 h-24 bg-info-100 rounded mb-4 flex items-center justify-center">
        <span className="text-info font-semibold">Line Chart</span>
      </div>
      <p className="text-foreground-secondary">Feature Velocity</p>
      {analytics && (
        <p className="text-sm text-foreground-muted mt-2">
          {analytics.velocity?.weeklyData?.length || 0} weeks of data
        </p>
      )}
    </div>
  );

  const renderTimelinePlaceholder = () => (
    <div className="h-64 flex flex-col items-center justify-center bg-background-elevated rounded-lg">
      <div className="w-48 h-32 bg-success-100 rounded mb-4 flex items-center justify-center">
        <span className="text-success font-semibold">Stacked Bar</span>
      </div>
      <p className="text-foreground-secondary">Status Timeline</p>
      {analytics && (
        <p className="text-sm text-foreground-muted mt-2">
          {analytics.timelineAnalytics?.monthlyData?.length || 0} months of data
        </p>
      )}
    </div>
  );

  const renderPriorityImpactPlaceholder = () => (
    <div className="h-64 flex flex-col items-center justify-center bg-background-elevated rounded-lg">
      <div className="w-40 h-32 bg-accent-100 rounded mb-4 flex items-center justify-center">
        <span className="text-accent font-semibold">Matrix</span>
      </div>
      <p className="text-foreground-secondary">Priority vs Impact Matrix</p>
      {analytics && (
        <p className="text-sm text-foreground-muted mt-2">
          {analytics.overview?.totalFeatures || 0} features plotted
        </p>
      )}
    </div>
  );

  const renderEffortImpactPlaceholder = () => (
    <div className="h-64 flex flex-col items-center justify-center bg-background-elevated rounded-lg">
      <div className="w-40 h-32 bg-warning-100 rounded mb-4 flex items-center justify-center">
        <span className="text-warning font-semibold">Scatter Plot</span>
      </div>
      <p className="text-foreground-secondary">Effort vs Impact Analysis</p>
      {analytics && (
        <p className="text-sm text-foreground-muted mt-2">
          {analytics.effortImpactMatrix?.length || 0} features with effort/impact data
        </p>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Feature Flow & Progress Section */}
      <div className="border border-border rounded-lg">
        {/* Header with dropdown */}
        <div 
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-background-elevated"
          onClick={() => setFlowExpanded(!flowExpanded)}
        >
          <h3 className="text-lg font-semibold text-foreground">Feature Flow & Progress</h3>
          <div className="flex items-center space-x-3">
            <Select value={flowChartType} onValueChange={setFlowChartType}>
              <SelectTrigger className="w-64" onClick={(e) => e.stopPropagation()}>
                <SelectValue placeholder="Select chart type" />
              </SelectTrigger>
              <SelectContent>
                {flowChartOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {flowExpanded ? (
              <ChevronUp className="h-5 w-5 text-foreground-muted" />
            ) : (
              <ChevronDown className="h-5 w-5 text-foreground-muted" />
            )}
          </div>
        </div>

        {/* Chart Content */}
        {flowExpanded && (
          <div className="p-4 border-t border-border">
            {renderFlowChart()}
          </div>
        )}
      </div>

      {/* Priority & Impact Section */}
      <div className="border border-border rounded-lg">
        {/* Header with dropdown */}
        <div 
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-background-elevated"
          onClick={() => setImpactExpanded(!impactExpanded)}
        >
          <h3 className="text-lg font-semibold text-foreground">Priority & Impact</h3>
          <div className="flex items-center space-x-3">
            <Select value={impactChartType} onValueChange={setImpactChartType}>
              <SelectTrigger className="w-64" onClick={(e) => e.stopPropagation()}>
                <SelectValue placeholder="Select chart type" />
              </SelectTrigger>
              <SelectContent>
                {impactChartOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {impactExpanded ? (
              <ChevronUp className="h-5 w-5 text-foreground-muted" />
            ) : (
              <ChevronDown className="h-5 w-5 text-foreground-muted" />
            )}
          </div>
        </div>

        {/* Chart Content */}
        {impactExpanded && (
          <div className="p-4 border-t border-border">
            {renderImpactChart()}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsSection; 