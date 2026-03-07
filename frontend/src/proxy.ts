import { NextRequest, NextResponse } from 'next/server';

const PROTECTED_ROUTES: Record<string, string[]> = {
    '/hr': ['HR'],
    '/interviewer': ['INTERVIEWER'],
    '/candidate': ['CANDIDATE'],
};

export function proxy(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Find which protected prefix this path falls under
    const matchedPrefix = Object.keys(PROTECTED_ROUTES).find((prefix) =>
        pathname.startsWith(prefix)
    );

    if (!matchedPrefix) return NextResponse.next();

    // Read token and user from cookies (set by the auth store on login)
    const token = req.cookies.get('token')?.value;
    const userCookie = req.cookies.get('user')?.value;

    if (!token || !userCookie) {
        return NextResponse.redirect(new URL('/login', req.url));
    }

    try {
        const user = JSON.parse(userCookie);
        const allowedRoles = PROTECTED_ROUTES[matchedPrefix];

        if (!allowedRoles.includes(user.role)) {
            // Logged in but wrong role — redirect to their own dashboard
            const roleRedirect: Record<string, string> = {
                HR: '/hr',
                INTERVIEWER: '/interviewer',
                CANDIDATE: '/candidate',
            };
            return NextResponse.redirect(new URL(roleRedirect[user.role] || '/', req.url));
        }
    } catch {
        return NextResponse.redirect(new URL('/login', req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/hr/:path*', '/interviewer/:path*', '/candidate/:path*'],
};
