import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/session';

export async function POST(request: NextRequest) {
    try {
        const response = NextResponse.json({
            success: true,
            message: 'Logged out successfully',
        });

        const session = await getIronSession<SessionData>(request, response, sessionOptions);
        session.destroy();

        return response;
    } catch (error) {
        console.error('Logout error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
