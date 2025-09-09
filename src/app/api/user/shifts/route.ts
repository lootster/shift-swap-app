import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { shiftSchema } from '@/lib/validations';
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

        const shifts = await prisma.shift.findMany({
            where: { userId: session.userId },
            orderBy: { date: 'asc' },
            include: {
                haveShiftRequests: {
                    where: { isActive: true },
                    select: { id: true }
                }
            }
        });

        // Transform the data to include hasActiveSwapRequest field
        const shiftsWithSwapInfo = shifts.map((shift: any) => ({
            id: shift.id,
            date: shift.date,
            start: shift.start,
            end: shift.end,
            durationHours: shift.durationHours,
            hasActiveSwapRequest: shift.haveShiftRequests.length > 0
        }));

        return NextResponse.json({
            success: true,
            shifts: shiftsWithSwapInfo,
        });
    } catch (error) {
        console.error('Get shifts error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validatedData = shiftSchema.parse(body);

        const response = NextResponse.json({ success: false });
        const session = await getIronSession<SessionData>(request, response, sessionOptions);

        if (!session.isLoggedIn || !session.userId) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            );
        }

        const shift = await prisma.shift.create({
            data: {
                ...validatedData,
                userId: session.userId,
            },
        });

        return NextResponse.json({
            success: true,
            shift,
        });
    } catch (error) {
        console.error('Create shift error:', error);
        return NextResponse.json(
            { success: false, error: 'Invalid request data' },
            { status: 400 }
        );
    }
}
