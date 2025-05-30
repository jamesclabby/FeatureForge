const nodemailer = require('nodemailer');
const logger = require('./logger');

// Create transporter
const createTransporter = () => {
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    logger.warn('Email configuration incomplete. Email sending will be disabled.');
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

const transporter = createTransporter();

/**
 * Send team invitation email
 * @param {Object} options
 * @param {string} options.email - Recipient email
 * @param {string} options.teamName - Team name
 * @param {string} options.inviterName - Name of the person sending the invitation
 * @param {string} options.inviteToken - Optional invite token for direct signup
 */
const sendInvitationEmail = async (email, teamName, inviterName, inviteToken = null) => {
  // In test environment, just return success
  if (process.env.NODE_ENV === 'test') {
    logger.info(`Mock email sent to ${email} for team ${teamName}`);
    return Promise.resolve({
      success: true,
      message: 'Email sent (mock)'
    });
  }

  if (!transporter) {
    logger.error('Email transporter not configured');
    return Promise.reject(new Error('Email service not available'));
  }

  try {
    const inviteUrl = inviteToken 
      ? `${process.env.FRONTEND_URL}/invite/${inviteToken}`
      : `${process.env.FRONTEND_URL}/register`;

    const mailOptions = {
      from: `"FeatureForge" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Invitation to join ${teamName} on FeatureForge`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0ea5e9;">You're invited to join ${teamName}</h2>
          <p>Hello,</p>
          <p><strong>${inviterName}</strong> has invited you to join the team "<strong>${teamName}</strong>" on FeatureForge.</p>
          <p>FeatureForge is a collaborative platform for feature prioritization and management.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteUrl}" 
               style="background-color: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Accept Invitation
            </a>
          </div>
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #0ea5e9;">${inviteUrl}</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;">
          <p style="color: #64748b; font-size: 14px;">
            If you didn't expect this invitation, you can safely ignore this email.
          </p>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    logger.info(`Invitation email sent successfully to ${email} for team ${teamName}`);
    
    return {
      success: true,
      message: 'Invitation email sent successfully',
      messageId: result.messageId
    };
  } catch (error) {
    logger.error(`Failed to send invitation email to ${email}:`, error);
    return Promise.reject(new Error('Failed to send invitation email'));
  }
};

/**
 * Send password reset email
 * @param {string} email - Recipient email
 * @param {string} resetToken - Password reset token
 */
const sendPasswordResetEmail = async (email, resetToken) => {
  if (process.env.NODE_ENV === 'test') {
    return Promise.resolve({ success: true, message: 'Password reset email sent (mock)' });
  }

  if (!transporter) {
    return Promise.reject(new Error('Email service not available'));
  }

  try {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    const mailOptions = {
      from: `"FeatureForge" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset Request - FeatureForge',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0ea5e9;">Password Reset Request</h2>
          <p>You requested a password reset for your FeatureForge account.</p>
          <p>Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Reset Password
            </a>
          </div>
          <p>This link will expire in 1 hour for security reasons.</p>
          <p>If you didn't request this reset, please ignore this email.</p>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    logger.info(`Password reset email sent to ${email}`);
    
    return {
      success: true,
      message: 'Password reset email sent successfully',
      messageId: result.messageId
    };
  } catch (error) {
    logger.error(`Failed to send password reset email to ${email}:`, error);
    return Promise.reject(new Error('Failed to send password reset email'));
  }
};

module.exports = {
  sendInvitationEmail,
  sendPasswordResetEmail
}; 