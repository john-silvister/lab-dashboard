import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { format, addHours, startOfDay, isBefore } from 'date-fns'

const TIME_SLOTS = [
    "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"
]

export default function BookingModal({ equipment, isOpen, onClose }) {
    const { user } = useAuth()
    const [date, setDate] = useState(new Date())
    const [selectedTime, setSelectedTime] = useState(null)
    const [loading, setLoading] = useState(false)
    const [bookedSlots, setBookedSlots] = useState([])

    useEffect(() => {
        if (equipment && date && isOpen) {
            fetchBookedSlots()
        }
    }, [equipment, date, isOpen])

    const fetchBookedSlots = async () => {
        // Fetch bookings for this equipment on this date that are NOT rejected
        const start = startOfDay(date).toISOString()
        const end = addHours(startOfDay(date), 24).toISOString()

        const { data, error } = await supabase
            .from('bookings')
            .select('start_time, end_time')
            .eq('equipment_id', equipment.id)
            .neq('status', 'rejected')
            .gte('start_time', start)
            .lt('start_time', end)

        if (!error && data) {
            const times = data.map(b => format(new Date(b.start_time), 'HH:mm'))
            setBookedSlots(times)
        }
    }

    const handleBooking = async () => {
        if (!selectedTime || !date) return

        setLoading(true)
        try {
            // Construct start and end time
            const [hours, minutes] = selectedTime.split(':')
            const startTime = new Date(date)
            startTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)

            const endTime = addHours(startTime, 1)

            const { error } = await supabase
                .from('bookings')
                .insert({
                    equipment_id: equipment.id,
                    student_id: user.id,
                    start_time: startTime.toISOString(),
                    end_time: endTime.toISOString(),
                    status: 'pending' // Default to pending
                })

            if (error) throw error

            toast.success('Booking requested! faster approval.')
            onClose()
            setSelectedTime(null)
        } catch (error) {
            toast.error('Failed to book: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Book {equipment?.name}</DialogTitle>
                    <DialogDescription>
                        Select a date and time slot. Bookings are for 1 hour.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="flex justify-center">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={(d) => d && setDate(d)}
                            disabled={(date) => isBefore(date, startOfDay(new Date()))}
                            className="rounded-md border"
                        />
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                        {TIME_SLOTS.map(time => {
                            const isBooked = bookedSlots.includes(time)
                            return (
                                <Button
                                    key={time}
                                    variant={selectedTime === time ? "default" : "outline"}
                                    disabled={isBooked}
                                    onClick={() => setSelectedTime(time)}
                                    className={`text-xs ${isBooked ? 'opacity-50 cursor-not-allowed bg-muted' : ''}`}
                                >
                                    {time}
                                </Button>
                            )
                        })}
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleBooking} disabled={loading || !selectedTime}>
                        {loading ? 'Booking...' : 'Confirm Request'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
