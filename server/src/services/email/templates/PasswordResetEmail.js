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

function PasswordResetEmail({ resetUrl }) {
  return React.createElement(Html, null,
    React.createElement(Head, null),
    React.createElement(Preview, null, 'Reset your FeatureForge password'),
    React.createElement(Body, { style: bodyStyle },
      React.createElement(Container, { style: containerStyle },
        React.createElement(Section, { style: headerStyle },
          React.createElement(Heading, { style: headingStyle },
            'Password Reset Request'
          )
        ),
        
        React.createElement(Section, { style: contentStyle },
          React.createElement(Text, { style: textStyle },
            'Hello,'
          ),
          React.createElement(Text, { style: textStyle },
            'You requested a password reset for your FeatureForge account. Click the button below to create a new password.'
          ),
          React.createElement(Text, { style: alertTextStyle },
            'This link will expire in 1 hour for security reasons.'
          )
        ),

        React.createElement(Section, { style: buttonSectionStyle },
          React.createElement(Button, { 
            href: resetUrl,
            style: buttonStyle 
          },
            'Reset My Password'
          )
        ),

        React.createElement(Section, { style: linkSectionStyle },
          React.createElement(Text, { style: smallTextStyle },
            'If the button doesn\'t work, you can copy and paste this link into your browser:'
          ),
          React.createElement(Text, { style: linkStyle },
            resetUrl
          )
        ),

        React.createElement(Hr, { style: hrStyle }),

        React.createElement(Section, { style: securitySectionStyle },
          React.createElement(Text, { style: securityHeadingStyle },
            'Security Notice'
          ),
          React.createElement(Text, { style: securityTextStyle },
            '• If you didn\'t request this password reset, please ignore this email'
          ),
          React.createElement(Text, { style: securityTextStyle },
            '• Your password will remain unchanged if you don\'t click the link'
          ),
          React.createElement(Text, { style: securityTextStyle },
            '• This link will expire automatically for your security'
          )
        ),

        React.createElement(Hr, { style: hrStyle }),

        React.createElement(Section, { style: footerStyle },
          React.createElement(Text, { style: footerTextStyle },
            'This email was sent from FeatureForge. If you have any questions, please contact support.'
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
  backgroundColor: '#dc2626',
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

const alertTextStyle = {
  color: '#dc2626',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 16px 0',
  fontWeight: '600'
};

const buttonSectionStyle = {
  textAlign: 'center',
  padding: '0 40px 40px 40px'
};

const buttonStyle = {
  backgroundColor: '#dc2626',
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
  color: '#dc2626',
  fontSize: '14px',
  wordBreak: 'break-all',
  margin: 0
};

const securitySectionStyle = {
  padding: '0 40px 40px 40px',
  backgroundColor: '#fef3f2',
  margin: '0 40px',
  borderRadius: '8px'
};

const securityHeadingStyle = {
  color: '#dc2626',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 16px 0'
};

const securityTextStyle = {
  color: '#7f1d1d',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0 0 8px 0'
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
  margin: 0
};

module.exports = PasswordResetEmail; 