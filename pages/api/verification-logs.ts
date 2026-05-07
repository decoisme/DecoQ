import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { verifyAdminKey } from './auth-admin'

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
        // Get user role from users table
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
    const session = verifyAdminKey(adminKey)
    if (session) {
      isAuthenticated = true
    }
  }

  if (!isAuthenticated) {
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
