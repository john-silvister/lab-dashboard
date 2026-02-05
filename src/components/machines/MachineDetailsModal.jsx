import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { MapPin, Info } from 'lucide-react';

const MachineDetailsModal = ({ machine, isOpen, onClose, onBook }) => {
    if (!machine) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between mr-4">
                        <DialogTitle>{machine.name}</DialogTitle>
                        <Badge variant={machine.is_active ? "success" : "destructive"}>
                            {machine.is_active ? "Available" : "Unavailable"}
                        </Badge>
                    </div>
                </DialogHeader>

                <div className="space-y-6">
                    <div className="aspect-video w-full rounded-lg overflow-hidden bg-muted">
                        {machine.image_url ? (
                            <img src={machine.image_url} alt={machine.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-secondary/50 text-muted-foreground">
                                <Info className="h-16 w-16 opacity-20" />
                            </div>
                        )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Location</h3>
                            <div className="flex items-center mt-1">
                                <MapPin className="h-4 w-4 mr-2 text-primary" />
                                <span>{machine.location || "N/A"}</span>
                            </div>
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Department</h3>
                            <div className="mt-1">
                                <span>{machine.department || "General"}</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-2">Description</h3>
                        <p className="text-foreground/80 leading-relaxed">
                            {machine.description || "No description available."}
                        </p>
                    </div>
                </div>

                <DialogFooter className="mt-4">
                    <Button variant="ghost" onClick={onClose}>Close</Button>
                    <Button
                        onClick={() => { onClose(); onBook(machine); }}
                        disabled={!machine.is_active}
                    >
                        Book This Machine
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default MachineDetailsModal;
