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

        const swapRequestId = params.id;

        // Verify the user owns the swap request
        const swapRequest = await prisma.swapRequest.findFirst({
            where: {
                id: swapRequestId,
                requesterUserId: session.userId,
                isActive: true,
            },
        });

        if (!swapRequest) {
            return NextResponse.json(
                { success: false, error: 'Swap request not found or not owned by user' },
                { status: 404 }
            );
        }

        // Soft delete by setting isActive to false
        await prisma.swapRequest.update({
            where: { id: swapRequestId },
            data: { isActive: false },
        });

        // Also deactivate all related interests
        await prisma.interest.updateMany({
            where: { swapRequestId: swapRequestId },
            data: { isActive: false },
        });

        return NextResponse.json({
            success: true,
            message: 'Swap request deleted successfully',
        });
    } catch (error) {
        console.error('Delete swap request error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
