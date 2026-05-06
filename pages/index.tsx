import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Shield, Search, Settings, ArrowRight, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import Image from 'next/image'

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  
  useEffect(() => setMounted(true), [])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 }
    }
  }

  return (
    <>
      <Head>
        <title>DecoQ — Sistem Verifikasi QRIS Terpercaya</title>
        <meta name="description" content="DecoQ - Platform verifikasi QRIS berbasis SHA-256 untuk keamanan transaksi digital Anda" />
      </Head>

      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '2rem 1rem', position: 'relative', overflow: 'hidden'
      }}>
        {/* Animated Background Elements */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.03, 0.06, 0.03]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          style={{
            position: 'absolute',
            top: '10%',
            right: '10%',
            width: 300,
            height: 300,
            background: 'radial-gradient(circle, rgba(255,249,133,0.1) 0%, transparent 70%)',
            borderRadius: '50%',
            pointerEvents: 'none'
          }}
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, -90, 0],
            opacity: [0.03, 0.06, 0.03]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          style={{
            position: 'absolute',
            bottom: '10%',
            left: '10%',
            width: 250,
            height: 250,
            background: 'radial-gradient(circle, rgba(255,249,133,0.08) 0%, transparent 70%)',
            borderRadius: '50%',
            pointerEvents: 'none'
          }}
        />

        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          style={{ width: '100%', maxWidth: 1200, position: 'relative', zIndex: 1 }}
        >
          {/* Logo + title */}
          <motion.div variants={itemVariants} style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <motion.div
              whileHover={{ scale: 1.05, rotate: [0, -5, 5, 0] }}
              transition={{ type: 'spring', stiffness: 300 }}
              style={{
                width: 100,
                height: 100,
                margin: '0 auto 1.5rem',
                position: 'relative',
                cursor: 'pointer'
              }}
            >
              <motion.div
                animate={{
                  boxShadow: [
                    '0 8px 32px rgba(255,249,133,0.3)',
                    '0 8px 48px rgba(255,249,133,0.5)',
                    '0 8px 32px rgba(255,249,133,0.3)'
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '28px',
                  overflow: 'hidden',
                  background: 'linear-gradient(135deg, #fff985, #ffe940)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Image src="/logo.svg" alt="DecoQ Logo" width={80} height={80} priority />
              </motion.div>
              
              {/* Sparkle effect */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                style={{ position: 'absolute', top: -5, right: -5 }}
              >
                <Sparkles size={20} color="#fff985" fill="#fff985" />
              </motion.div>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontWeight: 800,
                fontSize: 'clamp(2.5rem, 6vw, 4rem)',
                color: '#ffffff',
                lineHeight: 1.1,
                marginBottom: '0.75rem',
                letterSpacing: '-0.03em'
              }}
            >
              <motion.span
                animate={{ opacity: [1, 0.8, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{
                  background: 'linear-gradient(90deg, #fff985, #ffe940, #fff985)',
                  backgroundSize: '200% auto',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  display: 'inline-block'
                }}
              >
                DecoQ
              </motion.span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              style={{
                color: 'rgba(255,255,255,0.6)',
                fontSize: '1.1rem',
                maxWidth: 520,
                margin: '0 auto',
                lineHeight: 1.7
              }}
            >
              Platform verifikasi QRIS berbasis <strong style={{ color: '#fff985' }}>SHA-256</strong> untuk memastikan keamanan transaksi digital Anda
            </motion.p>
          </motion.div>

          {/* Cards */}
          <motion.div
            variants={itemVariants}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1.5rem',
              width: '100%',
              maxWidth: 720
            }}
          >
            {/* User Card */}
            <Link href="/verify" style={{ textDecoration: 'none' }}>
              <motion.div
                className="glass"
                whileHover={{ y: -8, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onHoverStart={() => setHoveredCard('verify')}
                onHoverEnd={() => setHoveredCard(null)}
                style={{
                  padding: '2rem',
                  cursor: 'pointer',
                  borderColor: 'rgba(255,249,133,0.35)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Hover glow effect */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: hoveredCard === 'verify' ? 1 : 0 }}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'radial-gradient(circle at center, rgba(255,249,133,0.1) 0%, transparent 70%)',
                    pointerEvents: 'none'
                  }}
                />

                <motion.div
                  animate={{
                    scale: hoveredCard === 'verify' ? 1.1 : 1,
                    rotate: hoveredCard === 'verify' ? [0, -5, 5, 0] : 0
                  }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, rgba(255,249,133,0.25), rgba(255,233,64,0.15))',
                    border: '1px solid rgba(255,249,133,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1.25rem',
                    position: 'relative',
                    zIndex: 1
                  }}
                >
                  <Search size={28} color="#fff985" strokeWidth={2.5} />
                </motion.div>

                <h2 style={{ color: '#ffffff', fontWeight: 700, fontSize: '1.3rem', marginBottom: '0.5rem', position: 'relative', zIndex: 1 }}>
                  Verifikasi QRIS
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.95rem', lineHeight: 1.6, position: 'relative', zIndex: 1 }}>
                  Scan atau upload gambar QRIS untuk memverifikasi keaslian dan keamanannya sebelum bertransaksi.
                </p>

                <motion.div
                  animate={{ x: hoveredCard === 'verify' ? 5 : 0 }}
                  style={{
                    marginTop: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    color: '#fff985',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    position: 'relative',
                    zIndex: 1
                  }}
                >
                  Mulai Verifikasi
                  <ArrowRight size={18} strokeWidth={2.5} />
                </motion.div>
              </motion.div>
            </Link>

            {/* Admin Card */}
            <Link href="/admin" style={{ textDecoration: 'none' }}>
              <motion.div
                className="glass-dark"
                whileHover={{ y: -8, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onHoverStart={() => setHoveredCard('admin')}
                onHoverEnd={() => setHoveredCard(null)}
                style={{
                  padding: '2rem',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Hover glow effect */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: hoveredCard === 'admin' ? 1 : 0 }}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'radial-gradient(circle at center, rgba(255,249,133,0.08) 0%, transparent 70%)',
                    pointerEvents: 'none'
                  }}
                />

                <motion.div
                  animate={{
                    scale: hoveredCard === 'admin' ? 1.1 : 1,
                    rotate: hoveredCard === 'admin' ? [0, 10, -10, 0] : 0
                  }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: '16px',
                    background: 'rgba(255,249,133,0.08)',
                    border: '1px solid rgba(255,249,133,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1.25rem',
                    position: 'relative',
                    zIndex: 1
                  }}
                >
                  <Settings size={28} color="rgba(255,249,133,0.7)" strokeWidth={2.5} />
                </motion.div>

                <h2 style={{ color: '#ffffff', fontWeight: 700, fontSize: '1.3rem', marginBottom: '0.5rem', position: 'relative', zIndex: 1 }}>
                  Panel Admin
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.95rem', lineHeight: 1.6, position: 'relative', zIndex: 1 }}>
                  Daftarkan QRIS merchant baru, kelola database, dan pantau log verifikasi.
                </p>

                <motion.div
                  animate={{ x: hoveredCard === 'admin' ? 5 : 0 }}
                  style={{
                    marginTop: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    color: 'rgba(255,249,133,0.7)',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    position: 'relative',
                    zIndex: 1
                  }}
                >
                  Masuk Admin
                  <ArrowRight size={18} strokeWidth={2.5} />
                </motion.div>
              </motion.div>
            </Link>
          </motion.div>

          {/* Footer badges */}
          <motion.div
            variants={itemVariants}
            style={{
              marginTop: '3rem',
              display: 'flex',
              gap: '0.75rem',
              flexWrap: 'wrap',
              justifyContent: 'center'
            }}
          >
            {['SHA-256 Secured', 'Supabase DB', 'Real-time Verify'].map((badge, i) => (
              <motion.span
                key={badge}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 0.7, scale: 1 }}
                transition={{ delay: 0.8 + i * 0.1 }}
                whileHover={{ scale: 1.1, opacity: 1 }}
                className="tag tag-neutral"
                style={{ fontSize: '0.75rem', cursor: 'default' }}
              >
                {badge}
              </motion.span>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </>
  )
}
