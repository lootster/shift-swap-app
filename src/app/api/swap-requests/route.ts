import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { swapRequestSchema } from '@/lib/validations';
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
                isActive: true,
                requesterUserId: { not: session.userId } // Don't show own requests
            },
            include: {
                requester: {
                    select: { fullName: true, appleEmail: true }
                },
                haveShift: true,
                interests: {
                    where: { isActive: true },
                    select: {
                        id: true,
                        interestedUserId: true,
                        isActive: true,
                        interestedUser: { select: { fullName: true } },
                    },
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Transform the data to include hasMyInterest and myInterestId
        const result = swapRequests.map((req) => {
            const myInterest = req.interests.find(interest => interest.interestedUserId === session.userId);
            const hasMyInterest = !!myInterest;
            const myInterestId = myInterest ? myInterest.id : null;

            // Remove the full interests array from the final output and add computed fields
            const { interests, ...rest } = req;
            return {
                ...rest,
                hasMyInterest,
                myInterestId,
                interestCount: interests.length, // Keep the count for display
            };
        });

        return NextResponse.json({
            success: true,
            swapRequests: result,
        });
    } catch (error) {
        console.error('Get swap requests error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getIronSession<SessionData>(request, NextResponse.next(), sessionOptions);

        if (!session.isLoggedIn || !session.userId) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const validatedData = swapRequestSchema.parse(body);

        // Verify the user owns the shift
        const shift = await prisma.shift.findFirst({
            where: {
                id: validatedData.haveShiftId,
                userId: session.userId,
            },
        });

        if (!shift) {
            return NextResponse.json(
                { success: false, error: 'Shift not found or not owned by user' },
                { status: 404 }
            );
        }

        // Check for existing active swap request for the same shift
        const existingRequest = await prisma.swapRequest.findFirst({
            where: {
                haveShiftId: validatedData.haveShiftId,
                isActive: true,
            },
        });

        if (existingRequest) {
            return NextResponse.json(
                { success: false, error: 'You already have an active swap request for this shift' },
                { status: 400 }
            );
        }

        const swapRequest = await prisma.swapRequest.create({
            data: {
                ...validatedData,
                requesterUserId: session.userId,
                wantDates: validatedData.wantDates ? JSON.stringify(validatedData.wantDates) : null,
            },
        });

        return NextResponse.json({
            success: true,
            swapRequest,
        });
    } catch (error) {
        console.error('Create swap request error:', error);
        return NextResponse.json(
            { success: false, error: 'Invalid request data' },
            { status: 400 }
        );
    }
}
