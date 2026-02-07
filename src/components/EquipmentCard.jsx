import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Info } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * EquipmentCard Component
 * An alias/wrapper for MachineCard for semantic flexibility.
 * Use this when referring to general lab equipment that may not be a "machine".
 */
const EquipmentCard = ({ equipment, onBook, onDetails }) => {
    // Map equipment to machine props for consistency
    const machine = equipment;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            whileHover={{ y: -5 }}
        >
            <Card className="overflow-hidden border-border/50 h-full flex flex-col group hover:shadow-xl transition-all duration-300">
                <div className="aspect-video w-full bg-muted relative overflow-hidden">
                    {machine.image_url ? (
                        <img
                            src={machine.image_url}
                            alt={machine.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-secondary/50">
                            <Info className="h-10 w-10 opacity-20" />
                        </div>
                    )}
                    <div className="absolute top-2 right-2">
                        <Badge variant={machine.is_active ? "success" : "destructive"} className="shadow-sm">
                            {machine.is_active ? "Available" : "Maintenance"}
                        </Badge>
                    </div>
                </div>

                <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-start">
                        <CardTitle className="text-lg font-bold line-clamp-1 group-hover:text-primary transition-colors">
                            {machine.name}
                        </CardTitle>
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3 mr-1" />
                        {machine.location || 'Location not specified'}
                    </div>
                </CardHeader>

                <CardContent className="p-4 pt-0 flex-grow">
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {machine.description || 'No description available'}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1">
                        {machine.department && (
                            <Badge variant="outline" className="text-[10px] h-5">{machine.department}</Badge>
                        )}
                        {machine.requires_training && (
                            <Badge variant="outline" className="text-[10px] h-5 bg-yellow-50 text-yellow-700 border-yellow-200">
                                Training Required
                            </Badge>
                        )}
                    </div>
                </CardContent>

                <CardFooter className="p-4 pt-0 flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => onDetails && onDetails(machine)}
                        aria-label={`View details for ${machine.name}`}
                    >
                        Details
                    </Button>
                    <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => onBook && onBook(machine)}
                        disabled={!machine.is_active}
                        aria-label={`Book ${machine.name}`}
                    >
                        Book Now
                    </Button>
                </CardFooter>
            </Card>
        </motion.div>
    );
};

export default EquipmentCard;
