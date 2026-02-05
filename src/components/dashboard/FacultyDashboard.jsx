import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Check, X, Clock, User } from 'lucide-react';
import { motion } from 'framer-motion';

const FacultyDashboard = () => {
    // Mock data - replace with useBooking hook
    const pendingBookings = [
        { id: 1, student: 'Alice Johnson', machine: 'Electron Microscope', date: 'Feb 12, 10:00 AM', purpose: 'Thesis Research' },
        { id: 2, student: 'Bob Smith', machine: '3D Printer', date: 'Feb 12, 02:00 PM', purpose: 'Prototyping' },
        { id: 3, student: 'Charlie Brown', machine: 'Centrifuge', date: 'Feb 13, 09:00 AM', purpose: 'Lab #4' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Faculty Dashboard</h2>
                <p className="text-muted-foreground">Manage approvals and oversee lab usage.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">12</div>
                        <p className="text-xs text-muted-foreground">+2 since last hour</p>
                    </CardContent>
                </Card>
                {/* Add more stats cards */}
            </div>

            <Card className="col-span-4">
                <CardHeader>
                    <CardTitle>Booking Requests</CardTitle>
                    <CardDescription>Review and approve student booking requests.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {pendingBookings.map((booking, index) => (
                            <motion.div
                                key={booking.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted/30 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-9 w-9">
                                        <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                                    </Avatar>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium leading-none">{booking.student}</p>
                                        <p className="text-sm text-muted-foreground">
                                            wants to use <span className="font-medium text-foreground">{booking.machine}</span>
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Badge variant="outline" className="text-[10px]">{booking.date}</Badge>
                                            <span>•</span>
                                            <span>{booking.purpose}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50">
                                        <X className="h-4 w-4" />
                                    </Button>
                                    <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50">
                                        <Check className="h-4 w-4" />
                                    </Button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default FacultyDashboard;
