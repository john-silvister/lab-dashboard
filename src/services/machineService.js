import { supabase } from '@/lib/supabase'
import { securityUtils } from '@/lib/security'

export const machineService = {
    /**
     * Get all machines with security validation
     * @param {object} [filters] - { department, location, isAdmin }
     */
    getMachines: async (filters = {}) => {
        try {
            // Security: Validate and sanitize filters
            const sanitizedFilters = {}

            if (filters.department) {
                sanitizedFilters.department = securityUtils.sanitizeInput(filters.department)?.substring(0, 100)
            }

            if (filters.location) {
                sanitizedFilters.location = securityUtils.sanitizeInput(filters.location)?.substring(0, 100)
            }

            if (typeof filters.isAdmin === 'boolean') {
                sanitizedFilters.isAdmin = filters.isAdmin
            }

            let query = supabase
                .from('machines')
                .select('*')

            // Security: Only show active machines to non-admin users
            if (!sanitizedFilters.isAdmin) {
                query = query.eq('is_active', true)
            }

            if (sanitizedFilters.department) {
                query = query.eq('department', sanitizedFilters.department)
            }

            if (sanitizedFilters.location) {
                query = query.eq('location', sanitizedFilters.location)
            }

            query = query.order('name')

            const { data, error } = await query

            if (error) {
                securityUtils.secureLog('error', 'Failed to fetch machines', error.message)
            }

            return { data, error }
        } catch (err) {
            securityUtils.secureLog('error', 'Unexpected error in getMachines', err.message)
            return { data: null, error: { message: 'An unexpected error occurred' } }
        }
    },

    /**
     * Get single machine details with security validation
     * @param {string} machineId
     */
    getMachineDetails: async (machineId) => {
        try {
            // Security: Validate machineId
            if (!machineId || !securityUtils.validateUUID(machineId)) {
                return { data: null, error: { message: 'Invalid machine ID' } }
            }

            const { data, error } = await supabase
                .from('machines')
                .select('*')
                .eq('id', machineId)
                .single()

            if (error) {
                securityUtils.secureLog('error', 'Failed to fetch machine details', error.message)
            }

            return { data, error }
        } catch (err) {
            securityUtils.secureLog('error', 'Unexpected error in getMachineDetails', err.message)
            return { data: null, error: { message: 'An unexpected error occurred' } }
        }
    },

    /**
     * Create machine with security validation (admin/faculty only)
     * @param {object} machineData
     */
    createMachine: async (machineData) => {
        try {
            // Security: Validate input
            if (!machineData || typeof machineData !== 'object') {
                return { data: null, error: { message: 'Invalid machine data' } }
            }

            const sanitizedData = {
                name: securityUtils.sanitizeInput(machineData.name)?.substring(0, 200),
                description: securityUtils.sanitizeInput(machineData.description)?.substring(0, 1000),
                department: securityUtils.sanitizeInput(machineData.department)?.substring(0, 100),
                location: securityUtils.sanitizeInput(machineData.location)?.substring(0, 200),
                specifications: machineData.specifications, // JSON will be validated at DB level
                image_url: securityUtils.sanitizeInput(machineData.image_url)?.substring(0, 500),
                is_active: typeof machineData.is_active === 'boolean' ? machineData.is_active : true,
                requires_training: typeof machineData.requires_training === 'boolean' ? machineData.requires_training : false
            }

            // Security: Validate required fields
            if (!sanitizedData.name || !sanitizedData.department) {
                return { data: null, error: { message: 'Name and department are required' } }
            }

            // Security: Validate image URL format if provided
            if (sanitizedData.image_url && !securityUtils.validateUrl(sanitizedData.image_url)) {
                return { data: null, error: { message: 'Invalid image URL format' } }
            }

            // Security: Validate specifications JSON
            if (sanitizedData.specifications && typeof sanitizedData.specifications !== 'object') {
                return { data: null, error: { message: 'Specifications must be a valid object' } }
            }

            securityUtils.secureLog('info', 'Creating machine', {
                name: sanitizedData.name,
                department: sanitizedData.department
            })

            const { data, error } = await supabase
                .from('machines')
                .insert(sanitizedData)
                .select()
                .single()

            if (error) {
                securityUtils.secureLog('error', 'Machine creation failed', error.message)
            }

            return { data, error }
        } catch (err) {
            securityUtils.secureLog('error', 'Unexpected error in createMachine', err.message)
            return { data: null, error: { message: 'An unexpected error occurred' } }
        }
    },

    /**
     * Update machine with security validation (admin/faculty only)
     * @param {string} machineId
     * @param {object} updates
     */
    updateMachine: async (machineId, updates) => {
        try {
            // Security: Validate machineId
            if (!machineId || !securityUtils.validateUUID(machineId)) {
                return { data: null, error: { message: 'Invalid machine ID' } }
            }

            // Security: Validate updates
            if (!updates || typeof updates !== 'object') {
                return { data: null, error: { message: 'Invalid update data' } }
            }

            const sanitizedUpdates = {}

            if (updates.name !== undefined) {
                sanitizedUpdates.name = securityUtils.sanitizeInput(updates.name)?.substring(0, 200)
            }

            if (updates.description !== undefined) {
                sanitizedUpdates.description = securityUtils.sanitizeInput(updates.description)?.substring(0, 1000)
            }

            if (updates.department !== undefined) {
                sanitizedUpdates.department = securityUtils.sanitizeInput(updates.department)?.substring(0, 100)
            }

            if (updates.location !== undefined) {
                sanitizedUpdates.location = securityUtils.sanitizeInput(updates.location)?.substring(0, 200)
            }

            if (updates.specifications !== undefined) {
                if (typeof updates.specifications !== 'object') {
                    return { data: null, error: { message: 'Specifications must be a valid object' } }
                }
                sanitizedUpdates.specifications = updates.specifications
            }

            if (updates.image_url !== undefined) {
                const sanitizedUrl = securityUtils.sanitizeInput(updates.image_url)?.substring(0, 500)
                if (sanitizedUrl && !securityUtils.validateUrl(sanitizedUrl)) {
                    return { data: null, error: { message: 'Invalid image URL format' } }
                }
                sanitizedUpdates.image_url = sanitizedUrl
            }

            if (typeof updates.is_active === 'boolean') {
                sanitizedUpdates.is_active = updates.is_active
            }

            if (typeof updates.requires_training === 'boolean') {
                sanitizedUpdates.requires_training = updates.requires_training
            }

            // Security: Ensure at least one field is being updated
            if (Object.keys(sanitizedUpdates).length === 0) {
                return { data: null, error: { message: 'No valid fields to update' } }
            }

            sanitizedUpdates.updated_at = new Date().toISOString()

            securityUtils.secureLog('info', 'Updating machine', {
                machine_id: machineId,
                fields: Object.keys(sanitizedUpdates)
            })

            const { data, error } = await supabase
                .from('machines')
                .update(sanitizedUpdates)
                .eq('id', machineId)
                .select()
                .single()

            if (error) {
                securityUtils.secureLog('error', 'Machine update failed', error.message)
            }

            return { data, error }
        } catch (err) {
            securityUtils.secureLog('error', 'Unexpected error in updateMachine', err.message)
            return { data: null, error: { message: 'An unexpected error occurred' } }
        }
    },

    /**
     * Delete machine with security validation (admin/faculty only)
     * @param {string} machineId
     */
    deleteMachine: async (machineId) => {
        try {
            // Security: Validate machineId
            if (!machineId || !securityUtils.validateUUID(machineId)) {
                return { data: null, error: { message: 'Invalid machine ID' } }
            }

            securityUtils.secureLog('info', 'Deleting machine', { machine_id: machineId })

            const { error } = await supabase
                .from('machines')
                .delete()
                .eq('id', machineId)

            if (error) {
                securityUtils.secureLog('error', 'Machine deletion failed', error.message)
            }

            return { error }
        } catch (err) {
            securityUtils.secureLog('error', 'Unexpected error in deleteMachine', err.message)
            return { error: { message: 'An unexpected error occurred' } }
        }
    }
}
