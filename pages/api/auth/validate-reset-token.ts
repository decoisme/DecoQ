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
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { token } = req.query

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ 
        valid: false,
        error: 'Token diperlukan' 
      })
    }

    // Check if token exists and not expired
    const { data: request, error } = await supabaseAdmin
      .from('password_reset_requests')
      .select('*')
      .eq('reset_token', token)
      .eq('status', 'approved')
      .single()

    if (error || !request) {
      return res.status(400).json({ 
        valid: false,
        error: 'Token tidak valid' 
      })
    }

    // Check if token expired
    if (request.reset_token_expires_at) {
      const expiresAt = new Date(request.reset_token_expires_at)
      const now = new Date()

      if (now > expiresAt) {
        return res.status(400).json({ 
          valid: false,
          error: 'Token sudah kadaluarsa' 
        })
      }
    }

    return res.status(200).json({ 
      valid: true,
      email: request.email
    })

  } catch (error: any) {
    console.error('❌ Validate token error:', error)
    return res.status(500).json({
      valid: false,
      error: 'Internal server error'
    })
  }
}
