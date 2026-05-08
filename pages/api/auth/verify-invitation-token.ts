import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

// Use service role to bypass RLS
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
    const { token } = req.body

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ 
        valid: false,
        error: 'Token diperlukan' 
      })
    }

    console.log('🔍 Verifying invitation token:', token.substring(0, 10) + '...')

    // Query user by invitation_token using service role (bypasses RLS)
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, role, status, is_active, full_name, invitation_expires_at, auth_user_id, last_login_at')
      .eq('invitation_token', token)
      .single()

    if (error || !user) {
      console.error('❌ User not found:', error)
      return res.status(400).json({ 
        valid: false,
        error: 'Token tidak valid atau sudah digunakan' 
      })
    }

    console.log('✅ User found:', user.email)

    // Check if token expired
    if (user.invitation_expires_at) {
      const expiresAt = new Date(user.invitation_expires_at)
      const now = new Date()

      if (now > expiresAt) {
        console.log('⏰ Token expired')
        return res.status(400).json({ 
          valid: false,
          error: 'Token sudah kadaluarsa. Silakan minta undangan baru.' 
        })
      }
    }

    // Check if already activated
    if (user.is_active && user.last_login_at) {
      console.log('⚠️ User already activated')
      return res.status(200).json({ 
        valid: true,
        alreadyActivated: true,
        user: {
          email: user.email,
          role: user.role,
          fullName: user.full_name
        }
      })
    }

    console.log('✅ Token valid')

    return res.status(200).json({ 
      valid: true,
      alreadyActivated: false,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.full_name,
        authUserId: user.auth_user_id
      }
    })

  } catch (error: any) {
    console.error('❌ Verify token error:', error)
    return res.status(500).json({
      valid: false,
      error: 'Internal server error',
      details: error.message
    })
  }
}
