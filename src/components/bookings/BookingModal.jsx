import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import BookingForm from './BookingForm';

const BookingModal = ({ machine, isOpen, onClose, onSuccess }) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Book {machine?.name}</DialogTitle>
                </DialogHeader>
                <BookingForm
                    machine={machine}
                    onSuccess={() => { onSuccess(); onClose(); }}
                    onCancel={onClose}
                />
            </DialogContent>
        </Dialog>
    );
};

export default BookingModal;
