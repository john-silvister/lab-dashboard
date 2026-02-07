import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    Microscope,
    Calendar,
    Settings,
    LogOut,
    Menu,
    X,
    ChevronLeft,
    ChevronRight,
    UserCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';

import ProfileModal from '@/components/profile/ProfileModal';

export function AppSidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const { profile, signOut } = useAuth();
    const isAdmin = profile?.role === 'admin' || profile?.role === 'faculty';

    const navItems = [
        { name: 'Dashboard', href: '/', icon: LayoutDashboard },
        { name: 'Machines', href: '/machines', icon: Microscope },
        { name: 'Bookings', href: '/bookings', icon: Calendar },
    ];

    if (isAdmin) {
        navItems.push({ name: 'Admin Panel', href: '/admin', icon: Settings });
    }

    return (
        <>
            <motion.aside
                initial={false}
                animate={{ width: collapsed ? 80 : 250 }}
                className={cn(
                    "relative z-30 hidden h-screen flex-col border-r bg-card transition-all duration-300 md:flex"
                )}
            >
                <div className="flex h-16 items-center justify-between px-4">
                    <AnimatePresence mode='wait'>
                        {!collapsed && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center gap-2 font-bold text-xl text-primary"
                            >
                                <Microscope className="h-6 w-6" />
                                <span>LabBook</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    {collapsed && (
                        <div className="mx-auto text-primary">
                            <Microscope className="h-6 w-6" />
                        </div>
                    )}

                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute -right-3 top-6 h-6 w-6 rounded-full border bg-background shadow-md hidden md:flex"
                        onClick={() => setCollapsed(!collapsed)}
                    >
                        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
                    </Button>
                </div>

                <div className="flex-1 space-y-2 py-4 px-2">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.href}
                            to={item.href}
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                                    isActive ? "bg-primary/10 text-primary" : "text-muted-foreground",
                                    collapsed && "justify-center px-2"
                                )
                            }
                        >
                            <item.icon className="h-5 w-5 shrink-0" />
                            {!collapsed && <span>{item.name}</span>}
                        </NavLink>
                    ))}
                </div>

                <div className="border-t p-2">
                    <div
                        className={cn("flex items-center gap-3 rounded-md p-2 bg-muted/50 cursor-pointer hover:bg-muted transition-colors", collapsed && "justify-center")}
                        onClick={() => setIsProfileOpen(true)}
                    >
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={`https://avatar.vercel.sh/${profile?.email}`} />
                            <AvatarFallback><UserCircle className="h-6 w-6" /></AvatarFallback>
                        </Avatar>
                        {!collapsed && (
                            <div className="flex-1 overflow-hidden">
                                <p className="truncate text-sm font-medium">{profile?.full_name}</p>
                                <p className="truncate text-xs text-muted-foreground">{profile?.email}</p>
                            </div>
                        )}
                    </div>
                    <Button
                        variant="ghost"
                        className={cn("mt-2 w-full justify-start text-destructive hover:text-destructive", collapsed && "justify-center")}
                        onClick={signOut}
                    >
                        <LogOut className="h-4 w-4 shrink-0" />
                        {!collapsed && <span className="ml-2">Sign Out</span>}
                    </Button>
                </div>
            </motion.aside>

            <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
        </>
    );
}
