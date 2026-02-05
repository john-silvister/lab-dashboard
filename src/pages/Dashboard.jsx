import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import EquipmentCard from '@/components/EquipmentCard'
import BookingModal from '@/components/BookingModal'

export default function Dashboard() {
    const [equipment, setEquipment] = useState([])
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(true)
    const [selectedEquipment, setSelectedEquipment] = useState(null)
    const [isModalOpen, setIsModalOpen] = useState(false)

    useEffect(() => {
        fetchEquipment()

        // Realtime subscription for equipment updates
        const channel = supabase
            .channel('equipment-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'equipment' },
                () => fetchEquipment()
            )
            .subscribe()

        return () => supabase.removeChannel(channel)
    }, [])

    const fetchEquipment = async () => {
        const { data } = await supabase
            .from('equipment')
            .select('*')
            .order('name')
        if (data) setEquipment(data)
        setLoading(false)
    }

    const filteredEquipment = equipment.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.category?.toLowerCase().includes(search.toLowerCase())
    )

    const handleBook = (item) => {
        setSelectedEquipment(item)
        setIsModalOpen(true)
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Lab Equipment</h1>
                    <p className="text-muted-foreground">Browse and book available resources.</p>
                </div>
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search equipment..."
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-[300px] rounded-lg bg-muted animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredEquipment.map(item => (
                        <EquipmentCard key={item.id} equipment={item} onBook={handleBook} />
                    ))}
                    {filteredEquipment.length === 0 && (
                        <div className="col-span-full text-center py-12 text-muted-foreground">
                            No equipment found matching your search.
                        </div>
                    )}
                </div>
            )}

            <BookingModal
                equipment={selectedEquipment}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    )
}
