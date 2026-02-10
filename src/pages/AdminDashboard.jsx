import React from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import FacultyDashboard from '@/components/dashboard/FacultyDashboard';
import MachineManager from '@/components/admin/MachineManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const AdminDashboard = () => {
    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-bold tracking-tight">Admin Console</h2>
                </div>

                <Tabs defaultValue="overview" className="space-y-4">
                    <div className="w-full overflow-x-auto pb-2 relative" style={{ WebkitOverflowScrolling: 'touch' }}>
                        <div className="pointer-events-none absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-background to-transparent z-10 md:hidden" />
                        <TabsList>
                            <TabsTrigger value="overview">Overview & Approvals</TabsTrigger>
                            <TabsTrigger value="machines">Manage Machines</TabsTrigger>
                        </TabsList>
                    </div>
                    <TabsContent value="overview" className="space-y-4">
                        <FacultyDashboard />
                    </TabsContent>
                    <TabsContent value="machines" className="space-y-4">
                        <MachineManager />
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
};

export default AdminDashboard;
