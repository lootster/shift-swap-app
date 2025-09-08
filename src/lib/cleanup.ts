import { prisma } from './prisma';

export async function cleanupExpiredData() {
    try {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

        console.log(`Running cleanup for shifts before ${today}`);

        // First, deactivate all swap requests for expired shifts
        const expiredSwapRequests = await prisma.swapRequest.updateMany({
            where: {
                isActive: true,
                haveShift: {
                    date: { lt: today }
                }
            },
            data: { isActive: false }
        });

        // Deactivate all interests for expired swap requests
        const expiredInterests = await prisma.interest.updateMany({
            where: {
                isActive: true,
                swapRequest: {
                    haveShift: {
                        date: { lt: today }
                    }
                }
            },
            data: { isActive: false }
        });

        // Finally, delete all expired shifts
        const deletedShifts = await prisma.shift.deleteMany({
            where: {
                date: { lt: today }
            }
        });

        console.log(`Cleanup completed: ${deletedShifts.count} shifts deleted, ${expiredSwapRequests.count} swap requests deactivated, ${expiredInterests.count} interests deactivated`);

        return {
            shiftsDeleted: deletedShifts.count,
            swapRequestsDeactivated: expiredSwapRequests.count,
            interestsDeactivated: expiredInterests.count
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
