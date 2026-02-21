import { ReactNode } from "react";
import { Building2, Users, Vote, MapPin } from "lucide-react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ─── DESKTOP: side-by-side layout ─── */}
      <div className="hidden lg:grid lg:grid-cols-5 min-h-screen">
        {/* LEFT — Brand panel (2/5) */}
        <div className="lg:col-span-2 flex flex-col justify-between p-10 xl:p-14 bg-primary text-primary-foreground relative overflow-hidden">
          {/* Subtle pattern overlay */}
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />

          <div className="relative z-10">
            <div className="flex items-center gap-2.5 mb-20">
              <div className="w-8 h-8 bg-primary-foreground/15 rounded-lg flex items-center justify-center">
                <Building2 className="w-4.5 h-4.5" />
              </div>
              <span className="font-semibold text-lg tracking-tight">
                CityHub
              </span>
            </div>

            <h1 className="text-3xl xl:text-4xl font-bold tracking-tight mb-4 leading-tight">
              Build better
              <br />
              cities, together.
            </h1>
            <p className="text-primary-foreground/70 text-base max-w-xs leading-relaxed">
              One platform for community discovery, civic governance, and urban coordination.
            </p>

            {/* Feature pills */}
            <div className="mt-10 space-y-3">
              <div className="flex items-center gap-3 text-sm text-primary-foreground/80">
                <div className="w-8 h-8 rounded-lg bg-primary-foreground/10 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <span>Discover communities in your city</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-primary-foreground/80">
                <div className="w-8 h-8 rounded-lg bg-primary-foreground/10 flex items-center justify-center shrink-0">
                  <Vote className="w-4 h-4" />
                </div>
                <span>Democratic governance, no gatekeepers</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-primary-foreground/80">
                <div className="w-8 h-8 rounded-lg bg-primary-foreground/10 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <span>City-wide activity map</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-6 border-t border-primary-foreground/15">
            <div className="flex items-center gap-6 text-sm">
              <div>
                <p className="text-2xl font-bold">120+</p>
                <p className="text-primary-foreground/50 text-xs uppercase tracking-wider">Communities</p>
              </div>
              <div className="w-px h-10 bg-primary-foreground/15" />
              <div>
                <p className="text-2xl font-bold">8</p>
                <p className="text-primary-foreground/50 text-xs uppercase tracking-wider">Cities</p>
              </div>
              <div className="w-px h-10 bg-primary-foreground/15" />
              <div>
                <p className="text-2xl font-bold">2.4k</p>
                <p className="text-primary-foreground/50 text-xs uppercase tracking-wider">Members</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — Auth form (3/5) */}
        <div className="lg:col-span-3 flex items-center justify-center p-6 sm:p-10 lg:p-16">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </div>

      {/* ─── MOBILE: stacked layout ─── */}
      <div className="lg:hidden min-h-screen flex flex-col">
        {/* Mobile Hero Banner */}
        <div className="relative bg-primary text-primary-foreground overflow-hidden">
          {/* Pattern overlay */}
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />

          {/* Gradient glow effect */}
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-primary-foreground/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-primary-foreground/5 rounded-full blur-3xl" />

          <div className="relative z-10 px-6 pt-8 pb-8 sm:px-8 sm:pt-10 sm:pb-10">
            {/* Logo */}
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-primary-foreground/15 rounded-lg flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
              <span className="font-semibold text-base tracking-tight">
                CityHub
              </span>
            </div>

            {/* Hero text */}
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight mb-2">
              Build better cities,
              <br />
              together.
            </h1>
            <p className="text-primary-foreground/60 text-sm max-w-[280px] leading-relaxed">
              Community discovery, civic governance, and urban coordination — in one place.
            </p>

            {/* Compact stats row */}
            <div className="flex items-center gap-4 mt-6 pt-5 border-t border-primary-foreground/10">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-primary-foreground/10 flex items-center justify-center">
                  <Users className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-sm font-bold leading-none">2.4k</p>
                  <p className="text-[10px] text-primary-foreground/50 uppercase tracking-wider">Members</p>
                </div>
              </div>
              <div className="w-px h-8 bg-primary-foreground/10" />
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-primary-foreground/10 flex items-center justify-center">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-sm font-bold leading-none">8</p>
                  <p className="text-[10px] text-primary-foreground/50 uppercase tracking-wider">Cities</p>
                </div>
              </div>
              <div className="w-px h-8 bg-primary-foreground/10" />
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-primary-foreground/10 flex items-center justify-center">
                  <Vote className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-sm font-bold leading-none">120+</p>
                  <p className="text-[10px] text-primary-foreground/50 uppercase tracking-wider">Groups</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile form area — pulls up slightly with rounded corners */}
        <div className="flex-1 -mt-3 bg-background rounded-t-2xl relative z-20 px-6 py-8 sm:px-8 sm:py-10 flex flex-col">
          <div className="w-full max-w-sm mx-auto flex-1">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
