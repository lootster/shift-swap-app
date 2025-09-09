import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { runCleanupIfNeeded } from '@/lib/cleanup';

export async function GET(request: NextRequest) {
    try {
        const response = NextResponse.json({ success: false });
        const session = await getIronSession<SessionData>(request, response, sessionOptions);

        if (!session.isLoggedIn || !session.userId) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            );
        }

        // Run cleanup of expired data if needed
        await runCleanupIfNeeded();

        const swapRequests = await prisma.swapRequest.findMany({
            where: {
                requesterUserId: session.userId,
                isActive: true
            },
            include: {
                haveShift: true,
                interests: {
                    where: { isActive: true },
                    include: {
                        interestedUser: {
                            select: { id: true, fullName: true, appleEmail: true }
                        },
                        offeredShift: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({
            success: true,
            swapRequests,
        });
    } catch (error) {
        console.error('Get user swap requests error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
