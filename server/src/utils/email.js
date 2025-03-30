const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

/**
 * Send team invitation email
 * @param {Object} options
 * @param {string} options.email - Recipient email
 * @param {string} options.teamName - Team name
 * @param {string} options.inviterName - Name of the person sending the invitation
 */
const sendInvitationEmail = async (email, teamName, inviterName) => {
  // In test environment, just return success
  if (process.env.NODE_ENV === 'test') {
    return Promise.resolve({
      success: true,
      message: 'Email sent (mock)'
    });
  }

  // TODO: Implement actual email sending logic
  console.log(`Sending invitation email to ${email} for team ${teamName} from ${inviterName}`);
  return Promise.resolve({
    success: true,
    message: 'Email sent'
  });
};

module.exports = {
  sendInvitationEmail
}; 