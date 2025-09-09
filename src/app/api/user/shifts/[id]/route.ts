import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const response = NextResponse.json({ success: false });
        const session = await getIronSession<SessionData>(request, response, sessionOptions);

        if (!session.isLoggedIn || !session.userId) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            );
        }

        const shiftId = params.id;

        // Check if the shift belongs to the current user
        const shift = await prisma.shift.findFirst({
            where: {
                id: shiftId,
                userId: session.userId,
            },
            include: {
                haveShiftRequests: {
                    where: { isActive: true }
                }
            }
        });

        if (!shift) {
            return NextResponse.json(
                { success: false, error: 'Shift not found' },
                { status: 404 }
            );
        }

        // Check if shift has active swap requests
        if (shift.haveShiftRequests.length > 0) {
            return NextResponse.json(
                { success: false, error: 'Cannot delete shift with active swap requests. Please delete the swap request first.' },
                { status: 400 }
            );
        }

        // Delete the shift
        await prisma.shift.delete({
            where: { id: shiftId }
        });

        return NextResponse.json({
            success: true,
            message: 'Shift deleted successfully'
        });

    } catch (error) {
        console.error('Delete shift error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
