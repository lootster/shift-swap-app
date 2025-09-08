// Utility functions for time handling in shift swap app
// Apple Retail shifts are between 8:00 AM and 11:00 PM with 15-minute intervals

export function generateTimeOptions(): string[] {
    const times: string[] = [];

    // Start from 8:00 AM (08:00)
    for (let hour = 8; hour <= 22; hour++) {
        for (let minute = 0; minute < 60; minute += 15) {
            // Skip 11:15 PM and later (23:15+)
            if (hour === 22 && minute > 45) break;

            const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            times.push(timeString);
        }
    }

    return times;
}

export function formatTimeForDisplay(time: string): string {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const minute = minutes;

    if (hour === 0) {
        return `12:${minute} AM`;
    } else if (hour < 12) {
        return `${hour}:${minute} AM`;
    } else if (hour === 12) {
        return `12:${minute} PM`;
    } else {
        return `${hour - 12}:${minute} PM`;
    }
}

export function validateTimeRange(startTime: string, endTime: string): { isValid: boolean; error?: string } {
    const start = timeToMinutes(startTime);
    const end = timeToMinutes(endTime);

    if (start >= end) {
        return { isValid: false, error: 'End time must be after start time' };
    }

    // Check if times are within allowed range (8:00 AM to 11:00 PM)
    const minTime = timeToMinutes('08:00');
    const maxTime = timeToMinutes('23:00');

    if (start < minTime || start > maxTime) {
        return { isValid: false, error: 'Start time must be between 8:00 AM and 11:00 PM' };
    }

    if (end < minTime || end > maxTime) {
        return { isValid: false, error: 'End time must be between 8:00 AM and 11:00 PM' };
    }

    return { isValid: true };
}

function timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
}
