import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const StatusDistributionChart = ({ data }) => {
  // Early return for safety
  if (!data) {
    return (
      <div className="h-80 flex items-center justify-center text-gray-500">
        <p>No data provided</p>
      </div>
    );
  }

  if (!Array.isArray(data)) {
    return (
      <div className="h-80 flex items-center justify-center text-gray-500">
        <p>Invalid data format</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-gray-500">
        <p>No status data available</p>
      </div>
    );
  }

  // Color scheme that matches your app's design
  const COLORS = {
    'backlog': '#6b7280',      // Gray for backlog
    'in_progress': '#f59e0b',  // Amber for in progress  
    'review': '#8b5cf6',       // Purple for review
    'done': '#10b981'          // Green for done
  };

  // Transform the data for Recharts with safety checks
  const chartData = data
    .filter(item => item && typeof item === 'object')
    .map(item => ({
      name: item.name || 'Unknown',
      value: parseInt(item.count) || 0,
      percentage: parseFloat(item.percentage) || 0,
      status: item.status || 'unknown'
    }))
    .filter(item => item.value > 0); // Only show statuses that have features

  if (chartData.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-gray-500">
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
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">
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
      <div className="h-80 flex items-center justify-center text-gray-500">
        <p>Error rendering chart</p>
      </div>
    );
  }
};

export default StatusDistributionChart; 