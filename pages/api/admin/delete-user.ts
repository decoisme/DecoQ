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
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { userId } = req.body

    if (!userId) {
      return res.status(400).json({ error: 'User ID diperlukan' })
    }

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
      .select('id, role, is_active')
      .eq('auth_user_id', user.id)
      .single()

    if (currentUserError || !currentUser) {
      return res.status(403).json({ error: 'User tidak ditemukan' })
    }

    if (currentUser.role !== 'superadmin' || !currentUser.is_active) {
      return res.status(403).json({ error: 'Hanya superadmin yang dapat menghapus user' })
    }

    // Prevent self-deletion
    if (currentUser.id === userId) {
      return res.status(400).json({ error: 'Tidak dapat menghapus akun sendiri' })
    }

    // Get user to delete
    const { data: userToDelete, error: getUserError } = await supabaseAdmin
      .from('users')
      .select('id, email, role, auth_user_id, full_name')
      .eq('id', userId)
      .single()

    if (getUserError || !userToDelete) {
      return res.status(404).json({ error: 'User tidak ditemukan' })
    }

    // Delete from auth.users if auth_user_id exists
    if (userToDelete.auth_user_id) {
      const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(
        userToDelete.auth_user_id
      )

      if (deleteAuthError) {
        console.error('Delete auth user error:', deleteAuthError)
        // Continue anyway, will be cleaned up by CASCADE
      }
    }

    // Delete from users table (will cascade to related records)
    const { error: deleteError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId)

    if (deleteError) {
      console.error('Delete user error:', deleteError)
      return res.status(500).json({ error: 'Gagal menghapus user' })
    }

    // Log deletion
    await supabaseAdmin.from('auth_logs').insert({
      email: userToDelete.email,
      action: 'USER_DELETED',
      role: userToDelete.role,
      details: {
        deleted_by: user.email,
        deleted_user_id: userId,
        deleted_user_email: userToDelete.email,
        deleted_user_name: userToDelete.full_name
      },
      ip_address: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      user_agent: req.headers['user-agent']
    })

    return res.status(200).json({
      success: true,
      message: `User ${userToDelete.email} berhasil dihapus`
    })

  } catch (error) {
    console.error('Delete user error:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
