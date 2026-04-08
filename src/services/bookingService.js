import {
    collection,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    query,
    runTransaction,
    where,
} from 'firebase/firestore'
import { firebaseAuth, firestore } from '@/lib/firebase'
import { securityUtils } from '@/lib/security'

const ACTIVE_BOOKING_STATUSES = new Set(['pending', 'approved'])

const nowIso = () => new Date().toISOString()

const toServiceError = (err, fallback = 'An unexpected error occurred') => ({
    message: typeof err?.message === 'string' && err.message.trim() ? err.message : fallback,
    code: err?.code,
})

const fromDoc = (docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
})

const sortBookingsByDate = (bookings) => bookings.sort((a, b) => {
    const aValue = `${a.booking_date || ''}T${a.start_time || ''}`
    const bValue = `${b.booking_date || ''}T${b.start_time || ''}`
    return aValue.localeCompare(bValue)
})

const sortBookingsByCreatedDesc = (bookings) => bookings.sort((a, b) => {
    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
})

const parseTimeToMinute = (time) => {
    if (typeof time !== 'string') return Number.NaN
    const [hours, minutes] = time.split(':').map(Number)
    if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return Number.NaN
    return hours * 60 + minutes
}

const formatMinute = (minute) => {
    const hours = Math.floor(minute / 60).toString().padStart(2, '0')
    const minutes = (minute % 60).toString().padStart(2, '0')
    return `${hours}${minutes}`
}

const getSlotMinutes = (booking) => {
    const startMinute = parseTimeToMinute(booking.start_time)
    const endMinute = parseTimeToMinute(booking.end_time)

    if (!Number.isFinite(startMinute) || !Number.isFinite(endMinute) || startMinute >= endMinute) {
        return []
    }

    const minutes = []
    for (let minute = startMinute; minute < endMinute; minute += 1) {
        minutes.push(minute)
    }
    return minutes
}

const getSlotRefs = (booking) => {
    return getSlotMinutes(booking).map((minute) => {
        const slotId = `${booking.machine_id}_${booking.booking_date}_${formatMinute(minute)}`
        return {
            minute,
            ref: doc(firestore, 'booking_slots', slotId),
        }
    })
}

const buildSlotRecord = (booking, slotId, minute, status = booking.status) => ({
    id: slotId,
    booking_id: booking.id,
    machine_id: booking.machine_id,
    booking_date: booking.booking_date,
    minute,
    student_id: booking.student_id,
    status,
    updated_at: nowIso(),
})

const fetchDocsById = async (collectionName, ids) => {
    const validIds = [...new Set(ids.filter((id) => securityUtils.validateFirestoreId(id)))]
    const entries = await Promise.all(validIds.map(async (id) => {
        const snap = await getDoc(doc(firestore, collectionName, id))
        return [id, snap.exists() ? fromDoc(snap) : null]
    }))
    return new Map(entries)
}

const enrichBookings = async (bookings, { includeMachines = true, includeProfiles = false } = {}) => {
    const machineMap = includeMachines
        ? await fetchDocsById('machines', bookings.map((booking) => booking.machine_id))
        : new Map()
    const profileMap = includeProfiles
        ? await fetchDocsById('profiles', bookings.map((booking) => booking.student_id))
        : new Map()

    return bookings.map((booking) => ({
        ...booking,
        ...(includeMachines ? { machines: machineMap.get(booking.machine_id) || null } : {}),
        ...(includeProfiles ? { profiles: profileMap.get(booking.student_id) || null } : {}),
    }))
}

