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
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { userId, newRole } = req.body

    if (!userId || !newRole) {
      return res.status(400).json({ error: 'User ID dan role baru diperlukan' })
    }

    if (!['admin', 'superadmin'].includes(newRole)) {
      return res.status(400).json({ error: 'Role tidak valid' })
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
      .select('id, role, is_active, full_name, email')
      .eq('auth_user_id', user.id)
      .single()

    if (currentUserError || !currentUser) {
      return res.status(403).json({ error: 'User tidak ditemukan' })
    }

    if (currentUser.role !== 'superadmin' || !currentUser.is_active) {
      return res.status(403).json({ error: 'Hanya superadmin yang dapat mengubah role' })
    }

    // Prevent changing own role
    if (currentUser.id === userId) {
      return res.status(400).json({ error: 'Tidak dapat mengubah role sendiri' })
    }

    // Get user to update
    const { data: userToUpdate, error: getUserError } = await supabaseAdmin
      .from('users')
      .select('id, email, role, full_name')
      .eq('id', userId)
      .single()

    if (getUserError || !userToUpdate) {
      return res.status(404).json({ error: 'User tidak ditemukan' })
    }

    // Check if role is actually changing
    if (userToUpdate.role === newRole) {
      return res.status(400).json({ error: `User sudah memiliki role ${newRole}` })
    }

    // Update role
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ 
        role: newRole,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Update role error:', updateError)
      return res.status(500).json({ error: 'Gagal mengubah role' })
    }

    // Log role change
    await supabaseAdmin.from('auth_logs').insert({
      user_id: userId,
      email: userToUpdate.email,
      action: 'ROLE_CHANGED',
      role: newRole,
      details: {
        changed_by: currentUser.email,
        changed_by_id: currentUser.id,
        old_role: userToUpdate.role,
        new_role: newRole,
        user_name: userToUpdate.full_name
      },
      ip_address: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      user_agent: req.headers['user-agent']
    })

    // Also log to audit_logs
    await supabaseAdmin.from('audit_logs').insert({
      user_id: currentUser.id,
      admin_role: currentUser.role,
      admin_name: currentUser.full_name || currentUser.email,
      action: 'UPDATE',
      resource_type: 'USER',
      resource_id: userId,
      details: {
        target_email: userToUpdate.email,
        target_name: userToUpdate.full_name,
        old_role: userToUpdate.role,
        new_role: newRole
      },
      ip_address: req.headers['x-forwarded-for'] as string || req.socket.remoteAddress,
      user_agent: req.headers['user-agent']
    })

    return res.status(200).json({
      success: true,
      message: `Role ${userToUpdate.email} berhasil diubah dari ${userToUpdate.role} ke ${newRole}`,
      user: {
        id: userId,
        email: userToUpdate.email,
        role: newRole
      }
    })

  } catch (error) {
    console.error('Update role error:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
