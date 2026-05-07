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
  // Support both admin key (legacy) and Bearer token (new)
  const adminKey = req.headers['x-admin-key'] as string
  const authHeader = req.headers.authorization as string
  
  let userRole = 'admin' // default
  let userId: string | null = null
  let userName = 'Admin'
  let userEmail = ''
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
          .select('id, role, is_active, full_name, email')
          .eq('auth_user_id', user.id)
          .single()

        if (userData && userData.is_active) {
          userId = userData.id
          userRole = userData.role
          userName = userData.full_name || userData.email
          userEmail = userData.email
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
      userRole = session.role
      userName = session.name
      isAuthenticated = true
    }
  }

  if (!isAuthenticated) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // GET - List all QRIS (both admin and superadmin can view)
  if (req.method === 'GET') {
    console.log('📋 Fetching QRIS from qris_database...')
    
    const { data, error } = await supabaseAdmin
      .from('qris_database')
      .select('*')
      .order('registered_at', { ascending: false })

    if (error) {
      console.error('❌ List QRIS error:', error)
      return res.status(500).json({ error: error.message })
    }
    
    console.log('✅ QRIS data fetched:', data?.length || 0, 'items')
    return res.status(200).json({ data, role: userRole })
  }

  // DELETE - Soft delete (deactivate) - SUPERADMIN ONLY
  if (req.method === 'DELETE') {
    if (userRole !== 'superadmin') {
      return res.status(403).json({ 
        error: 'Akses ditolak. Hanya Superadmin yang dapat menonaktifkan QRIS.',
        requiredRole: 'superadmin',
        currentRole: userRole
      })
    }

    const { id } = req.body
    
    // Get QRIS data before deactivating
    const { data: qrisData } = await supabaseAdmin
      .from('qris_database')
      .select('merchant_name, merchant_id, hash')
      .eq('id', id)
      .single()

    const { error } = await supabaseAdmin
      .from('qris_database')
      .update({ is_active: false })
      .eq('id', id)

    if (error) return res.status(500).json({ error: error.message })

    // Log to audit_logs
    await supabaseAdmin.from('audit_logs').insert({
      user_id: userId,
      admin_role: userRole,
      admin_name: userName,
      action: 'DEACTIVATE',
      resource_type: 'QRIS',
      resource_id: id,
      details: {
        merchant_name: qrisData?.merchant_name,
        merchant_id: qrisData?.merchant_id,
        hash: qrisData?.hash?.substring(0, 16) + '...',
        user_email: userEmail
      },
      ip_address: req.headers['x-forwarded-for'] as string || req.socket.remoteAddress,
      user_agent: req.headers['user-agent']
    })

    return res.status(200).json({ success: true, message: 'QRIS dinonaktifkan' })
  }

  // PATCH - Activate or update QRIS - SUPERADMIN ONLY
  if (req.method === 'PATCH') {
    if (userRole !== 'superadmin') {
      return res.status(403).json({ 
        error: 'Akses ditolak. Hanya Superadmin yang dapat mengubah data QRIS.',
        requiredRole: 'superadmin',
        currentRole: userRole
      })
    }

    const { id, action, ...updateData } = req.body

    if (action === 'activate') {
      // Get QRIS data before activating
      const { data: qrisData } = await supabaseAdmin
        .from('qris_database')
        .select('merchant_name, merchant_id, hash')
        .eq('id', id)
        .single()

      // Aktivasi kembali QRIS
      const { error } = await supabaseAdmin
        .from('qris_database')
        .update({ is_active: true })
        .eq('id', id)

      if (error) return res.status(500).json({ error: error.message })

      // Log to audit_logs
      await supabaseAdmin.from('audit_logs').insert({
        user_id: userId,
        admin_role: userRole,
        admin_name: userName,
        action: 'ACTIVATE',
        resource_type: 'QRIS',
        resource_id: id,
        details: {
          merchant_name: qrisData?.merchant_name,
          merchant_id: qrisData?.merchant_id,
          hash: qrisData?.hash?.substring(0, 16) + '...',
          user_email: userEmail
        },
        ip_address: req.headers['x-forwarded-for'] as string || req.socket.remoteAddress,
        user_agent: req.headers['user-agent']
      })

      return res.status(200).json({ success: true, message: 'QRIS diaktifkan kembali' })
    }

    if (action === 'update') {
      // Get old data before updating
      const { data: oldData } = await supabaseAdmin
        .from('qris_database')
        .select('merchant_name, merchant_id, category, notes, hash')
        .eq('id', id)
        .single()

      // Update data QRIS
      const { error } = await supabaseAdmin
        .from('qris_database')
        .update({
          merchant_name: updateData.merchantName,
          merchant_id: updateData.merchantId,
          category: updateData.category,
          notes: updateData.notes || null
        })
        .eq('id', id)

      if (error) return res.status(500).json({ error: error.message })

      // Log to audit_logs
      await supabaseAdmin.from('audit_logs').insert({
        user_id: userId,
        admin_role: userRole,
        admin_name: userName,
        action: 'UPDATE',
        resource_type: 'QRIS',
        resource_id: id,
        details: {
          hash: oldData?.hash?.substring(0, 16) + '...',
          old_data: {
            merchant_name: oldData?.merchant_name,
            merchant_id: oldData?.merchant_id,
            category: oldData?.category,
            notes: oldData?.notes
          },
          new_data: {
            merchant_name: updateData.merchantName,
            merchant_id: updateData.merchantId,
            category: updateData.category,
            notes: updateData.notes
          },
          user_email: userEmail
        },
        ip_address: req.headers['x-forwarded-for'] as string || req.socket.remoteAddress,
        user_agent: req.headers['user-agent']
      })

      return res.status(200).json({ success: true, message: 'Data QRIS berhasil diupdate' })
    }

    return res.status(400).json({ error: 'Invalid action' })
  }

  // PUT - Hard delete (permanent) - SUPERADMIN ONLY
  if (req.method === 'PUT') {
    if (userRole !== 'superadmin') {
      return res.status(403).json({ 
        error: 'Akses ditolak. Hanya Superadmin yang dapat menghapus QRIS secara permanen.',
        requiredRole: 'superadmin',
        currentRole: userRole
      })
    }

    const { id, confirm } = req.body

    if (confirm !== 'DELETE_PERMANENT') {
      return res.status(400).json({ error: 'Konfirmasi diperlukan untuk menghapus permanen' })
    }

    const { error } = await supabaseAdmin
      .from('qris_database')
      .delete()
      .eq('id', id)

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ success: true, message: 'QRIS dihapus permanen' })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
