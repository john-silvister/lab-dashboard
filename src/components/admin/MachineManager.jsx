import React, { useState, useEffect } from 'react';
import { machineService } from '../../services/machineService';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Plus, Edit, Trash, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

const MachineManager = () => {
    const [machines, setMachines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMachine, setEditingMachine] = useState(null);

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

    const fetchMachines = async () => {
        setLoading(true);
        const { data } = await machineService.getMachines({ isAdmin: true });
        if (data) setMachines(data);
        setLoading(false);
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
            setEditingMachine(null);
            setFormData({
                name: '',
                description: '',
                department: '',
                location: '',
                image_url: '',
                is_active: true
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Mocking create/update for now
            // await machineService.upsert(formData);
            toast.success(editingMachine ? 'Machine updated' : 'Machine created');
            setIsModalOpen(false);
            fetchMachines(); // In real app, this would refresh the list
        } catch (error) {
            toast.error('Failed to save machine');
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
                {machines.map(machine => (
                    <Card key={machine.id} className="flex flex-row items-center justify-between p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded bg-muted flex items-center justify-center overflow-hidden">
                                {machine.image_url ? (
                                    <img src={machine.image_url} alt={machine.name} className="h-full w-full object-cover" />
                                ) : (
                                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                                )}
                            </div>
                            <div>
                                <h3 className="font-semibold">{machine.name}</h3>
                                <p className="text-sm text-muted-foreground">{machine.department} • {machine.location}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleOpenModal(machine)}>
                                <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                <Trash className="h-4 w-4" />
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingMachine ? 'Edit Machine' : 'Add New Machine'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Name</label>
                            <Input
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Department</label>
                                <Input
                                    value={formData.department}
                                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Location</label>
                                <Input
                                    value={formData.location}
                                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Description</label>
                            <textarea
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                            <Button type="submit">Save Changes</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default MachineManager;
