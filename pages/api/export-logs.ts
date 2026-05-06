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
    const { 
      type = 'verification', // 'verification' | 'audit'
      status,
      startDate,
      endDate
    } = req.query

    let data: any[] = []
    let filename = ''
    let csvContent = ''

    if (type === 'verification') {
      // Export verification logs
      let query = supabaseAdmin
        .from('verification_logs')
        .select('*')
        .order('validated_at', { ascending: false })

      if (status === 'verified') {
        query = query.eq('is_verified', true)
      } else if (status === 'failed') {
        query = query.eq('is_verified', false)
      }

      if (startDate) {
        query = query.gte('validated_at', startDate)
      }
      if (endDate) {
        query = query.lte('validated_at', endDate)
      }

      const { data: logs, error } = await query

      if (error) throw error

      data = logs || []
      filename = `verification-logs-${new Date().toISOString().split('T')[0]}.csv`

      // CSV Headers
      csvContent = 'ID,Hash,Verified,Merchant Name,Merchant ID,Validated At,IP Address,User Agent,Error Message\n'

      // CSV Rows
      data.forEach(log => {
        const row = [
          log.id,
          log.hash,
          log.is_verified ? 'Yes' : 'No',
          log.merchant_name || '-',
          log.merchant_id || '-',
          new Date(log.validated_at).toISOString(),
          log.ip_address || '-',
          log.user_agent || '-',
          log.error_message || '-'
        ].map(field => `"${String(field).replace(/"/g, '""')}"`) // Escape quotes
        
        csvContent += row.join(',') + '\n'
      })

    } else if (type === 'audit') {
      // Export audit logs
      let query = supabaseAdmin
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })

      if (startDate) {
        query = query.gte('created_at', startDate)
      }
      if (endDate) {
        query = query.lte('created_at', endDate)
      }

      const { data: logs, error } = await query

      if (error) throw error

      data = logs || []
      filename = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`

      // CSV Headers
      csvContent = 'ID,Admin Role,Admin Name,Action,Resource Type,Resource ID,Created At,IP Address,Details\n'

      // CSV Rows
      data.forEach(log => {
        const row = [
          log.id,
          log.admin_role,
          log.admin_name,
          log.action,
          log.resource_type,
          log.resource_id || '-',
          new Date(log.created_at).toISOString(),
          log.ip_address || '-',
          log.details ? JSON.stringify(log.details).replace(/"/g, '""') : '-'
        ].map(field => `"${String(field).replace(/"/g, '""')}"`)
        
        csvContent += row.join(',') + '\n'
      })
    } else {
      return res.status(400).json({ error: 'Invalid export type. Use "verification" or "audit"' })
    }

    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Cache-Control', 'no-cache')

    // Add BOM for Excel UTF-8 support
    const BOM = '\uFEFF'
    return res.status(200).send(BOM + csvContent)

  } catch (error: any) {
    console.error('Export logs error:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
