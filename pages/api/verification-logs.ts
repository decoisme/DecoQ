import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../lib/supabase'
import { verifyAdminKey } from './auth-admin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const adminKey = req.headers['x-admin-key'] as string

  // Verify admin key
  const session = verifyAdminKey(adminKey)
  
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // GET - List verification logs with pagination and filters
  if (req.method === 'GET') {
    try {
      const { 
        page = '1', 
        limit = '50',
        status,  // 'verified' | 'failed' | 'all'
        search,
        startDate,
        endDate
      } = req.query

      const pageNum = parseInt(page as string)
      const limitNum = parseInt(limit as string)
      const offset = (pageNum - 1) * limitNum

      let query = supabaseAdmin
        .from('verification_logs')
        .select('*', { count: 'exact' })
        .order('validated_at', { ascending: false })

      // Filter by status
      if (status === 'verified') {
        query = query.eq('is_verified', true)
      } else if (status === 'failed') {
        query = query.eq('is_verified', false)
      }

      // Search by merchant name or ID
      if (search) {
        query = query.or(`merchant_name.ilike.%${search}%,merchant_id.ilike.%${search}%,hash.ilike.%${search}%`)
      }

      // Date range filter
      if (startDate) {
        query = query.gte('validated_at', startDate)
      }
      if (endDate) {
        query = query.lte('validated_at', endDate)
      }

      // Pagination
      query = query.range(offset, offset + limitNum - 1)

      const { data, error, count } = await query

      if (error) throw error

      return res.status(200).json({
        success: true,
        data,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limitNum)
        }
      })
    } catch (error: any) {
      console.error('Verification logs error:', error)
      return res.status(500).json({ error: error.message || 'Internal server error' })
    }
  }

  // POST - Create verification log (called from validate API)
  if (req.method === 'POST') {
    try {
      const { 
        hash, 
        qris_id,
        is_verified, 
        merchant_name,
        merchant_id,
        scanned_data,
        error_message,
        user_agent,
        ip_address 
      } = req.body

      const { data, error } = await supabaseAdmin
        .from('verification_logs')
        .insert({
          hash,
          qris_id: qris_id || null,
          is_verified,
          merchant_name: merchant_name || null,
          merchant_id: merchant_id || null,
          scanned_data: scanned_data || null,
          error_message: error_message || null,
          user_agent: user_agent || null,
          ip_address: ip_address || null
        })
        .select()
        .single()

      if (error) throw error

      return res.status(201).json({
        success: true,
        data
      })
    } catch (error: any) {
      console.error('Create verification log error:', error)
      return res.status(500).json({ error: error.message || 'Internal server error' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
