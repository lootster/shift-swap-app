import { NextResponse } from 'next/server';
import { cleanupExpiredData } from '@/lib/cleanup';

export async function POST() {
    try {
        // Optional: Add authentication or API key check here for security
        // For now, anyone can trigger cleanup, but in production you might want to restrict this

        const result = await cleanupExpiredData();

        return NextResponse.json({
            success: true,
            message: 'Cleanup completed successfully',
            ...result,
        });
    } catch (error) {
        console.error('Manual cleanup error:', error);
        return NextResponse.json(
            { success: false, error: 'Cleanup failed' },
            { status: 500 }
        );
    }
}
