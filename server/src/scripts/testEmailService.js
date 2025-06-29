const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

const emailService = require('../services/email/EmailService');
const logger = require('../utils/logger');

async function testEmailService() {
  console.log('🧪 Testing Email Service Configuration...\n');

  try {
    // Test 1: Initialize the service
    console.log('1. Initializing email service...');
    await emailService.initialize();
    console.log('✅ Email service initialized successfully\n');

    // Test 2: Check configuration
    console.log('2. Testing email configuration...');
    const configTest = await emailService.testConfiguration();
    console.log('✅ Configuration test passed:', configTest.message);
    console.log('   Message ID:', configTest.messageId, '\n');

    // Test 3: Get queue stats
    console.log('3. Checking queue statistics...');
    const queueStats = await emailService.queue.getStats();
    console.log('✅ Queue stats:', queueStats, '\n');

    // Test 4: Get analytics
    console.log('4. Checking email analytics...');
    const analytics = await emailService.getAnalytics();
    console.log('✅ Analytics:', analytics, '\n');

    // Test 5: Send test emails (if recipient provided)
    const testRecipient = process.env.EMAIL_FROM_ADDRESS;
    if (testRecipient) {
      console.log(`5. Sending test emails to ${testRecipient}...`);
      
      // Test invitation email
      console.log('   - Sending invitation email...');
      const inviteResult = await emailService.sendInvitation({
        email: testRecipient,
        teamName: 'Test Team',
        inviterName: 'Test User',
        inviteToken: null
      });
      console.log('   ✅ Invitation email queued:', inviteResult);

      // Test password reset email
      console.log('   - Sending password reset email...');
      const resetResult = await emailService.sendPasswordReset({
        email: testRecipient,
        resetToken: 'test-token-123'
      });
      console.log('   ✅ Password reset email queued:', resetResult);

      // Test mention notification email
      console.log('   - Sending mention notification email...');
      const mentionResult = await emailService.sendMentionNotification({
        email: testRecipient,
        recipientName: 'Test User',
        mentionerName: 'Another User',
        featureTitle: 'Test Feature',
        commentContent: 'This is a test mention notification.',
        featureId: 'test-feature-id'
      });
      console.log('   ✅ Mention notification email queued:', mentionResult);

      console.log('\n📧 Check your email for the test messages!');
    } else {
      console.log('5. Skipping test email sending (no recipient configured)');
    }

    console.log('\n🎉 All tests passed! Email service is ready for production.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testEmailService()
    .then(() => {
      console.log('\n✨ Email service test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Email service test failed:', error);
      process.exit(1);
    });
}

module.exports = testEmailService; 