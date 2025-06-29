const express = require('express');
const router = express.Router();
const emailService = require('../services/email/EmailService');
const { protectWithAny } = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * Webhook endpoint for Resend events
 * @route POST /api/email/webhook
 * @access Public (but verified via signature)
 */
router.post('/webhook', async (req, res) => {
  try {
    const signature = req.headers['resend-signature'];
    const payload = JSON.stringify(req.body);

    // Verify webhook signature
    const provider = emailService.provider;
    if (!provider.verifyWebhookSignature(signature, payload)) {
      logger.warn('Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Process webhook event
    await emailService.processWebhook(req.body);

    res.status(200).json({ received: true });

  } catch (error) {
    logger.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * Get email analytics
 * @route GET /api/email/analytics
 * @access Private
 */
router.get('/analytics', protectWithAny, async (req, res) => {
  try {
    const { startDate, endDate, emailType } = req.query;
    
    const analytics = await emailService.getAnalytics({
      startDate,
      endDate,
      emailType
    });

    res.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    logger.error('Failed to get email analytics:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve analytics' 
    });
  }
});

/**
 * Get email analytics report
 * @route GET /api/email/analytics/report
 * @access Private
 */
router.get('/analytics/report', protectWithAny, async (req, res) => {
  try {
    const report = await emailService.analytics.generateReport();

    res.json({
      success: true,
      data: report
    });

  } catch (error) {
    logger.error('Failed to generate analytics report:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate report' 
    });
  }
});

/**
 * Get queue statistics
 * @route GET /api/email/queue/stats
 * @access Private
 */
router.get('/queue/stats', protectWithAny, async (req, res) => {
  try {
    const stats = await emailService.queue.getStats();

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    logger.error('Failed to get queue stats:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve queue statistics' 
    });
  }
});

/**
 * Test email configuration
 * @route POST /api/email/test
 * @access Private
 */
router.post('/test', protectWithAny, async (req, res) => {
  try {
    const result = await emailService.testConfiguration();

    res.json({
      success: true,
      message: 'Test email sent successfully',
      data: result
    });

  } catch (error) {
    logger.error('Email configuration test failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * Send test email
 * @route POST /api/email/test/send
 * @access Private
 */
router.post('/test/send', protectWithAny, async (req, res) => {
  try {
    const { type, recipient } = req.body;
    
    if (!type || !recipient) {
      return res.status(400).json({
        success: false,
        error: 'Type and recipient are required'
      });
    }

    let result;
    
    switch (type) {
      case 'invitation':
        result = await emailService.sendInvitation({
          email: recipient,
          teamName: 'Test Team',
          inviterName: req.user.name || 'Test User',
          inviteToken: null
        });
        break;
        
      case 'password-reset':
        result = await emailService.sendPasswordReset({
          email: recipient,
          resetToken: 'test-token-123'
        });
        break;
        
      case 'mention':
        result = await emailService.sendMentionNotification({
          email: recipient,
          recipientName: 'Test User',
          mentionerName: req.user.name || 'Test Mentioner',
          featureTitle: 'Test Feature',
          commentContent: 'This is a test mention notification.',
          featureId: 'test-feature-id'
        });
        break;
        
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid email type. Use: invitation, password-reset, or mention'
        });
    }

    res.json({
      success: true,
      message: `Test ${type} email queued successfully`,
      data: result
    });

  } catch (error) {
    logger.error('Failed to send test email:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * Get email details by message ID
 * @route GET /api/email/details/:messageId
 * @access Private
 */
router.get('/details/:messageId', protectWithAny, async (req, res) => {
  try {
    const { messageId } = req.params;
    const details = await emailService.analytics.getEmailDetails(messageId);

    if (!details) {
      return res.status(404).json({
        success: false,
        error: 'Email not found'
      });
    }

    res.json({
      success: true,
      data: details
    });

  } catch (error) {
    logger.error('Failed to get email details:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve email details' 
    });
  }
});

/**
 * Get recent email activity
 * @route GET /api/email/activity
 * @access Private
 */
router.get('/activity', protectWithAny, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const activity = await emailService.analytics.getRecentActivity(parseInt(limit));

    res.json({
      success: true,
      data: activity
    });

  } catch (error) {
    logger.error('Failed to get email activity:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve email activity' 
    });
  }
});

module.exports = router; 