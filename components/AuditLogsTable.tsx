import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Shield, 
  Download,
  ChevronLeft,
  ChevronRight,
  Filter,
  Crown,
  Eye
} from 'lucide-react'

type AuditLog = {
  id: string
  admin_role: string
  admin_name: string
  action: string
  resource_type: string
  resource_id: string | null
  details: any
  created_at: string
  ip_address: string | null
}

type Props = {
  sessionToken: string
}

const actionColors: Record<string, string> = {
  CREATE: '#4ade80',
  UPDATE: '#60a5fa',
  DELETE: '#f87171',
  ACTIVATE: '#86efac',
  DEACTIVATE: '#fbbf24'
}

export default function AuditLogsTable({ sessionToken }: Props) {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [exporting, setExporting] = useState(false)

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(actionFilter !== 'all' && { action: actionFilter }),
        ...(roleFilter !== 'all' && { adminRole: roleFilter })
      })

      const res = await fetch(`/api/audit-logs?${params}`, {
        headers: { 'Authorization': `Bearer ${sessionToken}` }
      })
      const data = await res.json()

      if (data.success) {
        setLogs(data.data || [])
        setTotalPages(data.pagination.totalPages)
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchLogs()
  }, [page, actionFilter, roleFilter])

  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await fetch('/api/export-logs?type=audit', {
        headers: { 'Authorization': `Bearer ${sessionToken}` }
      })

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Gagal export data')
    }
    setExporting(false)
  }

  return (
    <div>
      {/* Header & Filters */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        gap: '1rem',
        marginBottom: '1.5rem' 
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <h2 style={{ color: '#fff', fontWeight: 700, fontSize: '1.3rem', margin: 0 }}>
            Audit Logs
          </h2>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleExport}
            disabled={exporting}
            className="btn-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.85rem'
            }}
          >
            <Download size={16} />
            {exporting ? 'Exporting...' : 'Export CSV'}
          </motion.button>
        </div>

        {/* Filters */}
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '0.75rem'
        }}>
          {/* Action Filter */}
          <select
            className="input-glass"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            style={{ cursor: 'pointer' }}
          >
            <option value="all">Semua Action</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
            <option value="ACTIVATE">ACTIVATE</option>
            <option value="DEACTIVATE">DEACTIVATE</option>
          </select>

          {/* Role Filter */}
          <select
            className="input-glass"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{ cursor: 'pointer' }}
          >
            <option value="all">Semua Role</option>
            <option value="admin">Admin</option>
            <option value="superadmin">Superadmin</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="glass" style={{ borderRadius: '16px', overflow: 'hidden', padding: 0 }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem' }} />
            <p style={{ color: 'rgba(255,255,255,0.4)' }}>Loading audit logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <p style={{ color: 'rgba(255,255,255,0.4)' }}>Tidak ada audit log ditemukan</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,249,133,0.2)' }}>
                    <th style={thStyle}>Admin</th>
                    <th style={thStyle}>Action</th>
                    <th style={thStyle}>Resource</th>
                    <th style={thStyle}>Details</th>
                    <th style={thStyle}>Waktu</th>
                    <th style={thStyle}>IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, index) => (
                    <motion.tr
                      key={log.id}
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
                          {log.admin_role === 'superadmin' ? (
                            <Crown size={14} color="#fff985" />
                          ) : (
                            <Eye size={14} color="rgba(255,255,255,0.5)" />
                          )}
                          <div>
                            <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.85rem' }}>
                              {log.admin_name}
                            </div>
                            <div style={{ 
                              color: 'rgba(255,255,255,0.4)', 
                              fontSize: '0.7rem',
                              textTransform: 'capitalize'
                            }}>
                              {log.admin_role}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <span style={{
                          display: 'inline-block',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '6px',
                          background: `${actionColors[log.action] || '#60a5fa'}20`,
                          color: actionColors[log.action] || '#60a5fa',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          letterSpacing: '0.05em'
                        }}>
                          {log.action}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ fontSize: '0.85rem' }}>
                          <div style={{ color: '#fff', fontWeight: 600 }}>
                            {log.resource_type}
                          </div>
                          {log.resource_id && (
                            <div style={{ 
                              color: 'rgba(255,255,255,0.4)',
                              fontSize: '0.7rem',
                              fontFamily: 'Space Mono, monospace'
                            }}>
                              {log.resource_id.substring(0, 8)}...
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={tdStyle}>
                        {log.details ? (
                          <details style={{ cursor: 'pointer' }}>
                            <summary style={{ 
                              color: 'rgba(255,249,133,0.6)',
                              fontSize: '0.75rem',
                              userSelect: 'none'
                            }}>
                              View Details
                            </summary>
                            <pre style={{
                              marginTop: '0.5rem',
                              padding: '0.5rem',
                              background: 'rgba(0,0,0,0.3)',
                              borderRadius: '6px',
                              fontSize: '0.7rem',
                              color: 'rgba(255,255,255,0.6)',
                              overflow: 'auto',
                              maxWidth: '300px'
                            }}>
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </details>
                        ) : (
                          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>-</span>
                        )}
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                          {new Date(log.created_at).toLocaleString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ 
                          fontSize: '0.75rem',
                          color: 'rgba(255,255,255,0.4)'
                        }}>
                          {log.ip_address || '-'}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div style={{
              padding: '1rem',
              borderTop: '1px solid rgba(255,249,133,0.2)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                Page {page} of {totalPages}
              </span>
              
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn-secondary"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
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
