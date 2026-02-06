import { supabase } from '@/lib/supabase'
import { securityUtils } from '@/lib/security'

export const bookingService = {
    /**
     * Create a new booking with security validation
     * @param {object} bookingData - { machine_id, student_id, booking_date, start_time, end_time, purpose }
     */
    createBooking: async (bookingData) => {
        try {
            // Security: Validate and sanitize input
            if (!bookingData || typeof bookingData !== 'object') {
                return { data: null, error: { message: 'Invalid booking data' } }
            }

            const sanitizedData = {
                machine_id: securityUtils.sanitizeInput(bookingData.machine_id),
                student_id: securityUtils.sanitizeInput(bookingData.student_id),
                booking_date: securityUtils.sanitizeInput(bookingData.booking_date),
                start_time: securityUtils.sanitizeInput(bookingData.start_time),
                end_time: securityUtils.sanitizeInput(bookingData.end_time),
                purpose: securityUtils.sanitizeInput(bookingData.purpose)?.substring(0, 500), // Limit purpose length
            }

            // Security: Validate required fields
            if (!sanitizedData.machine_id || !sanitizedData.student_id ||
                !sanitizedData.booking_date || !sanitizedData.start_time ||
                !sanitizedData.end_time || !sanitizedData.purpose) {
                return { data: null, error: { message: 'All booking fields are required' } }
            }

            // Security: Validate UUID format
            if (!securityUtils.validateUUID(sanitizedData.machine_id) ||
                !securityUtils.validateUUID(sanitizedData.student_id)) {
                return { data: null, error: { message: 'Invalid ID format' } }
            }

            // Security: Validate date format and logic
            const bookingDate = new Date(sanitizedData.booking_date)
            const today = new Date()
            today.setHours(0, 0, 0, 0)

            if (bookingDate < today) {
                return { data: null, error: { message: 'Cannot book for past dates' } }
            }

            // Security: Validate time format and logic
            const startTime = new Date(`1970-01-01T${sanitizedData.start_time}`)
            const endTime = new Date(`1970-01-01T${sanitizedData.end_time}`)

            if (startTime >= endTime) {
                return { data: null, error: { message: 'End time must be after start time' } }
            }

            // Security: Check for reasonable booking duration (max 8 hours)
            const durationHours = (endTime - startTime) / (1000 * 60 * 60)
            if (durationHours > 8) {
                return { data: null, error: { message: 'Booking duration cannot exceed 8 hours' } }
            }

            securityUtils.secureLog('info', 'Creating booking', {
                machine_id: sanitizedData.machine_id,
                student_id: sanitizedData.student_id,
                date: sanitizedData.booking_date
            })

            const { data, error } = await supabase
                .from('bookings')
                .insert(sanitizedData)
                .select()
                .single()

            if (error) {
                securityUtils.secureLog('error', 'Booking creation failed', error.message)
            }

            return { data, error }
        } catch (err) {
            securityUtils.secureLog('error', 'Unexpected error in createBooking', err.message)
            return { data: null, error: { message: 'An unexpected error occurred' } }
        }
    },

    /**
     * Get bookings for a specific user with security validation
     * @param {string} userId
     */
    getMyBookings: async (userId) => {
        try {
            // Security: Validate userId
            if (!userId || !securityUtils.validateUUID(userId)) {
                return { data: null, error: { message: 'Invalid user ID' } }
            }

            const { data, error } = await supabase
                .from('bookings')
                .select('*, machines(*)')
                .eq('student_id', userId)
                .order('booking_date', { ascending: true })

            if (error) {
                securityUtils.secureLog('error', 'Failed to fetch user bookings', error.message)
            }

            return { data, error }
        } catch (err) {
            securityUtils.secureLog('error', 'Unexpected error in getMyBookings', err.message)
            return { data: null, error: { message: 'An unexpected error occurred' } }
        }
    },

    /**
     * Get all pending bookings (for faculty) with security validation
     */
    getPendingBookings: async () => {
        try {
            const { data, error } = await supabase
                .from('bookings')
                .select('*, machines(*), profiles!student_id(*)')
                .eq('status', 'pending')
                .order('created_at', { ascending: false })

            if (error) {
                securityUtils.secureLog('error', 'Failed to fetch pending bookings', error.message)
            }

            return { data, error }
        } catch (err) {
            securityUtils.secureLog('error', 'Unexpected error in getPendingBookings', err.message)
            return { data: null, error: { message: 'An unexpected error occurred' } }
        }
    },

    /**
     * Update booking status with security validation
     * @param {string} bookingId
     * @param {string} status - 'approved', 'rejected', 'cancelled'
     * @param {string} [comments]
     */
    updateBookingStatus: async (bookingId, status, comments) => {
        try {
            // Security: Validate inputs
            if (!bookingId || !securityUtils.validateUUID(bookingId)) {
                return { data: null, error: { message: 'Invalid booking ID' } }
            }

            const validStatuses = ['approved', 'rejected', 'cancelled']
            if (!status || !validStatuses.includes(status)) {
                return { data: null, error: { message: 'Invalid status' } }
            }

            const updateData = {
                status: status,
                updated_at: new Date().toISOString()
            }

            // Security: Sanitize comments if provided
            if (comments !== undefined) {
                updateData.faculty_comments = securityUtils.sanitizeInput(comments)?.substring(0, 1000)
            }

            securityUtils.secureLog('info', 'Updating booking status', {
                booking_id: bookingId,
                status: status
            })

            const { data, error } = await supabase
                .from('bookings')
                .update(updateData)
                .eq('id', bookingId)
                .select()
                .single()

            if (error) {
                securityUtils.secureLog('error', 'Booking status update failed', error.message)
            }

            return { data, error }
        } catch (err) {
            securityUtils.secureLog('error', 'Unexpected error in updateBookingStatus', err.message)
            return { data: null, error: { message: 'An unexpected error occurred' } }
        }
    },

    /**
     * Cancel booking with security validation
     * @param {string} bookingId
     * @param {string} userId - User making the cancellation
     */
    cancelBooking: async (bookingId, userId) => {
        try {
            // Security: Validate inputs
            if (!bookingId || !securityUtils.validateUUID(bookingId)) {
                return { data: null, error: { message: 'Invalid booking ID' } }
            }

            if (!userId || !securityUtils.validateUUID(userId)) {
                return { data: null, error: { message: 'Invalid user ID' } }
            }

            securityUtils.secureLog('info', 'Cancelling booking', {
                booking_id: bookingId,
                user_id: userId
            })

            const { data, error } = await supabase
                .from('bookings')
                .update({
                    status: 'cancelled',
                    updated_at: new Date().toISOString()
                })
                .eq('id', bookingId)
                .eq('student_id', userId) // Security: Ensure user can only cancel their own bookings
                .in('status', ['pending', 'approved']) // Security: Only allow cancellation of active bookings
                .select()
                .single()

            if (error) {
                securityUtils.secureLog('error', 'Booking cancellation failed', error.message)
            }

            return { data, error }
        } catch (err) {
            securityUtils.secureLog('error', 'Unexpected error in cancelBooking', err.message)
            return { data: null, error: { message: 'An unexpected error occurred' } }
        }
    }
}
