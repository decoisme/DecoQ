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

  // GET - List audit logs with pagination and filters
  if (req.method === 'GET') {
    try {
      const { 
        page = '1', 
        limit = '50',
        action,      // 'CREATE' | 'UPDATE' | 'DELETE' | 'ACTIVATE' | 'DEACTIVATE'
        adminRole,   // 'admin' | 'superadmin'
        resourceType, // 'QRIS' | 'USER'
        startDate,
        endDate
      } = req.query

      const pageNum = parseInt(page as string)
      const limitNum = parseInt(limit as string)
      const offset = (pageNum - 1) * limitNum

      // Query with left join to users table to get email
      let query = supabaseAdmin
        .from('audit_logs')
        .select(`
          *,
          user:users!audit_logs_user_id_fkey(email, full_name)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })

      // Filters
      if (action) {
        query = query.eq('action', action)
      }
      if (adminRole) {
        query = query.eq('admin_role', adminRole)
      }
      if (resourceType) {
        query = query.eq('resource_type', resourceType)
      }

      // Date range filter
      if (startDate) {
        query = query.gte('created_at', startDate)
      }
      if (endDate) {
        query = query.lte('created_at', endDate)
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
      console.error('Audit logs error:', error)
      return res.status(500).json({ error: error.message || 'Internal server error' })
    }
  }

  // POST - Create audit log
  if (req.method === 'POST') {
    try {
      const { 
        user_id,
        admin_role,
        admin_name,
        action,
        resource_type,
        resource_id,
        details,
        ip_address,
        user_agent
      } = req.body

      if (!admin_role || !admin_name || !action || !resource_type) {
        return res.status(400).json({ 
          error: 'Missing required fields: admin_role, admin_name, action, resource_type' 
        })
      }

      const { data, error } = await supabaseAdmin
        .from('audit_logs')
        .insert({
          user_id: user_id || null,
          admin_role,
          admin_name,
          action,
          resource_type,
          resource_id: resource_id || null,
          details: details || null,
          ip_address: ip_address || null,
          user_agent: user_agent || null
        })
        .select()
        .single()

      if (error) throw error

      return res.status(201).json({
        success: true,
        data
      })
    } catch (error: any) {
      console.error('Create audit log error:', error)
      return res.status(500).json({ error: error.message || 'Internal server error' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

// Helper function to create audit log (for use in other APIs)
export async function createAuditLog(params: {
  userId?: string
  adminRole: string
  adminName: string
  action: string
  resourceType: string
  resourceId?: string
  details?: any
  ipAddress?: string
  userAgent?: string
}) {
  try {
    await supabaseAdmin.from('audit_logs').insert({
      user_id: params.userId || null,
      admin_role: params.adminRole,
      admin_name: params.adminName,
      action: params.action,
      resource_type: params.resourceType,
      resource_id: params.resourceId || null,
      details: params.details || null,
      ip_address: params.ipAddress || null,
      user_agent: params.userAgent || null
    })
  } catch (error) {
    console.error('Failed to create audit log:', error)
    // Don't throw - audit log failure shouldn't break main operation
  }
}
