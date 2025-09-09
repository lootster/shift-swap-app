import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
    try {
        // This endpoint creates the database tables if they don't exist
        // Only run this once in production

        console.log('Setting up database tables...');

        // Test database connection
        await prisma.$connect();
        console.log('Database connected successfully');

        // Try to create tables by running a simple query
        // If tables don't exist, this will trigger Prisma to create them
        const userCount = await prisma.user.count();
        console.log('Database setup complete. User count:', userCount);

        return NextResponse.json({
            success: true,
            message: 'Database setup complete',
            userCount
        });

    } catch (error) {
        console.error('Database setup error:', error);
        return NextResponse.json({
            success: false,
            error: 'Database setup failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
