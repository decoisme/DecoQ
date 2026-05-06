import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'

type Props = {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  color: 'blue' | 'green' | 'yellow' | 'purple'
  trend?: {
    value: number
    isPositive: boolean
  }
}

const colorMap = {
  blue: {
    bg: 'rgba(59,130,246,0.1)',
    border: 'rgba(59,130,246,0.3)',
    icon: '#60a5fa',
    text: '#93c5fd'
  },
  green: {
    bg: 'rgba(34,197,94,0.1)',
    border: 'rgba(34,197,94,0.3)',
    icon: '#4ade80',
    text: '#86efac'
  },
  yellow: {
    bg: 'rgba(255,249,133,0.1)',
    border: 'rgba(255,249,133,0.3)',
    icon: '#fff985',
    text: '#fff985'
  },
  purple: {
    bg: 'rgba(168,85,247,0.1)',
    border: 'rgba(168,85,247,0.3)',
    icon: '#c084fc',
    text: '#d8b4fe'
  }
}

export default function StatCard({ title, value, subtitle, icon: Icon, color, trend }: Props) {
  const colors = colorMap[color]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="glass"
      style={{
        padding: '1.5rem',
        borderRadius: '16px',
        border: `1px solid ${colors.border}`,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background Glow */}
      <div style={{
        position: 'absolute',
        top: -50,
        right: -50,
        width: 150,
        height: 150,
        background: colors.bg,
        borderRadius: '50%',
        filter: 'blur(40px)',
        opacity: 0.5,
        pointerEvents: 'none'
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Icon */}
        <div style={{
          width: 48,
          height: 48,
          borderRadius: '12px',
          background: colors.bg,
          border: `1px solid ${colors.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1rem'
        }}>
          <Icon size={24} color={colors.icon} strokeWidth={2.5} />
        </div>

        {/* Title */}
        <p style={{
          color: 'rgba(255,255,255,0.5)',
          fontSize: '0.8rem',
          fontWeight: 600,
          marginBottom: '0.5rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          {title}
        </p>

        {/* Value */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <motion.h3
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            style={{
              color: '#fff',
              fontSize: '2rem',
              fontWeight: 800,
              margin: 0
            }}
          >
            {value}
          </motion.h3>
          
          {trend && (
            <span style={{
              color: trend.isPositive ? '#4ade80' : '#f87171',
              fontSize: '0.85rem',
              fontWeight: 600
            }}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </span>
          )}
        </div>

        {/* Subtitle */}
        {subtitle && (
          <p style={{
            color: colors.text,
            fontSize: '0.75rem',
            fontWeight: 500
          }}>
            {subtitle}
          </p>
        )}
      </div>
    </motion.div>
  )
}
