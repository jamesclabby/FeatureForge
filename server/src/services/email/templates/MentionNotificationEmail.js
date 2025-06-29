const React = require('react');
const { 
  Html, 
  Head, 
  Body, 
  Container, 
  Heading, 
  Text, 
  Button, 
  Hr,
  Section,
  Preview
} = require('@react-email/components');

function MentionNotificationEmail({ 
  recipientName, 
  mentionerName, 
  featureTitle, 
  commentContent, 
  featureUrl 
}) {
  return React.createElement(Html, null,
    React.createElement(Head, null),
    React.createElement(Preview, null, `${mentionerName} mentioned you in a comment on FeatureForge`),
    React.createElement(Body, { style: bodyStyle },
      React.createElement(Container, { style: containerStyle },
        React.createElement(Section, { style: headerStyle },
          React.createElement(Heading, { style: headingStyle },
            'You were mentioned in a comment'
          )
        ),
        
        React.createElement(Section, { style: contentStyle },
          React.createElement(Text, { style: textStyle },
            `Hello ${recipientName || 'there'},`
          ),
          React.createElement(Text, { style: textStyle },
            React.createElement('strong', null, mentionerName),
            ' mentioned you in a comment on the feature "',
            React.createElement('strong', null, featureTitle),
            '".'
          )
        ),

        React.createElement(Section, { style: commentSectionStyle },
          React.createElement(Text, { style: commentHeadingStyle },
            'Comment:'
          ),
          React.createElement(Text, { style: commentTextStyle },
            `"${commentContent}"`
          )
        ),

        React.createElement(Section, { style: buttonSectionStyle },
          React.createElement(Button, { 
            href: featureUrl,
            style: buttonStyle 
          },
            'View Comment & Reply'
          )
        ),

        React.createElement(Section, { style: linkSectionStyle },
          React.createElement(Text, { style: smallTextStyle },
            'If the button doesn\'t work, you can copy and paste this link into your browser:'
          ),
          React.createElement(Text, { style: linkStyle },
            featureUrl
          )
        ),

        React.createElement(Hr, { style: hrStyle }),

        React.createElement(Section, { style: contextStyle },
          React.createElement(Text, { style: contextHeadingStyle },
            'About Mentions'
          ),
          React.createElement(Text, { style: contextTextStyle },
            'When someone mentions you with @' + (recipientName || 'username') + ' in a comment, you\'ll receive this notification to keep you in the loop on important discussions.'
          )
        ),

        React.createElement(Hr, { style: hrStyle }),

        React.createElement(Section, { style: footerStyle },
          React.createElement(Text, { style: footerTextStyle },
            'You received this email because you were mentioned in a FeatureForge comment.'
          ),
          React.createElement(Text, { style: footerTextStyle },
            'You can manage your notification preferences in your account settings.'
          )
        )
      )
    )
  );
}

// Styles
const bodyStyle = {
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  backgroundColor: '#f8fafc',
  margin: 0,
  padding: '40px 0'
};

const containerStyle = {
  maxWidth: '600px',
  margin: '0 auto',
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  overflow: 'hidden'
};

const headerStyle = {
  backgroundColor: '#7c3aed',
  padding: '40px 40px 30px 40px',
  textAlign: 'center'
};

const headingStyle = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: 0,
  lineHeight: '1.2'
};

const contentStyle = {
  padding: '40px'
};

const textStyle = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 16px 0'
};

const commentSectionStyle = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  padding: '20px',
  margin: '0 40px 40px 40px'
};

const commentHeadingStyle = {
  color: '#374151',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 12px 0'
};

const commentTextStyle = {
  color: '#4b5563',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: 0,
  fontStyle: 'italic'
};

const buttonSectionStyle = {
  textAlign: 'center',
  padding: '0 40px 40px 40px'
};

const buttonStyle = {
  backgroundColor: '#7c3aed',
  color: '#ffffff',
  padding: '16px 32px',
  borderRadius: '8px',
  textDecoration: 'none',
  fontWeight: 'bold',
  fontSize: '16px',
  display: 'inline-block',
  border: 'none'
};

const linkSectionStyle = {
  padding: '0 40px 40px 40px'
};

const smallTextStyle = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0 0 8px 0'
};

const linkStyle = {
  color: '#7c3aed',
  fontSize: '14px',
  wordBreak: 'break-all',
  margin: 0
};

const contextStyle = {
  padding: '0 40px 40px 40px',
  backgroundColor: '#faf5ff',
  margin: '0 40px',
  borderRadius: '8px'
};

const contextHeadingStyle = {
  color: '#7c3aed',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 12px 0'
};

const contextTextStyle = {
  color: '#5b21b6',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: 0
};

const hrStyle = {
  border: 'none',
  borderTop: '1px solid #e5e7eb',
  margin: '0 40px'
};

const footerStyle = {
  padding: '30px 40px 40px 40px'
};

const footerTextStyle = {
  color: '#9ca3af',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0 0 8px 0'
};

module.exports = MentionNotificationEmail; 