export const bookingService = {
    /**
     * Create a new booking with security validation
     * @param {object} bookingData - { machine_id, student_id, booking_date, start_time, end_time, purpose }
     */
    createBooking: async (bookingData) => {
        try {
            if (!bookingData || typeof bookingData !== 'object') {
                return { data: null, error: { message: 'Invalid booking data' } }
            }

            const sanitizedData = {
                machine_id: bookingData.machine_id,
                student_id: bookingData.student_id,
                booking_date: bookingData.booking_date,
                start_time: bookingData.start_time,
                end_time: bookingData.end_time,
                purpose: typeof bookingData.purpose === 'string' ? bookingData.purpose.trim().substring(0, 500) : '',
                status: 'pending',
            }

            if (!sanitizedData.machine_id || !sanitizedData.student_id ||
                !sanitizedData.booking_date || !sanitizedData.start_time ||
                !sanitizedData.end_time || !sanitizedData.purpose) {
                return { data: null, error: { message: 'All booking fields are required' } }
            }

            if (!securityUtils.validateFirestoreId(sanitizedData.machine_id) ||
                !securityUtils.validateFirestoreId(sanitizedData.student_id)) {
                return { data: null, error: { message: 'Invalid ID format' } }
            }

            const bookingDate = new Date(sanitizedData.booking_date)
            const today = new Date()
            today.setHours(0, 0, 0, 0)

            if (bookingDate < today) {
                return { data: null, error: { message: 'Cannot book for past dates' } }
            }

            const startMinute = parseTimeToMinute(sanitizedData.start_time)
            const endMinute = parseTimeToMinute(sanitizedData.end_time)

            if (!Number.isFinite(startMinute) || !Number.isFinite(endMinute)) {
                return { data: null, error: { message: 'Invalid booking time' } }
            }

            if (startMinute >= endMinute) {
                return { data: null, error: { message: 'End time must be after start time' } }
            }

            const durationHours = (endMinute - startMinute) / 60
            if (durationHours > 8) {
                return { data: null, error: { message: 'Booking duration cannot exceed 8 hours' } }
            }

            const bookingId = crypto.randomUUID()
            const timestamp = nowIso()
            const record = {
                id: bookingId,
                ...sanitizedData,
                faculty_id: null,
                faculty_comments: '',
                created_at: timestamp,
                updated_at: timestamp,
            }
            const bookingRef = doc(firestore, 'bookings', bookingId)
            const machineRef = doc(firestore, 'machines', sanitizedData.machine_id)
            const slotRefs = getSlotRefs(record)

            if (slotRefs.length === 0 || slotRefs.length > 480) {
                return { data: null, error: { message: 'Invalid booking duration' } }
            }

            securityUtils.secureLog('info', 'Creating booking', {
                machine_id: sanitizedData.machine_id,
                student_id: sanitizedData.student_id,
                date: sanitizedData.booking_date,
            })

            await runTransaction(firestore, async (transaction) => {
                const machineSnap = await transaction.get(machineRef)
                if (!machineSnap.exists()) {
                    throw new Error('Selected machine was not found')
                }
                if (machineSnap.data().is_active !== true) {
                    throw new Error('Selected machine is not available for booking')
                }

                for (const slot of slotRefs) {
                    const slotSnap = await transaction.get(slot.ref)
                    if (slotSnap.exists() && ACTIVE_BOOKING_STATUSES.has(slotSnap.data().status)) {
                        throw new Error('This booking conflicts with an existing booking')
                    }
                }

                transaction.set(bookingRef, record)
                for (const slot of slotRefs) {
                    transaction.set(slot.ref, {
                        ...buildSlotRecord(record, slot.ref.id, slot.minute),
                        created_at: timestamp,
                    })
                }
            })

            return { data: record, error: null }
        } catch (err) {
            securityUtils.secureLog('error', 'Unexpected error in createBooking', err.message)
            return { data: null, error: toServiceError(err) }
        }
    },

    /**
     * Get bookings for a specific user with security validation
     * @param {string} userId
     */
    getMyBookings: async (userId) => {
        try {
            if (!securityUtils.validateFirestoreId(userId)) {
                return { data: null, error: { message: 'Invalid user ID' } }
            }

            const bookingsQuery = query(collection(firestore, 'bookings'), where('student_id', '==', userId))
            const snapshot = await getDocs(bookingsQuery)
            const bookings = sortBookingsByDate(snapshot.docs.map(fromDoc))
            const data = await enrichBookings(bookings, { includeMachines: true })

            return { data, error: null }
        } catch (err) {
            securityUtils.secureLog('error', 'Unexpected error in getMyBookings', err.message)
            return { data: null, error: toServiceError(err) }
        }
    },

    /**
     * Subscribe to a user's bookings with Firebase realtime updates.
     * @param {string} userId
     * @param {(data: Array) => void} onData
     * @param {(error: Error) => void} onError
     */
    subscribeToMyBookings: (userId, onData, onError) => {
        if (!securityUtils.validateFirestoreId(userId)) {
            onError?.(new Error('Invalid user ID'))
            return () => {}
        }

        let active = true
        const bookingsQuery = query(collection(firestore, 'bookings'), where('student_id', '==', userId))
        const unsubscribe = onSnapshot(bookingsQuery, (snapshot) => {
            const bookings = sortBookingsByDate(snapshot.docs.map(fromDoc))
            enrichBookings(bookings, { includeMachines: true })
                .then((data) => {
                    if (active) onData(data)
                })
                .catch((err) => {
                    if (active) onError?.(err)
                })
        }, (err) => {
            if (active) onError?.(err)
        })

        return () => {
            active = false
            unsubscribe()
        }
    },

    /**
     * Get all pending bookings (for faculty) with security validation
     */
    getPendingBookings: async () => {
        try {
            const bookingsQuery = query(collection(firestore, 'bookings'), where('status', '==', 'pending'))
            const snapshot = await getDocs(bookingsQuery)
            const bookings = sortBookingsByCreatedDesc(snapshot.docs.map(fromDoc))
            const data = await enrichBookings(bookings, { includeMachines: true, includeProfiles: true })

            return { data, error: null }
        } catch (err) {
            securityUtils.secureLog('error', 'Unexpected error in getPendingBookings', err.message)
            return { data: null, error: toServiceError(err) }
        }
    },

    /**
     * Subscribe to pending bookings with Firebase realtime updates.
     * @param {(data: Array) => void} onData
     * @param {(error: Error) => void} onError
     */
    subscribeToPendingBookings: (onData, onError) => {
        let active = true
        const bookingsQuery = query(collection(firestore, 'bookings'), where('status', '==', 'pending'))
        const unsubscribe = onSnapshot(bookingsQuery, (snapshot) => {
            const bookings = sortBookingsByCreatedDesc(snapshot.docs.map(fromDoc))
            enrichBookings(bookings, { includeMachines: true, includeProfiles: true })
                .then((data) => {
                    if (active) onData(data)
                })
                .catch((err) => {
                    if (active) onError?.(err)
                })
        }, (err) => {
            if (active) onError?.(err)
        })

        return () => {
            active = false
            unsubscribe()
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
            if (!securityUtils.validateFirestoreId(bookingId)) {
                return { data: null, error: { message: 'Invalid booking ID' } }
            }

            const validStatuses = ['approved', 'rejected', 'cancelled']
            if (!status || !validStatuses.includes(status)) {
                return { data: null, error: { message: 'Invalid status' } }
            }

            const updateData = {
                status,
                updated_at: nowIso(),
            }

            if (status === 'approved' || status === 'rejected') {
                const currentUser = firebaseAuth.currentUser
                if (currentUser?.uid) {
                    updateData.faculty_id = currentUser.uid
                }
            }

            if (comments !== undefined) {
                updateData.faculty_comments = typeof comments === 'string' ? comments.trim().substring(0, 1000) : ''
            }

            securityUtils.secureLog('info', 'Updating booking status', {
                booking_id: bookingId,
                status,
            })

            const bookingRef = doc(firestore, 'bookings', bookingId)
            let updatedBooking = null

            await runTransaction(firestore, async (transaction) => {
                const bookingSnap = await transaction.get(bookingRef)
                if (!bookingSnap.exists()) {
                    throw new Error('Booking not found')
                }

                const existingBooking = fromDoc(bookingSnap)
                updatedBooking = { ...existingBooking, ...updateData }
                transaction.update(bookingRef, updateData)

                for (const slot of getSlotRefs(existingBooking)) {
                    if (status === 'rejected' || status === 'cancelled') {
                        transaction.delete(slot.ref)
                    } else if (status === 'approved') {
                        transaction.set(slot.ref, buildSlotRecord(updatedBooking, slot.ref.id, slot.minute, 'approved'), { merge: true })
                    }
                }
            })

            return { data: updatedBooking, error: null }
        } catch (err) {
            securityUtils.secureLog('error', 'Unexpected error in updateBookingStatus', err.message)
            return { data: null, error: toServiceError(err) }
        }
    },

    /**
     * Cancel booking with security validation
     * @param {string} bookingId
     * @param {string} userId - User making the cancellation
     */
    cancelBooking: async (bookingId, userId) => {
        try {
            if (!securityUtils.validateFirestoreId(bookingId)) {
                return { data: null, error: { message: 'Invalid booking ID' } }
            }

            if (!securityUtils.validateFirestoreId(userId)) {
                return { data: null, error: { message: 'Invalid user ID' } }
            }

            securityUtils.secureLog('info', 'Cancelling booking', {
                booking_id: bookingId,
                user_id: userId,
            })

            const bookingRef = doc(firestore, 'bookings', bookingId)
            const updateData = {
                status: 'cancelled',
                updated_at: nowIso(),
            }
            let updatedBooking = null

            await runTransaction(firestore, async (transaction) => {
                const bookingSnap = await transaction.get(bookingRef)
                if (!bookingSnap.exists()) {
                    throw new Error('Booking not found')
                }

                const existingBooking = fromDoc(bookingSnap)
                if (existingBooking.student_id !== userId) {
                    throw new Error('You can only cancel your own bookings')
                }

                if (!ACTIVE_BOOKING_STATUSES.has(existingBooking.status)) {
                    throw new Error('Only pending or approved bookings can be cancelled')
                }

                updatedBooking = { ...existingBooking, ...updateData }
                transaction.update(bookingRef, updateData)

                for (const slot of getSlotRefs(existingBooking)) {
                    transaction.delete(slot.ref)
                }
            })

            return { data: updatedBooking, error: null }
        } catch (err) {
            securityUtils.secureLog('error', 'Unexpected error in cancelBooking', err.message)
            return { data: null, error: toServiceError(err) }
        }
    },
}
