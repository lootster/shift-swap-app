import { z } from 'zod';
import { validateDateRange } from './dateUtils';

// Auth validation
export const loginSchema = z.object({
    appleEmail: z.string().email().refine(
        (email) => email.endsWith('@apple.com'),
        { message: 'Email must be an Apple email address (@apple.com)' }
    ),
    fullName: z.string().min(1, 'Full name is required').max(100),
    passcode: z.string().min(1, 'Pass code is required'),
});

// Shift validation
export const shiftSchema = z.object({
    date: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
        .refine(
            (date) => {
                const validation = validateDateRange(date);
                return validation.isValid;
            },
            (date) => {
                const validation = validateDateRange(date);
                return { message: validation.error || 'Invalid date' };
            }
        ),
    start: z.string().regex(/^\d{2}:\d{2}$/, 'Start time must be in HH:mm format'),
    end: z.string().regex(/^\d{2}:\d{2}$/, 'End time must be in HH:mm format'),
    durationHours: z.number().refine(
        (hours) => hours === 4 || hours === 9,
        { message: 'Duration must be either 4 or 9 hours' }
    ),
});

// Swap request validation
export const swapRequestSchema = z.object({
    haveShiftId: z.string().cuid(),
    wantType: z.enum(['SAME_DAY', 'DATE_LIST']),
    wantDates: z.array(
        z.string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
            .refine(
                (date) => {
                    const validation = validateDateRange(date);
                    return validation.isValid;
                },
                (date) => {
                    const validation = validateDateRange(date);
                    return { message: validation.error || 'Invalid date' };
                }
            )
    ).optional(),
    timeRule: z.enum(['ANY', 'EXACT_START', 'END_NOT_AFTER']),
    timeValue: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    note: z.string().max(500).optional(),
}).refine(
    (data) => data.wantType === 'DATE_LIST' ? data.wantDates && data.wantDates.length > 0 : true,
    { message: 'Want dates are required when want type is DATE_LIST' }
);

// Interest validation
export const interestSchema = z.object({
    swapRequestId: z.string().cuid(),
    offeredShiftId: z.string().cuid(),
});
