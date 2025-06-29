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

function InvitationEmail({ teamName, inviterName, inviteUrl }) {
  return React.createElement(Html, null,
    React.createElement(Head, null),
    React.createElement(Preview, null, `You're invited to join ${teamName} on FeatureForge`),
    React.createElement(Body, { style: bodyStyle },
      React.createElement(Container, { style: containerStyle },
        React.createElement(Section, { style: headerStyle },
          React.createElement(Heading, { style: headingStyle },
            `You're invited to join ${teamName}`
          )
        ),
        
        React.createElement(Section, { style: contentStyle },
          React.createElement(Text, { style: textStyle },
            `Hello!`
          ),
          React.createElement(Text, { style: textStyle },
            React.createElement('strong', null, inviterName),
            ` has invited you to join the team "`,
            React.createElement('strong', null, teamName),
            `" on FeatureForge.`
          ),
          React.createElement(Text, { style: textStyle },
            `FeatureForge is a collaborative platform for feature prioritization and management. Join your team to contribute to product decisions and track feature development.`
          )
        ),

        React.createElement(Section, { style: buttonSectionStyle },
          React.createElement(Button, { 
            href: inviteUrl,
            style: buttonStyle 
          },
            'Accept Invitation'
          )
        ),

        React.createElement(Section, { style: linkSectionStyle },
          React.createElement(Text, { style: smallTextStyle },
            `If the button doesn't work, you can copy and paste this link into your browser:`
          ),
          React.createElement(Text, { style: linkStyle },
            inviteUrl
          )
        ),

        React.createElement(Hr, { style: hrStyle }),

        React.createElement(Section, { style: footerStyle },
          React.createElement(Text, { style: footerTextStyle },
            `If you didn't expect this invitation, you can safely ignore this email.`
          ),
          React.createElement(Text, { style: footerTextStyle },
            `This invitation was sent from FeatureForge.`
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
  backgroundColor: '#0ea5e9',
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

const buttonSectionStyle = {
  textAlign: 'center',
  padding: '0 40px 40px 40px'
};

const buttonStyle = {
  backgroundColor: '#0ea5e9',
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
  color: '#0ea5e9',
  fontSize: '14px',
  wordBreak: 'break-all',
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

module.exports = InvitationEmail; 