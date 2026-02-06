import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Security: Ensure required environment variables are present
if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing required Supabase configuration. Please check environment variables.')
}

// Security: Validate URL format
if (supabaseUrl) {
    try {
        new URL(supabaseUrl)
    } catch {
        console.error('Invalid Supabase URL format')
    }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false, // Security: Prevent URL-based session manipulation
    },
    global: {
        headers: {
            'X-Client-Info': 'lab-dashboard@1.0.0',
        },
    },
})
