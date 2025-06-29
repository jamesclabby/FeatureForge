const ResendProvider = require('./providers/ResendProvider');
const EmailQueue = require('./queue/EmailQueue');
const EmailAnalytics = require('./analytics/EmailAnalytics');
const logger = require('../../utils/logger');

class EmailService {
  constructor() {
    this.provider = new ResendProvider();
    this.queue = new EmailQueue();
    this.analytics = new EmailAnalytics();
    this.isInitialized = false;
  }

  /**
   * Initialize the email service
   */
  async initialize() {
    try {
      await this.queue.initialize();
      await this.analytics.initialize();
      this.isInitialized = true;
      logger.info('Email service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize email service:', error);
      throw error;
    }
  }

  /**
   * Send team invitation email
   * @param {Object} options - Email options
   * @param {string} options.email - Recipient email
   * @param {string} options.teamName - Team name
   * @param {string} options.inviterName - Name of inviter
   * @param {string} options.inviteToken - Optional invite token
   */
  async sendInvitation(options) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return this.queue.add('invitation', {
      type: 'invitation',
      to: options.email,
      data: {
        teamName: options.teamName,
        inviterName: options.inviterName,
        inviteToken: options.inviteToken,
        inviteUrl: options.inviteToken 
          ? `${process.env.FRONTEND_URL}/invite/${options.inviteToken}`
          : `${process.env.FRONTEND_URL}/register`
      }
    });
  }

  /**
   * Send password reset email
   * @param {Object} options - Email options
   * @param {string} options.email - Recipient email
   * @param {string} options.resetToken - Reset token
   */
  async sendPasswordReset(options) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return this.queue.add('password-reset', {
      type: 'password-reset',
      to: options.email,
      data: {
        resetToken: options.resetToken,
        resetUrl: `${process.env.FRONTEND_URL}/reset-password/${options.resetToken}`
      }
    });
  }

  /**
   * Send mention notification email
   * @param {Object} options - Email options
   */
  async sendMentionNotification(options) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return this.queue.add('mention', {
      type: 'mention',
      to: options.email,
      data: {
        recipientName: options.recipientName,
        mentionerName: options.mentionerName,
        featureTitle: options.featureTitle,
        commentContent: options.commentContent.length > 200 
          ? options.commentContent.substring(0, 200) + '...' 
          : options.commentContent,
        featureUrl: `${process.env.FRONTEND_URL}/features/${options.featureId}`
      }
    });
  }

  /**
   * Get email analytics
   * @param {Object} filters - Analytics filters
   */
  async getAnalytics(filters = {}) {
    return this.analytics.getStats(filters);
  }

  /**
   * Process webhook from Resend
   * @param {Object} webhookData - Webhook payload
   */
  async processWebhook(webhookData) {
    try {
      await this.analytics.recordEvent(webhookData);
      logger.info('Webhook processed successfully:', webhookData.type);
    } catch (error) {
      logger.error('Failed to process webhook:', error);
      throw error;
    }
  }

  /**
   * Test email configuration
   */
  async testConfiguration() {
    try {
      const testResult = await this.provider.testConnection();
      logger.info('Email configuration test successful');
      return testResult;
    } catch (error) {
      logger.error('Email configuration test failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new EmailService(); 