import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Edit2, Trash2, RotateCcw, X, FileText, MoreVertical } from 'lucide-react'

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
  qris: QRISEntry
  onEdit: () => void
  onActivate: () => void
  onDeactivate: () => void
  onDelete: () => void
}

export default function QRISListItem({ qris, onEdit, onActivate, onDeactivate, onDelete }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-dark"
      style={{ 
        padding: '1rem', 
        borderRadius: '16px', 
        position: 'relative',
        overflow: 'visible' // Penting: biarkan dropdown keluar dari container
      }}
    >
      {/* Mobile & Desktop Layout */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {/* Header Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ 
              color: '#fff', 
              fontWeight: 700, 
              fontSize: '1rem', 
              marginBottom: '0.5rem',
              wordBreak: 'break-word'
            }}>
              {qris.merchant_name}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: '0.5rem' }}>
              <span className={`tag ${qris.is_active ? 'tag-success' : 'tag-danger'}`} style={{ fontSize: '0.68rem' }}>
                {qris.is_active ? '● Aktif' : '○ Nonaktif'}
              </span>
              <span className="tag tag-neutral" style={{ fontSize: '0.68rem' }}>{qris.category}</span>
            </div>
          </div>

          {/* Action Menu Button */}
          <div style={{ position: 'relative', zIndex: menuOpen ? 30 : 1 }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation()
                setMenuOpen(!menuOpen)
              }}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,249,133,0.2)',
                color: '#fff',
                borderRadius: '8px',
                padding: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                zIndex: 2
              }}
              title="Menu aksi"
            >
              <MoreVertical size={18} />
            </motion.button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {menuOpen && (
                <>
                  {/* Backdrop */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                      position: 'fixed',
                      inset: 0,
                      zIndex: 25,
                      background: 'transparent'
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      setMenuOpen(false)
                    }}
                  />
                  
                  {/* Menu */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="glass"
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 0.5rem)',
                      right: 0,
                      minWidth: '180px',
                      padding: '0.5rem',
                      borderRadius: '12px',
                      zIndex: 30,
                      boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                      border: '1px solid rgba(255,249,133,0.2)'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Edit */}
                    <motion.button
                      whileHover={{ backgroundColor: 'rgba(59,130,246,0.15)' }}
                      onClick={() => {
                        onEdit()
                        setMenuOpen(false)
                      }}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: 'transparent',
                        border: 'none',
                        color: '#60a5fa',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        textAlign: 'left',
                        transition: 'background 0.2s'
                      }}
                    >
                      <Edit2 size={16} />
                      Edit Data
                    </motion.button>

                    {/* Activate/Deactivate */}
                    {qris.is_active ? (
                      <motion.button
                        whileHover={{ backgroundColor: 'rgba(251,191,36,0.15)' }}
                        onClick={() => {
                          onDeactivate()
                          setMenuOpen(false)
                        }}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          background: 'transparent',
                          border: 'none',
                          color: '#fbbf24',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          textAlign: 'left',
                          transition: 'background 0.2s'
                        }}
                      >
                        <X size={16} />
                        Nonaktifkan
                      </motion.button>
                    ) : (
                      <motion.button
                        whileHover={{ backgroundColor: 'rgba(34,197,94,0.15)' }}
                        onClick={() => {
                          onActivate()
                          setMenuOpen(false)
                        }}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          background: 'transparent',
                          border: 'none',
                          color: '#4ade80',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          textAlign: 'left',
                          transition: 'background 0.2s'
                        }}
                      >
                        <RotateCcw size={16} />
                        Aktifkan Kembali
                      </motion.button>
                    )}

                    {/* Divider */}
                    <div style={{ 
                      height: '1px', 
                      background: 'rgba(255,255,255,0.1)', 
                      margin: '0.5rem 0' 
                    }} />

                    {/* Delete */}
                    <motion.button
                      whileHover={{ backgroundColor: 'rgba(239,68,68,0.15)' }}
                      onClick={() => {
                        onDelete()
                        setMenuOpen(false)
                      }}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: 'transparent',
                        border: 'none',
                        color: '#f87171',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        textAlign: 'left',
                        transition: 'background 0.2s'
                      }}
                    >
                      <Trash2 size={16} />
                      Hapus Permanen
                    </motion.button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Info Section */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '0.5rem',
          paddingTop: '0.5rem',
          borderTop: '1px solid rgba(255,255,255,0.06)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>ID:</span>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', fontWeight: 600 }}>
              {qris.merchant_id}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem' }}>•</span>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>
              {new Date(qris.registered_at).toLocaleDateString('id-ID', { 
                day: 'numeric', 
                month: 'short', 
                year: 'numeric' 
              })}
            </span>
          </div>

          {qris.notes && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              gap: '0.5rem',
              padding: '0.5rem',
              background: 'rgba(255,249,133,0.05)',
              borderRadius: '6px',
              border: '1px solid rgba(255,249,133,0.1)'
            }}>
              <FileText size={12} style={{ marginTop: '2px', flexShrink: 0, color: 'rgba(255,249,133,0.6)' }} />
              <span style={{ 
                color: 'rgba(255,255,255,0.5)', 
                fontSize: '0.72rem', 
                fontStyle: 'italic',
                lineHeight: 1.4,
                wordBreak: 'break-word'
              }}>
                {qris.notes}
              </span>
            </div>
          )}

          {/* Hash - Collapsible */}
          <details style={{ marginTop: '0.25rem' }}>
            <summary style={{ 
              color: 'rgba(255,249,133,0.5)', 
              fontSize: '0.7rem',
              cursor: 'pointer',
              userSelect: 'none',
              listStyle: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span>SHA-256 Hash</span>
              <span style={{ fontSize: '0.6rem' }}>▼</span>
            </summary>
            <div style={{
              fontFamily: 'Space Mono, monospace',
              fontSize: '0.6rem',
              color: 'rgba(255,249,133,0.4)',
              marginTop: '0.5rem',
              padding: '0.5rem',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '6px',
              wordBreak: 'break-all',
              lineHeight: 1.5
            }}>
              {qris.hash}
            </div>
          </details>
        </div>
      </div>
    </motion.div>
  )
}
