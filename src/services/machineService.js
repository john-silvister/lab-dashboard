import { supabase } from '@/lib/supabase';

export const machineService = {
    /**
     * Get all machines (active only by default, unless isAdmin)
     * @param {object} [filters] - { department, location, isAdmin }
     */
    getMachines: async (filters = {}) => {
        let query = supabase
            .from('machines')
            .select('*');

        // Only filter active if not admin
        if (!filters.isAdmin) {
            query = query.eq('is_active', true);
        }

        if (filters.department) {
            query = query.eq('department', filters.department);
        }
        if (filters.location) {
            query = query.eq('location', filters.location);
        }

        query = query.order('name');

        const { data, error } = await query;
        return { data, error };
    },

    /**
     * Get single machine details
     * @param {string} machineId
     */
    getMachineDetails: async (machineId) => {
        const { data, error } = await supabase
            .from('machines')
            .select('*')
            .eq('id', machineId)
            .single();
        return { data, error };
    },

    createMachine: async (machineData) => {
        const { data, error } = await supabase
            .from('machines')
            .insert(machineData)
            .select()
            .single();
        return { data, error };
    },

    updateMachine: async (id, updates) => {
        const { data, error } = await supabase
            .from('machines')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        return { data, error };
    },

    deleteMachine: async (id) => {
        const { error } = await supabase
            .from('machines')
            .delete()
            .eq('id', id);
        return { error };
    }
};
