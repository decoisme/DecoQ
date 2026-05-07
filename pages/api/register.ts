import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { generateQRISHash } from '../../lib/hash'
import { verifyAdminKey } from './auth-admin'

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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { adminKey, rawQRIS, merchantName, merchantId, category, registeredBy, notes } = req.body

  // Support both admin key (legacy) and Bearer token (new)
  const authHeader = req.headers.authorization as string
  
  let userRole = 'admin'
  let userName = 'Admin'
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
          .select('role, full_name, is_active')
          .eq('auth_user_id', user.id)
          .single()

        if (userData && userData.is_active) {
          userRole = userData.role
          userName = userData.full_name || user.email || 'Admin'
          isAuthenticated = true
        }
      }
    } catch (error) {
      console.error('Token auth error:', error)
    }
  }

  // Fallback to admin key (legacy)
  if (!isAuthenticated && adminKey) {
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

  // Only superadmin can register new QRIS
  if (userRole !== 'superadmin') {
    return res.status(403).json({ 
      error: 'Akses ditolak. Hanya Superadmin yang dapat mendaftarkan QRIS baru.',
      requiredRole: 'superadmin',
      currentRole: userRole
    })
  }

  if (!rawQRIS || !merchantName || !merchantId) {
    return res.status(400).json({ error: 'rawQRIS, merchantName, dan merchantId wajib diisi' })
  }

  try {
    const hash = await generateQRISHash(rawQRIS)
    
    // DEBUG: Log hash generation
    console.log('📝 Register - Generated hash:', hash)
    console.log('📝 Register - Raw QRIS length:', rawQRIS.length)
    console.log('📝 Register - Raw QRIS preview:', rawQRIS.substring(0, 50))

    // Cek duplikat
    const { data: existing } = await supabaseAdmin
      .from('qris_database')
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
      .from('qris_database')
      .insert({
        hash,
        merchant_name: merchantName,
        merchant_id: merchantId,
        category: category || 'Umum',
        registered_by: registeredBy || userName,
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
