import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../lib/supabase'

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'admin123'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const adminKey = req.headers['x-admin-key'] || req.query.adminKey

  if (adminKey !== ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('qris_registry')
      .select('*')
      .order('registered_at', { ascending: false })

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ data })
  }

  if (req.method === 'DELETE') {
    const { id } = req.body
    const { error } = await supabaseAdmin
      .from('qris_registry')
      .update({ is_active: false })
      .eq('id', id)

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ success: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
