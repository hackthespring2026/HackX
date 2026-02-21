"use client";

import { useState, useCallback } from "react";
import { AppSidebar } from "./AppSidebar";
import { Menu, Search, Users, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetTrigger,
} from "@/components/ui/sheet";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { NotificationPermissionPrompt } from "@/components/notifications/NotificationPermissionPrompt";

export function AppShell({ children }: { children: React.ReactNode }) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

    return (
        <div className="flex flex-col h-dvh lg:block lg:h-auto lg:min-h-screen bg-background font-sans text-foreground">
            {/* Desktop Sidebar */}
            <div className="hidden lg:block">
                <AppSidebar />
            </div>

            {/* Mobile Header */}
            <div className="lg:hidden shrink-0 z-50 h-14 border-b border-border bg-card/95 backdrop-blur supports-backdrop-blur:bg-card/60">
                <div className="flex items-center justify-between h-full px-4">
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 bg-primary/15 flex items-center justify-center">
                            <Landmark className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-bold text-sm tracking-tight">CityHub</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="w-9 h-9 text-muted-foreground">
                            <Search className="w-4 h-4" />
                        </Button>
                        <NotificationBell />
                        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                            <SheetTrigger
                                render={
                                    <Button variant="ghost" size="icon" className="w-9 h-9 text-muted-foreground">
                                        <Menu className="w-5 h-5" />
                                        <span className="sr-only">Toggle menu</span>
                                    </Button>
                                }
                            />
                            <SheetContent side="right" className="p-0 w-72">
                                <AppSidebar onNavigate={closeMobileMenu} />
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="lg:pl-72 flex-1 min-h-0 overflow-y-auto lg:overflow-visible lg:min-h-screen">
                {children}
            </main>

            {/* Notification Permission Prompt (smart timing) */}
            <NotificationPermissionPrompt />
        </div>
    );
}
