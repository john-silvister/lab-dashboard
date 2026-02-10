import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Check, X, Clock, User, AlertCircle, CheckCircle2, Calendar } from 'lucide-react';
// eslint-disable-next-line no-unused-vars -- motion.div used in JSX
import { motion } from 'framer-motion';
import { bookingService } from '@/services/bookingService';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';

const FacultyDashboard = () => {
    const [pendingBookings, setPendingBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null); // Track which booking is being processed
    const [realtimeError, setRealtimeError] = useState(false); // eslint-disable-line no-unused-vars -- set by realtime handler, shown via toast
    const [rejectModal, setRejectModal] = useState({ open: false, booking: null });
    const [rejectReason, setRejectReason] = useState('');
    const [detailBooking, setDetailBooking] = useState(null);

    const refreshTimeoutRef = React.useRef(null);

    const fetchPending = useCallback(async () => {
        setLoading(true);
        const { data, error } = await bookingService.getPendingBookings();
        if (!error && data) setPendingBookings(data);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchPending(); // eslint-disable-line react-hooks/set-state-in-effect
        const channel = supabase
            .channel('faculty-bookings')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
                // Debounce realtime updates to prevent race conditions
                if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
                refreshTimeoutRef.current = setTimeout(() => fetchPending(), 1000);
            })
            .subscribe((status) => {
                if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                    setRealtimeError(true);
                    toast.error('Realtime connection lost. Please refresh for latest updates.');
                } else if (status === 'SUBSCRIBED') {
                    setRealtimeError(false);
                }
            });
        return () => {
            supabase.removeChannel(channel);
            if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
        };
    }, [fetchPending]);

    const handleApprove = async (bookingId) => {
        // I7: Add confirmation for approve action
        if (!window.confirm('Are you sure you want to approve this booking?')) return;

        setActionLoading(bookingId);
        const { error } = await bookingService.updateBookingStatus(bookingId, 'approved');
        setActionLoading(null);
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
                                        className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/5 transition-colors gap-4">
                                        <div className="space-y-1 w-full md:w-auto">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h4 className="font-semibold">{machine.name || 'Unknown Machine'}</h4>
                                                {machine.location && (
                                                    <Badge variant="outline" className="text-muted-foreground">
                                                        {machine.location}
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <User className="h-3.5 w-3.5" />
                                                    {student.full_name || 'Unknown Student'} ({student.role || 'Student'})
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    {format(new Date(booking.booking_date), 'MMM d, yyyy')}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    {booking.start_time?.slice(0, 5)} - {booking.end_time?.slice(0, 5)}
                                                </span>
                                            </div>
                                            {booking.purpose && (
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    <span className="font-medium">Purpose:</span> {booking.purpose}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                                            <Button size="sm" variant="outline" className="min-h-[44px]" onClick={() => setDetailBooking(booking)}>
                                                Details
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="min-h-[44px] min-w-[44px] p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                                                disabled={actionLoading === booking.id}
                                                onClick={() => setRejectModal({ open: true, booking })}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="min-h-[44px] min-w-[44px] p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                disabled={actionLoading === booking.id}
                                                onClick={() => handleApprove(booking.id)}
                                            >
                                                {actionLoading === booking.id ? <Clock className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
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
                    <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Button variant="ghost" onClick={() => setDetailBooking(null)} className="w-full sm:w-auto">Close</Button>
                        <Button variant="destructive" onClick={() => { setDetailBooking(null); setRejectModal({ open: true, booking: detailBooking }); }} className="w-full sm:w-auto">
                            <X className="h-4 w-4 mr-1" /> Reject
                        </Button>
                        <Button onClick={() => { handleApprove(detailBooking.id); setDetailBooking(null); }} className="w-full sm:w-auto bg-green-600 hover:bg-green-700">
                            <Check className="h-4 w-4 mr-1" /> Approve
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default FacultyDashboard;
