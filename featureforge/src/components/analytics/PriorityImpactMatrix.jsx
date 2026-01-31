import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const PriorityImpactMatrix = ({ data }) => {
  // Early return for safety
  if (!data) {
    return (
      <div className="h-80 flex items-center justify-center text-foreground-muted">
        <p>No priority analysis data provided</p>
      </div>
    );
  }

  if (!Array.isArray(data)) {
    return (
      <div className="h-80 flex items-center justify-center text-foreground-muted">
        <p>Invalid priority analysis data format</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-foreground-muted">
        <p>No priority analysis data available</p>
      </div>
    );
  }

  // Transform data for scatter plot
  // Priority: low=1, medium=2, high=3, critical=4
  // Impact: 1-10 scale (assuming this is how it's stored)
  const priorityValues = {
    'low': 1,
    'medium': 2, 
    'high': 3,
    'critical': 4
  };

  const scatterData = data.map((item, index) => ({
    x: priorityValues[item.priority] || 2, // Default to medium if unknown
    y: item.count || 0,
    priority: item.priority,
    name: item.name,
    count: item.count,
    percentage: item.percentage,
    size: Math.max(item.count * 20, 50) // Size based on count, minimum 50
  }));

  // Color scheme for priorities
  const PRIORITY_COLORS = {
    'low': '#6b7280',       // Gray
    'medium': '#3b82f6',    // Blue  
    'high': '#f59e0b',      // Amber
    'critical': '#ef4444'   // Red
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background-surface p-3 border border-border rounded-lg shadow-lg">
          <p className="font-medium text-foreground">{data.name}</p>
          <p className="text-sm text-foreground-secondary">
            {data.count} feature{data.count !== 1 ? 's' : ''} ({data.percentage}%)
          </p>
          <p className="text-xs text-foreground-muted capitalize">
            Priority: {data.priority}
          </p>
        </div>
      );
    }
    return null;
  };

  try {
    return (
      <div className="h-80 p-4">
        <div className="mb-4">
          <h4 className="text-sm font-medium text-foreground-secondary">Priority Distribution</h4>
          <p className="text-xs text-foreground-muted">Features grouped by priority level</p>
        </div>
        <ResponsiveContainer width="100%" height="85%">
          <ScatterChart
            margin={{
              top: 20,
              right: 30,
              bottom: 40,
              left: 40,
            }}
            data={scatterData}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              type="number"
              dataKey="x"
              domain={[0.5, 4.5]}
              tick={{ fontSize: 12 }}
              tickLine={{ stroke: '#e0e0e0' }}
              axisLine={{ stroke: '#e0e0e0' }}
              tickFormatter={(value) => {
                const labels = { 1: 'Low', 2: 'Medium', 3: 'High', 4: 'Critical' };
                return labels[value] || '';
              }}
            />
            <YAxis 
              type="number"
              dataKey="y"
              tick={{ fontSize: 12 }}
              tickLine={{ stroke: '#e0e0e0' }}
              axisLine={{ stroke: '#e0e0e0' }}
              label={{ value: 'Feature Count', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: '12px' } }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Scatter dataKey="y" fill="#8884d8">
              {scatterData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={PRIORITY_COLORS[entry.priority] || '#6b7280'} 
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
        
        {/* Legend */}
        <div className="flex justify-center space-x-4 mt-2">
          {Object.entries(PRIORITY_COLORS).map(([priority, color]) => (
            <div key={priority} className="flex items-center space-x-1">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: color }}
              ></div>
              <span className="text-xs text-foreground-secondary capitalize">{priority}</span>
            </div>
          ))}
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error rendering PriorityImpactMatrix:', error);
    return (
      <div className="h-80 flex items-center justify-center text-foreground-muted">
        <p>Error rendering priority matrix</p>
      </div>
    );
  }
};

export default PriorityImpactMatrix; 