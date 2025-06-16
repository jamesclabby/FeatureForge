import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const FeatureVelocityChart = ({ data }) => {
  // Early return for safety
  if (!data) {
    return (
      <div className="h-80 flex items-center justify-center text-gray-500">
        <p>No velocity data provided</p>
      </div>
    );
  }

  if (!data.weeklyData || !Array.isArray(data.weeklyData)) {
    return (
      <div className="h-80 flex items-center justify-center text-gray-500">
        <p>Invalid velocity data format</p>
      </div>
    );
  }

  if (data.weeklyData.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-gray-500">
        <p>No velocity data available</p>
      </div>
    );
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.weekLabel}</p>
          <p className="text-sm text-green-600">
            {data.completed} feature{data.completed !== 1 ? 's' : ''} completed
          </p>
          {data.created > 0 && (
            <p className="text-sm text-blue-600">
              {data.created} feature{data.created !== 1 ? 's' : ''} created
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  try {
    return (
      <div className="h-80 p-4">
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700">Weekly Feature Completion</h4>
            <div className="text-sm text-gray-500">
              Avg: {data.averagePerWeek} features/week
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height="85%">
          <LineChart
            data={data.weeklyData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="weekLabel" 
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
            <Line 
              type="monotone" 
              dataKey="completed" 
              stroke="#10b981" 
              strokeWidth={3}
              dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  } catch (error) {
    console.error('Error rendering FeatureVelocityChart:', error);
    return (
      <div className="h-80 flex items-center justify-center text-gray-500">
        <p>Error rendering velocity chart</p>
      </div>
    );
  }
};

export default FeatureVelocityChart; 