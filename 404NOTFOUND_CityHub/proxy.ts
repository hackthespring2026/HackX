import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isAuthenticated } from '@/lib/auth-server';

export async function proxy(request: NextRequest) {
    const authenticated = await isAuthenticated();

    // If not authenticated and trying to access protected routes, redirect to login
    if (!authenticated) {
        const loginUrl = new URL('/auth/login', request.url);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

// Configure which routes the middleware applies to
export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - /auth/* (authentication routes)
         * - /api/* (API routes)
         * - /_next/* (Next.js internals)
         * - /favicon.ico, /sitemap.xml, /robots.txt (static files)
         */
        '/((?!auth|api|_next|favicon.ico|sitemap.xml|robots.txt|sw\\.js).*)',
    ],
};
