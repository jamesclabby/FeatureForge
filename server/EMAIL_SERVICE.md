# FeatureForge Email Service

## Overview

The FeatureForge email service provides a robust, production-ready email system built on top of Resend with React Email templates, queue management, and comprehensive analytics.

## Features

- ✅ **Modern React Email Templates** - Beautiful, responsive emails using React components
- ✅ **Resend Integration** - Professional email delivery with excellent deliverability
- ✅ **Queue Management** - Reliable email processing with Bull queues and Redis
- ✅ **Analytics & Monitoring** - Track email performance and engagement
- ✅ **Webhook Support** - Real-time email event processing
- ✅ **Fallback Support** - Graceful degradation when Redis is unavailable
- ✅ **Test Environment** - Mock email sending for development

## Architecture

```
EmailService (Main orchestrator)
├── ResendProvider (Email sending)
├── EmailQueue (Job processing)
├── EmailAnalytics (Performance tracking)
└── Templates (React Email components)
    ├── InvitationEmail
    ├── PasswordResetEmail
    └── MentionNotificationEmail
```

## Environment Variables

Add these variables to your `.env` file:

```bash
# Email Provider Configuration
EMAIL_PROVIDER=resend
RESEND_API_KEY=your_resend_api_key_here
EMAIL_FROM_ADDRESS=noreply@featureforge.dev
EMAIL_FROM_NAME=FeatureForge

# Optional: Webhook Security
RESEND_WEBHOOK_SECRET=your_webhook_secret_here

# Optional: Redis Configuration (for queue)
REDIS_URL=redis://localhost:6379

# Frontend URL (for email links)
FRONTEND_URL=https://featureforge.dev
```

## Setup Instructions

### 1. Resend Configuration

