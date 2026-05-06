import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase, supabaseAdmin } from '../../lib/supabase'
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

    // Get client info
    const userAgent = req.headers['user-agent'] || 'unknown'
    const ipAddress = req.headers['x-forwarded-for'] as string || 
                      req.headers['x-real-ip'] as string || 
                      req.socket.remoteAddress || 
                      'unknown'

    // Log verification dengan detail lengkap
    await supabaseAdmin.from('verification_logs').insert({
      hash,
      qris_id: data?.id || null,
      is_verified: isVerified,
      merchant_name: data?.merchant_name || null,
      merchant_id: data?.merchant_id || null,
      scanned_data: rawQRIS.substring(0, 500), // Simpan sebagian data untuk audit
      error_message: error?.message || null,
      user_agent: userAgent,
      ip_address: ipAddress
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
    
    // Log error verification
    try {
      const hash = await generateQRISHash(rawQRIS)
      await supabaseAdmin.from('verification_logs').insert({
        hash,
        qris_id: null,
        is_verified: false,
        scanned_data: rawQRIS.substring(0, 500),
        error_message: err.message,
        user_agent: req.headers['user-agent'] || 'unknown',
        ip_address: req.headers['x-forwarded-for'] as string || 'unknown'
      })
    } catch (logError) {
      console.error('Failed to log error:', logError)
    }

    return res.status(500).json({ error: err.message || 'Internal server error' })
  }
}
