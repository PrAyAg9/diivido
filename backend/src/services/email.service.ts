import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface InvitationEmailData {
  email: string;
  inviterName: string;
  groupName?: string;
  invitationToken: string;
}

export const sendInvitationEmail = async (data: InvitationEmailData): Promise<void> => {
  const { email, inviterName, groupName, invitationToken } = data;
  
  // Create the invitation link
  const invitationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invite/${invitationToken}`;
  
  const subject = groupName 
    ? `${inviterName} invited you to join "${groupName}" on Divido`
    : `${inviterName} invited you to join Divido`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invitation to Divido</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f9fafb;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: 32px 24px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 600;
        }
        .content {
          padding: 32px 24px;
        }
        .invitation-box {
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 24px;
          margin: 24px 0;
          text-align: center;
        }
        .cta-button {
          display: inline-block;
          background-color: #10b981;
          color: white;
          padding: 12px 24px;
          border-radius: 6px;
          text-decoration: none;
          font-weight: 600;
          margin: 24px 0;
        }
        .cta-button:hover {
          background-color: #059669;
        }
        .footer {
          background-color: #f8fafc;
          padding: 24px;
          text-align: center;
          color: #6b7280;
          font-size: 14px;
        }
        .logo {
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 8px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Divido</div>
          <h1>You're invited!</h1>
        </div>
        
        <div class="content">
          <p><strong>${inviterName}</strong> has invited you to ${groupName ? `join the group "${groupName}"` : 'join Divido'} - the easiest way to split expenses with friends.</p>
          
          <div class="invitation-box">
            ${groupName ? `<h3>Group: ${groupName}</h3>` : ''}
            <p>Join now to start splitting expenses and never worry about who owes what!</p>
            
            <a href="${invitationLink}" class="cta-button">Accept Invitation</a>
          </div>
          
          <p><strong>What is Divido?</strong></p>
          <ul>
            <li>Split expenses easily with friends and groups</li>
            <li>Track who owes what in real-time</li>
            <li>Settle debts with integrated payments</li>
            <li>Never argue about money again!</li>
          </ul>
          
          <p>If you can't click the button above, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #6b7280; font-family: monospace;">${invitationLink}</p>
          
          <p style="margin-top: 32px; color: #6b7280; font-size: 14px;">
            This invitation will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.
          </p>
        </div>
        
        <div class="footer">
          <p>© 2024 Divido. All rights reserved.</p>
          <p>Happy splitting! 💰</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
    ${inviterName} invited you to ${groupName ? `join "${groupName}"` : 'join Divido'}
    
    ${groupName ? `Group: ${groupName}` : ''}
    
    Join Divido to split expenses with friends and never worry about who owes what!
    
    Click here to accept: ${invitationLink}
    
    What is Divido?
    - Split expenses easily with friends and groups
    - Track who owes what in real-time  
    - Settle debts with integrated payments
    - Never argue about money again!
    
    This invitation expires in 7 days.
    
    © 2024 Divido. Happy splitting! 💰
  `;

  const mailOptions = {
    from: `"Divido" <${process.env.SMTP_USER}>`,
    to: email,
    subject,
    html: htmlContent,
    text: textContent,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Invitation email sent successfully to ${email}`);
  } catch (error) {
    console.error('Error sending invitation email:', error);
    throw new Error('Failed to send invitation email');
  }
};

export const sendWelcomeEmail = async (email: string, fullName: string): Promise<void> => {
  const subject = 'Welcome to Divido! 🎉';
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Divido</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f9fafb;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: 32px 24px;
          text-align: center;
        }
        .content {
          padding: 32px 24px;
        }
        .feature-box {
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
          margin: 16px 0;
        }
        .footer {
          background-color: #f8fafc;
          padding: 24px;
          text-align: center;
          color: #6b7280;
          font-size: 14px;
        }
        .logo {
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 8px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Divido</div>
          <h1>Welcome to Divido, ${fullName}! 🎉</h1>
        </div>
        
        <div class="content">
          <p>Thanks for joining Divido! You're now part of a community that makes splitting expenses simple and stress-free.</p>
          
          <h3>Here's what you can do:</h3>
          
          <div class="feature-box">
            <h4>🏗️ Create Groups</h4>
            <p>Start a group for your trips, dinners, or shared living expenses</p>
          </div>
          
          <div class="feature-box">
            <h4>💰 Add Expenses</h4>
            <p>Easily add expenses and choose how to split them</p>
          </div>
          
          <div class="feature-box">
            <h4>📊 Track Balances</h4>
            <p>See who owes what at a glance</p>
          </div>
          
          <div class="feature-box">
            <h4>💸 Settle Up</h4>
            <p>Pay friends directly through the app</p>
          </div>
          
          <p>Ready to get started? Open the Divido app and create your first group!</p>
          
          <p>Happy splitting! 💰</p>
        </div>
        
        <div class="footer">
          <p>© 2024 Divido. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"Divido" <${process.env.SMTP_USER}>`,
    to: email,
    subject,
    html: htmlContent,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent successfully to ${email}`);
  } catch (error) {
    console.error('Error sending welcome email:', error);
    // Don't throw error for welcome email failure - it's not critical
  }
};
