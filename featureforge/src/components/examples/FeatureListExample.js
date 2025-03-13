import React, { useState, useEffect } from 'react';
import { featureService } from '../../services';

/**
 * Example component that demonstrates how to use the feature service
 * This is just for demonstration purposes and not meant to be used in production
 */
const FeatureListExample = () => {
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch features when component mounts
    const fetchFeatures = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Call the feature service to get all features
        const data = await featureService.getAllFeatures();
        setFeatures(data.data || []);
      } catch (err) {
        console.error('Error fetching features:', err);
        setError(err.message || 'Failed to fetch features');
      } finally {
        setLoading(false);
      }
    };

    fetchFeatures();
  }, []);

  // Function to vote for a feature
  const handleVote = async (id) => {
    try {
      // Call the feature service to vote for a feature
      const updatedFeature = await featureService.voteForFeature(id);
      
      // Update the features list with the updated feature
      setFeatures(features.map(feature => 
        feature.id === id ? updatedFeature : feature
      ));
    } catch (err) {
      console.error('Error voting for feature:', err);
      // You could set an error state here to display to the user
    }
  };

  if (loading) {
    return <div className="p-4">Loading features...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>;
  }

  if (features.length === 0) {
    return <div className="p-4">No features found.</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Features</h2>
      <ul className="space-y-4">
        {features.map(feature => (
          <li key={feature.id} className="border p-4 rounded-md">
            <h3 className="font-semibold">{feature.title}</h3>
            <p className="text-gray-600">{feature.description}</p>
            <div className="mt-2 flex items-center">
              <span className="mr-2">Votes: {feature.votes}</span>
              <button
                onClick={() => handleVote(feature.id)}
                className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm"
              >
                Vote
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FeatureListExample; 