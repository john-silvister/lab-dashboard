import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { authService } from '@/services/authService'
import { securityUtils } from '@/lib/security'

export function useAuth() {
    const [user, setUser] = useState(null)
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)
    const [authState, setAuthState] = useState('initializing')

    const fetchProfile = useCallback(async (userId) => {
        if (!userId) return

        try {
            const { data, error } = await authService.getProfile(userId)

            if (error) {
                securityUtils.secureLog('error', 'Error fetching profile', error)
                setProfile(null)
            } else if (securityUtils.validateApiResponse(data, ['id', 'email'])) {
                setProfile(data)
            } else {
                securityUtils.secureLog('warn', 'Invalid profile data received')
                setProfile(null)
            }
        } catch (err) {
            securityUtils.secureLog('error', 'Unexpected error fetching profile', err.message)
            setProfile(null)
        }
    }, [])

    useEffect(() => {
        let mounted = true

        // Get initial session
        supabase.auth.getSession().then(({ data: { session }, error }) => {
            if (error) {
                securityUtils.secureLog('error', 'Error getting session', error)
                return
            }

            if (!mounted) return

            setUser(session?.user ?? null)
            setAuthState(session?.user ? 'authenticated' : 'unauthenticated')

            if (session?.user) {
                fetchProfile(session.user.id).finally(() => {
                    if (mounted) setLoading(false)
                })
            } else {
                setLoading(false)
            }
        }).catch(err => {
            securityUtils.secureLog('error', 'Session retrieval failed', err.message)
            if (mounted) {
                setLoading(false)
                setAuthState('error')
            }
        })

        // Listen for auth changes with proper state management
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!mounted) return

            securityUtils.secureLog('info', `Auth state change: ${event}`)

            setUser(session?.user ?? null)
            setAuthState(session?.user ? 'authenticated' : 'unauthenticated')

            if (session?.user) {
                // Only fetch profile if we don't already have it or if it's a different user
                if (!profile || profile.id !== session.user.id) {
                    await fetchProfile(session.user.id)
                }
            } else {
                setProfile(null)
            }

            setLoading(false)
        })

        return () => {
            mounted = false
            subscription.unsubscribe()
        }
    }, [fetchProfile, profile])

    // Security: Validate user permissions
    const hasPermission = useCallback((requiredRole) => {
        return securityUtils.hasPermission(profile, requiredRole)
    }, [profile])

    return {
        user,
        profile,
        loading,
        authState,
        isAdmin: profile?.role === 'admin' || profile?.role === 'faculty',
        hasPermission,
        signIn: authService.signIn,
        signUp: authService.signUp,
        signOut: authService.signOut
    }
}
