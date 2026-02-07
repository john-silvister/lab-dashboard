import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Security: Ensure required environment variables are present
if (!supabaseUrl || !supabaseAnonKey) {
    const errorMsg = 'CRITICAL: Missing required Supabase configuration. Please check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
    console.error(errorMsg)
    // In production, show user-friendly error; in dev, throw to make it obvious
    if (import.meta.env.PROD) {
        document.body.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;text-align:center;padding:20px;"><div><h1 style="color:#dc2626;">Configuration Error</h1><p>The application is not properly configured. Please contact the administrator.</p></div></div>`
    }
    throw new Error(errorMsg)
}

// Security: Validate URL format
try {
    new URL(supabaseUrl)
} catch {
    throw new Error('Invalid Supabase URL format. Please check VITE_SUPABASE_URL.')
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
