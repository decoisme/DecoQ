/**
 * Email Service using Nodemailer
 * For sending custom invitation emails
 */

import nodemailer from 'nodemailer'

// Email configuration from environment variables
const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.gmail.com'
const EMAIL_PORT = parseInt(process.env.EMAIL_PORT || '587')
const EMAIL_USER = process.env.EMAIL_USER
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD
const EMAIL_FROM = process.env.EMAIL_FROM || EMAIL_USER

// Create transporter
const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  secure: EMAIL_PORT === 465, // true for 465, false for other ports
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASSWORD,
  },
})

// Verify transporter configuration
export async function verifyEmailConfig(): Promise<boolean> {
  try {
    await transporter.verify()
    console.log('✅ Email server is ready')
    return true
  } catch (error) {
    console.error('❌ Email server error:', error)
    return false
  }
}

// Email template for admin invitation
function getInvitationEmailHTML(params: {
  inviteeName: string
  inviterName: string
  role: 'admin' | 'superadmin'
  confirmationUrl: string
  appName: string
}): string {
  const { inviteeName, inviterName, role, confirmationUrl, appName } = params
  
  const roleLabel = role === 'superadmin' ? 'Super Administrator' : 'Administrator'
  const roleColor = role === 'superadmin' ? '#fff985' : '#60a5fa'
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitation to ${appName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f0f1e;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f0f1e; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05)); border-radius: 16px; border: 1px solid rgba(255,249,133,0.2); overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, rgba(255,249,133,0.15), rgba(255,233,64,0.08));">
              <h1 style="margin: 0; color: #fff; font-size: 28px; font-weight: 800;">
                🎉 You're Invited!
              </h1>
              <p style="margin: 10px 0 0; color: rgba(255,255,255,0.7); font-size: 14px;">
                ${appName} Admin Access
              </p>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #fff; font-size: 16px; line-height: 1.6;">
                Hi <strong>${inviteeName}</strong>,
              </p>
              
              <p style="margin: 0 0 20px; color: rgba(255,255,255,0.8); font-size: 15px; line-height: 1.6;">
                <strong>${inviterName}</strong> has invited you to join <strong>${appName}</strong> as a <strong style="color: ${roleColor};">${roleLabel}</strong>.
              </p>
              
              <!-- Role Badge -->
              <div style="margin: 30px 0; padding: 20px; background: rgba(255,255,255,0.05); border-radius: 12px; border: 1px solid rgba(255,249,133,0.2);">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="color: rgba(255,255,255,0.6); font-size: 12px; text-transform: uppercase; letter-spacing: 1px; padding-bottom: 8px;">
                      Your Role
                    </td>
                  </tr>
                  <tr>
                    <td style="color: ${roleColor}; font-size: 20px; font-weight: 700;">
                      ${roleLabel}
                    </td>
                  </tr>
                  ${role === 'superadmin' ? `
                  <tr>
                    <td style="color: rgba(255,255,255,0.5); font-size: 13px; padding-top: 8px;">
                      Full access to all features including user management
                    </td>
                  </tr>
                  ` : `
                  <tr>
                    <td style="color: rgba(255,255,255,0.5); font-size: 13px; padding-top: 8px;">
                      View-only access to dashboard and reports
                    </td>
                  </tr>
                  `}
                </table>
              </div>
              
              <p style="margin: 30px 0 20px; color: rgba(255,255,255,0.8); font-size: 15px; line-height: 1.6;">
                Click the button below to accept the invitation and set up your account:
              </p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${confirmationUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #fff985, #ffe940); color: #1a1a2e; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 12px rgba(255,249,133,0.3);">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 10px; color: rgba(255,255,255,0.6); font-size: 13px; line-height: 1.6;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin: 0; padding: 12px; background: rgba(0,0,0,0.3); border-radius: 8px; color: rgba(255,249,133,0.7); font-size: 12px; word-break: break-all; font-family: 'Courier New', monospace;">
                ${confirmationUrl}
              </p>
              
              <p style="margin: 30px 0 0; color: rgba(255,255,255,0.5); font-size: 13px; line-height: 1.6;">
                This invitation link will expire in <strong>7 days</strong>. If you didn't expect this invitation, you can safely ignore this email.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background: rgba(0,0,0,0.2); border-top: 1px solid rgba(255,249,133,0.1);">
              <p style="margin: 0; color: rgba(255,255,255,0.4); font-size: 12px; text-align: center; line-height: 1.6;">
                © ${new Date().getFullYear()} ${appName}. All rights reserved.<br>
                This is an automated email. Please do not reply.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}

// Plain text version for email clients that don't support HTML
function getInvitationEmailText(params: {
  inviteeName: string
  inviterName: string
  role: 'admin' | 'superadmin'
  confirmationUrl: string
  appName: string
}): string {
  const { inviteeName, inviterName, role, confirmationUrl, appName } = params
  const roleLabel = role === 'superadmin' ? 'Super Administrator' : 'Administrator'
  
  return `
You're Invited to ${appName}!

Hi ${inviteeName},

${inviterName} has invited you to join ${appName} as a ${roleLabel}.

Your Role: ${roleLabel}
${role === 'superadmin' 
  ? 'Full access to all features including user management' 
  : 'View-only access to dashboard and reports'}

Click the link below to accept the invitation and set up your account:
${confirmationUrl}

This invitation link will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.

© ${new Date().getFullYear()} ${appName}. All rights reserved.
This is an automated email. Please do not reply.
  `
}

// Send invitation email
export async function sendInvitationEmail(params: {
  to: string
  inviteeName: string
  inviterName: string
  role: 'admin' | 'superadmin'
  confirmationUrl: string
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!EMAIL_USER || !EMAIL_PASSWORD) {
      throw new Error('Email configuration is missing. Please set EMAIL_USER and EMAIL_PASSWORD in .env.local')
    }

    const appName = 'DecoQ'
    const roleLabel = params.role === 'superadmin' ? 'Super Administrator' : 'Administrator'
    
    const info = await transporter.sendMail({
      from: `"${appName}" <${EMAIL_FROM}>`,
      to: params.to,
      subject: `🎉 You've been invited to ${appName} as ${roleLabel}`,
      text: getInvitationEmailText({ ...params, appName }),
      html: getInvitationEmailHTML({ ...params, appName }),
    })

    console.log('✅ Email sent:', info.messageId)
    
    return {
      success: true,
      messageId: info.messageId,
    }
  } catch (error: any) {
    console.error('❌ Email send error:', error)
    
    return {
      success: false,
      error: error.message || 'Failed to send email',
    }
  }
}

// Test email configuration
export async function sendTestEmail(to: string): Promise<{ success: boolean; error?: string }> {
  try {
    const info = await transporter.sendMail({
      from: `"DecoQ Test" <${EMAIL_FROM}>`,
      to,
      subject: 'Test Email from DecoQ',
      text: 'This is a test email to verify your email configuration.',
      html: '<p>This is a test email to verify your email configuration.</p>',
    })

    console.log('✅ Test email sent:', info.messageId)
    
    return { success: true }
  } catch (error: any) {
    console.error('❌ Test email error:', error)
    
    return {
      success: false,
      error: error.message,
    }
  }
}
