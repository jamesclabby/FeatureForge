const logger = require('../../../utils/logger');

class EmailAnalytics {
  constructor() {
    this.events = new Map(); // In-memory storage for demo - replace with database in production
    this.stats = {
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      bounced: 0,
      complained: 0
    };
  }

  /**
   * Initialize analytics system
   */
  async initialize() {
    try {
      // In production, this would connect to a database
      // For now, we'll use in-memory storage
      logger.info('Email analytics initialized');
    } catch (error) {
      logger.error('Failed to initialize email analytics:', error);
      throw error;
    }
  }

  /**
   * Record email event from webhook
   * @param {Object} eventData - Webhook event data
   */
  async recordEvent(eventData) {
    try {
      const { type, data } = eventData;
      const messageId = data.email_id || data.message_id;
      
      if (!messageId) {
        logger.warn('Email event missing message ID:', eventData);
        return;
      }

      // Store event
      if (!this.events.has(messageId)) {
        this.events.set(messageId, {
          messageId,
          events: [],
          metadata: {
            to: data.to,
            subject: data.subject,
            created_at: data.created_at
          }
        });
      }

      const emailRecord = this.events.get(messageId);
      emailRecord.events.push({
        type,
        timestamp: new Date().toISOString(),
        data: data
      });

      // Update statistics
      this.updateStats(type);

      logger.info('Email event recorded', { messageId, type });

    } catch (error) {
      logger.error('Failed to record email event:', error);
    }
  }

  /**
   * Update statistics based on event type
   * @param {string} eventType - Type of email event
   */
  updateStats(eventType) {
    switch (eventType) {
      case 'email.sent':
        this.stats.sent++;
        break;
      case 'email.delivered':
        this.stats.delivered++;
        break;
      case 'email.opened':
        this.stats.opened++;
        break;
      case 'email.clicked':
        this.stats.clicked++;
        break;
      case 'email.bounced':
        this.stats.bounced++;
        break;
      case 'email.complained':
        this.stats.complained++;
        break;
    }
  }

  /**
   * Get email analytics statistics
   * @param {Object} filters - Optional filters
   */
  async getStats(filters = {}) {
    try {
      const { startDate, endDate, emailType } = filters;
      
      // In production, this would query a database with filters
      // For now, return basic stats
      const deliveryRate = this.stats.sent > 0 
        ? ((this.stats.delivered / this.stats.sent) * 100).toFixed(2)
        : 0;
      
      const openRate = this.stats.delivered > 0 
        ? ((this.stats.opened / this.stats.delivered) * 100).toFixed(2)
        : 0;
      
      const clickRate = this.stats.delivered > 0 
        ? ((this.stats.clicked / this.stats.delivered) * 100).toFixed(2)
        : 0;

      const bounceRate = this.stats.sent > 0 
        ? ((this.stats.bounced / this.stats.sent) * 100).toFixed(2)
        : 0;

      return {
        summary: {
          totalSent: this.stats.sent,
          totalDelivered: this.stats.delivered,
          totalOpened: this.stats.opened,
          totalClicked: this.stats.clicked,
          totalBounced: this.stats.bounced,
          totalComplaints: this.stats.complained
        },
        rates: {
          deliveryRate: `${deliveryRate}%`,
          openRate: `${openRate}%`,
          clickRate: `${clickRate}%`,
          bounceRate: `${bounceRate}%`
        },
        period: {
          startDate: startDate || 'All time',
          endDate: endDate || 'Present'
        },
        totalEvents: this.events.size
      };

    } catch (error) {
      logger.error('Failed to get email analytics:', error);
      throw error;
    }
  }

  /**
   * Get detailed email performance data
   * @param {string} messageId - Specific message ID
   */
  async getEmailDetails(messageId) {
    try {
      const emailRecord = this.events.get(messageId);
      
      if (!emailRecord) {
        return null;
      }

      return {
        messageId,
        metadata: emailRecord.metadata,
        events: emailRecord.events,
        timeline: this.buildTimeline(emailRecord.events)
      };

    } catch (error) {
      logger.error('Failed to get email details:', error);
      throw error;
    }
  }

  /**
   * Build timeline from events
   * @param {Array} events - Email events
   */
  buildTimeline(events) {
    return events
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .map(event => ({
        timestamp: event.timestamp,
        type: event.type,
        description: this.getEventDescription(event.type)
      }));
  }

