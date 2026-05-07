import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Key, 
  CheckCircle, 
  XCircle, 
  Clock,
  Mail,
  User,
  MessageSquare,
  RefreshCw,
  AlertTriangle,
  Send
} from 'lucide-react'

type PasswordResetRequest = {
  id: string
  user_id: string | null
  email: string
  full_name: string
  reason: string | null
  status: 'pending' | 'approved' | 'rejected'
  reset_token: string | null
  reset_token_expires_at: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  rejection_reason: string | null
  created_at: string
  updated_at: string
}

type Props = {
  sessionToken: string
}

export default function PasswordResetRequestsTab({ sessionToken }: Props) {
  const [requests, setRequests] = useState<PasswordResetRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<'pending' | 'approved' | 'rejected'>('pending')
  
  // Approve/Reject Modal
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean
    action: 'approve' | 'reject' | null
    request: PasswordResetRequest | null
  }>({ isOpen: false, action: null, request: null })
  
  const [rejectionReason, setRejectionReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchRequests()
  }, [filterStatus])

  const fetchRequests = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/password-reset-requests?status=${filterStatus}`, {
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      })

      const json = await res.json()
      
      if (json.success) {
        setRequests(json.data || [])
      }
    } catch (error) {
      console.error('Fetch requests error:', error)
    }
    setLoading(false)
  }

  const handleAction = async () => {
    if (!actionModal.request || !actionModal.action) return

    if (actionModal.action === 'reject' && !rejectionReason.trim()) {
      alert('Alasan penolakan wajib diisi')
      return
    }

    setActionLoading(true)

    try {
      const res = await fetch('/api/admin/password-reset-requests', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({
          requestId: actionModal.request.id,
          action: actionModal.action,
          rejectionReason: actionModal.action === 'reject' ? rejectionReason : undefined
        })
      })

      const json = await res.json()

      if (json.success) {
        alert(json.message)
        setActionModal({ isOpen: false, action: null, request: null })
        setRejectionReason('')
        fetchRequests()
      } else {
        alert(json.error || 'Gagal memproses request')
      }
    } catch (error) {
      alert('Gagal menghubungi server')
    } finally {
      setActionLoading(false)
    }
  }

  const openApproveModal = (request: PasswordResetRequest) => {
    setActionModal({ isOpen: true, action: 'approve', request })
  }

  const openRejectModal = (request: PasswordResetRequest) => {
    setActionModal({ isOpen: true, action: 'reject', request })
    setRejectionReason('')
  }

  return (
    <div>
      <h1 style={{ 
        color: '#fff', 
        fontWeight: 800, 
        fontSize: '2rem',
        marginBottom: '0.5rem'
      }}>
        Permintaan Reset Password
      </h1>
      <p style={{ 
        color: 'rgba(255,255,255,0.5)', 
        fontSize: '0.95rem',
        marginBottom: '2rem'
      }}>
        Kelola permintaan reset password dari admin
      </p>

      {/* Filter Bar */}
      <div className="glass" style={{ 
        padding: '1.5rem', 
        borderRadius: '16px', 
        marginBottom: '1.5rem',
        display: 'flex',
        gap: '1rem',
        alignItems: 'center',
        flexWrap: 'wrap',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setFilterStatus('pending')}
            className={filterStatus === 'pending' ? 'btn-primary' : 'btn-secondary'}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              fontSize: '0.85rem'
            }}
          >
            <Clock size={16} />
            Pending
          </button>
          <button
            onClick={() => setFilterStatus('approved')}
            className={filterStatus === 'approved' ? 'btn-primary' : 'btn-secondary'}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              fontSize: '0.85rem'
            }}
          >
            <CheckCircle size={16} />
            Approved
          </button>
          <button
            onClick={() => setFilterStatus('rejected')}
            className={filterStatus === 'rejected' ? 'btn-primary' : 'btn-secondary'}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              fontSize: '0.85rem'
            }}
          >
            <XCircle size={16} />
            Rejected
          </button>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={fetchRequests}
          className="btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <RefreshCw size={16} />
          Refresh
        </motion.button>
      </div>

      {/* Requests List */}
      <div className="glass" style={{ borderRadius: '16px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem' }} />
            <p style={{ color: 'rgba(255,255,255,0.4)' }}>Loading requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <Key size={48} color="rgba(255,255,255,0.2)" style={{ margin: '0 auto 1rem' }} />
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.95rem' }}>
              {filterStatus === 'pending' 
                ? 'Tidak ada permintaan pending' 
                : `Tidak ada permintaan ${filterStatus}`}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem' }}>
            {requests.map((request, index) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="glass"
                style={{
                  padding: '1.5rem',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,249,133,0.2)'
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  marginBottom: '1rem',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                      <User size={18} color="#fff985" />
                      <h3 style={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem', margin: 0 }}>
                        {request.full_name}
                      </h3>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <Mail size={14} color="rgba(255,255,255,0.4)" />
                      <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>
                        {request.email}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Clock size={14} color="rgba(255,255,255,0.4)" />
                      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
                        {new Date(request.created_at).toLocaleString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {request.status === 'pending' && (
                      <span 
                        className="tag" 
                        style={{ 
                          fontSize: '0.75rem',
                          background: 'rgba(251,191,36,0.15)',
                          color: '#fbbf24',
                          border: '1px solid rgba(251,191,36,0.3)'
                        }}
                      >
                        <Clock size={12} />
                        Pending
                      </span>
                    )}
                    {request.status === 'approved' && (
                      <span className="tag tag-success" style={{ fontSize: '0.75rem' }}>
                        <CheckCircle size={12} />
                        Approved
                      </span>
                    )}
                    {request.status === 'rejected' && (
                      <span className="tag tag-danger" style={{ fontSize: '0.75rem' }}>
                        <XCircle size={12} />
                        Rejected
                      </span>
                    )}
                  </div>
                </div>

                {/* Reason */}
                {request.reason && (
                  <div style={{
                    padding: '1rem',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '8px',
                    marginBottom: '1rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <MessageSquare size={14} color="rgba(255,255,255,0.5)" />
                      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', fontWeight: 600 }}>
                        ALASAN
                      </span>
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', margin: 0, lineHeight: 1.6 }}>
                      {request.reason}
                    </p>
                  </div>
                )}

                {/* Rejection Reason */}
                {request.status === 'rejected' && request.rejection_reason && (
                  <div style={{
                    padding: '1rem',
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    borderRadius: '8px',
                    marginBottom: '1rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <AlertTriangle size={14} color="#f87171" />
                      <span style={{ color: '#f87171', fontSize: '0.75rem', fontWeight: 600 }}>
                        ALASAN PENOLAKAN
                      </span>
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', margin: 0, lineHeight: 1.6 }}>
                      {request.rejection_reason}
                    </p>
                  </div>
                )}

                {/* Actions (only for pending) */}
                {request.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => openApproveModal(request)}
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        background: 'rgba(34,197,94,0.15)',
                        border: '1px solid rgba(34,197,94,0.3)',
                        borderRadius: '10px',
                        color: '#4ade80',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <CheckCircle size={16} />
                      Approve
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => openRejectModal(request)}
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        background: 'rgba(239,68,68,0.15)',
                        border: '1px solid rgba(239,68,68,0.3)',
                        borderRadius: '10px',
                        color: '#f87171',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <XCircle size={16} />
                      Reject
                    </motion.button>
                  </div>
                )}

                {/* Reviewed Info */}
                {request.reviewed_at && (
                  <div style={{
                    marginTop: '1rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>
                      Reviewed at {new Date(request.reviewed_at).toLocaleString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Action Modal */}
      <AnimatePresence>
        {actionModal.isOpen && actionModal.request && (
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
            onClick={() => setActionModal({ isOpen: false, action: null, request: null })}
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
                width: '100%',
                border: actionModal.action === 'approve' 
                  ? '1px solid rgba(34,197,94,0.3)' 
                  : '1px solid rgba(239,68,68,0.3)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                {actionModal.action === 'approve' ? (
                  <>
                    <div style={{
                      width: 64,
                      height: 64,
                      margin: '0 auto 1rem',
                      background: 'rgba(34,197,94,0.15)',
                      borderRadius: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <CheckCircle size={32} color="#4ade80" />
                    </div>
                    <h2 style={{ color: '#fff', fontWeight: 700, fontSize: '1.3rem', margin: '0 0 0.5rem' }}>
                      Approve Request?
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', margin: 0 }}>
                      Email dengan link reset password akan dikirim ke <strong>{actionModal.request.email}</strong>
                    </p>
                  </>
                ) : (
                  <>
                    <div style={{
                      width: 64,
                      height: 64,
                      margin: '0 auto 1rem',
                      background: 'rgba(239,68,68,0.15)',
                      borderRadius: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <XCircle size={32} color="#f87171" />
                    </div>
                    <h2 style={{ color: '#fff', fontWeight: 700, fontSize: '1.3rem', margin: '0 0 0.5rem' }}>
                      Reject Request?
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', margin: 0 }}>
                      Berikan alasan penolakan untuk <strong>{actionModal.request.email}</strong>
                    </p>
                  </>
                )}
              </div>

              {actionModal.action === 'reject' && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ 
                    color: 'rgba(255,255,255,0.6)', 
                    fontSize: '0.85rem', 
                    display: 'block', 
                    marginBottom: '0.5rem' 
                  }}>
                    Alasan Penolakan *
                  </label>
                  <textarea
                    className="input-glass"
                    placeholder="Jelaskan alasan penolakan..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={4}
                    style={{ resize: 'vertical' }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAction}
                  disabled={actionLoading}
                  style={{
                    flex: 1,
                    padding: '0.875rem',
                    background: actionModal.action === 'approve' 
                      ? 'linear-gradient(135deg, #4ade80, #22c55e)' 
                      : 'linear-gradient(135deg, #f87171, #ef4444)',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    opacity: actionLoading ? 0.6 : 1
                  }}
                >
                  {actionLoading ? (
                    <>
                      <div className="spinner" style={{ width: 16, height: 16 }} />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      {actionModal.action === 'approve' ? 'Approve & Send Email' : 'Reject & Send Email'}
                    </>
                  )}
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActionModal({ isOpen: false, action: null, request: null })}
                  className="btn-secondary"
                  style={{ padding: '0.875rem 1.5rem' }}
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
