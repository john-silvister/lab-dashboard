import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Check, X, Clock } from 'lucide-react'
import { format } from 'date-fns'

export default function AdminPanel() {
    const [bookings, setBookings] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchBookings()

        // Subscribe to booking changes
        const channel = supabase
            .channel('admin-bookings')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' },
                () => fetchBookings()
            )
            .subscribe()

        return () => supabase.removeChannel(channel)
    }, [])

    const fetchBookings = async () => {
        // Join with profiles and equipment
        const { data, error } = await supabase
            .from('bookings')
            .select(`
        *,
        profiles:student_id (full_name, email),
        equipment:equipment_id (name)
      `)
            .eq('status', 'pending') // Only show pending initially? Plan says "Pending Requests". 
            // User might want to see history too. Let's just show pending sorted by time.
            .order('created_at', { ascending: false })

        if (error) {
            toast.error('Error fetching bookings')
        } else {
            setBookings(data)
        }
        setLoading(false)
    }

    const handleStatusUpdate = async (id, newStatus) => {
        let denialReason = null
        if (newStatus === 'rejected') {
            denialReason = window.prompt("Enter reason for rejection:")
            if (!denialReason) return // Cancelled
        }

        try {
            const { error } = await supabase
                .from('bookings')
                .update({
                    status: newStatus,
                    denial_reason: denialReason
                })
                .eq('id', id)

            if (error) throw error
            toast.success(`Booking ${newStatus}`)

            // OPTIONAL: Optimistic update or wait for realtime. 
            // Realtime subscription handles list refresh, but to be snappy:
            setBookings(prev => prev.filter(b => b.id !== id))

        } catch (error) {
            toast.error('Failed to update status: ' + error.message)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Faculty Dashboard</h1>
                <Badge variant="outline" className="px-4 py-1">Admin Mode</Badge>
            </div>

            <div className="rounded-md border p-4 bg-background/50 backdrop-blur-sm">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5" /> Pending Requests
                </h2>

                {loading ? (
                    <div className="space-y-2">
                        <div className="h-10 w-full bg-muted animate-pulse rounded" />
                        <div className="h-10 w-full bg-muted animate-pulse rounded" />
                        <div className="h-10 w-full bg-muted animate-pulse rounded" />
                    </div>
                ) : bookings.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        No pending requests. Good job!
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Student</TableHead>
                                <TableHead>Equipment</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Time</TableHead>
                                <TableHead>Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {bookings.map((booking) => (
                                <TableRow key={booking.id}>
                                    <TableCell>
                                        <div className="font-medium">{booking.profiles?.full_name || 'Unknown'}</div>
                                        <div className="text-xs text-muted-foreground">{booking.profiles?.email}</div>
                                    </TableCell>
                                    <TableCell>{booking.equipment?.name}</TableCell>
                                    <TableCell>{format(new Date(booking.start_time), 'MMM d, yyyy')}</TableCell>
                                    <TableCell>
                                        {format(new Date(booking.start_time), 'h:mm a')} - {format(new Date(booking.end_time), 'h:mm a')}
                                    </TableCell>
                                    <TableCell className="flex gap-2">
                                        <Button
                                            size="sm"
                                            className="bg-green-600 hover:bg-green-700"
                                            onClick={() => handleStatusUpdate(booking.id, 'approved')}
                                        >
                                            <Check className="h-4 w-4 mr-1" /> Approve
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => handleStatusUpdate(booking.id, 'rejected')}
                                        >
                                            <X className="h-4 w-4 mr-1" /> Reject
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>
        </div>
    )
}
