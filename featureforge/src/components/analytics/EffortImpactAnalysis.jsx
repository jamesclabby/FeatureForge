import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

const EffortImpactAnalysis = ({ data }) => {
  // Early return for safety
  if (!data) {
    return (
      <div className="h-96 flex items-center justify-center text-foreground-muted">
        <p>No effort/impact data provided</p>
      </div>
    );
  }

  if (!Array.isArray(data)) {
    return (
      <div className="h-96 flex items-center justify-center text-foreground-muted">
        <p>Invalid effort/impact data format</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center text-foreground-muted">
        <p>No effort/impact data available</p>
      </div>
    );
  }

  // Transform data for scatter plot
  const scatterData = data.map((item, index) => ({
    x: item.effort || 5,      // Effort (1-10 scale)
    y: item.impact || 5,      // Impact (1-10 scale)
    effort: item.effort,
    impact: item.impact,
    title: item.title,
    votes: item.votes || 0,
    status: item.status,
    priority: item.priority,
    score: parseFloat(item.score) || 0,
    size: Math.max((item.votes || 0) * 3 + 30, 30) // Size based on votes
  }));

  // Color scheme based on priority
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
        <div className="bg-background-surface p-3 border border-border rounded-lg shadow-lg max-w-xs">
          <p className="font-medium text-foreground truncate">{data.title}</p>
          <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
            <div>
              <span className="text-foreground-muted">Effort:</span> {data.effort}/10
            </div>
            <div>
              <span className="text-foreground-muted">Impact:</span> {data.impact}/10
            </div>
            <div>
              <span className="text-foreground-muted">Votes:</span> {data.votes}
            </div>
            <div>
              <span className="text-foreground-muted">Score:</span> {data.score}
            </div>
          </div>
          <p className="text-xs text-foreground-muted capitalize mt-1">
            Priority: {data.priority} • Status: {data.status?.replace('_', ' ')}
          </p>
        </div>
      );
    }
    return null;
  };

  // Calculate quadrant labels positions
  const getQuadrantColor = (effort, impact) => {
    if (effort <= 5 && impact > 5) return '#10b981'; // Low effort, high impact (Quick wins) - Green
    if (effort > 5 && impact > 5) return '#3b82f6';  // High effort, high impact (Major projects) - Blue
    if (effort <= 5 && impact <= 5) return '#6b7280'; // Low effort, low impact (Fill-ins) - Gray
    return '#f59e0b'; // High effort, low impact (Questionable) - Amber
  };

  try {
    return (
      <div className="h-96 p-4">
        <div className="mb-4">
          <h4 className="text-sm font-medium text-foreground-secondary">Effort vs Impact Analysis</h4>
          <p className="text-xs text-foreground-muted">Features plotted by development effort and business impact</p>
        </div>
        <ResponsiveContainer width="100%" height="75%">
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
            
            {/* Reference lines to create quadrants */}
            <ReferenceLine x={5.5} stroke="#e0e0e0" strokeDasharray="2 2" />
            <ReferenceLine y={5.5} stroke="#e0e0e0" strokeDasharray="2 2" />
            
            <XAxis 
              type="number"
              dataKey="x"
              domain={[1, 10]}
              tick={{ fontSize: 12 }}
              tickLine={{ stroke: '#e0e0e0' }}
              axisLine={{ stroke: '#e0e0e0' }}
              label={{ value: 'Effort (Development Complexity)', position: 'insideBottom', offset: -10, style: { textAnchor: 'middle', fontSize: '12px' } }}
            />
            <YAxis 
              type="number"
              dataKey="y"
              domain={[1, 10]}
              tick={{ fontSize: 12 }}
              tickLine={{ stroke: '#e0e0e0' }}
              axisLine={{ stroke: '#e0e0e0' }}
              label={{ value: 'Impact (Business Value)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: '12px' } }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Scatter dataKey="y" fill="#8884d8">
              {scatterData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={getQuadrantColor(entry.x, entry.y)}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
        
        {/* Quadrant Legend */}
        <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded-full bg-success"></div>
            <span className="text-foreground-secondary">Quick Wins (Low Effort, High Impact)</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded-full bg-info"></div>
            <span className="text-foreground-secondary">Major Projects (High Effort, High Impact)</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded-full bg-foreground-muted"></div>
            <span className="text-foreground-secondary">Fill-ins (Low Effort, Low Impact)</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded-full bg-warning"></div>
            <span className="text-foreground-secondary">Questionable (High Effort, Low Impact)</span>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error rendering EffortImpactAnalysis:', error);
    return (
      <div className="h-96 flex items-center justify-center text-foreground-muted">
        <p>Error rendering effort/impact analysis</p>
      </div>
    );
  }
};

export default EffortImpactAnalysis; 