const { Resend } = require('resend');
const { render } = require('@react-email/render');
const logger = require('../../../utils/logger');

// Import email templates
const InvitationEmail = require('../templates/InvitationEmail');
const PasswordResetEmail = require('../templates/PasswordResetEmail');
const MentionNotificationEmail = require('../templates/MentionNotificationEmail');

class ResendProvider {
  constructor() {
    this.resend = null;
    this.isConfigured = false;
    this.templates = {
      invitation: InvitationEmail,
      'password-reset': PasswordResetEmail,
      mention: MentionNotificationEmail
    };
    
    this.initialize();
  }

  /**
   * Initialize Resend client
   */
  initialize() {
    try {
      if (!process.env.RESEND_API_KEY) {
        logger.warn('RESEND_API_KEY not found. Email sending will be disabled.');
        return;
      }

      this.resend = new Resend(process.env.RESEND_API_KEY);
      this.isConfigured = true;
      logger.info('Resend provider initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Resend provider:', error);
    }
  }

  /**
   * Send email using Resend
   * @param {Object} options - Email options
   * @param {string} options.to - Recipient email
   * @param {string} options.type - Email type (invitation, password-reset, mention)
   * @param {Object} options.data - Template data
   */
  async send({ to, type, data }) {
    // Handle test environment
    if (process.env.NODE_ENV === 'test') {
      logger.info(`Mock email sent: ${type} to ${to}`);
      return {
        success: true,
        messageId: `mock-${Date.now()}`,
        message: 'Email sent (mock)'
      };
    }

    if (!this.isConfigured) {
      throw new Error('Resend provider not configured. Check RESEND_API_KEY.');
    }

    if (!this.templates[type]) {
      throw new Error(`Unknown email template type: ${type}`);
    }

    try {
      // Get template and render it
      const Template = this.templates[type];
      const subject = this.getSubject(type, data);
      
      // Render React component to HTML
      const html = render(Template(data));

      const emailOptions = {
        from: `${process.env.EMAIL_FROM_NAME || 'FeatureForge'} <${process.env.EMAIL_FROM_ADDRESS}>`,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        // Add tags for analytics
        tags: [
          { name: 'type', value: type },
          { name: 'environment', value: process.env.NODE_ENV || 'development' }
        ]
      };

      const { data: result, error } = await this.resend.emails.send(emailOptions);

      if (error) {
        logger.error('Resend API error:', error);
        throw new Error(`Resend API error: ${error.message}`);
      }

      logger.info(`Email sent successfully: ${type} to ${to}`, { messageId: result.id });
      
      return {
        success: true,
        messageId: result.id,
        provider: 'resend'
      };

    } catch (error) {
      logger.error(`Failed to send ${type} email to ${to}:`, error);
      
      // Implement retry logic for transient errors
      if (this.isRetryableError(error)) {
        throw new Error(`Retryable error: ${error.message}`);
      }
      
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * Get email subject based on type and data
   * @param {string} type - Email type
   * @param {Object} data - Template data
   */
  getSubject(type, data) {
    switch (type) {
      case 'invitation':
        return `Invitation to join ${data.teamName} on FeatureForge`;
      case 'password-reset':
        return 'Password Reset Request - FeatureForge';
      case 'mention':
        return `${data.mentionerName} mentioned you in a comment on FeatureForge`;
      default:
        return 'Notification from FeatureForge';
    }
  }

  /**
   * Check if error is retryable
   * @param {Error} error - Error object
   */
  isRetryableError(error) {
    const retryableErrors = [
      'rate_limit_exceeded',
      'temporary_failure',
      'timeout',
      'network_error'
    ];
    
    return retryableErrors.some(retryable => 
      error.message.toLowerCase().includes(retryable.toLowerCase())
    );
  }

  /**
   * Test Resend connection
   */
  async testConnection() {
    if (!this.isConfigured) {
      throw new Error('Resend provider not configured');
    }

    try {
      // Send a test email to verify configuration
      const testEmail = {
        from: `${process.env.EMAIL_FROM_NAME || 'FeatureForge'} <${process.env.EMAIL_FROM_ADDRESS}>`,
        to: [process.env.EMAIL_FROM_ADDRESS], // Send to self for testing
        subject: 'FeatureForge Email Configuration Test',
        html: '<p>This is a test email to verify your Resend configuration is working correctly.</p>'
      };

      const { data, error } = await this.resend.emails.send(testEmail);

      if (error) {
        throw new Error(`Test email failed: ${error.message}`);
      }

      return {
        success: true,
        messageId: data.id,
        message: 'Test email sent successfully'
      };

    } catch (error) {
      logger.error('Resend connection test failed:', error);
      throw error;
    }
  }

  /**
   * Verify webhook signature (for webhook endpoints)
   * @param {string} signature - Webhook signature
   * @param {string} payload - Raw payload
   */
  verifyWebhookSignature(signature, payload) {
    // Implement webhook signature verification
    // This would use your webhook signing secret from Resend
    const crypto = require('crypto');
    const signingSecret = process.env.RESEND_WEBHOOK_SECRET;
    
    if (!signingSecret) {
      logger.warn('RESEND_WEBHOOK_SECRET not configured');
      return false;
    }

    try {
      const expectedSignature = crypto
        .createHmac('sha256', signingSecret)
        .update(payload)
        .digest('hex');
      
      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch (error) {
      logger.error('Webhook signature verification failed:', error);
      return false;
    }
  }
}

module.exports = ResendProvider; 