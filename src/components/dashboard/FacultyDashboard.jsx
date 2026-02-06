import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Check, X, Clock, User, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { bookingService } from '@/services/bookingService';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';

const FacultyDashboard = () => {
    const [pendingBookings, setPendingBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [rejectModal, setRejectModal] = useState({ open: false, booking: null });
    const [rejectReason, setRejectReason] = useState('');
    const [detailBooking, setDetailBooking] = useState(null);

    const fetchPending = useCallback(async () => {
        setLoading(true);
        const { data, error } = await bookingService.getPendingBookings();
        if (!error && data) setPendingBookings(data);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchPending();
        const channel = supabase
            .channel('faculty-bookings')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => fetchPending())
            .subscribe();
        return () => supabase.removeChannel(channel);
    }, [fetchPending]);

    const handleApprove = async (bookingId) => {
        const { error } = await bookingService.updateBookingStatus(bookingId, 'approved');
        if (error) {
            toast.error('Failed to approve booking');
        } else {
            toast.success('Booking approved');
            setPendingBookings(prev => prev.filter(b => b.id !== bookingId));
        }
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) {
            toast.error('Please provide a reason for rejection');
            return;
        }
        const { error } = await bookingService.updateBookingStatus(rejectModal.booking.id, 'rejected', rejectReason);
        if (error) {
            toast.error('Failed to reject booking');
        } else {
            toast.success('Booking rejected');
            setPendingBookings(prev => prev.filter(b => b.id !== rejectModal.booking.id));
        }
        setRejectModal({ open: false, booking: null });
        setRejectReason('');
    };

    const stats = {
        pending: pendingBookings.length,
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Faculty Dashboard</h2>
                <p className="text-muted-foreground">Manage approvals and oversee lab usage.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.pending}</div>
                        <p className="text-xs text-muted-foreground">Requests awaiting review</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Quick Approve</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">Use the approve/reject buttons below each request to process them quickly.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Realtime Updates</CardTitle>
                        <AlertCircle className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">New booking requests appear here automatically via realtime sync.</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="col-span-4">
                <CardHeader>
                    <CardTitle>Booking Requests</CardTitle>
                    <CardDescription>Review and approve student booking requests.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />)}
                        </div>
                    ) : pendingBookings.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            No pending requests. All caught up!
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {pendingBookings.map((booking, index) => {
                                const student = booking.profiles || {};
                                const machine = booking.machines || {};
                                return (
                                    <motion.div
                                        key={booking.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted/30 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <Avatar className="h-9 w-9">
                                                <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                                            </Avatar>
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium leading-none">{student.full_name || 'Unknown Student'}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    wants to use <span className="font-medium text-foreground">{machine.name || 'a machine'}</span>
                                                </p>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <Badge variant="outline" className="text-[10px] h-5">
                                                        {format(new Date(booking.booking_date), 'MMM d')} {booking.start_time?.slice(0, 5)} - {booking.end_time?.slice(0, 5)}
                                                    </Badge>
                                                    <span>--</span>
                                                    <span>{booking.purpose || 'No purpose given'}</span>
                                                </div>
                                                <p className="text-[10px] text-muted-foreground">
                                                    {formatDistanceToNow(new Date(booking.created_at), { addSuffix: true })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button size="sm" variant="outline" onClick={() => setDetailBooking(booking)} className="hidden md:inline-flex">
                                                Details
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                                                onClick={() => setRejectModal({ open: true, booking })}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                onClick={() => handleApprove(booking.id)}
                                            >
                                                <Check className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Reject Modal */}
            <Dialog open={rejectModal.open} onOpenChange={(open) => { if (!open) { setRejectModal({ open: false, booking: null }); setRejectReason(''); } }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Reject Booking</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Rejecting {rejectModal.booking?.profiles?.full_name}'s request for {rejectModal.booking?.machines?.name}.
                        </p>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Reason for rejection *</label>
                            <Input
                                placeholder="e.g., Equipment under maintenance, reschedule for next week"
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setRejectModal({ open: false, booking: null }); setRejectReason(''); }}>Cancel</Button>
                        <Button variant="destructive" onClick={handleReject}>Reject Booking</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Detail Modal */}
            <Dialog open={!!detailBooking} onOpenChange={() => setDetailBooking(null)}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Booking Request Details</DialogTitle>
                    </DialogHeader>
                    {detailBooking && (
                        <div className="space-y-4">
                            <Card className="bg-muted/30">
                                <CardContent className="pt-4 space-y-2 text-sm">
                                    <h4 className="font-semibold">Student Information</h4>
                                    <p>Name: {detailBooking.profiles?.full_name || 'N/A'}</p>
                                    <p>Email: {detailBooking.profiles?.email || 'N/A'}</p>
                                    <p>Department: {detailBooking.profiles?.department || 'N/A'}</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-muted/30">
                                <CardContent className="pt-4 space-y-2 text-sm">
                                    <h4 className="font-semibold">Booking Details</h4>
                                    <p>Machine: {detailBooking.machines?.name}</p>
                                    <p>Location: {detailBooking.machines?.location || 'N/A'}</p>
                                    <p>Date: {format(new Date(detailBooking.booking_date), 'MMMM d, yyyy')}</p>
                                    <p>Time: {detailBooking.start_time?.slice(0, 5)} - {detailBooking.end_time?.slice(0, 5)}</p>
                                    <p>Purpose: {detailBooking.purpose || 'Not specified'}</p>
                                    <p className="text-muted-foreground">Submitted {formatDistanceToNow(new Date(detailBooking.created_at), { addSuffix: true })}</p>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setDetailBooking(null)}>Close</Button>
                        <Button variant="destructive" onClick={() => { setDetailBooking(null); setRejectModal({ open: true, booking: detailBooking }); }}>
                            <X className="h-4 w-4 mr-1" /> Reject
                        </Button>
                        <Button onClick={() => { handleApprove(detailBooking.id); setDetailBooking(null); }} className="bg-green-600 hover:bg-green-700">
                            <Check className="h-4 w-4 mr-1" /> Approve
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default FacultyDashboard;
