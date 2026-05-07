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
    const { email, fullName, reason } = req.body

    console.log('🔐 Password reset request for:', email)

    if (!email || !fullName) {
      return res.status(400).json({ error: 'Email dan nama lengkap diperlukan' })
    }

    // Check if user exists
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, is_active')
      .eq('email', email)
      .single()

    if (userError || !user) {
      // Don't reveal if user exists or not for security
      console.log('⚠️ User not found, but returning success for security')
      return res.status(200).json({
        success: true,
        message: 'Jika email terdaftar, permintaan akan diproses'
      })
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(400).json({ error: 'Akun tidak aktif. Hubungi administrator.' })
    }

    // Check if there's already a pending request
    const { data: existingRequest } = await supabaseAdmin
      .from('password_reset_requests')
      .select('id, status, created_at')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .single()

    if (existingRequest) {
      return res.status(400).json({
        error: 'Anda sudah memiliki permintaan reset password yang sedang diproses'
      })
    }

    // Create password reset request
    const { error: insertError } = await supabaseAdmin
      .from('password_reset_requests')
      .insert({
        user_id: user.id,
        email: user.email,
        full_name: fullName,
        reason: reason || null,
        status: 'pending'
      })

    if (insertError) {
      console.error('❌ Insert error:', insertError)
      throw new Error('Gagal membuat permintaan reset password')
    }

    console.log('✅ Password reset request created')

    return res.status(200).json({
      success: true,
      message: 'Permintaan reset password berhasil dikirim'
    })

  } catch (error: any) {
    console.error('❌ Request password reset error:', error)
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    })
  }
}
