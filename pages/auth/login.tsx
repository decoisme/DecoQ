import Head from 'next/head'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Mail, Lock, AlertTriangle, LogIn } from 'lucide-react'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

export default function Login() {
  const router = useRouter()
  const { email: emailParam, error: errorParam } = router.query
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Pre-fill email if provided in URL and check for existing session
  useEffect(() => {
    // Check if there's an existing session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        console.log('⚠️ Existing session found on login page, clearing...')
        // If there's a session, user shouldn't be on login page
        // Clear it to allow fresh login
        await supabase.auth.signOut()
        
        // Clear localStorage
        if (typeof window !== 'undefined') {
          const keysToRemove: string[] = []
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key && key.startsWith('sb-')) {
              keysToRemove.push(key)
            }
          }
          keysToRemove.forEach(key => localStorage.removeItem(key))
        }
      }
    }
    
    checkSession()
    
    if (emailParam && typeof emailParam === 'string') {
      setEmail(emailParam)
    }
    if (errorParam && typeof errorParam === 'string') {
      setError(`Error: ${errorParam}`)
    }
  }, [emailParam, errorParam])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      console.log('🔐 Attempting login for:', email)
      
      // First, ensure no existing session
      await supabase.auth.signOut()
      
      // Small delay to ensure signOut completes
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Now attempt fresh login
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (signInError) {
        console.error('❌ Sign in error:', signInError)
        
        // Provide more helpful error messages
        if (signInError.message.includes('Invalid login credentials')) {
          setError('Email atau password salah. Silakan coba lagi.')
        } else if (signInError.message.includes('Email not confirmed')) {
          setError('Email belum dikonfirmasi. Cek inbox Anda.')
        } else {
          setError(signInError.message)
        }
        
        setLoading(false)
        return
      }

      if (data.user) {
        console.log('✅ Login successful, user ID:', data.user.id)
        console.log('📧 Email:', data.user.email)
        
        // Check if user exists in users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role, is_active, email, auth_user_id')
          .eq('auth_user_id', data.user.id)
          .single()

        console.log('🔍 Query result:', { userData, userError })

        if (userError) {
          console.error('❌ User query error:', userError)
          setError(`User tidak ditemukan dalam sistem (Error: ${userError.message})`)
          await supabase.auth.signOut()
          setLoading(false)
          return
        }

        if (!userData) {
          console.error('❌ User data is null')
          setError('User tidak ditemukan dalam sistem (Data null)')
          await supabase.auth.signOut()
          setLoading(false)
          return
        }

        console.log('✅ User found:', userData)

        // Update last_login_at
        await supabase
          .from('users')
          .update({ last_login_at: new Date().toISOString() })
          .eq('auth_user_id', data.user.id)

        if (!userData.is_active) {
          setError('Akun Anda tidak aktif. Hubungi administrator.')
          await supabase.auth.signOut()
          setLoading(false)
          return
        }

        // Update last login
        await supabase
          .from('users')
          .update({ last_login_at: new Date().toISOString() })
          .eq('auth_user_id', data.user.id)

        // Log login
        await supabase.from('auth_logs').insert({
          email: data.user.email,
          action: 'LOGIN',
          role: userData.role
        })

        console.log('🚀 Redirecting to dashboard...')
        // Redirect to dashboard
        router.push('/dashboard')
      }
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.')
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Login — DecoQ</title>
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
            maxWidth: 420,
            position: 'relative',
            zIndex: 1
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <motion.div
              animate={{
                rotate: [0, 10, -10, 0],
                scale: [1, 1.05, 1]
              }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
              style={{
                width: 64,
                height: 64,
                margin: '0 auto 0.75rem',
                background: 'linear-gradient(135deg, rgba(255,249,133,0.15), rgba(255,233,64,0.08))',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(255,249,133,0.2)'
              }}
            >
              <LogIn size={32} color="#fff985" strokeWidth={2.5} />
            </motion.div>
            <h1 style={{ color: '#fff', fontWeight: 800, fontSize: '1.5rem' }}>
              Login Admin
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem', marginTop: 6 }}>
              Masuk dengan email dan password Anda
            </p>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{
                color: 'rgba(255,255,255,0.6)',
                fontSize: '0.82rem',
                display: 'block',
                marginBottom: 6
              }}>
                Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail 
                  size={16} 
                  style={{ 
                    position: 'absolute', 
                    left: '0.75rem', 
                    top: '50%', 
                    transform: 'translateY(-50%)',
                    color: 'rgba(255,255,255,0.3)'
                  }} 
                />
                <input
                  type="email"
                  className="input-glass"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
            </div>

            <div>
              <label style={{
                color: 'rgba(255,255,255,0.6)',
                fontSize: '0.82rem',
                display: 'block',
                marginBottom: 6
              }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock 
                  size={16} 
                  style={{ 
                    position: 'absolute', 
                    left: '0.75rem', 
                    top: '50%', 
                    transform: 'translateY(-50%)',
                    color: 'rgba(255,255,255,0.3)'
                  }} 
                />
                <input
                  type="password"
                  className="input-glass"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                style={{
                  color: '#f87171',
                  fontSize: '0.83rem',
                  padding: '0.75rem',
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <AlertTriangle size={16} />
                {error}
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8
              }}
            >
              {loading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="spinner"
                  />
                  Logging in...
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  Login
                </>
              )}
            </motion.button>

            {/* Forgot Password Link */}
            <Link href="/auth/forgot-password">
              <div style={{
                textAlign: 'center',
                marginTop: '0.5rem'
              }}>
                <span style={{
                  color: 'rgba(255,249,133,0.7)',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#fff985'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,249,133,0.7)'}
                >
                  Lupa password?
                </span>
              </div>
            </Link>
          </form>

          <Link
            href="/"
            style={{
              display: 'block',
              textAlign: 'center',
              marginTop: '1.25rem',
              color: 'rgba(255,255,255,0.35)',
              fontSize: '0.82rem',
              textDecoration: 'none'
            }}
          >
            ← Kembali ke beranda
          </Link>
        </motion.div>
      </div>
    </>
  )
}
