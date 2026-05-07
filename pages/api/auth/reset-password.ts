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
    const { token, password } = req.body

    if (!token || !password) {
      return res.status(400).json({ error: 'Token dan password diperlukan' })
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password minimal 8 karakter' })
    }

    // Get request details
    const { data: request, error: requestError } = await supabaseAdmin
      .from('password_reset_requests')
      .select('*')
      .eq('reset_token', token)
      .eq('status', 'approved')
      .single()

    if (requestError || !request) {
      return res.status(400).json({ error: 'Token tidak valid' })
    }

    // Check if token expired
    if (request.reset_token_expires_at) {
      const expiresAt = new Date(request.reset_token_expires_at)
      const now = new Date()

      if (now > expiresAt) {
        return res.status(400).json({ error: 'Token sudah kadaluarsa' })
      }
    }

    // Get user by email
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('auth_user_id')
      .eq('email', request.email)
      .single()

    if (userError || !user || !user.auth_user_id) {
      return res.status(404).json({ error: 'User tidak ditemukan' })
    }

    // Update password using Admin API
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.auth_user_id,
      { password }
    )

    if (updateError) {
      console.error('❌ Update password error:', updateError)
      return res.status(500).json({ error: 'Gagal mengupdate password' })
    }

    // Mark request as completed and clear token
    await supabaseAdmin
      .from('password_reset_requests')
      .update({
        status: 'completed',
        reset_token: null,
        reset_token_expires_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', request.id)

    // Update user status to active if not already
    await supabaseAdmin
      .from('users')
      .update({
        is_active: true,
        updated_at: new Date().toISOString()
      })
      .eq('auth_user_id', user.auth_user_id)

    return res.status(200).json({
      success: true,
      message: 'Password berhasil direset'
    })

  } catch (error: any) {
    console.error('❌ Reset password error:', error)
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    })
  }
}
