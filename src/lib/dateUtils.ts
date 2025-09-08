import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);

// Set Singapore timezone as default
const SINGAPORE_TIMEZONE = 'Asia/Singapore';

export function getCurrentDateSG(): string {
    return dayjs().tz(SINGAPORE_TIMEZONE).format('YYYY-MM-DD');
}

export function getMaxAllowedDateSG(): string {
    return dayjs().tz(SINGAPORE_TIMEZONE).add(1, 'month').format('YYYY-MM-DD');
}

export function isDateTooFarInFuture(date: string): boolean {
    const inputDate = dayjs(date);
    const maxAllowedDate = dayjs().tz(SINGAPORE_TIMEZONE).add(1, 'month');

    return inputDate.isAfter(maxAllowedDate);
}

export function isDateInPast(date: string): boolean {
    const inputDate = dayjs(date);
    const today = dayjs().tz(SINGAPORE_TIMEZONE).startOf('day');

    return inputDate.isBefore(today);
}

export function validateDateRange(date: string): { isValid: boolean; error?: string } {
    if (isDateInPast(date)) {
        return {
            isValid: false,
            error: 'Date cannot be in the past'
        };
    }

    if (isDateTooFarInFuture(date)) {
        return {
            isValid: false,
            error: 'Date cannot be more than 1 month in the future'
        };
    }

    return { isValid: true };
}
