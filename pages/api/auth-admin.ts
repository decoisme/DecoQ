import type { NextApiRequest, NextApiResponse } from 'next'

// Define admin credentials with roles
const ADMIN_CREDENTIALS = {
  admin: {
    key: process.env.ADMIN_KEY || 'admin123',
    role: 'admin' as const,
    name: 'Admin'
  },
  superadmin: {
    key: process.env.SUPERADMIN_KEY || 'superadmin123',
    role: 'superadmin' as const,
    name: 'Super Admin'
  }
}

export type AdminRole = 'admin' | 'superadmin'

export interface AdminSession {
  role: AdminRole
  name: string
  authenticated: boolean
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { adminKey } = req.body

  // Check if key matches admin
  if (adminKey === ADMIN_CREDENTIALS.admin.key) {
    return res.status(200).json({
      success: true,
      role: ADMIN_CREDENTIALS.admin.role,
      name: ADMIN_CREDENTIALS.admin.name,
      authenticated: true
    })
  }

  // Check if key matches superadmin
  if (adminKey === ADMIN_CREDENTIALS.superadmin.key) {
    return res.status(200).json({
      success: true,
      role: ADMIN_CREDENTIALS.superadmin.role,
      name: ADMIN_CREDENTIALS.superadmin.name,
      authenticated: true
    })
  }

  // Invalid key
  return res.status(401).json({
    success: false,
    error: 'Kunci admin tidak valid'
  })
}

// Helper function to verify admin key and get role (for use in other APIs)
export function verifyAdminKey(adminKey: string): AdminSession | null {
  if (adminKey === ADMIN_CREDENTIALS.admin.key) {
    return {
      role: ADMIN_CREDENTIALS.admin.role,
      name: ADMIN_CREDENTIALS.admin.name,
      authenticated: true
    }
  }

  if (adminKey === ADMIN_CREDENTIALS.superadmin.key) {
    return {
      role: ADMIN_CREDENTIALS.superadmin.role,
      name: ADMIN_CREDENTIALS.superadmin.name,
      authenticated: true
    }
  }

  return null
}
