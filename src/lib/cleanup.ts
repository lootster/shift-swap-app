import { prisma } from './prisma';

export async function cleanupExpiredData() {
    try {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

        console.log(`Running cleanup for shifts before ${today}`);

        // Delete all expired shifts (cascade will handle related records)
        const deletedShifts = await prisma.shift.deleteMany({
            where: {
                date: { lt: today }
            }
        });

        console.log(`Cleanup completed: ${deletedShifts.count} expired shifts deleted (with cascaded related records)`);

        return {
            shiftsDeleted: deletedShifts.count
        };
    } catch (error) {
        console.error('Cleanup error:', error);
        throw error;
    }
}

// Track last cleanup time to avoid running too frequently
let lastCleanup = 0;
const CLEANUP_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours in milliseconds

export async function runCleanupIfNeeded() {
    const now = Date.now();

    // Only run cleanup if it's been more than 6 hours since last cleanup
    if (now - lastCleanup > CLEANUP_INTERVAL) {
        await cleanupExpiredData();
        lastCleanup = now;
    }
}
