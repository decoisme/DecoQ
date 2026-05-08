import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { sendInvitationEmail } from '../../../lib/email'
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

    // NEW APPROACH: Create auth user with temporary password, then send custom email
    console.log('📧 Creating auth user with temporary password...')
    
    // Generate temporary password (user will change this)
    const tempPassword = crypto.randomBytes(16).toString('hex')
    
    // Create auth user with temporary password
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        role,
        full_name: fullName || null,
        invited_by: user.email
      }
    })

    if (authError) {
      console.error('❌ Create auth user error:', authError)
      return res.status(500).json({ 
        error: 'Gagal membuat auth user',
        details: authError.message
      })
    }

    console.log('✅ Auth user created:', authUser.user.id)
    const authUserId = authUser.user.id
    
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
    
    // Generate invitation token
    const invitationToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    try {
      await supabaseAdmin
        .from('users')
        .update({
          invitation_token: invitationToken,
          invitation_expires_at: expiresAt.toISOString(),
          status: 'pending'
        })
        .eq('id', newUser.id)
      
      console.log('✅ Token stored')
    } catch (e) {
      console.log('⚠️ Token columns not exist yet, skipping token storage')
    }
    
    // ALWAYS send custom email via Nodemailer with our own link
    console.log('📧 Sending custom invitation email via Nodemailer...')
    
    const confirmationUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/confirm?token=${invitationToken}`
    
    try {
      const emailResult = await sendInvitationEmail({
        to: email,
        inviteeName: fullName || email.split('@')[0],
        inviterName: currentUser.full_name || currentUser.email || 'Admin',
        role,
        confirmationUrl
      })
      
      if (!emailResult.success) {
        console.error('❌ Failed to send email:', emailResult.error)
        // Rollback: delete auth user and database record
        await supabaseAdmin.auth.admin.deleteUser(authUserId)
        await supabaseAdmin.from('users').delete().eq('id', newUser.id)
        
        return res.status(500).json({ 
          error: 'Gagal mengirim email invitation',
          details: emailResult.error
        })
      }
      
      console.log('✅ Custom email sent successfully via Nodemailer')
    } catch (emailError: any) {
      console.error('❌ Email sending error:', emailError)
      // Rollback
      await supabaseAdmin.auth.admin.deleteUser(authUserId)
      await supabaseAdmin.from('users').delete().eq('id', newUser.id)
      
      return res.status(500).json({ 
        error: 'Gagal mengirim email invitation',
        details: emailError.message
      })
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
        method: 'nodemailer_custom_link',
        full_name: fullName
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
        method: 'nodemailer_custom_link'
      },
      ip_address: req.headers['x-forwarded-for'] as string || req.socket.remoteAddress,
      user_agent: req.headers['user-agent']
    })

    return res.status(200).json({
      success: true,
      message: `Invite berhasil dikirim ke ${email}. User akan menerima email dengan link aktivasi.`,
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
