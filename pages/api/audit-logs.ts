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

      let query = supabaseAdmin
        .from('audit_logs')
        .select('*', { count: 'exact' })
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
