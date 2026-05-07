import Head from 'next/head'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, User, MessageSquare, Send, ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function ForgotPassword() {
  const router = useRouter()
  
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (!email || !fullName) {
        setError('Email dan nama lengkap wajib diisi')
        setLoading(false)
        return
      }

      const response = await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          fullName,
          reason
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Gagal mengirim permintaan')
      }

      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan. Silakan coba lagi.')
      setLoading(false)
    }
  }

  if (success) {
    return (
      <>
        <Head>
          <title>Permintaan Terkirim — DecoQ</title>
        </Head>
        
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <motion.div
            animate={{ rotate: 360, scale: [1, 1.2, 1] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute',
              width: 400,
              height: 400,
              background: 'radial-gradient(circle, rgba(255,249,133,0.05) 0%, transparent 70%)',
              borderRadius: '50%',
              pointerEvents: 'none'
            }}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 100 }}
            className="glass"
            style={{
              padding: '2.5rem',
              width: '100%',
              maxWidth: 480,
              position: 'relative',
              zIndex: 1,
              textAlign: 'center'
            }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              style={{
                width: 64,
                height: 64,
                margin: '0 auto 1.5rem',
                background: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.08))',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(34,197,94,0.3)'
              }}
            >
              <CheckCircle size={32} color="#4ade80" strokeWidth={2.5} />
            </motion.div>

            <h2 style={{ color: '#fff', fontWeight: 800, fontSize: '1.5rem', marginBottom: '1rem' }}>
              Permintaan Terkirim!
            </h2>
            
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>
              Permintaan reset password Anda telah dikirim ke Superadmin. Anda akan menerima email notifikasi setelah permintaan Anda ditinjau.
            </p>

            <div style={{
              padding: '1.5rem',
              background: 'rgba(96,165,250,0.1)',
              border: '1px solid rgba(96,165,250,0.2)',
              borderRadius: '12px',
              marginBottom: '2rem'
            }}>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', margin: 0, lineHeight: 1.6 }}>
                <strong style={{ color: '#60a5fa' }}>Info:</strong> Proses review biasanya memakan waktu 1-24 jam. Pastikan Anda memeriksa inbox email Anda secara berkala.
              </p>
            </div>

            <Link href="/auth/login">
              <button className="btn-primary" style={{ width: '100%' }}>
                Kembali ke Login
              </button>
            </Link>
          </motion.div>
        </div>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>Lupa Password — DecoQ</title>
      </Head>

      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background animation */}
        <motion.div
          animate={{ rotate: 360, scale: [1, 1.2, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute',
            width: 400,
            height: 400,
            background: 'radial-gradient(circle, rgba(255,249,133,0.05) 0%, transparent 70%)',
            borderRadius: '50%',
            pointerEvents: 'none'
          }}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100 }}
          className="glass"
          style={{
            padding: '2.5rem',
            width: '100%',
            maxWidth: 480,
            position: 'relative',
            zIndex: 1
          }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1 style={{ color: '#fff', fontWeight: 800, fontSize: '1.8rem', marginBottom: '0.5rem' }}>
              Lupa Password?
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
              Isi form di bawah untuk mengajukan reset password
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gap: '1.25rem' }}>
              {/* Email */}
              <div>
                <label style={{
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: '0.85rem',
                  display: 'block',
                  marginBottom: 8,
                  fontWeight: 500
                }}>
                  Email *
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{
                    position: 'absolute',
                    left: 16,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'rgba(255,255,255,0.4)'
                  }} />
                  <input
                    type="email"
                    className="input-glass"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{ paddingLeft: 48 }}
                  />
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label style={{
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: '0.85rem',
                  display: 'block',
                  marginBottom: 8,
                  fontWeight: 500
                }}>
                  Nama Lengkap *
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{
                    position: 'absolute',
                    left: 16,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'rgba(255,255,255,0.4)'
                  }} />
                  <input
                    type="text"
                    className="input-glass"
                    placeholder="Nama lengkap Anda"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    style={{ paddingLeft: 48 }}
                  />
                </div>
              </div>

              {/* Reason (Optional) */}
              <div>
                <label style={{
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: '0.85rem',
                  display: 'block',
                  marginBottom: 8,
                  fontWeight: 500
                }}>
                  Alasan (opsional)
                </label>
                <div style={{ position: 'relative' }}>
                  <MessageSquare size={18} style={{
                    position: 'absolute',
                    left: 16,
                    top: 16,
                    color: 'rgba(255,255,255,0.4)'
                  }} />
                  <textarea
                    className="input-glass"
                    placeholder="Jelaskan alasan Anda memerlukan reset password..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    style={{ paddingLeft: 48, resize: 'vertical' }}
                  />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    padding: '1rem',
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}
                >
                  <AlertTriangle size={20} color="#f87171" />
                  <p style={{ color: '#f87171', fontSize: '0.9rem', margin: 0 }}>
                    {error}
                  </p>
                </motion.div>
              )}

              {/* Submit Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{
                  width: '100%',
                  marginTop: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10
                }}
              >
                {loading ? (
                  <>
                    <div className="spinner" style={{ width: 18, height: 18 }} />
                    Mengirim...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Kirim Permintaan
                  </>
                )}
              </motion.button>

              {/* Back to Login */}
              <Link href="/auth/login">
                <button
                  type="button"
                  className="btn-secondary"
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8
                  }}
                >
                  <ArrowLeft size={18} />
                  Kembali ke Login
                </button>
              </Link>
            </div>
          </form>

          {/* Info Box */}
          <div style={{
            marginTop: '2rem',
            padding: '1rem',
            background: 'rgba(255,249,133,0.1)',
            border: '1px solid rgba(255,249,133,0.2)',
            borderRadius: '12px'
          }}>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', margin: 0, lineHeight: 1.6 }}>
              <strong style={{ color: '#fff985' }}>Catatan:</strong> Permintaan reset password akan ditinjau oleh Superadmin. Anda akan menerima email notifikasi setelah permintaan Anda disetujui atau ditolak.
            </p>
          </div>
        </motion.div>
      </div>
    </>
  )
}
