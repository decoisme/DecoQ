import { motion } from 'framer-motion'
import { 
  LayoutDashboard, 
  Database, 
  FileText, 
  Shield, 
  LogOut,
  Crown,
  Eye,
  Menu,
  X as CloseIcon
} from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'

type Props = {
  activeTab: string
  onTabChange: (tab: string) => void
  adminRole: 'admin' | 'superadmin'
  adminName: string
  onLogout: () => void
}

export default function Sidebar({ activeTab, onTabChange, adminRole, adminName, onLogout }: Props) {
  const [isOpen, setIsOpen] = useState(false)

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'qris', label: 'QRIS Database', icon: Database },
    { id: 'verification', label: 'Verification Logs', icon: FileText },
    { id: 'audit', label: 'Audit Logs', icon: Shield },
  ]

  const SidebarContent = () => (
    <>
      {/* Logo & Brand */}
      <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <Image src="/logo.svg" alt="DecoQ" width={32} height={32} />
          <div>
            <h2 style={{ color: '#fff', fontWeight: 800, fontSize: '1.1rem', margin: 0 }}>
              DecoQ
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', margin: 0 }}>
              Admin Dashboard
            </p>
          </div>
        </div>
        
        {/* Admin Info */}
        <div style={{ 
          background: 'rgba(255,249,133,0.08)',
          border: '1px solid rgba(255,249,133,0.2)',
          borderRadius: '8px',
          padding: '0.75rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            {adminRole === 'superadmin' ? (
              <Crown size={14} color="#fff985" />
            ) : (
              <Eye size={14} color="rgba(255,255,255,0.5)" />
            )}
            <span style={{ 
              color: '#fff', 
              fontSize: '0.8rem', 
              fontWeight: 600 
            }}>
              {adminName}
            </span>
          </div>
          <span style={{ 
            color: 'rgba(255,255,255,0.4)', 
            fontSize: '0.7rem' 
          }}>
            {adminRole === 'superadmin' ? 'Full Access' : 'View Only'}
          </span>
        </div>
      </div>

      {/* Menu Items */}
      <nav style={{ padding: '1rem', flex: 1 }}>
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          
          return (
            <motion.button
              key={item.id}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                onTabChange(item.id)
                setIsOpen(false)
              }}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                marginBottom: '0.5rem',
                background: isActive ? 'rgba(255,249,133,0.15)' : 'transparent',
                border: isActive ? '1px solid rgba(255,249,133,0.3)' : '1px solid transparent',
                borderRadius: '10px',
                color: isActive ? '#fff985' : 'rgba(255,255,255,0.6)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                transition: 'all 0.2s',
                textAlign: 'left'
              }}
            >
              <Icon size={18} strokeWidth={2.5} />
              {item.label}
            </motion.button>
          )
        })}
      </nav>

      {/* Logout Button */}
      <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onLogout}
          style={{
            width: '100%',
            padding: '0.75rem 1rem',
            background: 'rgba(239,68,68,0.15)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '10px',
            color: '#f87171',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            fontSize: '0.85rem',
            fontWeight: 600
          }}
        >
          <LogOut size={16} />
          Logout
        </motion.button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile Menu Button */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          top: '1rem',
          left: '1rem',
          zIndex: 100,
          background: 'rgba(255,249,133,0.15)',
          border: '1px solid rgba(255,249,133,0.3)',
          borderRadius: '10px',
          padding: '0.75rem',
          color: '#fff985',
          cursor: 'pointer',
          display: 'none'
        }}
        className="mobile-menu-btn"
      >
        {isOpen ? <CloseIcon size={20} /> : <Menu size={20} />}
      </motion.button>

      {/* Desktop Sidebar */}
      <motion.aside
        initial={{ x: -280 }}
        animate={{ x: 0 }}
        style={{
          width: 280,
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          background: 'rgba(26, 26, 46, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRight: '1px solid rgba(255,249,133,0.1)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 50
        }}
        className="desktop-sidebar"
      >
        <SidebarContent />
      </motion.aside>

      {/* Mobile Sidebar */}
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(4px)',
              zIndex: 90
            }}
            className="mobile-sidebar-backdrop"
          />
          
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            style={{
              width: 280,
              height: '100vh',
              position: 'fixed',
              left: 0,
              top: 0,
              background: 'rgba(26, 26, 46, 0.98)',
              backdropFilter: 'blur(10px)',
              borderRight: '1px solid rgba(255,249,133,0.2)',
              display: 'flex',
              flexDirection: 'column',
              zIndex: 95,
              boxShadow: '4px 0 24px rgba(0,0,0,0.5)'
            }}
            className="mobile-sidebar"
          >
            <SidebarContent />
          </motion.aside>
        </>
      )}

      <style jsx global>{`
        @media (max-width: 768px) {
          .desktop-sidebar {
            display: none !important;
          }
          .mobile-menu-btn {
            display: flex !important;
          }
        }
        @media (min-width: 769px) {
          .mobile-sidebar,
          .mobile-sidebar-backdrop {
            display: none !important;
          }
        }
      `}</style>
    </>
  )
}
