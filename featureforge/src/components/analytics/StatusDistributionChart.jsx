import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const StatusDistributionChart = ({ data, title = "Status Distribution" }) => {
  // Early return for safety
  if (!data) {
    return (
      <div className="h-80 flex items-center justify-center text-foreground-muted">
        <p>No data provided</p>
      </div>
    );
  }

  if (!Array.isArray(data)) {
    return (
      <div className="h-80 flex items-center justify-center text-foreground-muted">
        <p>Invalid data format</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-foreground-muted">
        <p>No data available</p>
      </div>
    );
  }

  // Color scheme that matches your app's design
  const STATUS_COLORS = {
    'backlog': '#6b7280',      // Gray for backlog
    'in_progress': '#f59e0b',  // Amber for in progress  
    'review': '#8b5cf6',       // Purple for review
    'done': '#10b981'          // Green for done
  };

  const TYPE_COLORS = {
    'parent': '#8b5cf6',       // Purple for parent
    'story': '#3b82f6',        // Blue for story
    'task': '#10b981',         // Green for task
    'research': '#f59e0b'      // Orange for research
  };

  // Determine if this is status or type data based on the data structure
  const isTypeData = data.some(item => item.type && ['parent', 'story', 'task', 'research'].includes(item.type));
  const COLORS = isTypeData ? TYPE_COLORS : STATUS_COLORS;

  // Transform the data for Recharts with safety checks
  const chartData = data
    .filter(item => item && typeof item === 'object')
    .map(item => ({
      name: item.name || 'Unknown',
      value: parseInt(item.count) || 0,
      percentage: parseFloat(item.percentage) || 0,
      status: item.status || item.type || 'unknown'
    }))
    .filter(item => item.value > 0); // Only show items that have features

  if (chartData.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-foreground-muted">
        <p>No features found</p>
      </div>
    );
  }

  // Custom label function to show percentages
  const renderLabel = ({ percentage }) => {
    return `${percentage}%`;
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background-surface p-3 border border-border rounded-lg shadow-lg">
          <p className="font-medium text-foreground">{data.name}</p>
          <p className="text-sm text-foreground-secondary">
            {data.value} feature{data.value !== 1 ? 's' : ''} ({data.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  try {
    return (
      <div className="h-80 p-4">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="45%"
              labelLine={false}
              label={renderLabel}
              outerRadius={70}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[entry.status] || '#6b7280'} 
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="bottom" 
              height={40}
              formatter={(value, entry) => (
                <span style={{ color: entry.color }}>
                  {value} ({entry.payload.value})
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  } catch (error) {
    console.error('Error rendering StatusDistributionChart:', error);
    return (
      <div className="h-80 flex items-center justify-center text-foreground-muted">
        <p>Error rendering chart</p>
      </div>
    );
  }
};

export default StatusDistributionChart; 