import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { sendInvitationEmail } from '../../../lib/email'

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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { email, role = 'admin', fullName } = req.body

    // Validate input
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Email valid diperlukan' })
    }

    if (!['admin', 'superadmin'].includes(role)) {
      return res.status(400).json({ error: 'Role tidak valid' })
    }

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
      .select('role, is_active')
      .eq('auth_user_id', user.id)
      .single()

    if (currentUserError || !currentUser) {
      return res.status(403).json({ error: 'User tidak ditemukan' })
    }

    if (currentUser.role !== 'superadmin' || !currentUser.is_active) {
      return res.status(403).json({ error: 'Hanya superadmin yang dapat mengundang admin' })
    }

    // Check if email already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id, email, role, is_active')
      .eq('email', email)
      .single()

    if (existingUser) {
      if (existingUser.is_active) {
        return res.status(400).json({ 
          error: 'Email sudah terdaftar',
          details: `User dengan email ${email} sudah aktif sebagai ${existingUser.role}`
        })
      } else {
        // Reactivate inactive user
        const { error: updateError } = await supabaseAdmin
          .from('users')
          .update({ 
            is_active: true, 
            role,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingUser.id)

        if (updateError) {
          return res.status(500).json({ error: 'Gagal mengaktifkan kembali user' })
        }

        // Log action
        await supabaseAdmin.from('auth_logs').insert({
          user_id: existingUser.id,
          email,
          action: 'USER_REACTIVATED',
          role,
          details: { reactivated_by: user.id },
          ip_address: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
          user_agent: req.headers['user-agent']
        })

        return res.status(200).json({
          success: true,
          message: 'User berhasil diaktifkan kembali',
          user: { email, role }
        })
      }
    }

    // Get inviter user_id
    const { data: inviter } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    // Create user record first (before sending invite)
    // Note: status column might not exist yet, so we'll add it conditionally
    const insertData: any = {
      email,
      role,
      full_name: fullName || null,
      invited_by: inviter?.id || null,
      is_active: false, // Will be activated when they accept invite
    }
    
    // Try to add status if column exists
    try {
      insertData.status = 'pending'
    } catch (e) {
      // Column doesn't exist yet, skip it
    }

    const { data: newUser, error: insertError } = await supabaseAdmin
      .from('users')
      .insert(insertData)
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      return res.status(500).json({ 
        error: 'Gagal membuat user record',
        details: insertError.message 
      })
    }

    // Generate secure invitation token
    const crypto = require('crypto')
    const invitationToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    // Store token in database
    await supabaseAdmin
      .from('users')
      .update({
        invitation_token: invitationToken,
        invitation_expires_at: expiresAt.toISOString()
      })
      .eq('id', newUser.id)

    // Send invite email via Supabase Auth OR Nodemailer
    const useNodemailer = process.env.USE_NODEMAILER === 'true'
    
    let inviteSuccess = false
    let inviteMethod = 'supabase'
    
    if (useNodemailer && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      // Use Nodemailer for custom email
      console.log('📧 Sending invite via Nodemailer...')
      
      const confirmationUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/confirm?token=${invitationToken}`
      
      console.log('🔗 Confirmation URL:', confirmationUrl)
      
      const emailResult = await sendInvitationEmail({
        to: email,
        inviteeName: fullName || email.split('@')[0],
        inviterName: user.email || 'Admin',
        role,
        confirmationUrl
      })
      
      if (emailResult.success) {
        inviteSuccess = true
        inviteMethod = 'nodemailer'
        console.log('✅ Invite sent via Nodemailer')
      } else {
        console.error('❌ Nodemailer failed:', emailResult.error)
        // Fallback to Supabase
      }
    }
    
    // Fallback to Supabase Auth if Nodemailer not configured or failed
    if (!inviteSuccess) {
      console.log('📧 Sending invite via Supabase Auth...')
      
      const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        email,
        {
          data: {
            role,
            full_name: fullName || null,
            invited_by: user.email
          },
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`
        }
      )

      if (inviteError) {
        console.error('Invite error:', inviteError)
        
        // Rollback: delete user record
        await supabaseAdmin.from('users').delete().eq('id', newUser.id)
        
        return res.status(500).json({ 
          error: 'Gagal mengirim email invite',
          details: inviteError.message
        })
      }

      // Update user with auth_user_id if available
      if (inviteData.user?.id) {
        await supabaseAdmin
          .from('users')
          .update({ auth_user_id: inviteData.user.id })
          .eq('id', newUser.id)
      }
      
      inviteSuccess = true
      inviteMethod = 'supabase'
      console.log('✅ Invite sent via Supabase Auth')
    }

    // Log invite action
    await supabaseAdmin.from('auth_logs').insert({
      user_id: newUser.id,
      email,
      action: 'INVITE_SENT',
      role,
      details: {
        invited_by: user.email,
        full_name: fullName,
        method: inviteMethod
      },
      ip_address: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      user_agent: req.headers['user-agent']
    })

    return res.status(200).json({
      success: true,
      message: `Invite berhasil dikirim ke ${email}`,
      method: inviteMethod,
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        invited_at: newUser.invited_at
      }
    })

  } catch (error) {
    console.error('Invite admin error:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
