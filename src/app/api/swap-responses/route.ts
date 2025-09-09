import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { interestSchema } from '@/lib/validations';

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
        const validatedData = interestSchema.parse(body);

        // Get the swap request and offered shift to validate
        const [swapRequest, offeredShift] = await Promise.all([
            prisma.swapRequest.findUnique({
                where: { id: validatedData.swapRequestId },
                include: { haveShift: true }
            }),
            prisma.shift.findFirst({
                where: {
                    id: validatedData.offeredShiftId,
                    userId: session.userId,
                },
            }),
        ]);

        if (!swapRequest) {
            return NextResponse.json(
                { success: false, error: 'Swap request not found' },
                { status: 404 }
            );
        }

        if (!offeredShift) {
            return NextResponse.json(
                { success: false, error: 'Offered shift not found or not owned by user' },
                { status: 404 }
            );
        }

        // Prevent self interest
        if (swapRequest.requesterUserId === session.userId) {
            return NextResponse.json(
                { success: false, error: 'Cannot express interest in your own swap request' },
                { status: 400 }
            );
        }

        // Validate core business rules
        const haveShift = swapRequest.haveShift;

        // Duration must match
        if (offeredShift.durationHours !== haveShift.durationHours) {
            return NextResponse.json(
                { success: false, error: 'Offered shift duration must match requested shift duration' },
                { status: 400 }
            );
        }

        // SAME_DAY validation
        if (swapRequest.wantType === 'SAME_DAY' && offeredShift.date !== haveShift.date) {
            return NextResponse.json(
                { success: false, error: 'For same-day swaps, offered shift must be on the same date' },
                { status: 400 }
            );
        }

        // DATE_LIST validation
        if (swapRequest.wantType === 'DATE_LIST') {
            const wantDates = swapRequest.wantDates ? JSON.parse(swapRequest.wantDates) : [];
            if (!wantDates.includes(offeredShift.date)) {
                return NextResponse.json(
                    { success: false, error: 'Offered shift date must be in the requested date list' },
                    { status: 400 }
                );
            }
        }

        // Time rule validation
        if (swapRequest.timeRule === 'EXACT_START' && swapRequest.timeValue) {
            if (offeredShift.start !== swapRequest.timeValue) {
                return NextResponse.json(
                    { success: false, error: 'Offered shift start time must match the exact start time requirement' },
                    { status: 400 }
                );
            }
        }

        if (swapRequest.timeRule === 'END_NOT_AFTER' && swapRequest.timeValue) {
            if (offeredShift.end > swapRequest.timeValue) {
                return NextResponse.json(
                    { success: false, error: 'Offered shift end time must not be after the specified time' },
                    { status: 400 }
                );
            }
        }

        // Create swap response (unique constraint will prevent duplicates)
        const swapResponse = await prisma.swapResponse.create({
            data: {
                swapRequestId: validatedData.swapRequestId,
                interestedUserId: session.userId,
                offeredShiftId: validatedData.offeredShiftId,
            },
        });

        return NextResponse.json({
            success: true,
            swapResponse,
        });
    } catch (error) {
        console.error('Create swap response error:', error);

        // Handle unique constraint violation
        if (error instanceof Error && error.message.includes('Unique constraint')) {
            return NextResponse.json(
                { success: false, error: 'You have already expressed interest with this shift' },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { success: false, error: 'Invalid request data' },
            { status: 400 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const response = NextResponse.json({ success: false });
        const session = await getIronSession<SessionData>(request, response, sessionOptions);

        if (!session.isLoggedIn || !session.userId) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const swapRequestId = searchParams.get('swapRequestId');

        if (!swapRequestId) {
            return NextResponse.json(
                { success: false, error: 'Swap request ID is required' },
                { status: 400 }
            );
        }

        const result = await prisma.swapResponse.updateMany({
            where: {
                swapRequestId: swapRequestId,
                interestedUserId: session.userId,
                isActive: true,
            },
            data: {
                isActive: false,
            },
        });

        if (result.count === 0) {
            return NextResponse.json(
                { success: false, error: 'No active interest found to withdraw' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: `Successfully withdrew ${result.count} interest(s).`,
        });
    } catch (error) {
        console.error('Withdraw interest error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