1. Create account at [resend.com](https://resend.com)
2. Add and verify your domain
3. Generate API key
4. Configure environment variables

### 2. Domain Verification

Set up these DNS records for your domain:

```
# SPF Record
TXT @ "v=spf1 include:_spf.resend.com ~all"

# DKIM Record (provided by Resend)
CNAME resend._domainkey "resend._domainkey.resend.com"

# DMARC Record
TXT _dmarc "v=DMARC1; p=quarantine; rua=mailto:dmarc@featureforge.dev"
```

### 3. Testing

Run the email service test:

```bash
cd server
npm run test:email
```

## Usage Examples

### Sending Team Invitations

```javascript
const emailService = require('./services/email/EmailService');

await emailService.sendInvitation({
  email: 'user@example.com',
  teamName: 'My Team',
  inviterName: 'John Doe',
  inviteToken: 'optional-token'
});
```

### Sending Password Reset

```javascript
await emailService.sendPasswordReset({
  email: 'user@example.com',
  resetToken: 'secure-reset-token'
});
```

### Sending Mention Notifications

```javascript
await emailService.sendMentionNotification({
  email: 'user@example.com',
  recipientName: 'Jane Doe',
  mentionerName: 'John Doe',
  featureTitle: 'New Feature',
  commentContent: 'Great idea! @jane what do you think?',
  featureId: 'feature-123'
});
```

## API Endpoints

### Email Analytics
```
GET /api/email/analytics
GET /api/email/analytics/report
GET /api/email/activity
```

### Queue Management
```
GET /api/email/queue/stats
```

### Testing
```
POST /api/email/test
POST /api/email/test/send
```

### Webhooks
```
POST /api/email/webhook (public, signature verified)
```

## Email Templates

Templates are built using React Email components and support:

- **Responsive Design** - Mobile-first approach
- **Modern Styling** - Clean, professional appearance
- **Brand Consistency** - FeatureForge branding
- **Accessibility** - Screen reader friendly
- **Security Messaging** - Clear security notices

### Template Customization

Templates are located in `server/src/services/email/templates/`:

- `InvitationEmail.js` - Team invitation emails
- `PasswordResetEmail.js` - Password reset emails  
- `MentionNotificationEmail.js` - Comment mention notifications

## Queue Management

The email queue provides:

- **Automatic Retries** - 3 attempts with exponential backoff
- **Priority Handling** - Password resets get highest priority
- **Job Persistence** - Jobs survive server restarts
- **Graceful Fallback** - Direct processing when Redis unavailable

### Queue Priorities

1. **Password Reset** (Priority 1) - Immediate processing
2. **Team Invitations** (Priority 2) - Standard processing
3. **Mentions** (Priority 3) - Lower priority

## Analytics & Monitoring

Track email performance with:

- **Delivery Rates** - Successful delivery percentage
- **Open Rates** - Email open tracking
- **Click Rates** - Link click tracking
- **Bounce Rates** - Failed delivery tracking
- **Engagement Analytics** - User interaction metrics

### Performance Recommendations

The system automatically generates recommendations:

- **Delivery Issues** - SPF/DKIM/DMARC configuration
- **Low Engagement** - Subject line optimization
- **High Bounces** - List hygiene suggestions

## Webhook Integration

Resend webhooks provide real-time email events:

- `email.sent` - Email sent successfully
- `email.delivered` - Email delivered to inbox
- `email.opened` - Email opened by recipient
- `email.clicked` - Link clicked in email
- `email.bounced` - Email bounced back
- `email.complained` - Email marked as spam

Configure webhooks in your Resend dashboard:
```
Webhook URL: https://your-domain.com/api/email/webhook
```

## Error Handling

The service includes comprehensive error handling:

- **Provider Failures** - Automatic retry with backoff
- **Network Issues** - Graceful degradation
- **Configuration Errors** - Clear error messages
- **Queue Failures** - Fallback to direct processing

## Production Deployment

### Checklist

- [ ] Domain verified in Resend
- [ ] DNS records configured (SPF, DKIM, DMARC)
- [ ] Environment variables set
- [ ] Redis instance running (optional but recommended)
- [ ] Webhook endpoint configured
- [ ] Test emails sent successfully

### Monitoring

Monitor these metrics in production:

- Email delivery rates (target: >95%)
- Queue processing times
- Error rates and types
- Webhook processing success

### Scaling Considerations

- **Redis Cluster** - For high-volume email processing
- **Multiple Workers** - Scale queue processing
- **Rate Limiting** - Respect Resend API limits
- **Database Storage** - Move analytics to persistent storage

## Migration from Legacy System

The new service is backward compatible with the existing email system:

1. **Gradual Migration** - Old and new systems can coexist
2. **API Compatibility** - Similar method signatures
3. **Fallback Support** - Automatic fallback to old system if needed

### Migration Steps

1. Configure Resend and environment variables
2. Test email service with `npm run test:email`
3. Deploy new service alongside existing system
4. Monitor email delivery and performance
5. Gradually migrate all email sending to new service

## Troubleshooting

### Common Issues

**Emails not sending:**
- Check RESEND_API_KEY is valid
- Verify domain is verified in Resend
- Check EMAIL_FROM_ADDRESS matches verified domain

**Queue not processing:**
- Ensure Redis is running
- Check REDIS_URL configuration
- Monitor queue stats endpoint

**Poor deliverability:**
- Verify SPF, DKIM, DMARC records
- Check sender reputation
- Review email content for spam triggers

### Debug Commands

```bash
# Test email configuration
npm run test:email

# Check queue status
curl http://localhost:5002/api/email/queue/stats

# Get email analytics
curl http://localhost:5002/api/email/analytics
```

## Support

For issues or questions:

1. Check this documentation
2. Review server logs for error messages
3. Test email configuration with test script
4. Monitor Resend dashboard for delivery issues

## Future Enhancements

Planned improvements:

- **Template Editor** - Visual email template editor
- **A/B Testing** - Test different email variants
- **Advanced Analytics** - Cohort analysis and segmentation
- **Email Preferences** - User notification preferences
- **Batch Processing** - Bulk email sending capabilities 