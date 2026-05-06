import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function Home() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <>
      <Head>
        <title>QRIS Verifier — Sistem Verifikasi QRIS</title>
      </Head>

      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '2rem 1rem'
      }}>
        {/* Logo + title */}
        <div style={{
          textAlign: 'center', marginBottom: '3rem',
          opacity: mounted ? 1 : 0, transform: mounted ? 'none' : 'translateY(20px)',
          transition: 'all 0.6s ease'
        }}>
          <div style={{
            width: 80, height: 80, margin: '0 auto 1.5rem',
            background: 'linear-gradient(135deg, #fff985, #ffe940)',
            borderRadius: '24px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '2.5rem',
            boxShadow: '0 8px 32px rgba(255,249,133,0.4)'
          }}>🔐</div>

          <h1 style={{
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            fontWeight: 800, fontSize: 'clamp(2rem, 5vw, 3.2rem)',
            color: '#ffffff', lineHeight: 1.1, marginBottom: '0.75rem',
            letterSpacing: '-0.02em'
          }}>
            QRIS <span style={{
              background: 'linear-gradient(90deg, #fff985, #ffe940)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
            }}>Verifier</span>
          </h1>

          <p style={{
            color: 'rgba(255,255,255,0.6)', fontSize: '1.05rem',
            maxWidth: 480, margin: '0 auto', lineHeight: 1.6
          }}>
            Sistem verifikasi QRIS berbasis SHA-256 untuk memastikan keamanan transaksi digital Anda
          </p>
        </div>

        {/* Cards */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.25rem', width: '100%', maxWidth: 680,
          opacity: mounted ? 1 : 0, transform: mounted ? 'none' : 'translateY(24px)',
          transition: 'all 0.7s ease 0.15s'
        }}>
          {/* User Card */}
          <Link href="/verify" style={{ textDecoration: 'none' }}>
            <div className="glass" style={{
              padding: '2rem', cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              borderColor: 'rgba(255,249,133,0.35)'
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'
              ;(e.currentTarget as HTMLElement).style.boxShadow = '0 16px 48px rgba(255,249,133,0.2)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.transform = 'none'
              ;(e.currentTarget as HTMLElement).style.boxShadow = ''
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: '14px',
                background: 'linear-gradient(135deg, rgba(255,249,133,0.25), rgba(255,233,64,0.15))',
                border: '1px solid rgba(255,249,133,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.6rem', marginBottom: '1.25rem'
              }}>🔍</div>

              <h2 style={{ color: '#ffffff', fontWeight: 700, fontSize: '1.25rem', marginBottom: '0.5rem' }}>
                Verifikasi QRIS
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.9rem', lineHeight: 1.55 }}>
                Scan atau upload gambar QRIS untuk memverifikasi keaslian dan keamanannya sebelum bertransaksi.
              </p>

              <div style={{
                marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: 6,
                color: '#fff985', fontWeight: 600, fontSize: '0.9rem'
              }}>
                Mulai Verifikasi
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </div>
            </div>
          </Link>

          {/* Admin Card */}
          <Link href="/admin" style={{ textDecoration: 'none' }}>
            <div className="glass-dark" style={{
              padding: '2rem', cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'
              ;(e.currentTarget as HTMLElement).style.boxShadow = '0 16px 48px rgba(255,249,133,0.12)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.transform = 'none'
              ;(e.currentTarget as HTMLElement).style.boxShadow = ''
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: '14px',
                background: 'rgba(255,249,133,0.08)',
                border: '1px solid rgba(255,249,133,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.6rem', marginBottom: '1.25rem'
              }}>⚙️</div>

              <h2 style={{ color: '#ffffff', fontWeight: 700, fontSize: '1.25rem', marginBottom: '0.5rem' }}>
                Panel Admin
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.9rem', lineHeight: 1.55 }}>
                Daftarkan QRIS merchant baru, kelola database, dan pantau log verifikasi.
              </p>

              <div style={{
                marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: 6,
                color: 'rgba(255,249,133,0.7)', fontWeight: 600, fontSize: '0.9rem'
              }}>
                Masuk Admin
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </div>
            </div>
          </Link>
        </div>

        {/* Footer badges */}
        <div style={{
          marginTop: '3rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap',
          justifyContent: 'center', opacity: 0.6
        }}>
          {['SHA-256 Secured', 'Supabase DB', 'Real-time Verify'].map(b => (
            <span key={b} className="tag tag-neutral" style={{ fontSize: '0.72rem' }}>
              {b}
            </span>
          ))}
        </div>
      </div>
    </>
  )
}
