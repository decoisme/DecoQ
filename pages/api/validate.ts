import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../lib/supabase'
import { generateQRISHash } from '../../lib/hash'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { rawQRIS } = req.body

  if (!rawQRIS) {
    return res.status(400).json({ error: 'rawQRIS wajib diisi' })
  }

  try {
    const hash = await generateQRISHash(rawQRIS)

    // Cari di database
    const { data, error } = await supabase
      .from('qris_registry')
      .select('*')
      .eq('hash', hash)
      .eq('is_active', true)
      .single()

    const isVerified = !error && !!data

    // Log validasi
    await supabase.from('validation_logs').insert({
      hash,
      is_verified: isVerified,
      user_agent: req.headers['user-agent'] || 'unknown'
    })

    if (isVerified) {
      return res.status(200).json({
        verified: true,
        hash,
        merchant: {
          name: data.merchant_name,
          id: data.merchant_id,
          category: data.category,
          registeredAt: data.registered_at
        }
      })
    } else {
      return res.status(200).json({
        verified: false,
        hash,
        message: 'QRIS tidak ditemukan dalam database'
      })
    }
  } catch (err: any) {
    console.error('Validate error:', err)
    return res.status(500).json({ error: err.message || 'Internal server error' })
  }
}
