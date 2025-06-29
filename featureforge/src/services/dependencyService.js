import apiService from './api';

class DependencyService {
  /**
   * Get all dependency types
   */
  async getDependencyTypes() {
    try {
      const response = await apiService.get('/features/dependencies/types');
      return response.data || response;
    } catch (error) {
      console.error('Error fetching dependency types:', error);
      throw error;
    }
  }

  /**
   * Get dependencies for a specific feature
   */
  async getFeatureDependencies(featureId) {
    try {
      const response = await apiService.get(`/features/${featureId}/dependencies`);
      return response.data || response;
    } catch (error) {
      console.error('Error fetching feature dependencies:', error);
      throw error;
    }
  }

  /**
   * Create a new dependency
   */
  async createDependency(featureId, dependencyData) {
    try {
      const response = await apiService.post(`/features/${featureId}/dependencies`, dependencyData);
      return response.data || response;
    } catch (error) {
      console.error('Error creating dependency:', error);
      throw error;
    }
  }

  /**
   * Delete a dependency
   */
  async deleteDependency(featureId, dependencyId) {
    try {
      const response = await apiService.delete(`/features/${featureId}/dependencies/${dependencyId}`);
      return response.data || response;
    } catch (error) {
      console.error('Error deleting dependency:', error);
      throw error;
    }
  }

  /**
   * Get all dependencies for a team
   */
  async getTeamDependencies(teamId) {
    try {
      const response = await apiService.get(`/teams/${teamId}/dependencies`);
      return response.data || response;
    } catch (error) {
      console.error('Error fetching team dependencies:', error);
      throw error;
    }
  }

  /**
   * Search features within a team (for dependency selection)
   */
  async searchTeamFeatures(teamId, searchTerm = '') {
    try {
      const response = await apiService.get(`/teams/${teamId}/features`, {
        params: {
          search: searchTerm,
          limit: 20 // Limit results for performance
        }
      });
      return response.data || response;
    } catch (error) {
      console.error('Error searching team features:', error);
      throw error;
    }
  }
}

export default new DependencyService(); 