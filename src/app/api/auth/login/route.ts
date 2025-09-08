import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { loginSchema } from '@/lib/validations';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate request body
        const validatedData = loginSchema.parse(body);
        const { appleEmail, fullName } = validatedData;

        // Find or create user
        let user = await prisma.user.findUnique({
            where: { appleEmail },
        });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    appleEmail,
                    fullName,
                },
            });
        }

        // Create response first
        const response = NextResponse.json({
            success: true,
            user: {
                id: user.id,
                fullName: user.fullName,
                appleEmail: user.appleEmail,
            },
        });

        // Set session with response
        const session = await getIronSession<SessionData>(request, response, sessionOptions);
        session.userId = user.id;
        session.appleEmail = user.appleEmail;
        session.fullName = user.fullName;
        session.isLoggedIn = true;

        await session.save();

        return response;
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { success: false, error: 'Invalid request data' },
            { status: 400 }
        );
    }
}
