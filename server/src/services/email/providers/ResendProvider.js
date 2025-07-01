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

    try {
      // Get subject and HTML content
      const subject = this.getSubject(type, data);
      const html = this.getHtmlContent(type, data);

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
   * Get HTML content based on type and data
   * @param {string} type - Email type
   * @param {Object} data - Template data
   */
  getHtmlContent(type, data) {
    switch (type) {
      case 'invitation':
        return this.getInvitationHtml(data);
      case 'password-reset':
        return this.getPasswordResetHtml(data);
      case 'mention':
        return this.getMentionHtml(data);
      default:
        throw new Error(`Unknown email template type: ${type}`);
    }
  }

  /**
   * Get invitation email HTML
   */
  getInvitationHtml(data) {
    const { teamName, inviterName, inviteUrl } = data;
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Invitation to join ${teamName} on FeatureForge</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 40px 0;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
            
            <!-- Header -->
            <div style="background-color: #0ea5e9; padding: 40px 40px 30px 40px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 28px; font-weight: bold; margin: 0; line-height: 1.2;">
                You're invited to join ${teamName}
              </h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
                Hello!
              </p>
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
                <strong>${inviterName}</strong> has invited you to join the team "<strong>${teamName}</strong>" on FeatureForge.
              </p>
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
                FeatureForge is a collaborative platform for feature prioritization and management. Join your team to contribute to product decisions and track feature development.
              </p>
            </div>
            
            <!-- Button -->
            <div style="text-align: center; padding: 0 40px 40px 40px;">
              <a href="${inviteUrl}" style="background-color: #0ea5e9; color: #ffffff; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block; border: none;">
                Accept Invitation
              </a>
            </div>
            
            <!-- Link Section -->
            <div style="padding: 0 40px 40px 40px;">
              <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 0 0 8px 0;">
                If the button doesn't work, you can copy and paste this link into your browser:
              </p>
              <p style="color: #0ea5e9; font-size: 14px; word-break: break-all; margin: 0;">
                ${inviteUrl}
              </p>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 0 40px;">
            
            <!-- Footer -->
            <div style="padding: 30px 40px 40px 40px;">
              <p style="color: #9ca3af; font-size: 14px; line-height: 1.5; margin: 0 0 8px 0;">
                If you didn't expect this invitation, you can safely ignore this email.
              </p>
              <p style="color: #9ca3af; font-size: 14px; line-height: 1.5; margin: 0 0 8px 0;">
                This invitation was sent from FeatureForge.
              </p>
            </div>
            
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Get password reset email HTML
   */
  getPasswordResetHtml(data) {
    const { resetUrl } = data;
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset Request - FeatureForge</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 40px 0;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
            
            <!-- Header -->
            <div style="background-color: #dc2626; padding: 40px 40px 30px 40px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 28px; font-weight: bold; margin: 0; line-height: 1.2;">
                Password Reset Request
              </h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
                Hello,
              </p>
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
                We received a request to reset your password for your FeatureForge account.
              </p>
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
                Click the button below to reset your password:
              </p>
            </div>
            
            <!-- Button -->
            <div style="text-align: center; padding: 0 40px 40px 40px;">
              <a href="${resetUrl}" style="background-color: #dc2626; color: #ffffff; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block; border: none;">
                Reset Password
              </a>
            </div>
            
            <!-- Link Section -->
            <div style="padding: 0 40px 40px 40px;">
              <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 0 0 8px 0;">
                If the button doesn't work, you can copy and paste this link into your browser:
              </p>
              <p style="color: #dc2626; font-size: 14px; word-break: break-all; margin: 0;">
                ${resetUrl}
              </p>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 0 40px;">
            
            <!-- Footer -->
            <div style="padding: 30px 40px 40px 40px;">
              <p style="color: #9ca3af; font-size: 14px; line-height: 1.5; margin: 0 0 8px 0;">
                If you didn't request this password reset, you can safely ignore this email.
              </p>
              <p style="color: #9ca3af; font-size: 14px; line-height: 1.5; margin: 0 0 8px 0;">
                This link will expire in 1 hour for security reasons.
              </p>
            </div>
            
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Get mention notification email HTML
   */
  getMentionHtml(data) {
    const { recipientName, mentionerName, featureTitle, commentContent, featureId } = data;
    const featureUrl = `${process.env.FRONTEND_URL}/features/${featureId}`;
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${mentionerName} mentioned you in a comment on FeatureForge</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 40px 0;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
            
            <!-- Header -->
            <div style="background-color: #7c3aed; padding: 40px 40px 30px 40px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 28px; font-weight: bold; margin: 0; line-height: 1.2;">
                You were mentioned in a comment
              </h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
                Hello ${recipientName},
              </p>
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
                <strong>${mentionerName}</strong> mentioned you in a comment on the feature "<strong>${featureTitle}</strong>".
              </p>
              <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; border-left: 4px solid #7c3aed; margin: 16px 0;">
                <p style="color: #374151; font-size: 14px; line-height: 1.5; margin: 0; font-style: italic;">
                  "${commentContent}"
                </p>
              </div>
            </div>
            
            <!-- Button -->
            <div style="text-align: center; padding: 0 40px 40px 40px;">
              <a href="${featureUrl}" style="background-color: #7c3aed; color: #ffffff; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block; border: none;">
                View Comment
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 0 40px;">
            
            <!-- Footer -->
            <div style="padding: 30px 40px 40px 40px;">
              <p style="color: #9ca3af; font-size: 14px; line-height: 1.5; margin: 0 0 8px 0;">
                You received this notification because you were mentioned in a comment.
              </p>
              <p style="color: #9ca3af; font-size: 14px; line-height: 1.5; margin: 0 0 8px 0;">
                This email was sent from FeatureForge.
              </p>
            </div>
            
          </div>
        </body>
      </html>
    `;
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