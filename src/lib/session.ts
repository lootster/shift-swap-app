import { SessionOptions } from 'iron-session';

export interface SessionData {
    userId?: string;
    appleEmail?: string;
    fullName?: string;
    isLoggedIn: boolean;
}

export const defaultSession: SessionData = {
    isLoggedIn: false,
};

export const sessionOptions: SessionOptions = {
    password: process.env.SESSION_SECRET!,
    cookieName: 'shift-swap-session',
    cookieOptions: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7, // 7 days
    },
};
