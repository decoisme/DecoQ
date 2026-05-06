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
  isMenuOpen: boolean
  onMenuToggle: () => void
}

export default function QRISListItem({ qris, onEdit, onActivate, onDeactivate, onDelete, isMenuOpen, onMenuToggle }: Props) {

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-dark"
      style={{ 
        padding: '1rem', 
        borderRadius: '16px', 
        position: 'relative',
        overflow: 'visible'
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
          <div style={{ position: 'relative' }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation()
                onMenuToggle()
              }}
              style={{
                background: isMenuOpen ? 'rgba(255,249,133,0.15)' : 'rgba(255,255,255,0.1)',
                border: `1px solid ${isMenuOpen ? 'rgba(255,249,133,0.4)' : 'rgba(255,249,133,0.2)'}`,
                color: '#fff',
                borderRadius: '8px',
                padding: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              title="Menu aksi"
            >
              <MoreVertical size={18} />
            </motion.button>
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

      {/* Dropdown Menu - Expanded Below */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            layout
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              marginTop: '1rem',
              paddingTop: '1rem',
              borderTop: '1px solid rgba(255,249,133,0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              {/* Edit */}
              <motion.button
                whileHover={{ scale: 1.02, backgroundColor: 'rgba(59,130,246,0.15)' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  onEdit()
                  onMenuToggle()
                }}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  background: 'rgba(59,130,246,0.08)',
                  border: '1px solid rgba(59,130,246,0.3)',
                  color: '#60a5fa',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  transition: 'all 0.2s'
                }}
              >
                <Edit2 size={16} />
                Edit Data
              </motion.button>

              {/* Activate/Deactivate */}
              {qris.is_active ? (
                <motion.button
                  whileHover={{ scale: 1.02, backgroundColor: 'rgba(251,191,36,0.15)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    onDeactivate()
                    onMenuToggle()
                  }}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: 'rgba(251,191,36,0.08)',
                    border: '1px solid rgba(251,191,36,0.3)',
                    color: '#fbbf24',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    transition: 'all 0.2s'
                  }}
                >
                  <X size={16} />
                  Nonaktifkan
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.02, backgroundColor: 'rgba(34,197,94,0.15)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    onActivate()
                    onMenuToggle()
                  }}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: 'rgba(34,197,94,0.08)',
                    border: '1px solid rgba(34,197,94,0.3)',
                    color: '#4ade80',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    transition: 'all 0.2s'
                  }}
                >
                  <RotateCcw size={16} />
                  Aktifkan Kembali
                </motion.button>
              )}

              {/* Delete */}
              <motion.button
                whileHover={{ scale: 1.02, backgroundColor: 'rgba(239,68,68,0.15)' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  onDelete()
                  onMenuToggle()
                }}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  color: '#f87171',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  transition: 'all 0.2s'
                }}
              >
                <Trash2 size={16} />
                Hapus Permanen
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
