import { motion } from 'framer-motion'
import { Shield, X, AlertTriangle } from 'lucide-react'

type Props = {
  isOpen: boolean
  onClose: () => void
  action: string
}

export default function RestrictionModal({ isOpen, onClose, action }: Props) {
  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="glass"
        style={{
          width: '100%',
          maxWidth: 450,
          padding: '2rem',
          textAlign: 'center'
        }}
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', delay: 0.1 }}
          style={{
            width: 80,
            height: 80,
            margin: '0 auto 1.5rem',
            borderRadius: '50%',
            background: 'rgba(251,191,36,0.12)',
            border: '2px solid rgba(251,191,36,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}
        >
          <Shield size={40} color="#fbbf24" strokeWidth={2.5} />
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3 }}
            style={{
              position: 'absolute',
              bottom: -5,
              right: -5,
              background: '#ef4444',
              borderRadius: '50%',
              padding: 4,
              border: '2px solid #1a1a2e'
            }}
          >
            <X size={16} color="#fff" strokeWidth={3} />
          </motion.div>
        </motion.div>

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            color: '#fbbf24',
            fontWeight: 800,
            fontSize: '1.4rem',
            marginBottom: '0.75rem'
          }}
        >
          Akses Terbatas
        </motion.h2>

        {/* Message */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{
            color: 'rgba(255,255,255,0.6)',
            fontSize: '0.95rem',
            lineHeight: 1.6,
            marginBottom: '1.5rem'
          }}
        >
          Anda tidak memiliki izin untuk <strong style={{ color: '#fff' }}>{action}</strong>.
          <br />
          Fitur ini hanya tersedia untuk <strong style={{ color: '#fff985' }}>Superadmin</strong>.
        </motion.p>

        {/* Info box */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{
            background: 'rgba(251,191,36,0.08)',
            border: '1px solid rgba(251,191,36,0.2)',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '1.5rem',
            textAlign: 'left'
          }}
        >
          <p style={{
            color: 'rgba(255,255,255,0.5)',
            fontSize: '0.85rem',
            lineHeight: 1.5,
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'flex-start'
          }}>
            <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2, color: '#fbbf24' }} />
            <span>
              Sebagai <strong style={{ color: '#fff' }}>Admin</strong>, Anda hanya dapat melihat database QRIS. 
              Hubungi Superadmin untuk melakukan perubahan data.
            </span>
          </p>
        </motion.div>

        {/* Close button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="btn-primary"
          onClick={onClose}
          style={{ width: '100%' }}
        >
          Mengerti
        </motion.button>
      </motion.div>
    </motion.div>
  )
}
