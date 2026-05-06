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
          .select('role, is_active')
          .eq('auth_user_id', user.id)
          .single()

        if (userData && userData.is_active) {
          userRole = userData.role
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
    const { error } = await supabaseAdmin
      .from('qris_database')
      .update({ is_active: false })
      .eq('id', id)

    if (error) return res.status(500).json({ error: error.message })
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
      // Aktivasi kembali QRIS
      const { error } = await supabaseAdmin
        .from('qris_database')
        .update({ is_active: true })
        .eq('id', id)

      if (error) return res.status(500).json({ error: error.message })
      return res.status(200).json({ success: true, message: 'QRIS diaktifkan kembali' })
    }

    if (action === 'update') {
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
