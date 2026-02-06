import { supabase } from '@/lib/supabase';

export const bookingService = {
    /**
     * Create a new booking
     * @param {object} bookingData - { machine_id, student_id, booking_date, start_time, end_time, purpose }
     */
    createBooking: async (bookingData) => {
        // optional: client-side overlap check or rely on db constraint/rpc
        const { data, error } = await supabase
            .from('bookings')
            .insert(bookingData)
            .select()
            .single();
        return { data, error };
    },

    /**
     * Get bookings for a specific user
     * @param {string} userId
     */
    getMyBookings: async (userId) => {
        const { data, error } = await supabase
            .from('bookings')
            .select('*, machines(*)')
            .eq('student_id', userId)
            .order('booking_date', { ascending: true });
        return { data, error };
    },

    /**
     * Get all pending bookings (for faculty)
     */
    getPendingBookings: async () => {
        const { data, error } = await supabase
            .from('bookings')
            .select('*, machines(*), profiles!student_id(*)')
            .eq('status', 'pending')
            .order('created_at', { ascending: false });
        return { data, error };
    },

    /**
     * Update booking status
     * @param {string} bookingId
     * @param {string} status - 'approved', 'rejected', 'cancelled'
     * @param {string} [comments]
     */
    updateBookingStatus: async (bookingId, status, comments) => {
        const updateData = {
            status,
            updated_at: new Date().toISOString(),
        };
        if (comments !== undefined) {
            updateData.faculty_comments = comments;
        }

        const { data, error } = await supabase
            .from('bookings')
            .update(updateData)
            .eq('id', bookingId)
            .select()
            .single();
        return { data, error };
    },

    /**
     * Check for conflicts using RPC
     * @param {string} machineId
     * @param {string} date
     * @param {string} startTime
     * @param {string} endTime
     */
    checkConflict: async (machineId, date, startTime, endTime) => {
        const { data, error } = await supabase.rpc('check_booking_conflict', {
            p_machine_id: machineId,
            p_date: date,
            p_start_time: startTime,
            p_end_time: endTime,
        });
        return { data, error };
    },

    /**
     * Subscribe to booking changes for a user
     * @param {string} userId
     * @param {function} callback
     */
    subscribeToBookings: (userId, callback) => {
        return supabase
            .channel('public:bookings')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'bookings',
                    filter: `student_id=eq.${userId}`,
                },
                callback
            )
            .subscribe();
    },
};
