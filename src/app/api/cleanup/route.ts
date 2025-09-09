import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/session';
import { cleanupExpiredData } from '@/lib/cleanup';

export async function POST(request: NextRequest) {
    try {
        // Check if user is logged in
        const response = NextResponse.json({ success: false });
        const session = await getIronSession<SessionData>(request, response, sessionOptions);

        if (!session.isLoggedIn) {
            return NextResponse.json(
                { success: false, error: 'Must be logged in to trigger cleanup' },
                { status: 401 }
            );
        }

        const result = await cleanupExpiredData();

        return NextResponse.json({
            success: true,
            message: 'Cleanup completed successfully',
            ...result,
        });
    } catch (error) {
        console.error('Manual cleanup error:', error);
        return NextResponse.json(
            { success: false, error: 'Cleanup failed' },
            { status: 500 }
        );
    }
}
