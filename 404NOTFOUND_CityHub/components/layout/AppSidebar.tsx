"use client";

import { memo, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutGrid,
    Map,
    MapPin,
    Users,
    User,
    LogOut,
    Building2,
    Compass,
    Search,
    ChevronDown,
    Shield,
    Landmark,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { NotificationBell } from "@/components/notifications/NotificationBell";

const CATEGORY_EMOJI: Record<string, string> = {
    "Neighborhood": "🏘️",
    "Environment": "🌱",
    "Education": "📚",
    "Arts & Culture": "🎨",
    "Sports & Recreation": "⚽",
    "Safety & Watch": "🚨",
    "Local Business": "🏪",
    "Tech & Innovation": "💻",
    "Health & Wellness": "💪",
    "Other": "📌",
};

const SidebarItem = memo(function SidebarItem({
    href,
    icon: Icon,
    label,
    isActive,
    onClick,
    badge,
}: {
    href: string;
    icon: any;
    label: string;
    isActive: boolean;
    onClick?: () => void;
    badge?: number;
}) {
    return (
        <Link
            href={href}
            onClick={onClick}
            className={cn(
                "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all group",
                isActive
                    ? "bg-primary/15 text-primary border border-primary/20"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground border border-transparent"
            )}
        >
            <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
            <span className="truncate">{label}</span>
            {badge && badge > 0 ? (
                <span className="ml-auto px-1.5 py-0.5 text-[10px] font-bold bg-destructive text-white rounded-full min-w-4.5 text-center">
                    {badge}
                </span>
            ) : null}
        </Link>
    );
});

/* ── Sidebar skeleton shown while the single query loads ── */
function SidebarSkeleton() {
    return (
        <aside className="h-full bg-background/95 backdrop-blur-sm flex flex-col lg:fixed lg:left-0 lg:top-0 lg:z-40 lg:w-72 lg:h-screen border-r border-border">
            <div className="h-14 flex items-center justify-between px-5 border-b border-border bg-card/50">
                <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
                        <Landmark className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-bold text-sm text-foreground tracking-tight">CityHub</span>
                </div>
                <Skeleton className="h-7 w-20 rounded-lg" />
            </div>
            <div className="flex-1 overflow-y-auto px-3 pt-4 space-y-6">
                <div className="space-y-2">
                    <Skeleton className="h-3 w-28 rounded ml-2" />
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-9 w-full rounded-lg" />)}
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-3 w-20 rounded ml-2" />
                    <Skeleton className="h-9 w-full rounded-lg" />
                    <Skeleton className="h-9 w-full rounded-lg" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-3 w-24 rounded ml-2" />
                    <Skeleton className="h-9 w-full rounded-lg" />
                    <Skeleton className="h-9 w-full rounded-lg" />
                </div>
            </div>
            <div className="p-3 border-t border-border bg-card/30">
                <div className="flex items-center gap-3 px-2 py-2">
                    <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                    <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3.5 w-24 rounded" />
                        <Skeleton className="h-2.5 w-16 rounded" />
                    </div>
                </div>
            </div>
        </aside>
    );
}

export function AppSidebar({ onNavigate }: { onNavigate?: () => void }) {
    const pathname = usePathname();
    const router = useRouter();
    const { data: session } = authClient.useSession();

    // ── Single combined query (replaces getMyProfile + getMyGroups + getFileUrl) ──
    const sidebarData = useQuery(api.users.getSidebarData, {});

    const handleSignOut = useCallback(async () => {
        await authClient.signOut({
            fetchOptions: { onSuccess: () => router.push("/auth/login") },
        });
    }, [router]);

    // Show skeleton while the single query loads
    if (sidebarData === undefined) return <SidebarSkeleton />;
    if (sidebarData === null) return null;

    const { profile, groups, avatarUrl, userName } = sidebarData;
    const cityName = profile?.city?.name ?? "City";
    const displayName = userName || session?.user?.name || "User";
    const initials = displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "U";

    return (
        <aside className="h-full bg-background/95 backdrop-blur-sm flex flex-col lg:fixed lg:left-0 lg:top-0 lg:z-40 lg:w-72 lg:h-screen border-r border-border">
            {/* Civic Header */}
            <div className="h-14 flex items-center justify-between px-3 border-b border-border bg-card/50">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                        <Landmark className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-bold text-sm text-foreground tracking-tight">
                        CityHub
                    </span>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                    <div className="hidden lg:block">
                        <NotificationBell />
                    </div>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
                {/* My Communities */}
                {groups.length > 0 && (
                    <div className="px-3 pt-4 pb-2">
                        <div className="px-2 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-[0.15em] mb-2 flex items-center gap-1.5">
                            <Shield className="w-3 h-3" />
                            My Communities
                        </div>
                        <div className="space-y-0.5">
                            {groups.map((group) => {
                                const isActive = pathname === `/community/${group._id}`;
                                const emoji = CATEGORY_EMOJI[group.category] || "📌";
                                return (
                                    <Link
                                        key={group._id}
                                        href={`/community/${group._id}`}
                                        onClick={onNavigate}
                                        className={cn(
                                            "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all group",
                                            isActive
                                                ? "bg-primary/10 text-foreground"
                                                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                        )}
                                    >
                                        <span className="text-base shrink-0">{emoji}</span>
                                        <span className="truncate font-medium">{group.name}</span>
                                        {group.myRole === "founder" || group.myRole === "manager" ? (
                                            <span className="ml-auto w-2 h-2 rounded-full bg-primary shrink-0" title="Manager" />
                                        ) : null}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Discover Section */}
                <div className="px-3 pt-4 pb-2">
                    <div className="px-2 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-[0.15em] mb-2 flex items-center gap-1.5">
                        <Compass className="w-3 h-3" />
                        Discover
                    </div>
                    <div className="space-y-0.5">
                        <SidebarItem
                            href="/community"
                            icon={Search}
                            label="Browse All Groups"
                            isActive={pathname === "/community"}
                            onClick={onNavigate}
                        />
                        <SidebarItem
                            href="/map"
                            icon={Map}
                            label="City Map"
                            isActive={pathname === "/map"}
                            onClick={onNavigate}
                        />
                    </div>
                </div>

                {/* Civic Platform */}
                <div className="px-3 pt-4 pb-2">
                    <div className="px-2 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-[0.15em] mb-2 flex items-center gap-1.5">
                        <Building2 className="w-3 h-3" />
                        Civic Platform
                    </div>
                    <div className="space-y-0.5">
                        <SidebarItem
                            href="/"
                            icon={LayoutGrid}
                            label="Dashboard"
                            isActive={pathname === "/"}
                            onClick={onNavigate}
                        />
                        <SidebarItem
                            href="/profile"
                            icon={User}
                            label="My Profile"
                            isActive={pathname === "/profile"}
                            onClick={onNavigate}
                        />
                    </div>
                </div>
            </div>

            {/* Footer - User Info */}
            <div className="p-3 border-t border-border bg-card/30">
                {profile && (
                    <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted/30 transition-colors">
                        <Avatar className="w-8 h-8 ring-2 ring-primary/20">
                            {avatarUrl && <AvatarImage src={avatarUrl} />}
                            <AvatarFallback className="text-xs bg-primary/15 text-primary font-bold">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">
                                {displayName}
                            </p>
                            <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                                {cityName}
                            </p>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={handleSignOut}
                                className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                title="Sign Out"
                            >
                                <LogOut className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </aside>
    );
}

