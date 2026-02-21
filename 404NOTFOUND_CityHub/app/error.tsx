"use client";

import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle } from "lucide-react";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    console.error("App error:", error);

    return (
        <div className="flex h-screen items-center justify-center bg-background px-6">
            <div className="text-center space-y-4 max-w-sm">
                <div className="mx-auto w-14 h-14 bg-destructive/10 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-7 h-7 text-destructive" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">Something went wrong</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    An unexpected error occurred. This has been logged and we'll look into it.
                </p>
                <Button onClick={reset} variant="outline" className="gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Try again
                </Button>
            </div>
        </div>
    );
}
