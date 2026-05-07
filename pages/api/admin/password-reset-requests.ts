import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Email function (will be imported from lib/email.ts later)
async function sendPasswordResetEmail(params: {
  to: string
  userName: string
  resetUrl?: string
  isApproved: boolean
  rejectionReason?: string
}) {
  const nodemailer = require('nodemailer')
  
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    tls: { rejectUnauthorized: false }
  })

  const { to, userName, resetUrl, isApproved, rejectionReason } = params

  if (isApproved && resetUrl) {
    // Approved email
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset Approved</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f0f1e;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f0f1e; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05)); border-radius: 16px; border: 1px solid rgba(34,197,94,0.3); overflow: hidden;">
          <tr>
            <td style="padding: 40px; text-align: center; background: linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.08));">
              <h1 style="margin: 0; color: #4ade80; font-size: 28px; font-weight: 800;">✅ Request Approved</h1>
              <p style="margin: 10px 0 0; color: rgba(255,255,255,0.7); font-size: 14px;">Your password reset request has been approved</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #fff; font-size: 16px;">Hi <strong>${userName}</strong>,</p>
              <p style="margin: 0 0 20px; color: rgba(255,255,255,0.8); font-size: 15px; line-height: 1.6;">
                Your password reset request has been <strong style="color: #4ade80;">approved</strong> by the administrator. You can now reset your password by clicking the button below:
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #4ade80, #22c55e); color: #fff; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 30px 0 10px; color: rgba(255,255,255,0.6); font-size: 13px;">Or copy this link:</p>
              <p style="margin: 0; padding: 12px; background: rgba(0,0,0,0.3); border-radius: 8px; color: rgba(34,197,94,0.7); font-size: 12px; word-break: break-all; font-family: monospace;">
                ${resetUrl}
              </p>
              <p style="margin: 30px 0 0; color: rgba(255,255,255,0.5); font-size: 13px;">
                This link will expire in <strong>1 hour</strong>. If you didn't request this, please contact your administrator.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px 40px; background: rgba(0,0,0,0.2); border-top: 1px solid rgba(34,197,94,0.1);">
              <p style="margin: 0; color: rgba(255,255,255,0.4); font-size: 12px; text-align: center;">
                © ${new Date().getFullYear()} DecoQ. All rights reserved.
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

    await transporter.sendMail({
      from: `"DecoQ" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to,
      subject: '✅ Password Reset Request Approved',
      html
    })
  } else {
    // Rejected email
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset Rejected</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f0f1e;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f0f1e; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05)); border-radius: 16px; border: 1px solid rgba(239,68,68,0.3); overflow: hidden;">
          <tr>
            <td style="padding: 40px; text-align: center; background: linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.08));">
              <h1 style="margin: 0; color: #f87171; font-size: 28px; font-weight: 800;">❌ Request Rejected</h1>
              <p style="margin: 10px 0 0; color: rgba(255,255,255,0.7); font-size: 14px;">Your password reset request was not approved</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #fff; font-size: 16px;">Hi <strong>${userName}</strong>,</p>
              <p style="margin: 0 0 20px; color: rgba(255,255,255,0.8); font-size: 15px; line-height: 1.6;">
                Unfortunately, your password reset request has been <strong style="color: #f87171;">rejected</strong> by the administrator.
              </p>
              ${rejectionReason ? `
              <div style="margin: 30px 0; padding: 20px; background: rgba(239,68,68,0.1); border-radius: 12px; border: 1px solid rgba(239,68,68,0.2);">
                <p style="margin: 0 0 8px; color: rgba(255,255,255,0.6); font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Reason</p>
                <p style="margin: 0; color: rgba(255,255,255,0.9); font-size: 15px; line-height: 1.6;">${rejectionReason}</p>
              </div>
              ` : ''}
              <p style="margin: 30px 0 0; color: rgba(255,255,255,0.6); font-size: 14px; line-height: 1.6;">
                If you believe this is a mistake or need further assistance, please contact your administrator directly.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px 40px; background: rgba(0,0,0,0.2); border-top: 1px solid rgba(239,68,68,0.1);">
              <p style="margin: 0; color: rgba(255,255,255,0.4); font-size: 12px; text-align: center;">
                © ${new Date().getFullYear()} DecoQ. All rights reserved.
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

    await transporter.sendMail({
      from: `"DecoQ" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to,
      subject: '❌ Password Reset Request Rejected',
      html
    })
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Get current user from session
    const authHeader = req.headers.authorization
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)

    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    // Check if current user is superadmin
    const { data: currentUser, error: currentUserError } = await supabaseAdmin
      .from('users')
      .select('id, role, is_active, full_name, email')
      .eq('auth_user_id', user.id)
      .single()

    if (currentUserError || !currentUser) {
      return res.status(403).json({ error: 'User tidak ditemukan' })
    }

    if (currentUser.role !== 'superadmin' || !currentUser.is_active) {
      return res.status(403).json({ error: 'Hanya superadmin yang dapat mengelola password reset requests' })
    }

    // GET - List all password reset requests
    if (req.method === 'GET') {
      const { status = 'pending' } = req.query

      const { data, error } = await supabaseAdmin
        .from('password_reset_requests')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      return res.status(200).json({
        success: true,
        data
      })
    }

    // PATCH - Approve or reject request
    if (req.method === 'PATCH') {
      const { requestId, action, rejectionReason } = req.body

      if (!requestId || !action) {
        return res.status(400).json({ error: 'Request ID dan action diperlukan' })
      }

      if (!['approve', 'reject'].includes(action)) {
        return res.status(400).json({ error: 'Action tidak valid' })
      }

      // Get request details
      const { data: request, error: requestError } = await supabaseAdmin
        .from('password_reset_requests')
        .select('*')
        .eq('id', requestId)
        .single()

      if (requestError || !request) {
        return res.status(404).json({ error: 'Request tidak ditemukan' })
      }

      if (request.status !== 'pending') {
        return res.status(400).json({ error: 'Request sudah diproses sebelumnya' })
      }

      if (action === 'approve') {
        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex')
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

        // Update request
        const { error: updateError } = await supabaseAdmin
          .from('password_reset_requests')
          .update({
            status: 'approved',
            reset_token: resetToken,
            reset_token_expires_at: expiresAt.toISOString(),
            reviewed_by: currentUser.id,
            reviewed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', requestId)

        if (updateError) {
          throw updateError
        }

        // Send approval email with reset link
        const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`
        
        await sendPasswordResetEmail({
          to: request.email,
          userName: request.full_name,
          resetUrl,
          isApproved: true
        })

        // Log action
        await supabaseAdmin.from('audit_logs').insert({
          user_id: currentUser.id,
          admin_role: currentUser.role,
          admin_name: currentUser.full_name || currentUser.email,
          action: 'APPROVE',
          resource_type: 'PASSWORD_RESET_REQUEST',
          resource_id: requestId,
          details: {
            target_email: request.email,
            target_name: request.full_name
          },
          ip_address: req.headers['x-forwarded-for'] as string || req.socket.remoteAddress,
          user_agent: req.headers['user-agent']
        })

        return res.status(200).json({
          success: true,
          message: 'Request disetujui dan email telah dikirim'
        })
      } else {
        // Reject
        const { error: updateError } = await supabaseAdmin
          .from('password_reset_requests')
          .update({
            status: 'rejected',
            rejection_reason: rejectionReason || null,
            reviewed_by: currentUser.id,
            reviewed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', requestId)

        if (updateError) {
          throw updateError
        }

        // Send rejection email
        await sendPasswordResetEmail({
          to: request.email,
          userName: request.full_name,
          isApproved: false,
          rejectionReason
        })

        // Log action
        await supabaseAdmin.from('audit_logs').insert({
          user_id: currentUser.id,
          admin_role: currentUser.role,
          admin_name: currentUser.full_name || currentUser.email,
          action: 'REJECT',
          resource_type: 'PASSWORD_RESET_REQUEST',
          resource_id: requestId,
          details: {
            target_email: request.email,
            target_name: request.full_name,
            rejection_reason: rejectionReason
          },
          ip_address: req.headers['x-forwarded-for'] as string || req.socket.remoteAddress,
          user_agent: req.headers['user-agent']
        })

        return res.status(200).json({
          success: true,
          message: 'Request ditolak dan email telah dikirim'
        })
      }
    }

    return res.status(405).json({ error: 'Method not allowed' })

  } catch (error: any) {
    console.error('❌ Password reset requests error:', error)
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    })
  }
}
