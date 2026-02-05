import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default function EquipmentCard({ equipment, onBook }) {
    // Safe check for image, fallback if null
    const image = equipment.image_url || "https://placehold.co/600x400?text=Lab+Equipment"

    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
        >
            <Card className="overflow-hidden h-full flex flex-col">
                <div className="aspect-video w-full overflow-hidden bg-muted">
                    <img
                        src={image}
                        alt={equipment.name}
                        className="h-full w-full object-cover transition-transform hover:scale-105"
                    />
                </div>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <CardTitle className="text-xl">{equipment.name}</CardTitle>
                        <Badge variant={equipment.is_under_maintenance ? "destructive" : "secondary"}>
                            {equipment.is_under_maintenance ? "Maintenance" : "Available"}
                        </Badge>
                    </div>
                    <CardDescription>{equipment.category}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                    <p className="text-sm text-muted-foreground line-clamp-3">
                        {equipment.description}
                    </p>
                </CardContent>
                <CardFooter>
                    <Button
                        className="w-full"
                        onClick={() => onBook(equipment)}
                        disabled={equipment.is_under_maintenance}
                    >
                        {equipment.is_under_maintenance ? "Unavailable" : "Book Now"}
                    </Button>
                </CardFooter>
            </Card>
        </motion.div>
    )
}
