const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');

/**
 * AI Service - Handles all AI provider integrations
 * Supports: Mock (free), OpenAI, Anthropic, Ollama
 */
class AIService {
  constructor() {
    this.provider = process.env.AI_PROVIDER || 'mock';
    this.maxTokens = parseInt(process.env.AI_MAX_TOKENS) || 1000;
    this.mockEnabled = process.env.AI_MOCK_ENABLED === 'true';
    
    // Initialize providers based on configuration
    this.initializeProviders();
    
    console.log(`AI Service initialized with provider: ${this.provider}`);
  }

  initializeProviders() {
    try {
      // OpenAI initialization
      if (this.provider === 'openai' && process.env.OPENAI_API_KEY) {
        this.openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY
        });
        this.model = process.env.AI_MODEL || 'gpt-3.5-turbo';
      }

      // Anthropic initialization
      if (this.provider === 'anthropic' && process.env.ANTHROPIC_API_KEY) {
        this.anthropic = new Anthropic({
          apiKey: process.env.ANTHROPIC_API_KEY
        });
        this.model = process.env.AI_MODEL || 'claude-3-haiku-20240307';
      }

      // Ollama initialization
      if (this.provider === 'ollama') {
        this.ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
        this.model = process.env.OLLAMA_MODEL || 'llama2';
      }
    } catch (error) {
      console.error('Error initializing AI providers:', error);
      // Fallback to mock if initialization fails
      this.provider = 'mock';
      this.mockEnabled = true;
    }
  }

  /**
   * Main chat method - routes to appropriate provider
   */
  async chat(message, context = {}) {
    try {
      console.log(`Processing chat message with ${this.provider} provider`);
      
      // Analyze message for potential actions
      const actionAnalysis = this.analyzeForActions(message, context);
      
      let response;
      switch (this.provider) {
        case 'mock':
          response = await this.mockChat(message, context);
          break;
        case 'openai':
          response = await this.openaiChat(message, context);
          break;
        case 'anthropic':
          response = await this.anthropicChat(message, context);
          break;
        case 'ollama':
          response = await this.ollamaChat(message, context);
          break;
        default:
          throw new Error(`Unsupported AI provider: ${this.provider}`);
      }

      // If action was detected, return structured response
      if (actionAnalysis.hasAction) {
        return {
          message: response,
          action: actionAnalysis.action,
          parameters: actionAnalysis.parameters,
          requiresConfirmation: actionAnalysis.requiresConfirmation
        };
      }

      return response;
    } catch (error) {
      console.error('AI Service Error:', error);
      return this.getFallbackResponse(message, error);
    }
  }

  /**
   * Mock AI implementation with intelligent responses based on team data
   */
  async mockChat(message, context) {
    console.log('Processing chat message with mock provider');
    
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
    
    const lowerMessage = message.toLowerCase();
    
    // Safely extract context data with defaults
    const teamName = context.teamName || 'your team';
    const userRole = context.userRole || 'member';
    const features = context.features || {
      total: 0,
      byStatus: {},
      byPriority: {},
      recent: [],
      overdue: [],
      assigned: []
    };
    const analytics = context.analytics || {
      velocity: 0,
      completionRate: 0,
      averageEffort: 0
    };
    const members = context.members || [];
    const recentActivity = context.recentActivity || [];
    
    // Greeting responses
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return `Hello! I'm your AI assistant for ${teamName}. As a ${userRole}, you have access to ${features.total} features and ${members.length} team members. How can I help you today?`;
    }
    
    // Feature queries
    if (lowerMessage.includes('feature') || lowerMessage.includes('show') || lowerMessage.includes('list')) {
      if (lowerMessage.includes('high priority') || lowerMessage.includes('urgent')) {
        const urgentCount = features.byPriority?.urgent || 0;
        const highCount = features.byPriority?.high || 0;
        return `You have ${urgentCount} urgent and ${highCount} high priority features. ${urgentCount + highCount > 0 ? 'These need immediate attention!' : 'Great job staying on top of priorities!'}`;
      }
      
      if (lowerMessage.includes('overdue')) {
        return features.overdue?.length > 0 
          ? `You have ${features.overdue.length} overdue features: ${features.overdue.slice(0, 3).map(f => f.title).join(', ')}${features.overdue.length > 3 ? '...' : ''}`
          : 'Great news! No features are currently overdue.';
      }
      
      if (lowerMessage.includes('assigned to me') || lowerMessage.includes('my features')) {
        return features.assigned?.length > 0
          ? `You have ${features.assigned.length} features assigned to you: ${features.assigned.slice(0, 3).map(f => f.title).join(', ')}${features.assigned.length > 3 ? '...' : ''}`
          : 'You currently have no features assigned to you.';
      }
      
      if (lowerMessage.includes('in progress') || lowerMessage.includes('in-progress')) {
        const inProgressCount = features.byStatus?.in_progress || 0;
        return `There are ${inProgressCount} features currently in progress. ${inProgressCount > 0 ? 'Keep up the momentum!' : 'Time to move some features to in-progress!'}`;
      }
      
      // Recent features
      if (features.recent?.length > 0) {
        const recentFeature = features.recent[0];
        return `Here are your recent features. Latest: "${recentFeature.title}" (${recentFeature.priority} priority, ${recentFeature.status}). You have ${features.total} total features.`;
      }
      
      return `Your team has ${features.total} features total. Status breakdown: ${Object.entries(features.byStatus).map(([status, count]) => `${count} ${status}`).join(', ')}.`;
    }
    
    // Team statistics and analytics
    if (lowerMessage.includes('velocity') || lowerMessage.includes('performance') || lowerMessage.includes('stats') || lowerMessage.includes('analytics')) {
      return `📊 Team Analytics for ${teamName}:
• Velocity: ${analytics.velocity} features completed in last 30 days
• Completion Rate: ${analytics.completionRate}%
• Average Effort: ${analytics.averageEffort} story points
• Team Members: ${members.length}
• Total Features: ${features.total}
${analytics.velocity > 5 ? '🚀 Great velocity!' : analytics.velocity > 2 ? '📈 Good progress!' : '💪 Room for improvement!'}`;
    }
    
    // Team member queries
    if (lowerMessage.includes('team') || lowerMessage.includes('member')) {
      const adminCount = members.filter(m => m.role === 'admin').length;
      const memberCount = members.filter(m => m.role === 'member').length;
      return `${teamName} has ${members.length} members: ${adminCount} admins and ${memberCount} members. Recent activity: ${recentActivity.length} recent events.`;
    }
    
    // Feature creation help
    if (lowerMessage.includes('create') || lowerMessage.includes('new feature') || lowerMessage.includes('add feature')) {
      return `I can help you create a new feature! Here's what you'll need:
• Title and description
• Priority level (current breakdown: ${Object.entries(features.byPriority).map(([p, c]) => `${c} ${p}`).join(', ')})
• Estimated effort
• Due date (optional)
Would you like me to guide you through the process?`;
    }
    
    // Status updates
    if (lowerMessage.includes('update') || lowerMessage.includes('change status')) {
      return `I can help you update feature status. Current status distribution: ${Object.entries(features.byStatus).map(([status, count]) => `${count} ${status.replace('_', ' ')}`).join(', ')}. Which feature would you like to update?`;
    }
    
    // Recent activity
    if (lowerMessage.includes('recent') || lowerMessage.includes('activity') || lowerMessage.includes('what happened')) {
      if (recentActivity.length > 0) {
        const activities = recentActivity.slice(0, 3).map(a => a.description).join('\n• ');
        return `Recent activity in ${teamName}:\n• ${activities}`;
      }
      return `No recent activity to report for ${teamName}.`;
    }
    
    // Help responses
    if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
      return `🤖 **I can help you with:**

📋 **Feature Management**
• "Show me high priority features" 
• "List overdue features"
• "What features are assigned to me?"
• "Create a new feature"

📊 **Team Analytics**
• "What's our velocity?"
• "Show team performance"
• "Team statistics"

👥 **Team Information**  
• "Who's on the team?"
• "Recent activity"
• "Team overview"

Current context: ${features.total} features, ${members.length} members, ${analytics.completionRate}% completion rate.`;
    }
    
    // Priority-based responses
    if (lowerMessage.includes('priority') || lowerMessage.includes('important')) {
      const urgent = features.byPriority?.urgent || 0;
      const high = features.byPriority?.high || 0;
      return `Priority breakdown: ${urgent} urgent, ${high} high, ${features.byPriority?.medium || 0} medium, ${features.byPriority?.low || 0} low priority features. ${urgent > 0 ? '⚠️ Focus on urgent items first!' : '✅ No urgent items!'}`;
    }
    
    // Completion and progress
    if (lowerMessage.includes('complete') || lowerMessage.includes('done') || lowerMessage.includes('finish')) {
      const completed = features.byStatus?.done || 0;
      const inProgress = features.byStatus?.in_progress || 0;
      return `You have ${completed} completed features and ${inProgress} in progress. Completion rate: ${analytics.completionRate}%. ${analytics.completionRate > 70 ? '🎉 Excellent progress!' : 'Keep pushing forward!'}`;
    }
    
    // Default intelligent response with context
    const contextualResponses = [
      `As a ${userRole} on ${teamName}, I can help you manage your ${features.total} features more effectively. What specific task are you working on?`,
      `I see you're working with ${teamName} (${members.length} members, ${features.total} features). How can I assist with your feature management today?`,
      `With ${analytics.completionRate}% completion rate and ${analytics.velocity} features completed recently, ${teamName} is making progress! What would you like to focus on?`,
      `I'm here to help with ${teamName}'s feature management. You have ${features.assigned?.length || 0} features assigned to you. What do you need help with?`
    ];
    
    return contextualResponses[Math.floor(Math.random() * contextualResponses.length)];
  }

  /**
   * OpenAI implementation
   */
  async openaiChat(message, context) {
    if (!this.openai) {
      throw new Error('OpenAI not properly initialized');
    }

    const systemPrompt = this.buildSystemPrompt(context);
    
    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      max_tokens: this.maxTokens,
      temperature: 0.7
    });

    return response.choices[0].message.content;
  }

  /**
   * Anthropic Claude implementation
   */
  async anthropicChat(message, context) {
    if (!this.anthropic) {
      throw new Error('Anthropic not properly initialized');
    }

    const systemPrompt = this.buildSystemPrompt(context);
    
    const response = await this.anthropic.messages.create({
      model: this.model,
      max_tokens: this.maxTokens,
      system: systemPrompt,
      messages: [
        { role: 'user', content: message }
      ]
    });

    return response.content[0].text;
  }

  /**
   * Ollama local AI implementation
   */
  async ollamaChat(message, context) {
    const systemPrompt = this.buildSystemPrompt(context);
    const fullPrompt = `${systemPrompt}\n\nUser: ${message}\nAssistant:`;

    const response = await fetch(`${this.ollamaBaseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        prompt: fullPrompt,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.response;
  }

  /**
   * Build system prompt with comprehensive context
   */
  buildSystemPrompt(context) {
    // Safely extract context data with defaults
    const teamName = context.teamName || 'Unknown';
    const userRole = context.userRole || 'team member';
    const teamData = context.teamData || {};
    const features = context.features || {
      total: 0,
      byStatus: {},
      byPriority: {},
      recent: [],
      overdue: [],
      assigned: []
    };
    const analytics = context.analytics || {
      velocity: 0,
      completionRate: 0,
      averageEffort: 0
    };
    const members = context.members || [];
    const recentActivity = context.recentActivity || [];
    
    const teamInfo = teamName !== 'Unknown' ? `for the "${teamName}" team` : '';
    const roleInfo = userRole ? `The user is a ${userRole}.` : '';
    
    // Build detailed context
    let contextDetails = `Current team context:
- Team: ${teamName} (${members.length} members)
- User Role: ${userRole}
- Total Features: ${features.total}
- Feature Status: ${Object.entries(features.byStatus).map(([s, c]) => `${c} ${s}`).join(', ') || 'none'}
- Priority Distribution: ${Object.entries(features.byPriority).map(([p, c]) => `${c} ${p}`).join(', ') || 'none'}
- Completion Rate: ${analytics.completionRate}%
- Team Velocity: ${analytics.velocity} features/month
- Overdue Features: ${features.overdue?.length || 0}
- Recent Activity: ${recentActivity.length} events`;

    if (features.assigned?.length > 0) {
      contextDetails += `\n- User's Assigned Features: ${features.assigned.length}`;
    }
    
    return `You are a helpful AI assistant for FeatureForge, a feature management application ${teamInfo}. 
    
${roleInfo}

You help users:
- Create, update, and manage feature requests
- Analyze team performance and feature metrics  
- Search and filter features by status, priority, assignee
- Understand feature priorities and deadlines
- Get insights about team velocity and trends
- Track overdue features and assignments
- Provide team analytics and completion rates

${contextDetails}

Be helpful, concise, and focus on actionable feature management tasks. Use the rich team data to provide specific, relevant responses. If you need more information to help, ask specific questions about features, team members, or priorities.`;
  }

  /**
   * Fallback response for errors
   */
  getFallbackResponse(message, error) {
    console.error('AI Service fallback triggered:', error.message);
    
    return `I apologize, but I'm having trouble processing your request right now. 

Here are some things you can try:
• Ask me to show team features
• Request help with creating a new feature  
• Ask for team statistics
• Type "help" for more options

Error details: ${error.message}`;
  }

  /**
   * Analyze user intent (for routing different types of requests)
   */
  async analyzeIntent(message) {
    const lowerMessage = message.toLowerCase();
    
    // Intent patterns
    const intents = {
      'create-feature': ['create', 'add feature', 'new feature', 'make a feature'],
      'query-features': ['show', 'list', 'find features', 'search features', 'get features'],
      'update-feature': ['update', 'change', 'modify', 'edit feature'],
      'get-stats': ['stats', 'analytics', 'metrics', 'performance', 'velocity'],
      'help': ['help', 'what can you do', 'how to', 'commands'],
      'general': []
    };

    for (const [intent, patterns] of Object.entries(intents)) {
      if (patterns.some(pattern => lowerMessage.includes(pattern))) {
        return {
          intent,
          confidence: 0.8,
          message
        };
      }
    }

    return {
      intent: 'general',
      confidence: 0.5,
      message
    };
  }

  /**
   * Health check for AI service
   */
  async healthCheck() {
    try {
      const testResponse = await this.chat('Hello', { teamName: 'Test Team' });
      return {
        status: 'healthy',
        provider: this.provider,
        model: this.model,
        testResponse: testResponse.substring(0, 50) + '...'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        provider: this.provider,
        error: error.message
      };
    }
  }

  /**
   * Analyze message for actionable requests
   */
  analyzeForActions(message, context) {
    const lowerMessage = message.toLowerCase();
    const result = {
      hasAction: false,
      action: null,
      parameters: {},
      requiresConfirmation: true
    };

    // Feature creation patterns
    const createPatterns = [
      'create feature',
      'add feature',
      'new feature',
      'make a feature',
      'add a new feature',
      'create a new feature'
    ];

    // Feature update patterns
    const updatePatterns = [
      'update feature',
      'change feature',
      'modify feature',
      'edit feature',
      'set feature status',
      'mark feature as',
      'move feature to'
    ];

    if (createPatterns.some(pattern => lowerMessage.includes(pattern))) {
      result.hasAction = true;
      result.action = 'create_feature';
      result.parameters = this.extractFeatureCreationParams(message, context);
    } else if (updatePatterns.some(pattern => lowerMessage.includes(pattern))) {
      result.hasAction = true;
      result.action = 'update_feature';
      result.parameters = this.extractFeatureUpdateParams(message, context);
    }

    return result;
  }

  /**
   * Extract parameters for feature creation
   */
  extractFeatureCreationParams(message, context) {
    const params = {
      teamId: context.teamId
    };

    // Extract title (look for quotes or "called" patterns)
    const titleMatch = message.match(/(?:title|name|called)\s+["']([^"']+)["']/i) ||
                      message.match(/["']([^"']+)["']/);
    if (titleMatch) {
      params.title = titleMatch[1];
    }

    // Extract description
    const descMatch = message.match(/description\s+["']([^"']+)["']/i);
    if (descMatch) {
      params.description = descMatch[1];
    }

    // Extract priority - updated to match database enum values
    const priorityMatch = message.match(/priority\s+(high|medium|low|urgent|critical)/i);
    if (priorityMatch) {
      // Map 'urgent' to 'critical' to match database enum
      const priority = priorityMatch[1].toLowerCase();
      params.priority = priority === 'urgent' ? 'critical' : priority;
    }

    // Extract effort
    const effortMatch = message.match(/effort\s+(\d+)/i);
    if (effortMatch) {
      params.estimatedEffort = parseInt(effortMatch[1]);
    }

    return params;
  }

  /**
   * Extract parameters for feature updates
   */
  extractFeatureUpdateParams(message, context) {
    const params = {};

    console.log('Extracting update parameters from message:', message);
    console.log('Available recent features:', context.features?.recent?.map(f => ({ id: f.id, title: f.title })));

    // Extract feature ID or title - improved regex patterns
    const featureMatch = message.match(/feature\s+#?(\d+)/i) ||
                        message.match(/feature\s+["']([^"']+)["']/i) ||
                        message.match(/["']([^"']+)["']/i); // Also match any quoted text as potential feature title
    
    if (featureMatch) {
      console.log('Feature match found:', featureMatch[1]);
      
      if (featureMatch[1].match(/^\d+$/)) {
        // Try to find feature by position in recent features
        const featureIndex = parseInt(featureMatch[1]) - 1;
        if (context.features?.recent?.[featureIndex]) {
          params.featureId = context.features.recent[featureIndex].id;
          console.log('Found feature by index:', params.featureId);
        }
      } else {
        // Find feature by title (case-insensitive partial match)
        const featureTitle = featureMatch[1].toLowerCase();
        const feature = context.features?.recent?.find(f => 
          f.title.toLowerCase().includes(featureTitle) || 
          featureTitle.includes(f.title.toLowerCase())
        );
        if (feature) {
          params.featureId = feature.id;
          console.log('Found feature by title match:', feature.title, '->', params.featureId);
        } else {
          console.log('No feature found matching title:', featureTitle);
        }
      }
    } else {
      console.log('No feature match found in message');
    }

    // Extract new status - improved regex to handle more patterns including spaced versions
    const statusMatch = message.match(/(?:status|mark|move|set|change|update).*?(?:to|as)\s*(?:status\s+)?["']?(backlog|in\s+progress|in[-_]progress|review|done|completed|cancelled|requested)["']?/i);
    if (statusMatch) {
      let status = statusMatch[1].toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_');
      console.log('Status match found:', statusMatch[1], '->', status);
      
      // Apply status mapping to match database enum
      const statusMap = {
        'requested': 'backlog',
        'planned': 'backlog',
        'in_progress': 'in_progress',
        'inprogress': 'in_progress',
        'review': 'review',
        'done': 'done',
        'completed': 'done',
        'cancelled': 'done'
      };
      
      params.status = statusMap[status] || status;
      console.log('Mapped status to:', params.status);
    } else {
      console.log('No status match found in message');
      console.log('Trying alternative status patterns...');
      
      // Try alternative patterns for common phrasings - including spaced versions
      const altStatusMatch = message.match(/["']?(backlog|in\s+progress|in[-_]progress|review|done|completed|cancelled|requested)["']?/i);
      if (altStatusMatch) {
        let status = altStatusMatch[1].toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_');
        console.log('Alternative status match found:', altStatusMatch[1], '->', status);
        
        const statusMap = {
          'requested': 'backlog',
          'planned': 'backlog',
          'in_progress': 'in_progress',
          'inprogress': 'in_progress',
          'review': 'review',
          'done': 'done',
          'completed': 'done',
          'cancelled': 'done'
        };
        
        params.status = statusMap[status] || status;
        console.log('Mapped alternative status to:', params.status);
      } else {
        console.log('No alternative status match found either');
      }
    }

    // Extract new priority
    const priorityMatch = message.match(/priority\s+(high|medium|low|urgent|critical)/i);
    if (priorityMatch) {
      // Map 'urgent' to 'critical' to match database enum
      const priority = priorityMatch[1].toLowerCase();
      params.priority = priority === 'urgent' ? 'critical' : priority;
      console.log('Priority match found:', priorityMatch[1], '->', params.priority);
    }

    console.log('Final extracted parameters:', params);
    return params;
  }
}

// Export singleton instance
module.exports = new AIService(); 