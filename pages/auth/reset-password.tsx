import Head from 'next/head'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Lock, Eye, EyeOff, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function ResetPassword() {
  const router = useRouter()
  const { token } = router.query
  
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (token) {
      validateToken()
    }
  }, [token])

  const validateToken = async () => {
    setValidating(true)
    try {
      const res = await fetch(`/api/auth/validate-reset-token?token=${token}`)
      const data = await res.json()
      
      if (data.valid) {
        setTokenValid(true)
      } else {
        setError(data.error || 'Token tidak valid atau sudah kadaluarsa')
        setTokenValid(false)
      }
    } catch (err) {
      setError('Gagal memvalidasi token')
      setTokenValid(false)
    } finally {
      setValidating(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validation
    if (password.length < 8) {
      setError('Password minimal 8 karakter')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Password tidak cocok')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token,
          password
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Gagal reset password')
      }

      setSuccess(true)
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/auth/login')
      }, 3000)
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan. Silakan coba lagi.')
      setLoading(false)
    }
  }

  if (validating) {
    return (
      <>
        <Head>
          <title>Validating Token — DecoQ</title>
        </Head>
        
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div className="glass" style={{ padding: '3rem', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem', width: 40, height: 40 }} />
            <p style={{ color: 'rgba(255,255,255,0.6)' }}>Memvalidasi token...</p>
          </div>
        </div>
      </>
    )
  }

  if (!tokenValid) {
    return (
      <>
        <Head>
          <title>Invalid Token — DecoQ</title>
        </Head>
        
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass"
            style={{
              padding: '2.5rem',
              maxWidth: 480,
              width: '100%',
              textAlign: 'center'
            }}
          >
            <div style={{
              width: 64,
              height: 64,
              margin: '0 auto 1.5rem',
              background: 'rgba(239,68,68,0.15)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <AlertTriangle size={32} color="#f87171" />
            </div>

            <h2 style={{ color: '#fff', fontWeight: 800, fontSize: '1.5rem', marginBottom: '1rem' }}>
              Token Tidak Valid
            </h2>
            
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>
              {error || 'Link reset password tidak valid atau sudah kadaluarsa. Silakan ajukan permintaan reset password baru.'}
            </p>

            <Link href="/auth/forgot-password">
              <button className="btn-primary" style={{ width: '100%' }}>
                Request Reset Password Baru
              </button>
            </Link>
          </motion.div>
        </div>
      </>
    )
  }

  if (success) {
    return (
      <>
        <Head>
          <title>Password Reset Berhasil — DecoQ</title>
        </Head>
        
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass"
            style={{
              padding: '2.5rem',
              maxWidth: 480,
              width: '100%',
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
                background: 'rgba(34,197,94,0.15)',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <CheckCircle size={32} color="#4ade80" />
            </motion.div>

            <h2 style={{ color: '#fff', fontWeight: 800, fontSize: '1.5rem', marginBottom: '1rem' }}>
              Password Berhasil Direset!
            </h2>
            
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>
              Password Anda telah berhasil diubah. Anda akan diarahkan ke halaman login dalam beberapa detik...
            </p>

            <Link href="/auth/login">
              <button className="btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                Login Sekarang
                <ArrowRight size={18} />
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
        <title>Reset Password — DecoQ</title>
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
            <div style={{
              width: 64,
              height: 64,
              margin: '0 auto 1rem',
              background: 'rgba(255,249,133,0.15)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Lock size={32} color="#fff985" />
            </div>
            <h1 style={{ color: '#fff', fontWeight: 800, fontSize: '1.8rem', marginBottom: '0.5rem' }}>
              Reset Password
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
              Masukkan password baru Anda
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gap: '1.25rem' }}>
              {/* Password */}
              <div>
                <label style={{
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: '0.85rem',
                  display: 'block',
                  marginBottom: 8,
                  fontWeight: 500
                }}>
                  Password Baru *
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{
                    position: 'absolute',
                    left: 16,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'rgba(255,255,255,0.4)'
                  }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input-glass"
                    placeholder="Minimal 8 karakter"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ paddingLeft: 48, paddingRight: 48 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: 16,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'rgba(255,255,255,0.4)',
                      padding: 0
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label style={{
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: '0.85rem',
                  display: 'block',
                  marginBottom: 8,
                  fontWeight: 500
                }}>
                  Konfirmasi Password *
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{
                    position: 'absolute',
                    left: 16,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'rgba(255,255,255,0.4)'
                  }} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="input-glass"
                    placeholder="Ketik ulang password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    style={{ paddingLeft: 48, paddingRight: 48 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: 'absolute',
                      right: 16,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'rgba(255,255,255,0.4)',
                      padding: 0
                    }}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
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
                    Memproses...
                  </>
                ) : (
                  <>
                    <Lock size={18} />
                    Reset Password
                  </>
                )}
              </motion.button>
            </div>
          </form>

          {/* Info Box */}
          <div style={{
            marginTop: '2rem',
            padding: '1rem',
            background: 'rgba(96,165,250,0.1)',
            border: '1px solid rgba(96,165,250,0.2)',
            borderRadius: '12px'
          }}>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', margin: 0, lineHeight: 1.6 }}>
              <strong style={{ color: '#60a5fa' }}>Tips:</strong> Gunakan kombinasi huruf besar, huruf kecil, angka, dan simbol untuk password yang lebih aman.
            </p>
          </div>
        </motion.div>
      </div>
    </>
  )
}
