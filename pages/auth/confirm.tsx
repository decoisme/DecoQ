import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { motion } from 'framer-motion'
import { CheckCircle, AlertTriangle, Loader, Crown, Eye } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function ConfirmInvitation() {
  const router = useRouter()
  const { token } = router.query
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading')
  const [message, setMessage] = useState('')
  const [inviteData, setInviteData] = useState<{
    email: string
    role: 'admin' | 'superadmin'
    userId: string
  } | null>(null)
  
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [settingUp, setSettingUp] = useState(false)

  useEffect(() => {
    if (!token) return
    
    verifyToken()
  }, [token])

  const verifyToken = async () => {
    try {
      console.log('🔍 Verifying token:', token)
      
      if (!token || typeof token !== 'string') {
        setStatus('error')
        setMessage('Token tidak valid atau format salah.')
        return
      }
      
      // Try to query user by invitation_token (if column exists)
      let user: any = null
      let error: any = null
      
      try {
        const result = await supabase
          .from('users')
          .select('id, email, role, status, is_active, full_name, invitation_expires_at, auth_user_id')
          .eq('invitation_token', token)
          .single()
        
        user = result.data
        error = result.error
      } catch (e) {
        console.log('⚠️ invitation_token column not exist, trying fallback...')
        
        // Fallback: Try to decode token as base64 (old method)
        try {
          const decoded = JSON.parse(Buffer.from(token, 'base64url').toString())
          const result = await supabase
            .from('users')
            .select('id, email, role, status, is_active, full_name, auth_user_id')
            .eq('email', decoded.email)
            .single()
          
          user = result.data
          error = result.error
        } catch (decodeError) {
          console.log('❌ Fallback also failed')
        }
      }
      
      console.log('👤 User query result:', { user, error })
      
      if (error || !user) {
        console.log('❌ User not found or error:', error)
        setStatus('error')
        setMessage('Undangan tidak valid atau sudah digunakan.')
        return
      }
      
      // Check expiration (if column exists)
      if (user.invitation_expires_at && new Date(user.invitation_expires_at) < new Date()) {
        console.log('⏰ Token expired')
        setStatus('expired')
        setMessage('Link undangan sudah kadaluarsa. Silakan minta undangan baru.')
        return
      }
      
      // Always show setup form - let Supabase handle if email already exists
      console.log('✅ Token valid, showing setup form')
      setInviteData({
        email: user.email,
        role: user.role as 'admin' | 'superadmin',
        userId: user.id
      })
      setFullName(user.full_name || '')
      setStatus('success')
      setMessage('Undangan valid! Silakan set password Anda.')
      
    } catch (error) {
      console.error('❌ Token verification error:', error)
      setStatus('error')
      setMessage('Terjadi kesalahan saat memverifikasi token.')
    }
  }

  const handleSetupAccount = async () => {
    if (!inviteData) return
    
    // Validation
    if (!fullName.trim()) {
      alert('Nama lengkap wajib diisi')
      return
    }
    
    if (password.length < 8) {
      alert('Password minimal 8 karakter')
      return
    }
    
    if (password !== confirmPassword) {
      alert('Password tidak cocok')
      return
    }
    
    setSettingUp(true)
    
    try {
      console.log('🔐 Setting up account for:', inviteData.email)
      
      // Check if user already has auth account
      const { data: existingUser } = await supabase
        .from('users')
        .select('auth_user_id')
        .eq('id', inviteData.userId)
        .single()
      
      let authUserId = existingUser?.auth_user_id
      
      if (!authUserId) {
        console.error('❌ No auth_user_id found - this should not happen for invited users')
        throw new Error('Auth account tidak ditemukan. Silakan minta undangan baru.')
      }
      
      console.log('✅ Auth account exists:', authUserId)
      console.log('📝 Setting password via signInWithPassword (OTP flow)...')
      
      // For invited users, we need to use a different approach
      // The user was created via inviteUserByEmail, which sends them a magic link
      // When they click the link, they're already authenticated
      // We just need to update their password
      
      // First, try to sign in with the email (this will fail but that's ok)
      // Then use updateUser to set the password
      try {
        // Try to get current session (from email link)
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session && session.user.email === inviteData.email) {
          console.log('✅ User already has session from email link')
          
          // Update password for the authenticated user
          const { error: updateError } = await supabase.auth.updateUser({
            password: password,
            data: {
              full_name: fullName
            }
          })
          
          if (updateError) {
            throw updateError
          }
          
          console.log('✅ Password updated successfully')
        } else {
          console.log('⚠️ No session found, trying alternative method...')
          
          // Alternative: Use signUp which will update the invited user
          const { data: authData, error: signUpError } = await supabase.auth.signUp({
            email: inviteData.email,
            password: password,
            options: {
              data: {
                full_name: fullName,
                role: inviteData.role
              }
            }
          })
          
          if (signUpError) {
            // If error says user already exists, try to sign in
            if (signUpError.message.includes('already') || signUpError.message.includes('exists')) {
              console.log('⚠️ User exists, trying signIn...')
              
              const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                email: inviteData.email,
                password: password
              })
              
              if (signInError) {
                throw new Error('Gagal login. Password mungkin sudah di-set sebelumnya.')
              }
              
              authUserId = signInData.user?.id
            } else {
              throw signUpError
            }
          } else {
            authUserId = authData.user?.id
            
            // Sign in after signup
            await supabase.auth.signInWithPassword({
              email: inviteData.email,
              password: password
            })
          }
        }
      } catch (authError: any) {
        console.error('❌ Auth error:', authError)
        throw new Error(authError.message || 'Gagal mengatur password')
      }
      
      // Update user record in database
      const updateData: any = {
        auth_user_id: authUserId,
        full_name: fullName,
        is_active: true,
        last_login_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      // Add optional fields if columns exist
      try {
        updateData.status = 'active'
        updateData.invitation_token = null
        updateData.invitation_expires_at = null
      } catch (e) {
        // Columns don't exist, skip them
      }
      
      const { error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', inviteData.userId)
      
      if (updateError) {
        console.error('❌ Database update error:', updateError)
        throw updateError
      }
      
      console.log('✅ User record updated')
      
      // Log activation
      await supabase.from('auth_logs').insert({
        user_id: inviteData.userId,
        email: inviteData.email,
        action: 'ACCOUNT_ACTIVATED',
        role: inviteData.role,
        details: { 
          activated_via: 'email_invitation',
          full_name: fullName
        }
      })
      
      console.log('✅ Activation logged')
      
      setMessage('✅ Akun berhasil diaktifkan! Redirecting...')
      
      // Redirect to dashboard
      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)
      
    } catch (error: any) {
      console.error('❌ Setup account error:', error)
      alert(error.message || 'Gagal mengaktifkan akun. Silakan coba lagi.')
      setSettingUp(false)
    }
  }

  return (
    <>
      <Head>
        <title>Konfirmasi Undangan — DecoQ</title>
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
          {/* Loading State */}
          {status === 'loading' && (
            <div style={{ textAlign: 'center' }}>
              <Loader size={48} color="#fff985" style={{ margin: '0 auto 1rem', animation: 'spin 1s linear infinite' }} />
              <h2 style={{ color: '#fff', fontWeight: 700, fontSize: '1.3rem', marginBottom: '0.5rem' }}>
                Memverifikasi Undangan...
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
                Mohon tunggu sebentar
              </p>
            </div>
          )}

          {/* Success State - Setup Form */}
          {status === 'success' && inviteData && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                  style={{
                    width: 64,
                    height: 64,
                    margin: '0 auto 1rem',
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
                
                <h2 style={{ color: '#fff', fontWeight: 800, fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                  Selamat Datang!
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                  {inviteData.email}
                </p>
                
                {/* Role Badge */}
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  background: inviteData.role === 'superadmin' 
                    ? 'rgba(255,249,133,0.15)' 
                    : 'rgba(96,165,250,0.15)',
                  border: `1px solid ${inviteData.role === 'superadmin' ? 'rgba(255,249,133,0.3)' : 'rgba(96,165,250,0.3)'}`,
                  borderRadius: '8px'
                }}>
                  {inviteData.role === 'superadmin' ? (
                    <Crown size={16} color="#fff985" />
                  ) : (
                    <Eye size={16} color="#60a5fa" />
                  )}
                  <span style={{ 
                    color: inviteData.role === 'superadmin' ? '#fff985' : '#60a5fa',
                    fontSize: '0.85rem',
                    fontWeight: 600
                  }}>
                    {inviteData.role === 'superadmin' ? 'Super Administrator' : 'Administrator'}
                  </span>
                </div>
              </div>

              {/* Setup Form */}
              <div style={{ display: 'grid', gap: '1rem' }}>
                <div>
                  <label style={{
                    color: 'rgba(255,255,255,0.6)',
                    fontSize: '0.85rem',
                    display: 'block',
                    marginBottom: 6
                  }}>
                    Nama Lengkap *
                  </label>
                  <input
                    type="text"
                    className="input-glass"
                    placeholder="Masukkan nama lengkap"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{
                    color: 'rgba(255,255,255,0.6)',
                    fontSize: '0.85rem',
                    display: 'block',
                    marginBottom: 6
                  }}>
                    Password *
                  </label>
                  <input
                    type="password"
                    className="input-glass"
                    placeholder="Minimal 8 karakter"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{
                    color: 'rgba(255,255,255,0.6)',
                    fontSize: '0.85rem',
                    display: 'block',
                    marginBottom: 6
                  }}>
                    Konfirmasi Password *
                  </label>
                  <input
                    type="password"
                    className="input-glass"
                    placeholder="Ketik ulang password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn-primary"
                  onClick={handleSetupAccount}
                  disabled={settingUp}
                  style={{
                    width: '100%',
                    marginTop: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8
                  }}
                >
                  {settingUp ? (
                    <>
                      <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
                      Mengaktifkan Akun...
                    </>
                  ) : (
                    'Aktifkan Akun'
                  )}
                </motion.button>
              </div>
            </div>
          )}

          {/* Error State */}
          {(status === 'error' || status === 'expired') && (
            <div style={{ textAlign: 'center' }}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring' }}
                style={{
                  width: 64,
                  height: 64,
                  margin: '0 auto 1rem',
                  background: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.08))',
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(239,68,68,0.3)'
                }}
              >
                <AlertTriangle size={32} color="#f87171" strokeWidth={2.5} />
              </motion.div>
              
              <h2 style={{ color: '#fff', fontWeight: 700, fontSize: '1.3rem', marginBottom: '0.5rem' }}>
                {status === 'expired' ? 'Link Kadaluarsa' : 'Undangan Tidak Valid'}
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                {message}
              </p>
              
              <button
                className="btn-secondary"
                onClick={() => router.push('/auth/login')}
                style={{ width: '100%' }}
              >
                Kembali ke Login
              </button>
            </div>
          )}
        </motion.div>
      </div>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  )
}
