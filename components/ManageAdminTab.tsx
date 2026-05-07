import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  UserPlus, 
  Mail, 
  Trash2, 
  Crown,
  Eye,
  AlertTriangle,
  CheckCircle,
  X,
  Search,
  RefreshCw,
  User
} from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

type User = {
  id: string
  email: string
  role: 'admin' | 'superadmin'
  full_name: string | null
  is_active: boolean
  status: 'pending' | 'active' | 'inactive'
  invited_at: string
  last_login_at: string | null
  created_at: string
  invitation_expires_at: string | null
}

type Stats = {
  total_superadmins: number
  total_admins: number
  total_active_users: number
  total_inactive_users: number
  total_pending_users: number
  total_users: number
}

type Props = {
  sessionToken: string
}

export default function ManageAdminTab({ sessionToken }: Props) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )

  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'superadmin'>('all')
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all')
  
  // Invite modal
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'admin' as 'admin' | 'superadmin',
    fullName: ''
  })
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteResult, setInviteResult] = useState<{ success?: boolean; message?: string; error?: string } | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [filterRole, filterActive])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterRole !== 'all') params.append('role', filterRole)
      if (filterActive !== 'all') params.append('is_active', filterActive === 'active' ? 'true' : 'false')
      if (searchTerm) params.append('search', searchTerm)

      const res = await fetch(`/api/admin/list-users?${params}`, {
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      })

      const json = await res.json()
      
      if (json.success) {
        setUsers(json.data || [])
        setStats(json.stats)
      }
    } catch (error) {
      console.error('Fetch users error:', error)
    }
    setLoading(false)
  }

  const handleInvite = async () => {
    if (!inviteForm.email || !inviteForm.email.includes('@')) {
      setInviteResult({ error: 'Email valid diperlukan' })
      return
    }

    setInviteLoading(true)
    setInviteResult(null)

    try {
      const res = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify(inviteForm)
      })

      const json = await res.json()

      if (json.success) {
        setInviteResult({ success: true, message: json.message })
        setInviteForm({ email: '', role: 'admin', fullName: '' })
        setTimeout(() => {
          setShowInviteModal(false)
          setInviteResult(null)
          fetchUsers()
        }, 2000)
      } else {
        setInviteResult({ error: json.error || 'Gagal mengirim invite' })
      }
    } catch (error) {
      setInviteResult({ error: 'Gagal menghubungi server' })
    } finally {
      setInviteLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`Hapus user ${email}?\n\nTindakan ini tidak dapat dibatalkan!`)) {
      return
    }

    try {
      const res = await fetch('/api/admin/delete-user', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({ userId })
      })

      const json = await res.json()

      if (json.success) {
        alert(json.message)
        fetchUsers()
      } else {
        alert(json.error || 'Gagal menghapus user')
      }
    } catch (error) {
      alert('Gagal menghubungi server')
    }
  }

  const handleChangeRole = async (userId: string, email: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'superadmin' : 'admin'
    
    if (!confirm(`Ubah role ${email} dari ${currentRole} ke ${newRole}?`)) {
      return
    }

    try {
      const res = await fetch('/api/admin/update-role', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({ userId, newRole })
      })

      const json = await res.json()

      if (json.success) {
        alert(json.message)
        fetchUsers()
      } else {
        alert(json.error || 'Gagal mengubah role')
      }
    } catch (error) {
      alert('Gagal menghubungi server')
    }
  }

  const filteredUsers = users.filter(u => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      return u.email.toLowerCase().includes(search) || 
             u.full_name?.toLowerCase().includes(search)
    }
    return true
  })

  return (
    <div>
      <h1 style={{ 
        color: '#fff', 
        fontWeight: 800, 
        fontSize: '2rem',
        marginBottom: '0.5rem'
      }}>
        Manage Admin
      </h1>
      <p style={{ 
        color: 'rgba(255,255,255,0.5)', 
        fontSize: '0.95rem',
        marginBottom: '2rem'
      }}>
        Kelola akses admin dan superadmin
      </p>

      {/* Stats Cards */}
      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <div className="glass" style={{ padding: '1.25rem', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <Crown size={20} color="#fff985" />
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>Superadmin</span>
            </div>
            <div style={{ color: '#fff', fontSize: '2rem', fontWeight: 800 }}>
              {stats.total_superadmins}
            </div>
          </div>

          <div className="glass" style={{ padding: '1.25rem', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <Eye size={20} color="#60a5fa" />
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>Admin</span>
            </div>
            <div style={{ color: '#fff', fontSize: '2rem', fontWeight: 800 }}>
              {stats.total_admins}
            </div>
          </div>

          <div className="glass" style={{ padding: '1.25rem', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <CheckCircle size={20} color="#4ade80" />
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>Active</span>
            </div>
            <div style={{ color: '#fff', fontSize: '2rem', fontWeight: 800 }}>
              {stats.total_active_users}
            </div>
          </div>

          <div className="glass" style={{ padding: '1.25rem', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <User size={20} color="#fbbf24" />
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>Pending</span>
            </div>
            <div style={{ color: '#fff', fontSize: '2rem', fontWeight: 800 }}>
              {stats.total_pending_users || 0}
            </div>
          </div>

          <div className="glass" style={{ padding: '1.25rem', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <AlertTriangle size={20} color="#f87171" />
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>Inactive</span>
            </div>
            <div style={{ color: '#fff', fontSize: '2rem', fontWeight: 800 }}>
              {stats.total_inactive_users}
            </div>
          </div>
        </div>
      )}

      {/* Actions Bar */}
      <div className="glass" style={{ padding: '1.5rem', borderRadius: '16px', marginBottom: '1.5rem' }}>
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* Search */}
          <div style={{ flex: '1 1 300px', position: 'relative' }}>
            <Search 
              size={16} 
              style={{ 
                position: 'absolute', 
                left: '0.75rem', 
                top: '50%', 
                transform: 'translateY(-50%)',
                color: 'rgba(255,255,255,0.3)'
              }} 
            />
            <input
              className="input-glass"
              placeholder="Cari email atau nama..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.5rem', width: '100%' }}
            />
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <select
              className="input-glass"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as any)}
              style={{ cursor: 'pointer', minWidth: '120px' }}
            >
              <option value="all">Semua Role</option>
              <option value="superadmin">Superadmin</option>
              <option value="admin">Admin</option>
            </select>

            <select
              className="input-glass"
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value as any)}
              style={{ cursor: 'pointer', minWidth: '120px' }}
            >
              <option value="all">Semua Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={fetchUsers}
              className="btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <RefreshCw size={16} />
              Refresh
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowInviteModal(true)}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <UserPlus size={16} />
              Invite Admin
            </motion.button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="glass" style={{ borderRadius: '16px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem' }} />
            <p style={{ color: 'rgba(255,255,255,0.4)' }}>Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <p style={{ color: 'rgba(255,255,255,0.4)' }}>
              {searchTerm ? 'Tidak ada hasil' : 'Belum ada user'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,249,133,0.2)' }}>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>Nama</th>
                  <th style={thStyle}>Role</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Created</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, index) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    style={{ 
                      borderBottom: '1px solid rgba(255,249,133,0.1)',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Mail size={14} color="rgba(255,255,255,0.4)" />
                        <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.85rem' }}>
                          {user.email}
                        </span>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>
                        {user.full_name || '-'}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span 
                        className={user.role === 'superadmin' ? 'tag tag-neutral' : 'tag'}
                        style={{
                          fontSize: '0.75rem',
                          background: user.role === 'superadmin' 
                            ? 'rgba(255,249,133,0.15)' 
                            : 'rgba(59,130,246,0.15)',
                          color: user.role === 'superadmin' ? '#fff985' : '#60a5fa',
                          border: `1px solid ${user.role === 'superadmin' ? 'rgba(255,249,133,0.3)' : 'rgba(59,130,246,0.3)'}`
                        }}
                      >
                        {user.role === 'superadmin' ? <Crown size={10} /> : <Eye size={10} />}
                        {user.role}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      {user.status === 'pending' ? (
                        <span 
                          className="tag" 
                          style={{ 
                            fontSize: '0.75rem',
                            background: 'rgba(251,191,36,0.15)',
                            color: '#fbbf24',
                            border: '1px solid rgba(251,191,36,0.3)'
                          }}
                        >
                          ⏳ Pending
                        </span>
                      ) : (
                        <span className={user.is_active ? 'tag tag-success' : 'tag tag-danger'} style={{ fontSize: '0.75rem' }}>
                          {user.is_active ? '● Active' : '○ Inactive'}
                        </span>
                      )}
                    </td>
                    <td style={tdStyle}>
                      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
                        {new Date(user.created_at).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleChangeRole(user.id, user.email, user.role)}
                          style={{
                            padding: '0.4rem 0.75rem',
                            background: 'rgba(59,130,246,0.1)',
                            border: '1px solid rgba(59,130,246,0.3)',
                            borderRadius: '6px',
                            color: '#60a5fa',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                          title="Change role"
                        >
                          {user.role === 'admin' ? '↑ Promote' : '↓ Demote'}
                        </motion.button>
                        
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleDeleteUser(user.id, user.email)}
                          style={{
                            padding: '0.4rem',
                            background: 'rgba(239,68,68,0.1)',
                            border: '1px solid rgba(239,68,68,0.3)',
                            borderRadius: '6px',
                            color: '#f87171',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          title="Delete user"
                        >
                          <Trash2 size={14} />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100,
              padding: '1rem'
            }}
            onClick={() => setShowInviteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass"
              style={{
                padding: '2rem',
                borderRadius: '20px',
                maxWidth: 500,
                width: '100%'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ color: '#fff', fontWeight: 700, fontSize: '1.3rem', margin: 0 }}>
                  Invite Admin
                </h2>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowInviteModal(false)}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.5rem',
                    cursor: 'pointer',
                    display: 'flex',
                    color: '#fff'
                  }}
                >
                  <X size={20} />
                </motion.button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>
                    Email *
                  </label>
                  <input
                    type="email"
                    className="input-glass"
                    placeholder="admin@example.com"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    className="input-glass"
                    placeholder="John Doe"
                    value={inviteForm.fullName}
                    onChange={(e) => setInviteForm({ ...inviteForm, fullName: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>
                    Role *
                  </label>
                  <select
                    className="input-glass"
                    value={inviteForm.role}
                    onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value as any })}
                    style={{ cursor: 'pointer' }}
                  >
                    <option value="admin">Admin (View Only)</option>
                    <option value="superadmin">Superadmin (Full Access)</option>
                  </select>
                </div>

                {inviteResult && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      padding: '1rem',
                      borderRadius: '12px',
                      background: inviteResult.success 
                        ? 'rgba(34,197,94,0.1)' 
                        : 'rgba(239,68,68,0.1)',
                      border: `1px solid ${inviteResult.success ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                      color: inviteResult.success ? '#4ade80' : '#f87171',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    {inviteResult.success ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                    {inviteResult.message || inviteResult.error}
                  </motion.div>
                )}

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleInvite}
                    disabled={inviteLoading}
                    className="btn-primary"
                    style={{ flex: 1 }}
                  >
                    {inviteLoading ? (
                      <>
                        <div className="spinner" style={{ width: 16, height: 16, marginRight: '0.5rem' }} />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail size={16} style={{ marginRight: '0.5rem' }} />
                        Send Invite
                      </>
                    )}
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowInviteModal(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const thStyle: React.CSSProperties = {
  padding: '1rem',
  textAlign: 'left',
  color: 'rgba(255,255,255,0.5)',
  fontSize: '0.75rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.05em'
}

const tdStyle: React.CSSProperties = {
  padding: '1rem',
  color: 'rgba(255,255,255,0.7)',
  fontSize: '0.85rem'
}
