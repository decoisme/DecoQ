import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../lib/supabase'
import { verifyAdminKey } from './auth-admin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const adminKey = req.headers['x-admin-key'] as string || req.query.adminKey as string

  // Verify admin key and get role
  const session = verifyAdminKey(adminKey)
  
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // GET - List all QRIS (both admin and superadmin can view)
  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('qris_registry')
      .select('*')
      .order('registered_at', { ascending: false })

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ data, role: session.role })
  }

  // DELETE - Soft delete (deactivate) - SUPERADMIN ONLY
  if (req.method === 'DELETE') {
    if (session.role !== 'superadmin') {
      return res.status(403).json({ 
        error: 'Akses ditolak. Hanya Superadmin yang dapat menonaktifkan QRIS.',
        requiredRole: 'superadmin',
        currentRole: session.role
      })
    }

    const { id } = req.body
    const { error } = await supabaseAdmin
      .from('qris_registry')
      .update({ is_active: false })
      .eq('id', id)

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ success: true, message: 'QRIS dinonaktifkan' })
  }

  // PATCH - Activate or update QRIS - SUPERADMIN ONLY
  if (req.method === 'PATCH') {
    if (session.role !== 'superadmin') {
      return res.status(403).json({ 
        error: 'Akses ditolak. Hanya Superadmin yang dapat mengubah data QRIS.',
        requiredRole: 'superadmin',
        currentRole: session.role
      })
    }

    const { id, action, ...updateData } = req.body

    if (action === 'activate') {
      // Aktivasi kembali QRIS
      const { error } = await supabaseAdmin
        .from('qris_registry')
        .update({ is_active: true })
        .eq('id', id)

      if (error) return res.status(500).json({ error: error.message })
      return res.status(200).json({ success: true, message: 'QRIS diaktifkan kembali' })
    }

    if (action === 'update') {
      // Update data QRIS
      const { error } = await supabaseAdmin
        .from('qris_registry')
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
    if (session.role !== 'superadmin') {
      return res.status(403).json({ 
        error: 'Akses ditolak. Hanya Superadmin yang dapat menghapus QRIS secara permanen.',
        requiredRole: 'superadmin',
        currentRole: session.role
      })
    }

    const { id, confirm } = req.body

    if (confirm !== 'DELETE_PERMANENT') {
      return res.status(400).json({ error: 'Konfirmasi diperlukan untuk menghapus permanen' })
    }

    const { error } = await supabaseAdmin
      .from('qris_registry')
      .delete()
      .eq('id', id)

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ success: true, message: 'QRIS dihapus permanen' })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
