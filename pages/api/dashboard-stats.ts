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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Support both admin key (legacy) and Bearer token (new)
  const adminKey = req.headers['x-admin-key'] as string
  const authHeader = req.headers.authorization as string
  
  let isAuthenticated = false

  // Try Bearer token first (new auth system)
  if (authHeader) {
    try {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)

      if (!userError && user) {
        const { data: userData } = await supabaseAdmin
          .from('users')
          .select('is_active')
          .eq('auth_user_id', user.id)
          .single()

        if (userData && userData.is_active) {
          isAuthenticated = true
        }
      }
    } catch (error) {
      console.error('Token auth error:', error)
    }
  }

  // Fallback to admin key (legacy)
  if (!isAuthenticated && adminKey) {
    const { verifyAdminKey } = await import('./auth-admin')
    const session = verifyAdminKey(adminKey)
    
    if (session) {
      isAuthenticated = true
    }
  }

  if (!isAuthenticated) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    // Calculate stats manually (no view dependency)
    const [qrisResult, verificationResult] = await Promise.all([
      supabaseAdmin.from('qris_database').select('id, is_active'),
      supabaseAdmin.from('validation_logs').select('id, is_verified, validated_at')
    ])

    const totalQris = qrisResult.data?.length || 0
    const totalActiveQris = qrisResult.data?.filter(q => q.is_active).length || 0
    const totalVerifications = verificationResult.data?.length || 0
    const successfulVerifications = verificationResult.data?.filter(v => v.is_verified).length || 0
    
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    const verificationsToday = verificationResult.data?.filter(
      v => new Date(v.validated_at) >= oneDayAgo
    ).length || 0
    
    const verificationsWeek = verificationResult.data?.filter(
      v => new Date(v.validated_at) >= oneWeekAgo
    ).length || 0

    const successRate = totalVerifications > 0 
      ? Math.round((successfulVerifications / totalVerifications) * 100 * 100) / 100
      : 0

    return res.status(200).json({
      success: true,
      data: {
        total_qris: totalQris,
        total_active_qris: totalActiveQris,
        total_verifications: totalVerifications,
        successful_verifications: successfulVerifications,
        verifications_today: verificationsToday,
        verifications_week: verificationsWeek,
        success_rate: successRate
      }
    })
  } catch (error: any) {
    console.error('Dashboard stats error:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
