import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Progress } from '../ui/progress'; // Need to create optional progress or just mock UI
import { Link } from 'react-router-dom';
import { Clock, CheckCircle2, AlertCircle, Plus, Microscope, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { bookingService } from '../../services/bookingService'; // Assuming service exists
import { motion } from 'framer-motion';

const BentoGridItem = ({ className, children, delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay }}
        className={className}
    >
        {children}
    </motion.div>
);

const StudentDashboard = () => {
    const { profile } = useAuth();
    // In real app, fetch these via React Query
    const stats = {
        activeBookings: 2,
        pendingRequests: 1,
        totalHours: 24,
        completedProjects: 3
    };

    const upcomingBookings = [
        { id: 1, machine: 'Electron Microscope', date: 'Tomorrow, 10:00 AM', status: 'approved' },
        { id: 2, machine: '3D Printer', date: 'Feb 12, 02:00 PM', status: 'pending' },
    ];

    return (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between"
            >
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Welcome back, {profile?.full_name?.split(' ')[0]} 👋</h2>
                    <p className="text-muted-foreground">Here's what's happening in your lab today.</p>
                </div>
                <div className="flex gap-2">
                    <Button asChild>
                        <Link to="/machines">
                            <Plus className="mr-2 h-4 w-4" /> New Booking
                        </Link>
                    </Button>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Stats Row - Bento Style */}
                <BentoGridItem className="col-span-1 md:col-span-2 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl border p-6 flex flex-col justify-between" delay={0.1}>
                    <div className="space-y-1">
                        <span className="text-sm font-medium text-muted-foreground">Total Lab Hours</span>
                        <div className="text-4xl font-bold tracking-tighter">{stats.totalHours}h</div>
                    </div>
                    <div className="mt-4">
                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                            <div className="h-full bg-primary w-[60%]" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">Top 15% of students this month</p>
                    </div>
                </BentoGridItem>

                <BentoGridItem className="md:col-span-1 bg-card rounded-xl border p-6 flex flex-col justify-between" delay={0.2}>
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Active</span>
                        <Clock className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold">{stats.activeBookings}</div>
                        <p className="text-xs text-muted-foreground">Bookings upcoming</p>
                    </div>
                </BentoGridItem>

                <BentoGridItem className="md:col-span-1 bg-card rounded-xl border p-6 flex flex-col justify-between" delay={0.3}>
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Pending</span>
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold">{stats.pendingRequests}</div>
                        <p className="text-xs text-muted-foreground">Awaiting approval</p>
                    </div>
                </BentoGridItem>

                {/* Main Content Area */}
                <BentoGridItem className="md:col-span-3 rounded-xl border bg-card overflow-hidden" delay={0.4}>
                    <div className="p-6 border-b flex items-center justify-between">
                        <h3 className="font-semibold">Recent Activity</h3>
                        <Button variant="ghost" size="sm" className="text-xs">View All</Button>
                    </div>
                    <div className="p-0">
                        {upcomingBookings.map((booking, i) => (
                            <div key={booking.id} className="flex items-center justify-between p-4 border-b last:border-0 hover:bg-muted/50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                                        <Microscope className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm">{booking.machine}</p>
                                        <p className="text-xs text-muted-foreground">{booking.date}</p>
                                    </div>
                                </div>
                                <Badge variant={booking.status === 'approved' ? 'success' : 'warning'}>
                                    {booking.status}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </BentoGridItem>

                <BentoGridItem className="md:col-span-1 rounded-xl border bg-card p-6 space-y-4" delay={0.5}>
                    <h3 className="font-semibold">Quick Actions</h3>
                    <div className="grid gap-2">
                        <Button variant="outline" className="w-full justify-start h-auto py-3">
                            <Microscope className="mr-2 h-4 w-4" /> Browse Machines
                        </Button>
                        <Button variant="outline" className="w-full justify-start h-auto py-3">
                            <Clock className="mr-2 h-4 w-4" /> Check Availability
                        </Button>
                        <Button variant="outline" className="w-full justify-start h-auto py-3">
                            <CheckCircle2 className="mr-2 h-4 w-4" /> Report Issue
                        </Button>
                    </div>
                </BentoGridItem>
            </div>
        </div>
    );
};

export default StudentDashboard;
