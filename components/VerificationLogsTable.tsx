import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  CheckCircle, 
  XCircle, 
  Search, 
  Download,
  ChevronLeft,
  ChevronRight,
  Filter,
  Calendar
} from 'lucide-react'

type VerificationLog = {
  id: string
  hash: string
  is_verified: boolean
  merchant_name: string | null
  merchant_id: string | null
  validated_at: string
  ip_address: string | null
  error_message: string | null
}

type Props = {
  sessionToken: string
}

export default function VerificationLogsTable({ sessionToken }: Props) {
  const [logs, setLogs] = useState<VerificationLog[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'failed'>('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [exporting, setExporting] = useState(false)

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        status: statusFilter,
        ...(search && { search })
      })

      const res = await fetch(`/api/verification-logs?${params}`, {
        headers: { 'Authorization': `Bearer ${sessionToken}` }
      })
      const data = await res.json()

      if (data.success) {
        setLogs(data.data || [])
        setTotalPages(data.pagination.totalPages)
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchLogs()
  }, [page, statusFilter])

  const handleSearch = () => {
    setPage(1)
    fetchLogs()
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const params = new URLSearchParams({
        type: 'verification',
        status: statusFilter
      })

      const res = await fetch(`/api/export-logs?${params}`, {
        headers: { 'Authorization': `Bearer ${sessionToken}` }
      })

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `verification-logs-${new Date().toISOString().split('T')[0]}.csv`
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
            Verification Logs
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

        {/* Search & Filter */}
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '0.75rem'
        }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
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
              placeholder="Cari merchant, ID, atau hash..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>

          {/* Status Filter */}
          <select
            className="input-glass"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            style={{ cursor: 'pointer' }}
          >
            <option value="all">Semua Status</option>
            <option value="verified">✓ Verified</option>
            <option value="failed">✗ Failed</option>
          </select>

          <button
            className="btn-secondary"
            onClick={handleSearch}
            style={{ fontSize: '0.85rem' }}
          >
            <Filter size={16} style={{ marginRight: '0.5rem' }} />
            Apply Filter
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="glass" style={{ borderRadius: '16px', overflow: 'hidden', padding: 0 }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem' }} />
            <p style={{ color: 'rgba(255,255,255,0.4)' }}>Loading logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <p style={{ color: 'rgba(255,255,255,0.4)' }}>Tidak ada log ditemukan</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,249,133,0.2)' }}>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Merchant</th>
                    <th style={thStyle}>Merchant ID</th>
                    <th style={thStyle}>Hash</th>
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
                        {log.is_verified ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            color: '#4ade80',
                            fontSize: '0.85rem',
                            fontWeight: 600
                          }}>
                            <CheckCircle size={16} />
                            Verified
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            color: '#f87171',
                            fontSize: '0.85rem',
                            fontWeight: 600
                          }}>
                            <XCircle size={16} />
                            Failed
                          </span>
                        )}
                      </td>
                      <td style={tdStyle}>
                        <span style={{ color: '#fff', fontWeight: 600 }}>
                          {log.merchant_name || '-'}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ 
                          fontFamily: 'Space Mono, monospace',
                          fontSize: '0.8rem',
                          color: 'rgba(255,255,255,0.7)'
                        }}>
                          {log.merchant_id || '-'}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ 
                          fontFamily: 'Space Mono, monospace',
                          fontSize: '0.7rem',
                          color: 'rgba(255,249,133,0.5)'
                        }}>
                          {log.hash.substring(0, 16)}...
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                          {new Date(log.validated_at).toLocaleString('id-ID', {
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
