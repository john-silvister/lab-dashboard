import React, { useState } from 'react';
import { AppSidebar } from '@/components/AppSidebar';
import { Menu, X, Microscope, LogOut, LayoutDashboard, Calendar, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const MobileNav = ({ navItems, currentPath, onSignOut }) => {
    const [open, setOpen] = useState(false);

    return (
        <div className="md:hidden">
            <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
                <Menu className="h-6 w-6" />
            </Button>

            {open && (
                <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
                    <div className="fixed inset-y-0 left-0 z-50 h-full w-3/4 border-r bg-background p-6 shadow-lg sm:max-w-sm">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-2 font-bold text-xl text-primary">
                                <Microscope className="h-6 w-6" />
                                <span>AML Lab</span>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                        <nav className="space-y-2">
                            {navItems.map(item => (
                                <Link
                                    key={item.href}
                                    to={item.href}
                                    onClick={() => setOpen(false)}
                                    className={cn(
                                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                                        currentPath === item.href ? "bg-primary/10 text-primary" : "text-foreground"
                                    )}
                                >
                                    <item.icon className="h-5 w-5" />
                                    {item.name}
                                </Link>
                            ))}
                            <button
                                onClick={onSignOut}
                                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                            >
                                <LogOut className="h-5 w-5" />
                                Sign Out
                            </button>
                        </nav>
                    </div>
                </div>
            )}
        </div>
    );
};

const DashboardLayout = ({ children }) => {
    const { profile, signOut } = useAuth();
    const location = useLocation();
    const role = profile?.role || 'student';

    const navItems = [
        { name: 'Dashboard', href: '/', icon: LayoutDashboard },
        { name: 'Machines', href: '/machines', icon: Microscope },
        { name: 'Bookings', href: '/bookings', icon: Calendar },
    ];

    if (role === 'admin' || role === 'faculty') {
        navItems.push({ name: 'Admin Panel', href: '/admin', icon: Settings });
    }

    return (
        <div className="flex min-h-screen bg-background">
            <AppSidebar />

            <div className="flex-1 flex flex-col">
                <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/95 px-6 backdrop-blur md:hidden">
                    <MobileNav navItems={navItems} currentPath={location.pathname} onSignOut={signOut} />
                    <span className="font-semibold">AML Lab</span>
                </header>

                <main className="flex-1 p-4 md:p-8 pt-6">
                    <div className="mx-auto max-w-7xl space-y-8 animate-in fade-in duration-500">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
