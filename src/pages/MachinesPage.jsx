import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import MachineCard from '@/components/machines/MachineCard';
import { machineService } from '@/services/machineService';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, X } from 'lucide-react';
import BookingModal from '@/components/bookings/BookingModal';
import MachineDetailsModal from '@/components/machines/MachineDetailsModal';


const MachinesPage = () => {
    const [machines, setMachines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState({ department: '', location: '' });
    const [showFilters, setShowFilters] = useState(false);

    // Modal state
    const [selectedMachine, setSelectedMachine] = useState(null);
    const [isBookModalOpen, setIsBookModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

    const fetchMachines = useCallback(async () => {
        setLoading(true);
        const { data } = await machineService.getMachines(filters);
        if (data) setMachines(data);
        setLoading(false);
    }, [filters]);

    useEffect(() => {
        fetchMachines();
    }, [fetchMachines]);

    const filteredMachines = machines.filter(m =>
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.description?.toLowerCase().includes(search.toLowerCase())
    );

    const handleBook = (machine) => {
        setSelectedMachine(machine);
        setIsBookModalOpen(true);
    };

    const handleDetails = (machine) => {
        setSelectedMachine(machine);
        setIsDetailsModalOpen(true);
    };

    return (
        <DashboardLayout>
            <div className="flex flex-col space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Machines & Equipment</h1>
                        <p className="text-muted-foreground">Browse available lab resources for your projects.</p>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search..."
                                className="pl-9"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
                            <Filter className="h-4 w-4 mr-2" /> Filters
                        </Button>
                    </div>
                </div>

                {showFilters && (
                    <div className="bg-card p-4 rounded-lg border flex flex-wrap gap-4 items-end">
                        <div className="space-y-2 min-w-[200px]">
                            <label className="text-sm font-medium">Department</label>
                            <select
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                value={filters.department}
                                onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
                            >
                                <option value="">All Departments</option>
                                <option value="CSE">CSE</option>
                                <option value="ECE">ECE</option>
                                <option value="Mech">Mechanical</option>
                            </select>
                        </div>
                        {/* Add more filters here */}
                        <Button variant="ghost" onClick={() => setFilters({ department: '', location: '' })}>
                            <X className="h-4 w-4 mr-2" /> Reset
                        </Button>
                    </div>
                )}

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-80 bg-muted animate-pulse rounded-xl" />
                        ))}
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredMachines.map(machine => (
                                <MachineCard
                                    key={machine.id}
                                    machine={machine}
                                    onBook={handleBook}
                                    onDetails={handleDetails}
                                />
                            ))}
                        </div>
                        {filteredMachines.length === 0 && (
                            <div className="text-center py-20 text-muted-foreground">
                                <p>No machines found matching your criteria.</p>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Placeholder for Booking Modal, will implement in next step */}
            {isBookModalOpen && (
                <BookingModal
                    machine={selectedMachine}
                    isOpen={isBookModalOpen}
                    onClose={() => setIsBookModalOpen(false)}
                    onSuccess={() => {
                        // Optionally refresh machines or show confetti
                    }}
                />
            )}


            {isDetailsModalOpen && (
                <MachineDetailsModal
                    machine={selectedMachine}
                    isOpen={isDetailsModalOpen}
                    onClose={() => setIsDetailsModalOpen(false)}
                    onBook={() => {
                        setIsDetailsModalOpen(false);
                        setIsBookModalOpen(true);
                    }}
                />
            )}
        </DashboardLayout>
    );
};

export default MachinesPage;