  /**
   * Get human-readable event description
   * @param {string} eventType - Event type
   */
  getEventDescription(eventType) {
    const descriptions = {
      'email.sent': 'Email sent to recipient',
      'email.delivered': 'Email delivered to recipient\'s inbox',
      'email.opened': 'Email opened by recipient',
      'email.clicked': 'Link clicked in email',
      'email.bounced': 'Email bounced back',
      'email.complained': 'Email marked as spam'
    };

    return descriptions[eventType] || 'Unknown event';
  }

  /**
   * Get email performance by type
   */
  async getPerformanceByType() {
    try {
      // In production, this would aggregate data from database
      // For now, return mock data structure
      return {
        invitation: {
          sent: Math.floor(this.stats.sent * 0.4),
          delivered: Math.floor(this.stats.delivered * 0.4),
          opened: Math.floor(this.stats.opened * 0.4),
          clicked: Math.floor(this.stats.clicked * 0.4)
        },
        'password-reset': {
          sent: Math.floor(this.stats.sent * 0.3),
          delivered: Math.floor(this.stats.delivered * 0.3),
          opened: Math.floor(this.stats.opened * 0.3),
          clicked: Math.floor(this.stats.clicked * 0.3)
        },
        mention: {
          sent: Math.floor(this.stats.sent * 0.3),
          delivered: Math.floor(this.stats.delivered * 0.3),
          opened: Math.floor(this.stats.opened * 0.3),
          clicked: Math.floor(this.stats.clicked * 0.3)
        }
      };

    } catch (error) {
      logger.error('Failed to get performance by type:', error);
      throw error;
    }
  }

  /**
   * Get recent email activity
   * @param {number} limit - Number of recent events to return
   */
  async getRecentActivity(limit = 10) {
    try {
      const allEvents = [];
      
      for (const [messageId, emailRecord] of this.events) {
        emailRecord.events.forEach(event => {
          allEvents.push({
            messageId,
            ...event,
            recipient: emailRecord.metadata.to
          });
        });
      }

      // Sort by timestamp and limit
      return allEvents
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit);

    } catch (error) {
      logger.error('Failed to get recent activity:', error);
      throw error;
    }
  }

  /**
   * Generate analytics report
   */
  async generateReport() {
    try {
      const [stats, performanceByType, recentActivity] = await Promise.all([
        this.getStats(),
        this.getPerformanceByType(),
        this.getRecentActivity(20)
      ]);

      return {
        generatedAt: new Date().toISOString(),
        summary: stats,
        performanceByType,
        recentActivity,
        recommendations: this.generateRecommendations(stats)
      };

    } catch (error) {
      logger.error('Failed to generate analytics report:', error);
      throw error;
    }
  }

  /**
   * Generate recommendations based on performance
   * @param {Object} stats - Email statistics
   */
  generateRecommendations(stats) {
    const recommendations = [];
    
    const deliveryRate = parseFloat(stats.rates.deliveryRate);
    const openRate = parseFloat(stats.rates.openRate);
    const clickRate = parseFloat(stats.rates.clickRate);
    const bounceRate = parseFloat(stats.rates.bounceRate);

    if (deliveryRate < 95) {
      recommendations.push({
        type: 'delivery',
        priority: 'high',
        message: 'Delivery rate is below 95%. Consider reviewing your sender reputation and email authentication (SPF, DKIM, DMARC).'
      });
    }

    if (openRate < 20) {
      recommendations.push({
        type: 'engagement',
        priority: 'medium',
        message: 'Open rate is below 20%. Consider improving subject lines and sender name recognition.'
      });
    }

    if (clickRate < 3) {
      recommendations.push({
        type: 'engagement',
        priority: 'medium',
        message: 'Click rate is below 3%. Consider improving email content and call-to-action buttons.'
      });
    }

    if (bounceRate > 5) {
      recommendations.push({
        type: 'list_hygiene',
        priority: 'high',
        message: 'Bounce rate is above 5%. Consider implementing email validation and list cleaning.'
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        type: 'success',
        priority: 'low',
        message: 'Email performance looks good! Keep monitoring for any changes.'
      });
    }

    return recommendations;
  }

  /**
   * Reset analytics data (for testing)
   */
  async reset() {
    this.events.clear();
    this.stats = {
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      bounced: 0,
      complained: 0
    };
    
    logger.info('Email analytics data reset');
  }
}

module.exports = EmailAnalytics; 