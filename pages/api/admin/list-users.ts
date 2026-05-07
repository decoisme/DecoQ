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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get current user from session
    const authHeader = req.headers.authorization
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)

    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    // Check if current user is superadmin
    const { data: currentUser, error: currentUserError } = await supabaseAdmin
      .from('users')
      .select('role, is_active')
      .eq('auth_user_id', user.id)
      .single()

    if (currentUserError || !currentUser) {
      return res.status(403).json({ error: 'User tidak ditemukan' })
    }

    if (currentUser.role !== 'superadmin' || !currentUser.is_active) {
      return res.status(403).json({ error: 'Hanya superadmin yang dapat melihat daftar user' })
    }

    // Get query params
    const { role, is_active, search } = req.query

    // Build query
    let query = supabaseAdmin
      .from('users')
      .select(`
        id,
        email,
        role,
        full_name,
        is_active,
        status,
        invitation_expires_at,
        invited_at,
        last_login_at,
        created_at,
        invited_by:users!users_invited_by_fkey(email, full_name)
      `)
      .order('created_at', { ascending: false })

    // Apply filters
    if (role && ['admin', 'superadmin'].includes(role as string)) {
      query = query.eq('role', role)
    }

    if (is_active !== undefined) {
      query = query.eq('is_active', is_active === 'true')
    }

    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`)
    }

    const { data: users, error: usersError } = await query

    if (usersError) {
      console.error('List users error:', usersError)
      return res.status(500).json({ error: 'Gagal mengambil daftar user' })
    }

    // Get stats
    const { data: stats, error: statsError } = await supabaseAdmin
      .from('users_stats')
      .select('*')
      .single()

    // If stats view doesn't exist, calculate manually
    let statsData = stats
    if (statsError || !stats) {
      const { data: allUsers } = await supabaseAdmin
        .from('users')
        .select('role, is_active, status')

      if (allUsers) {
        statsData = {
          total_superadmins: allUsers.filter(u => u.role === 'superadmin' && u.is_active).length,
          total_admins: allUsers.filter(u => u.role === 'admin' && u.is_active).length,
          total_active_users: allUsers.filter(u => u.is_active).length,
          total_inactive_users: allUsers.filter(u => !u.is_active && u.status !== 'pending').length,
          total_pending_users: allUsers.filter(u => u.status === 'pending').length,
          total_users: allUsers.length
        }
      }
    }

    return res.status(200).json({
      success: true,
      data: users,
      stats: statsData || {
        total_superadmins: 0,
        total_admins: 0,
        total_active_users: 0,
        total_inactive_users: 0,
        total_pending_users: 0,
        total_users: 0
      }
    })

  } catch (error) {
    console.error('List users error:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
