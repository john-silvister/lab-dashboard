import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Security: Ensure required environment variables are present
if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing required Supabase configuration. Please check environment variables.')
}

// Security: Validate URL format
try {
    new URL(supabaseUrl)
} catch {
    throw new Error('Invalid Supabase URL format')
}

// Security: Ensure anon key is not empty and has expected format
if (typeof supabaseAnonKey !== 'string' || supabaseAnonKey.length < 10) {
    throw new Error('Invalid Supabase anonymous key')
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
