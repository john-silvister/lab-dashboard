import { supabase } from '@/lib/supabase'
import { securityUtils } from '@/lib/security'

export const authService = {
  /**
   * Sign up a new user with security validation
   * @param {string} email
   * @param {string} password
   * @param {object} metadata - { full_name, department, etc. }
   */
  signUp: async (email, password, metadata) => {
    try {
      // Security: Validate inputs
      if (!securityUtils.validateEmail(email)) {
        return { data: null, error: { message: 'Invalid email format' } }
      }

      if (!securityUtils.validatePassword(password)) {
        return { data: null, error: { message: 'Password does not meet security requirements' } }
      }

      // Security: Sanitize metadata
      const sanitizedMetadata = metadata ? securityUtils.sanitizeObject(metadata) : {}

      const { data, error } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
        options: {
          data: sanitizedMetadata,
        },
      })

      if (error) {
        securityUtils.secureLog('error', 'Signup failed', error.message)
      } else {
        securityUtils.secureLog('info', 'User signup successful', { email: securityUtils.maskEmail(email) })
      }

      return { data, error }
    } catch (err) {
      securityUtils.secureLog('error', 'Unexpected error during signup', err.message)
      return { data: null, error: { message: 'An unexpected error occurred' } }
    }
  },

  /**
   * Sign in an existing user with security validation
   * @param {string} email
   * @param {string} password
   */
  signIn: async (email, password) => {
    try {
      // Security: Validate inputs
      if (!securityUtils.validateEmail(email)) {
        return { data: null, error: { message: 'Invalid email format' } }
      }

      if (!password || password.length < 6) {
        return { data: null, error: { message: 'Invalid password' } }
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      })

      if (error) {
        securityUtils.secureLog('warn', 'Signin failed', { email: securityUtils.maskEmail(email), reason: error.message })
      } else {
        securityUtils.secureLog('info', 'User signin successful', { email: securityUtils.maskEmail(email) })
      }

      return { data, error }
    } catch (err) {
      securityUtils.secureLog('error', 'Unexpected error during signin', err.message)
      return { data: null, error: { message: 'An unexpected error occurred' } }
    }
  },

  /**
   * Sign out the current user
   */
  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        securityUtils.secureLog('error', 'Signout failed', error.message)
      } else {
        securityUtils.secureLog('info', 'User signed out successfully')
      }

      return { error }
    } catch (err) {
      securityUtils.secureLog('error', 'Unexpected error during signout', err.message)
      return { error: { message: 'An unexpected error occurred' } }
    }
  },

  /**
   * Get the current user with security validation
   */
  getCurrentUser: async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()

      if (error) {
        securityUtils.secureLog('error', 'Error getting current user', error.message)
        return null
      }

      return user
    } catch (err) {
      securityUtils.secureLog('error', 'Unexpected error getting current user', err.message)
      return null
    }
  },

  /**
   * Get user profile by ID with security validation
   * @param {string} userId
   */
  getProfile: async (userId) => {
    try {
      // Security: Validate userId format
      if (!userId || typeof userId !== 'string' || userId.length !== 36) {
        return { data: null, error: { message: 'Invalid user ID' } }
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        securityUtils.secureLog('error', 'Error fetching profile', error.message)
      } else if (data) {
        // Security: Validate profile data structure
        if (!securityUtils.validateApiResponse(data, ['id', 'email'])) {
          securityUtils.secureLog('warn', 'Invalid profile data structure')
          return { data: null, error: { message: 'Invalid profile data' } }
        }
      }

      return { data, error }
    } catch (err) {
      securityUtils.secureLog('error', 'Unexpected error fetching profile', err.message)
      return { data: null, error: { message: 'An unexpected error occurred' } }
    }
  },
}
