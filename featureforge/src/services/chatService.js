import api from './api';

/**
 * Chat Service - Handles AI chat functionality
 */
class ChatService {
  constructor() {
    this.baseURL = '/api/chat';
  }

  /**
   * Send a message to the AI
   * @param {string} message - The message to send
   * @param {string} teamId - The current team ID
   * @param {Array} conversationHistory - Previous messages in the conversation
   * @returns {Promise<Object>} AI response
   */
  async sendMessage(message, teamId, conversationHistory = []) {
    try {
      const authToken = await this.getAuthToken();
      
      const response = await fetch('http://localhost:5002/api/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          message,
          teamId,
          conversationHistory
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data; // Extract the data field from the response
    } catch (error) {
      console.error('Chat message error:', error);
      throw new Error('Failed to send message');
    }
  }

  /**
   * Send a message to the public AI endpoint (for testing)
   * @param {string} message - The message to send
   * @param {string} teamName - The team name
   * @param {string} userRole - The user role
   * @returns {Promise<Object>} AI response
   */
  async sendPublicMessage(message, teamName = 'Test Team', userRole = 'member') {
    try {
      const response = await fetch('http://localhost:5002/api/chat/message-public', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message,
          teamName,
          userRole
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data; // Extract the data field from the response
    } catch (error) {
      console.error('Public chat message error:', error);
      throw new Error('Failed to send message');
    }
  }

  /**
   * Analyze message intent
   * @param {string} message - The message to analyze
   * @returns {Promise<Object>} Intent analysis
   */
  async analyzeIntent(message) {
    try {
      const response = await api.post(`${this.baseURL}/intent`, {
        message
      });
      return response.data;
    } catch (error) {
      console.error('Intent analysis error:', error);
      throw new Error(error.response?.data?.error || 'Failed to analyze intent');
    }
  }

  /**
   * Get contextual suggestions
   * @param {string} page - Current page context
   * @param {string} teamId - Current team ID
   * @returns {Promise<Array>} Suggestions array
   */
  async getSuggestions(page = 'default', teamId = null) {
    try {
      const params = new URLSearchParams({ page });
      if (teamId) params.append('teamId', teamId);
      
      // Use direct fetch to avoid double /api/ issue
      const response = await fetch(`http://localhost:5002/api/chat/suggestions?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.data?.suggestions || data.suggestions;
    } catch (error) {
      console.error('Suggestions error:', error);
      // Return fallback suggestions if API fails
      return this.getFallbackSuggestions(page);
    }
  }

  /**
   * Get authentication token for API calls
   * @returns {Promise<string|null>} Auth token
   */
  async getAuthToken() {
    try {
      // Import Firebase auth dynamically to avoid circular dependency
      const { auth } = await import('./firebase');
      const user = auth.currentUser;
      if (user) {
        return await user.getIdToken();
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return null;
  }

  /**
   * Check AI service health
   * @returns {Promise<Object>} Health status
   */
  async checkHealth() {
    try {
      const response = await fetch('http://localhost:5002/api/chat/health-public');
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Health check error:', error);
      throw new Error('AI service unavailable');
    }
  }

  /**
   * Get fallback suggestions when API is unavailable
   * @param {string} page - Current page context
   * @returns {Array} Fallback suggestions
   */
  getFallbackSuggestions(page) {
    const suggestions = {
      dashboard: [
        "What's our team's current velocity?",
        'Show me high priority features',
        'Any features need attention?',
        'Help me create a new feature'
      ],
      features: [
        'Create a new feature',
        'Show features assigned to me',
        'List all in-progress features',
        'What features are overdue?'
      ],
      analytics: [
        'Explain our team performance',
        'What trends do you see?',
        'Which features should we prioritize?',
        'How is our completion rate?'
      ],
      default: [
        'What can you help me with?',
        'Tell me about our team',
        'Show me team statistics',
        'Help me manage features'
      ]
    };

    return suggestions[page] || suggestions.default;
  }

  /**
   * Format message for display
   * @param {string} message - Raw message text
   * @returns {string} Formatted message
   */
  formatMessage(message) {
    // Basic formatting for markdown-like text
    return message
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
      .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
      .replace(/•/g, '•') // Bullet points
      .replace(/\n/g, '<br>'); // Line breaks
  }

  /**
   * Get current page context for suggestions
   * @returns {string} Page context
   */
  getCurrentPageContext() {
    const path = window.location.pathname;
    
    if (path.includes('/dashboard') || path.includes('/team-dashboard')) {
      return 'dashboard';
    } else if (path.includes('/features')) {
      return 'features';
    } else if (path.includes('/analytics')) {
      return 'analytics';
    }
    
    return 'default';
  }

  /**
   * Execute an AI-suggested action
   * @param {string} action - The action to execute
   * @param {Object} parameters - Action parameters
   * @returns {Promise<Object>} Action result
   */
  async executeAction(action, parameters) {
    try {
      const authToken = await this.getAuthToken();
      
      const response = await fetch('http://localhost:5002/api/chat/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          action,
          parameters
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Action execution error:', error);
      throw new Error('Failed to execute action');
    }
  }
}

// Export singleton instance
const chatService = new ChatService();
export default chatService; 