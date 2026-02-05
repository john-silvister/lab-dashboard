import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { format, addDays } from 'date-fns';
import { Calendar as CalendarIcon, Clock, ChevronRight, Check } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent } from '../ui/card';
import { bookingService } from '../../services/bookingService';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
// Note: Shadcn Calendar and Popover would be ideal here, but for now using native date input styled 
// or custom calendar if we had time. Sticking to simple inputs for "MVP 2.0" speed unless I see Calendar component.
// I haven't implemented Calendar ui component yet.

const steps = [
    { id: 1, title: 'Time' },
    { id: 2, title: 'Details' },
    { id: 3, title: 'Confirm' }
];

const BookingForm = ({ machine, onSuccess, onCancel }) => {
    const [step, setStep] = useState(1);
    const { user } = useAuth();
    const { register, handleSubmit, watch, formState: { errors } } = useForm({
        defaultValues: {
            date: format(new Date(), 'yyyy-MM-dd'),
            startTime: '09:00',
            endTime: '10:00',
            purpose: ''
        }
    });

    const formData = watch();

    const onSubmit = async (data) => {
        try {
            const startTime = new Date(`${data.date}T${data.startTime}`);
            const endTime = new Date(`${data.date}T${data.endTime}`);

            // Basic client validation
            if (startTime >= endTime) {
                toast.error("End time must be after start time");
                return;
            }

            // Check conflict
            const { data: conflict } = await bookingService.checkConflict(
                machine.id,
                data.date,
                startTime.toISOString(),
                endTime.toISOString()
            );

            if (conflict) {
                toast.error("Machine is already booked for this slot.");
                return;
            }

            const { error } = await bookingService.createBooking({
                equipment_id: machine.id,
                student_id: user.id,
                start_time: startTime.toISOString(),
                end_time: endTime.toISOString(),
                purpose: data.purpose,
                status: 'pending' // Default to pending
            });

            if (error) throw error;

            toast.success('Booking request sent!');
            onSuccess();
        } catch (error) {
            console.error(error);
            toast.error('Failed to create booking');
        }
    };

    const nextStep = () => setStep(s => Math.min(s + 1, 3));
    const prevStep = () => setStep(s => Math.max(s - 1, 1));

    return (
        <div className="w-full">
            {/* Progress Steps */}
            <div className="flex items-center justify-between mb-8 px-2 relative">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-muted -z-10" />
                {steps.map((s) => (
                    <motion.div
                        key={s.id}
                        initial={false}
                        animate={{
                            backgroundColor: step >= s.id ? "var(--primary)" : "var(--background)",
                            borderColor: step >= s.id ? "var(--primary)" : "var(--muted)",
                            color: step >= s.id ? "var(--primary-foreground)" : "var(--muted-foreground)"
                        }}
                        className={`h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all duration-300 relative`}
                    >
                        {step > s.id ? <Check className="h-4 w-4" /> : s.id}
                        <span className="absolute -bottom-6 text-[10px] font-medium text-foreground whitespace-nowrap">{s.title}</span>
                    </motion.div>
                ))}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-4">
                <AnimatePresence mode='wait'>
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                        >
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Date</label>
                                <Input
                                    type="date"
                                    min={format(new Date(), 'yyyy-MM-dd')}
                                    {...register('date', { required: true })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Start Time</label>
                                    <Input type="time" {...register('startTime', { required: true })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">End Time</label>
                                    <Input type="time" {...register('endTime', { required: true })} />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                        >
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Purpose of Use</label>
                                <Input
                                    placeholder="E.g., Senior Project Experiment"
                                    {...register('purpose', { required: 'Purpose is required' })}
                                />
                            </div>
                            <div className="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                                <p>Please ensure you are trained to use this equipment. Faculty approval may be required.</p>
                            </div>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                        >
                            <Card className="bg-muted/30 border-dashed">
                                <CardContent className="pt-6 space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Machine:</span>
                                        <span className="font-medium">{machine.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Date:</span>
                                        <span className="font-medium">{formData.date}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Time:</span>
                                        <span className="font-medium">{formData.startTime} - {formData.endTime}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex justify-between mt-8">
                    {step === 1 ? (
                        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
                    ) : (
                        <Button type="button" variant="outline" onClick={prevStep}>Back</Button>
                    )}

                    {step < 3 ? (
                        <Button type="button" onClick={nextStep}>
                            Next <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                    ) : (
                        <Button type="submit">Confirm Booking</Button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default BookingForm;
