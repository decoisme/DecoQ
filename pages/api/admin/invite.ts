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

  console.log('📨 Invite request received:', { email: req.body.email, role: req.body.role })

  try {
    const { email, role = 'admin', fullName } = req.body

    // Validate input
    if (!email || !email.includes('@')) {
      console.log('❌ Invalid email:', email)
      return res.status(400).json({ error: 'Email valid diperlukan' })
    }

    if (!['admin', 'superadmin'].includes(role)) {
      console.log('❌ Invalid role:', role)
      return res.status(400).json({ error: 'Role tidak valid' })
    }

    // Get current user from session
    const authHeader = req.headers.authorization
    if (!authHeader) {
      console.log('❌ No auth header')
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)

    if (userError || !user) {
      console.log('❌ Invalid token:', userError)
      return res.status(401).json({ error: 'Invalid token' })
    }

    console.log('✅ Current user:', user.email)

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
          details: { 
            reactivated_by: currentUser.email,
            reactivated_by_id: currentUser.id
          },
          ip_address: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
          user_agent: req.headers['user-agent']
        })

        // Also log to audit_logs
        await supabaseAdmin.from('audit_logs').insert({
          user_id: currentUser.id,
          admin_role: currentUser.role,
          admin_name: currentUser.full_name || currentUser.email,
          action: 'ACTIVATE',
          resource_type: 'USER',
          resource_id: existingUser.id,
          details: {
            user_email: email,
            role,
            action_type: 'reactivate'
          },
          ip_address: req.headers['x-forwarded-for'] as string || req.socket.remoteAddress,
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

    // Send invite email via Supabase Auth OR Nodemailer
    const useNodemailer = process.env.USE_NODEMAILER === 'true'
    
    let inviteSuccess = false
    let inviteMethod = 'supabase'
    let authUserId = null
    
    // Always try Supabase Auth first (this creates the auth user)
    console.log('📧 Sending invite via Supabase Auth to:', email)
    console.log('🔗 Redirect URL:', `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`)
    
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
      console.error('❌ Supabase invite error:', inviteError)
      console.error('Error details:', JSON.stringify(inviteError, null, 2))
      return res.status(500).json({ 
        error: 'Gagal mengirim email invite',
        details: inviteError.message
      })
    }

    console.log('✅ Supabase invite response:', inviteData)

    // Get the auth user ID from invite
    authUserId = inviteData.user?.id
    
    if (!authUserId) {
      console.error('❌ No auth_user_id from invite response')
      return res.status(500).json({ 
        error: 'Gagal mendapatkan auth user ID'
      })
    }
    
    inviteSuccess = true
    console.log('✅ Invite sent via Supabase Auth, auth_user_id:', authUserId)
    
    // Now create user record with auth_user_id
    console.log('💾 Inserting user record to database...')
    
    const { data: newUser, error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        email,
        role,
        full_name: fullName || null,
        invited_by: inviter?.id || null,
        is_active: false,
        auth_user_id: authUserId // Link to auth user
      })
      .select()
      .single()

    if (insertError) {
      console.error('❌ Insert error:', insertError)
      console.error('Insert error details:', JSON.stringify(insertError, null, 2))
      
      // Rollback: delete auth user
      console.log('🔄 Rolling back: deleting auth user...')
      try {
        await supabaseAdmin.auth.admin.deleteUser(authUserId)
        console.log('✅ Auth user deleted')
      } catch (e) {
        console.error('❌ Failed to rollback auth user:', e)
      }
      
      return res.status(500).json({ 
        error: 'Gagal membuat user record',
        details: insertError.message 
      })
    }
    
    console.log('✅ User record created:', newUser.id)
    
    // Try to store token if columns exist (optional)
    const crypto = require('crypto')
    const invitationToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    try {
      await supabaseAdmin
        .from('users')
        .update({
          invitation_token: invitationToken,
          invitation_expires_at: expiresAt.toISOString()
        })
        .eq('id', newUser.id)
      
      console.log('✅ Token stored')
    } catch (e) {
      console.log('⚠️ Token columns not exist yet, skipping token storage')
    }
    
    // Optionally send custom email via Nodemailer
    if (useNodemailer && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      console.log('📧 Also sending custom email via Nodemailer...')
      
      const confirmationUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/confirm?token=${invitationToken}`
      
      const emailResult = await sendInvitationEmail({
        to: email,
        inviteeName: fullName || email.split('@')[0],
        inviterName: user.email || 'Admin',
        role,
        confirmationUrl
      })
      
      if (emailResult.success) {
        inviteMethod = 'both'
        console.log('✅ Custom email also sent via Nodemailer')
      }
    }

    // Log invite action
    await supabaseAdmin.from('auth_logs').insert({
      user_id: newUser.id,
      email,
      action: 'INVITE_SENT',
      role,
      details: {
        invited_by: currentUser.email,
        invited_by_id: currentUser.id,
        full_name: fullName,
        method: inviteMethod
      },
      ip_address: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      user_agent: req.headers['user-agent']
    })

    // Also log to audit_logs
    await supabaseAdmin.from('audit_logs').insert({
      user_id: currentUser.id,
      admin_role: currentUser.role,
      admin_name: currentUser.full_name || currentUser.email,
      action: 'CREATE',
      resource_type: 'USER',
      resource_id: newUser.id,
      details: {
        invited_email: email,
        invited_role: role,
        invited_name: fullName,
        method: inviteMethod
      },
      ip_address: req.headers['x-forwarded-for'] as string || req.socket.remoteAddress,
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
