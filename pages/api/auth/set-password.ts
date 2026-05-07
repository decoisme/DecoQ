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
    const { token, password, fullName } = req.body

    console.log('🔐 Set password request for token:', token?.substring(0, 10) + '...')

    if (!token || !password) {
      return res.status(400).json({ error: 'Token dan password diperlukan' })
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password minimal 8 karakter' })
    }

    // Find user by invitation token
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, role, auth_user_id, is_active')
      .eq('invitation_token', token)
      .single()

    if (userError || !user) {
      console.error('❌ User not found:', userError)
      return res.status(404).json({ error: 'Token tidak valid atau sudah digunakan' })
    }

    console.log('✅ User found:', user.email)

    if (!user.auth_user_id) {
      console.error('❌ No auth_user_id')
      return res.status(400).json({ error: 'Auth account tidak ditemukan' })
    }

    // Use Admin API to update user password
    console.log('📝 Updating password via Admin API...')
    const { data: authData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.auth_user_id,
      {
        password: password,
        user_metadata: {
          full_name: fullName || user.email
        },
        email_confirm: true // Confirm email
      }
    )

    if (updateError) {
      console.error('❌ Update password error:', updateError)
      return res.status(500).json({ error: 'Gagal mengatur password: ' + updateError.message })
    }

    console.log('✅ Password updated successfully')

    // Update user record in database
    const { error: dbUpdateError } = await supabaseAdmin
      .from('users')
      .update({
        full_name: fullName || user.email,
        is_active: true,
        last_login_at: new Date().toISOString(),
        invitation_token: null,
        invitation_expires_at: null,
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (dbUpdateError) {
      console.error('❌ Database update error:', dbUpdateError)
      // Don't fail if this errors - password is already set
    }

    console.log('✅ User record updated')

    // Log activation
    await supabaseAdmin.from('auth_logs').insert({
      user_id: user.id,
      email: user.email,
      action: 'ACCOUNT_ACTIVATED',
      role: user.role,
      details: {
        activated_via: 'set_password_api',
        full_name: fullName
      }
    })

    console.log('✅ Activation logged')

    return res.status(200).json({
      success: true,
      message: 'Password berhasil diatur',
      user: {
        email: user.email,
        role: user.role
      }
    })

  } catch (error: any) {
    console.error('❌ Set password error:', error)
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    })
  }
}
