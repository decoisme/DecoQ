import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, AlertTriangle } from 'lucide-react'

type QRISEntry = {
  id: string
  hash: string
  merchant_name: string
  merchant_id: string
  category: string
  registered_by: string
  registered_at: string
  is_active: boolean
  notes?: string
}

type Props = {
  isOpen: boolean
  onClose: () => void
  qris: QRISEntry | null
  sessionToken: string
  onSuccess: () => void
}

const CATEGORIES = [
  "F&B",
  "Retail",
  "Jasa",
  "Transportasi",
  "Kesehatan",
  "Pendidikan",
  "E-commerce",
  "Umum",
]

export default function EditQRISModal({ isOpen, onClose, qris, sessionToken, onSuccess }: Props) {
  const [form, setForm] = useState({
    merchantName: '',
    merchantId: '',
    category: 'Umum',
    notes: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Populate form when qris data changes
  useEffect(() => {
    if (qris) {
      setForm({
        merchantName: qris.merchant_name,
        merchantId: qris.merchant_id,
        category: qris.category,
        notes: qris.notes || ''
      })
      setError('')
    }
  }, [qris])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!form.merchantName || !form.merchantId) {
      setError('Nama merchant dan ID merchant wajib diisi')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/list', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({
          id: qris?.id,
          action: 'update',
          merchantName: form.merchantName,
          merchantId: form.merchantId,
          category: form.category,
          notes: form.notes
        })
      })

      const data = await res.json()

      if (data.success) {
        onSuccess()
        onClose()
      } else {
        setError(data.error || 'Gagal mengupdate QRIS')
      }
    } catch (err) {
      setError('Gagal menghubungi server')
    }

    setLoading(false)
  }

  const handleClose = () => {
    if (!loading) {
      setError('')
      onClose()
    }
  }

  if (!isOpen || !qris) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="glass"
          style={{
            maxWidth: '600px',
            width: '100%',
            borderRadius: '20px',
            padding: '2rem',
            position: 'relative'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem'
          }}>
            <h2 style={{
              color: '#fff',
              fontWeight: 700,
              fontSize: '1.5rem',
              margin: 0
            }}>
              Edit QRIS
            </h2>
            <button
              onClick={handleClose}
              disabled={loading}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(255,255,255,0.5)',
                cursor: loading ? 'not-allowed' : 'pointer',
                padding: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <X size={24} />
            </button>
          </div>

          {/* Hash Info (Read-only) */}
          <div style={{
            background: 'rgba(255,249,133,0.1)',
            border: '1px solid rgba(255,249,133,0.2)',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '1.5rem'
          }}>
            <p style={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: '0.75rem',
              marginBottom: '0.5rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Hash QRIS (tidak dapat diubah)
            </p>
            <p style={{
              color: '#fff985',
              fontFamily: 'Space Mono, monospace',
              fontSize: '0.8rem',
              wordBreak: 'break-all',
              margin: 0
            }}>
              {qris.hash}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gap: '1.25rem' }}>
              {/* Merchant Name */}
              <div>
                <label style={{
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: '0.85rem',
                  display: 'block',
                  marginBottom: 8,
                  fontWeight: 500
                }}>
                  Nama Merchant *
                </label>
                <input
                  className="input-glass"
                  value={form.merchantName}
                  onChange={(e) => setForm({ ...form, merchantName: e.target.value })}
                  placeholder="Cth: Warung Pak Budi"
                  disabled={loading}
                  required
                />
              </div>

              {/* Merchant ID */}
              <div>
                <label style={{
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: '0.85rem',
                  display: 'block',
                  marginBottom: 8,
                  fontWeight: 500
                }}>
                  ID Merchant *
                </label>
                <input
                  className="input-glass"
                  value={form.merchantId}
                  onChange={(e) => setForm({ ...form, merchantId: e.target.value })}
                  placeholder="Cth: ID1234567890123"
                  disabled={loading}
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label style={{
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: '0.85rem',
                  display: 'block',
                  marginBottom: 8,
                  fontWeight: 500
                }}>
                  Kategori
                </label>
                <select
                  className="input-glass"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  disabled={loading}
                  style={{ cursor: loading ? 'not-allowed' : 'pointer' }}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c} style={{ background: '#1a1a2e' }}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label style={{
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: '0.85rem',
                  display: 'block',
                  marginBottom: 8,
                  fontWeight: 500
                }}>
                  Catatan (opsional)
                </label>
                <textarea
                  className="input-glass"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Catatan tambahan..."
                  disabled={loading}
                  rows={3}
                  style={{ resize: 'vertical' }}
                />
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    borderRadius: '12px',
                    padding: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}
                >
                  <AlertTriangle size={20} color="#f87171" />
                  <p style={{
                    color: '#f87171',
                    fontSize: '0.9rem',
                    margin: 0
                  }}>
                    {error}
                  </p>
                </motion.div>
              )}

              {/* Buttons */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                marginTop: '0.5rem'
              }}>
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="btn-secondary"
                  style={{
                    opacity: loading ? 0.5 : 1,
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  Batal
                </button>
                <motion.button
                  whileHover={loading ? {} : { scale: 1.02 }}
                  whileTap={loading ? {} : { scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    opacity: loading ? 0.7 : 1,
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? (
                    <>
                      <div className="spinner" style={{ width: 16, height: 16 }} />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Simpan Perubahan
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </form>

          {/* Info */}
          <div style={{
            marginTop: '1.5rem',
            padding: '1rem',
            background: 'rgba(96,165,250,0.1)',
            border: '1px solid rgba(96,165,250,0.2)',
            borderRadius: '12px'
          }}>
            <p style={{
              color: 'rgba(255,255,255,0.6)',
              fontSize: '0.8rem',
              margin: 0,
              lineHeight: 1.5
            }}>
              <strong style={{ color: '#60a5fa' }}>Info:</strong> Perubahan data QRIS akan tercatat di audit logs. Hash QRIS tidak dapat diubah untuk menjaga integritas data.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
