import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const StatusTimelineChart = ({ data }) => {
  // Early return for safety
  if (!data) {
    return (
      <div className="h-80 flex items-center justify-center text-foreground-muted">
        <p>No timeline data provided</p>
      </div>
    );
  }

  if (!data.monthlyData || !Array.isArray(data.monthlyData)) {
    return (
      <div className="h-80 flex items-center justify-center text-foreground-muted">
        <p>Invalid timeline data format</p>
      </div>
    );
  }

  if (data.monthlyData.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-foreground-muted">
        <p>No timeline data available</p>
      </div>
    );
  }

  // Color scheme that matches the status distribution
  const COLORS = {
    backlog: '#6b7280',      // Gray for backlog
    in_progress: '#f59e0b',  // Amber for in progress  
    review: '#8b5cf6',       // Purple for review
    done: '#10b981'          // Green for done
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum, item) => sum + item.value, 0);
      return (
        <div className="bg-background-surface p-3 border border-border rounded-lg shadow-lg">
          <p className="font-medium text-foreground mb-2">{label}</p>
          <p className="text-sm text-foreground-secondary mb-1">Total: {total} features</p>
          {payload.map((item, index) => (
            <p key={index} className="text-sm" style={{ color: item.color }}>
              {item.name}: {item.value} feature{item.value !== 1 ? 's' : ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Custom legend formatter
  const formatLegendValue = (value) => {
    const statusLabels = {
      backlog: 'Backlog',
      in_progress: 'In Progress',
      review: 'Review',
      done: 'Done'
    };
    return statusLabels[value] || value;
  };

  try {
    return (
      <div className="h-80 p-4">
        <div className="mb-4">
          <h4 className="text-sm font-medium text-foreground-secondary">Feature Status Over Time</h4>
          <p className="text-xs text-foreground-muted">Monthly distribution of feature statuses</p>
        </div>
        <ResponsiveContainer width="100%" height="85%">
          <BarChart
            data={data.monthlyData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="monthLabel" 
              tick={{ fontSize: 12 }}
              tickLine={{ stroke: '#e0e0e0' }}
              axisLine={{ stroke: '#e0e0e0' }}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickLine={{ stroke: '#e0e0e0' }}
              axisLine={{ stroke: '#e0e0e0' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              formatter={formatLegendValue}
              wrapperStyle={{ fontSize: '12px' }}
            />
            <Bar 
              dataKey="backlog" 
              stackId="status" 
              fill={COLORS.backlog}
              name="backlog"
            />
            <Bar 
              dataKey="in_progress" 
              stackId="status" 
              fill={COLORS.in_progress}
              name="in_progress"
            />
            <Bar 
              dataKey="review" 
              stackId="status" 
              fill={COLORS.review}
              name="review"
            />
            <Bar 
              dataKey="done" 
              stackId="status" 
              fill={COLORS.done}
              name="done"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  } catch (error) {
    console.error('Error rendering StatusTimelineChart:', error);
    return (
      <div className="h-80 flex items-center justify-center text-foreground-muted">
        <p>Error rendering timeline chart</p>
      </div>
    );
  }
};

export default StatusTimelineChart; 