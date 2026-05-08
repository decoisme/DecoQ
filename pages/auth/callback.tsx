import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabase'

export default function AuthCallback() {
  const router = useRouter()
  const [error, setError] = useState('')

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('🔍 Callback page loaded')
        console.log('URL:', window.location.href)
        console.log('Hash:', window.location.hash)
        
        // Handle hash-based callback (from email links)
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        const type = hashParams.get('type')
        const error_code = hashParams.get('error_code')
        const error_description = hashParams.get('error_description')

        console.log('Callback params:', { 
          type, 
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          error_code,
          error_description
        })
        
        // Check for errors in URL
        if (error_code || error_description) {
          console.error('❌ Error in callback URL:', { error_code, error_description })
          setError(`Error: ${error_description || error_code}`)
          setTimeout(() => router.push('/auth/login?error=callback_failed'), 3000)
          return
        }

        // If we have tokens from hash, set the session
        if (accessToken && refreshToken) {
          console.log('✅ Setting session with tokens...')
          
          const { data: { session }, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })

          if (sessionError) {
            console.error('❌ Session error:', sessionError)
            setError('Gagal memverifikasi session: ' + sessionError.message)
            setTimeout(() => router.push('/auth/login?error=session_failed'), 3000)
            return
          }

          if (session) {
            console.log('✅ Session established for:', session.user.email)

            // Check if user exists in users table
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('role, is_active, email, last_login_at')
              .eq('auth_user_id', session.user.id)
              .single()

            if (userError || !userData) {
              console.error('❌ User not found in database:', userError)
              setError('User tidak ditemukan dalam sistem')
              await supabase.auth.signOut()
              setTimeout(() => router.push('/auth/login?error=user_not_found'), 3000)
              return
            }

            console.log('✅ User found:', userData.email, 'Last login:', userData.last_login_at)

            // If this is first time (no last_login_at), redirect to confirm page to set password
            if (!userData.last_login_at) {
              console.log('🔐 First time login, redirecting to confirm page...')
              // Pass session tokens to confirm page
              router.push(`/auth/confirm?access_token=${accessToken}&refresh_token=${refreshToken}`)
              return
            }

            console.log('✅ Returning user, updating last login...')

            // Activate user and update last login
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
              action: 'LOGIN_FROM_CALLBACK',
              role: userData.role
            })

            console.log('✅ Redirecting to dashboard...')
            // Redirect to dashboard
            router.push('/dashboard')
            return
          }
        }

        console.log('⚠️ No tokens in hash, trying to get existing session...')

        // Fallback: Try to get existing session
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('❌ Auth callback error:', error)
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
