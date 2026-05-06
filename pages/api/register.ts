import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../lib/supabase'
import { generateQRISHash } from '../../lib/hash'

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'admin123'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { adminKey, rawQRIS, merchantName, merchantId, category, registeredBy, notes } = req.body

  // Validasi admin key
  if (adminKey !== ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized: invalid admin key' })
  }

  if (!rawQRIS || !merchantName || !merchantId) {
    return res.status(400).json({ error: 'rawQRIS, merchantName, dan merchantId wajib diisi' })
  }

  try {
    const hash = await generateQRISHash(rawQRIS)

    // Cek duplikat
    const { data: existing } = await supabaseAdmin
      .from('qris_registry')
      .select('id, merchant_name')
      .eq('hash', hash)
      .single()

    if (existing) {
      return res.status(409).json({
        error: `QRIS ini sudah terdaftar atas nama: ${existing.merchant_name}`,
        hash
      })
    }

    // Daftarkan QRIS
    const { data, error } = await supabaseAdmin
      .from('qris_registry')
      .insert({
        hash,
        merchant_name: merchantName,
        merchant_id: merchantId,
        category: category || 'Umum',
        registered_by: registeredBy || 'Admin',
        notes: notes || null,
        is_active: true
      })
      .select()
      .single()

    if (error) throw error

    return res.status(201).json({
      success: true,
      message: `QRIS berhasil didaftarkan untuk ${merchantName}`,
      hash,
      data
    })
  } catch (err: any) {
    console.error('Register error:', err)
    return res.status(500).json({ error: err.message || 'Internal server error' })
  }
}
