import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { authService } from '@/services/authService'

export function useAuth() {
    const [user, setUser] = useState(null)
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null)
            if (session?.user) fetchProfile(session.user.id)
            else setLoading(false)
        })

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setUser(session?.user ?? null)
            if (session?.user) {
                await fetchProfile(session.user.id)
            } else {
                setProfile(null)
                setLoading(false)
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    const fetchProfile = async (userId) => {
        try {
            const { data, error } = await authService.getProfile(userId)

            if (error) {
                console.error('Error fetching profile:', error)
            } else {
                setProfile(data)
            }
        } catch (err) {
            console.error('Unexpected error fetching profile:', err)
        } finally {
            setLoading(false)
        }
    }

    return {
        user,
        profile,
        loading,
        isAdmin: profile?.role === 'admin' || profile?.role === 'faculty',
        signIn: authService.signIn,
        signUp: authService.signUp,
        signOut: authService.signOut
    }
}
