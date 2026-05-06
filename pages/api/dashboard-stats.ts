import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../lib/supabase'
import { verifyAdminKey } from './auth-admin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const adminKey = req.headers['x-admin-key'] as string

  // Verify admin key
  const session = verifyAdminKey(adminKey)
  
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    // Get stats from view
    const { data: stats, error: statsError } = await supabaseAdmin
      .from('dashboard_stats')
      .select('*')
      .single()

    if (statsError) {
      console.error('Stats error:', statsError)
      // Fallback: calculate manually if view doesn't exist
      const [qrisResult, verificationResult] = await Promise.all([
        supabaseAdmin.from('qris_registry').select('id, is_active'),
        supabaseAdmin.from('verification_logs').select('id, is_verified, validated_at')
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
    }

    return res.status(200).json({
      success: true,
      data: stats
    })
  } catch (error: any) {
    console.error('Dashboard stats error:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
