import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

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
    const { data: newUser, error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        email,
        role,
        full_name: fullName || null,
        invited_by: inviter?.id || null,
        is_active: false // Will be activated when they accept invite
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      return res.status(500).json({ error: 'Gagal membuat user record' })
    }

    // Send invite email via Supabase Auth
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

    // Log invite action
    await supabaseAdmin.from('auth_logs').insert({
      user_id: newUser.id,
      email,
      action: 'INVITE_SENT',
      role,
      details: {
        invited_by: user.email,
        full_name: fullName
      },
      ip_address: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      user_agent: req.headers['user-agent']
    })

    return res.status(200).json({
      success: true,
      message: `Invite berhasil dikirim ke ${email}`,
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
