import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { createClient } from '@supabase/supabase-js'

export default function AuthCallback() {
  const router = useRouter()
  const [error, setError] = useState('')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Handle hash-based callback (from email links)
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        const type = hashParams.get('type')

        console.log('Callback type:', type)
        console.log('Has access token:', !!accessToken)

        // If we have tokens from hash, set the session
        if (accessToken && refreshToken) {
          const { data: { session }, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })

          if (sessionError) {
            console.error('Session error:', sessionError)
            setError('Gagal memverifikasi session')
            setTimeout(() => router.push('/auth/login?error=session_failed'), 2000)
            return
          }

          if (session) {
            console.log('Session established for:', session.user.email)

            // Check if user exists in users table
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('role, is_active, email')
              .eq('auth_user_id', session.user.id)
              .single()

            if (userError || !userData) {
              console.error('User not found in database:', userError)
              setError('User tidak ditemukan dalam sistem')
              await supabase.auth.signOut()
              setTimeout(() => router.push('/auth/login?error=user_not_found'), 2000)
              return
            }

            // Activate user on first login (from invite)
            await supabase
              .from('users')
              .update({ 
                last_login_at: new Date().toISOString(),
                is_active: true
              })
              .eq('auth_user_id', session.user.id)

            // Log login
            await supabase.from('auth_logs').insert({
              email: session.user.email,
              action: 'LOGIN_FROM_INVITE',
              role: userData.role
            })

            console.log('Redirecting to dashboard...')
            // Redirect to dashboard
            router.push('/dashboard')
            return
          }
        }

        // Fallback: Try to get existing session
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Auth callback error:', error)
          setError('Gagal memverifikasi akun')
          setTimeout(() => router.push('/auth/login?error=callback_failed'), 2000)
          return
        }

        if (session) {
          console.log('Existing session found')
          router.push('/dashboard')
        } else {
          console.log('No session, redirecting to login')
          router.push('/auth/login')
        }
      } catch (err) {
        console.error('Callback error:', err)
        setError('Terjadi kesalahan')
        setTimeout(() => router.push('/auth/login?error=unknown'), 2000)
      }
    }

    handleCallback()
  }, [router])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '1rem'
    }}>
      <div className="spinner" style={{ width: 40, height: 40 }} />
      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
        {error || 'Memverifikasi akun Anda...'}
      </p>
      {error && (
        <p style={{ color: '#f87171', fontSize: '0.8rem' }}>
          Redirecting to login...
        </p>
      )}
    </div>
  )
}
