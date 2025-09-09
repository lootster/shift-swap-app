import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/session';
import { prisma } from '@/lib/prisma';

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

        // Get all data from all tables
        const users = await prisma.user.findMany({
            select: {
                id: true,
                fullName: true,
                appleEmail: true,
                createdAt: true,
                _count: {
                    select: {
                        shifts: true,
                        swapRequests: true,
                        swapResponses: true
                    }
                }
            }
        });
        
        const shifts = await prisma.shift.findMany({
            include: { 
                user: { select: { fullName: true } },
                _count: {
                    select: {
                        haveShiftRequests: true,
                        offeredSwapResponses: true
                    }
                }
            },
            orderBy: { date: 'desc' }
        });
        
        const swapRequests = await prisma.swapRequest.findMany({
            include: { 
                requester: { select: { fullName: true } },
                haveShift: { select: { date: true, start: true, end: true } },
                _count: { select: { swapResponses: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        
        const swapResponses = await prisma.swapResponse.findMany({
            include: {
                interestedUser: { select: { fullName: true } },
                offeredShift: { select: { date: true, start: true, end: true } },
                swapRequest: { 
                    select: { 
                        id: true,
                        requester: { select: { fullName: true } }
                    } 
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            summary: {
                totalUsers: users.length,
                totalShifts: shifts.length,
                totalSwapRequests: swapRequests.length,
                totalSwapResponses: swapResponses.length,
                activeSwapRequests: swapRequests.filter(r => r.isActive).length,
                activeSwapResponses: swapResponses.filter(r => r.isActive).length
            },
            data: {
                users,
                shifts,
                swapRequests,
                swapResponses
            }
        });
    } catch (error) {
        console.error('Database admin error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
