import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function AuthCallback() {
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the code from URL
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Auth callback error:', error)
          router.push('/auth/login?error=callback_failed')
          return
        }

        if (session) {
          // Check if user exists in users table
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('role, is_active')
            .eq('auth_user_id', session.user.id)
            .single()

          if (userError || !userData) {
            console.error('User not found in database')
            await supabase.auth.signOut()
            router.push('/auth/login?error=user_not_found')
            return
          }

          if (!userData.is_active) {
            await supabase.auth.signOut()
            router.push('/auth/login?error=account_inactive')
            return
          }

          // Update last login
          await supabase
            .from('users')
            .update({ 
              last_login_at: new Date().toISOString(),
              is_active: true // Activate on first login (from invite)
            })
            .eq('auth_user_id', session.user.id)

          // Log login
          await supabase.from('auth_logs').insert({
            email: session.user.email,
            action: 'LOGIN',
            role: userData.role
          })

          // Redirect to dashboard
          router.push('/dashboard')
        } else {
          router.push('/auth/login')
        }
      } catch (err) {
        console.error('Callback error:', err)
        router.push('/auth/login?error=unknown')
      }
    }

    handleCallback()
  }, [router, supabase])

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
        Memverifikasi akun Anda...
      </p>
    </div>
  )
}
