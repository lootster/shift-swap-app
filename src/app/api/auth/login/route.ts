import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { loginSchema } from '@/lib/validations';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        console.log('Login attempt:', { employeeId: body.employeeId, appleEmail: body.appleEmail, fullName: body.fullName, hasPasscode: !!body.passcode });

        // Validate request body
        const validatedData = loginSchema.parse(body);
        const { employeeId, appleEmail, fullName, passcode } = validatedData;
        console.log('Validation passed');

        // Validate passcode
        const expectedPasscode = process.env.PASSCODE;
        console.log('Passcode check:', { provided: passcode, expected: expectedPasscode, match: passcode === expectedPasscode });

        if (!expectedPasscode) {
            console.error('PASSCODE environment variable is not set');
            return NextResponse.json(
                { success: false, error: 'Server configuration error' },
                { status: 500 }
            );
        }

        if (passcode !== expectedPasscode) {
            console.log('Passcode mismatch:', { provided: passcode, expected: expectedPasscode });
            return NextResponse.json(
                { success: false, error: 'Invalid pass code' },
                { status: 401 }
            );
        }

        // Find or create user by employeeId
        let user = await prisma.user.findUnique({
            where: { employeeId },
        });

        if (!user) {
            // Create new user with employeeId
            user = await prisma.user.create({
                data: {
                    employeeId,
                    appleEmail,
                    fullName,
                },
            });
        } else {
            // Reject login if employeeId exists but name/email don't match
            // Use case-insensitive comparison for fullName
            if (user.fullName.toLowerCase() !== fullName.toLowerCase() || user.appleEmail !== appleEmail) {
                console.log('Data mismatch for employeeId:', {
                    employeeId,
                    provided: { fullName, appleEmail },
                    stored: { fullName: user.fullName, appleEmail: user.appleEmail }
                });
                return NextResponse.json(
                    { success: false, error: 'Credentials does not match registered information' },
                    { status: 401 }
                );
            }
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
        console.error('Login error details:', error);
        if (error instanceof Error) {
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
        }
        return NextResponse.json(
            { success: false, error: 'Invalid request data' },
            { status: 400 }
        );
    }
}
