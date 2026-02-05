import { Link, useNavigate } from 'react-router-dom'
import { Beaker, User, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

export default function Navbar() {
    const { user, profile, isAdmin } = useAuth()
    const navigate = useNavigate()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        navigate('/login')
    }

    if (!user) return null

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center">
                <div className="mr-4 flex">
                    <Link to="/" className="mr-6 flex items-center space-x-2">
                        <Beaker className="h-6 w-6" />
                        <span className="hidden font-bold sm:inline-block">LabEquip</span>
                    </Link>
                    <nav className="flex items-center space-x-6 text-sm font-medium">
                        <Link to="/" className="transition-colors hover:text-foreground/80 text-foreground/60">Dashboard</Link>
                        {isAdmin && (
                            <Link to="/admin" className="transition-colors hover:text-foreground/80 text-foreground/60">Admin Panel</Link>
                        )}
                    </nav>
                </div>
                <div className="flex flex-1 items-center justify-end space-x-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src="" alt={profile?.full_name} />
                                    <AvatarFallback>{profile?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                                </Avatar>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56" align="end" forceMount>
                            <div className="grid gap-4">
                                <div className="space-y-2">
                                    <h4 className="font-medium leading-none">{profile?.full_name || 'User'}</h4>
                                    <p className="text-sm text-muted-foreground">{user.email}</p>
                                    <div className="text-xs text-muted-foreground capitalize">{profile?.role}</div>
                                </div>
                                <Button variant="outline" size="sm" onClick={handleLogout} className="w-full">
                                    <LogOut className="mr-2 h-4 w-4" /> Log out
                                </Button>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>
        </header>
    )
}
