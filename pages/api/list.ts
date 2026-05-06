import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../lib/supabase'

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'admin123'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const adminKey = req.headers['x-admin-key'] || req.query.adminKey

  if (adminKey !== ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // GET - List all QRIS
  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('qris_registry')
      .select('*')
      .order('registered_at', { ascending: false })

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ data })
  }

  // DELETE - Soft delete (deactivate)
  if (req.method === 'DELETE') {
    const { id } = req.body
    const { error } = await supabaseAdmin
      .from('qris_registry')
      .update({ is_active: false })
      .eq('id', id)

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ success: true, message: 'QRIS dinonaktifkan' })
  }

  // PATCH - Activate or update QRIS
  if (req.method === 'PATCH') {
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

  // PUT - Hard delete (permanent)
  if (req.method === 'PUT') {
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
