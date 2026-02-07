import React, { useState, useEffect, useCallback } from 'react';
import { machineService } from '@/services/machineService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Edit, Trash } from 'lucide-react';
import { toast } from 'sonner';

const MachineManager = () => {
    const [machines, setMachines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMachine, setEditingMachine] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        department: '',
        location: '',
        image_url: '',
        is_active: true
    });

    useEffect(() => {
        fetchMachines();
    }, []);

    const fetchMachines = useCallback(async () => {
        setLoading(true);
        const { data } = await machineService.getMachines({ isAdmin: true });
        if (data) setMachines(data);
        setLoading(false);
    }, []);

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            department: '',
            location: '',
            image_url: '',
            is_active: true
        });
        setEditingMachine(null);
    };

    const handleOpenModal = (machine = null) => {
        if (machine) {
            setEditingMachine(machine);
            setFormData({
                name: machine.name,
                description: machine.description || '',
                department: machine.department || '',
                location: machine.location || '',
                image_url: machine.image_url || '',
                is_active: machine.is_active
            });
        } else {
            resetForm();
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Prevent double submission
        if (submitting) return;

        setSubmitting(true);

        try {
            let result;

            if (editingMachine) {
                // Optimistic update for editing
                const optimisticMachine = { ...editingMachine, ...formData };
                setMachines(prev => prev.map(m => m.id === editingMachine.id ? optimisticMachine : m));

                result = await machineService.updateMachine(editingMachine.id, formData);
                if (result.error) throw result.error;

                toast.success('Machine updated successfully');
            } else {
                result = await machineService.createMachine(formData);
                if (result.error) throw result.error;

                // Add new machine to list optimistically
                if (result.data) {
                    setMachines(prev => [result.data, ...prev]);
                }

                toast.success('Machine created successfully');
            }

            setIsModalOpen(false);
            resetForm();

            // Refresh in background to ensure consistency
            setTimeout(() => fetchMachines(), 1000);

        } catch (error) {
            console.error('Error saving machine:', error);

            // Revert optimistic update on error
            if (editingMachine) {
                fetchMachines();
            }

            toast.error(error.message || 'Failed to save machine');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (machine) => {
        if (!window.confirm(`Are you sure you want to delete "${machine.name}"? This action cannot be undone.`)) {
            return;
        }

        // Optimistic update - remove from UI immediately
        const originalMachines = [...machines];
        setMachines(prev => prev.filter(m => m.id !== machine.id));

        try {
            const { error } = await machineService.deleteMachine(machine.id);
            if (error) throw error;

            toast.success('Machine deleted successfully');
        } catch (error) {
            console.error('Error deleting machine:', error);

            // Revert optimistic update on error
            setMachines(originalMachines);

            toast.error(error.message || 'Failed to delete machine');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold tracking-tight">Machine Management</h2>
                <Button onClick={() => handleOpenModal()}>
                    <Plus className="mr-2 h-4 w-4" /> Add Machine
                </Button>
            </div>

            <div className="grid gap-4">
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />)}
                    </div>
                ) : machines.length === 0 ? (
                    // I10: Empty state
                    <div className="text-center py-12 text-muted-foreground">
                        <p>No machines found. Add your first machine to get started!</p>
                    </div>
                ) : (
                    machines.map(machine => (
                        <div key={machine.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border rounded-lg bg-card gap-4">
                            <div className="flex items-center gap-4 w-full md:w-auto">
                                <div className="h-16 w-16 rounded-md bg-muted overflow-hidden shrink-0">
                                    {machine.image_url ? (
                                        <img src={machine.image_url} alt={machine.name} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                                            <Microscope className="h-8 w-8 opacity-20" />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-semibold">{machine.name}</h3>
                                    <p className="text-sm text-muted-foreground">{machine.location}</p>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        <Badge variant={machine.is_active ? 'success' : 'destructive'}>
                                            {machine.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                        <Badge variant="outline">{machine.department || 'General'}</Badge>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                                <Button variant="ghost" size="icon" onClick={() => handleOpenModal(machine)} aria-label={`Edit ${machine.name}`}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(machine)} aria-label={`Delete ${machine.name}`}>
                                    <Trash className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingMachine ? 'Edit Machine' : 'Add New Machine'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Name *</label>
                            <Input
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Department</label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    value={formData.department}
                                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                                >
                                    <option value="">Select Department</option>
                                    <option value="CSE">CSE</option>
                                    <option value="ECE">ECE</option>
                                    <option value="EEE">EEE</option>
                                    <option value="Mechanical">Mechanical</option>
                                    <option value="Civil">Civil</option>
                                    <option value="Chemical">Chemical</option>
                                    <option value="Biotechnology">Biotechnology</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Location</label>
                                <Input
                                    value={formData.location}
                                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                                />
                            </div>
                        </div>
                        {/* I2: Added image_url field */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Image URL</label>
                            <Input
                                type="url"
                                placeholder="https://example.com/image.jpg"
                                value={formData.image_url}
                                onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                            />
                            <p className="text-xs text-muted-foreground">Enter a URL to an image of the machine</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Description</label>
                            <textarea
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                        {/* I2: Added is_active toggle */}
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="is_active"
                                checked={formData.is_active}
                                onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <label htmlFor="is_active" className="text-sm font-medium">
                                Machine is active and available for booking
                            </label>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={submitting}>Cancel</Button>
                            <Button type="submit" disabled={submitting}>
                                {submitting ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default MachineManager;

