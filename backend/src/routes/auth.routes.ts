import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import prisma from '../config/database';
import { config } from '../config';
import { authenticate, AuthRequest } from '../middlewares/auth.middleware';
import { createOAuth2Client, getAuthUrl, saveTokens, isAuthorized } from '../services/google.service';
import { createNotification } from '../services/notification.service';
import { sendPasswordResetCode } from '../services/email.service';

const router = Router();

/**
 * POST /api/auth/register
 * Register a new user with email & password
 */
router.post('/register', async (req: Request, res: Response) => {
    try {
        const { email, password, name } = req.body;

        // Validate required fields
        if (!email || !password || !name) {
            res.status(400).json({ error: 'Email, password, and name are required' });
            return;
        }

        // Public registration is candidates only
        const role = 'CANDIDATE';

        if (password.length < 8) {
            res.status(400).json({ error: 'Password must be at least 8 characters' });
            return;
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            res.status(409).json({ error: 'User already exists' });
            return;
        }

        // Hash password
        const salt = await bcrypt.genSalt(12);
        const passwordHash = await bcrypt.hash(password, salt);

        // Create user
        const user = await prisma.user.create({
            data: { email, passwordHash, name, role },
        });

        // If user is a candidate, create candidate profile + welcome notification
        if (role === 'CANDIDATE') {
            await prisma.candidate.create({
                data: { userId: user.id },
            });
            createNotification(
                user.id,
                'WELCOME',
                'Welcome to HireOn!',
                'Your account has been created. Upload your resume to get started and let our AI find your perfect match.'
            ).catch(() => {});
        }

        // Generate JWT
        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            config.jwtSecret,
            { expiresIn: config.jwtExpiresIn as any }
        );

        res.status(201).json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
            token,
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

/**
 * POST /api/auth/login
 * Authenticate user with email & password
 */
router.post('/login', async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }

        // Find user
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            res.status(401).json({ error: 'Invalid email or password' });
            return;
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            res.status(401).json({ error: 'Invalid email or password' });
            return;
        }

        // Generate JWT
        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            config.jwtSecret,
            { expiresIn: config.jwtExpiresIn as any }
        );

        res.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
            token,
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

/**
 * POST /api/auth/create-member
 * HR creates an HR or INTERVIEWER account
 */
router.post('/create-member', authenticate as any, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user || req.user.role !== 'HR') {
            res.status(403).json({ error: 'Only HR can create team members' });
            return;
        }

        const { email, password, name, role } = req.body;

        if (!email || !password || !name || !role) {
            res.status(400).json({ error: 'Email, password, name, and role are required' });
            return;
        }

        if (!['HR', 'INTERVIEWER'].includes(role)) {
            res.status(400).json({ error: 'Role must be HR or INTERVIEWER' });
            return;
        }

        if (password.length < 8) {
            res.status(400).json({ error: 'Password must be at least 8 characters' });
            return;
        }

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            res.status(409).json({ error: 'A user with this email already exists' });
            return;
        }

        const salt = await bcrypt.genSalt(12);
        const passwordHash = await bcrypt.hash(password, salt);

        const user = await prisma.user.create({
            data: { email, passwordHash, name, role },
            select: { id: true, email: true, name: true, role: true, createdAt: true },
        });

        res.status(201).json({ user });
    } catch (error) {
        console.error('Create member error:', error);
        res.status(500).json({ error: 'Failed to create team member' });
    }
});

/**
 * GET /api/auth/team
 * HR fetches all HR and INTERVIEWER accounts
 */
router.get('/team', authenticate as any, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user || req.user.role !== 'HR') {
            res.status(403).json({ error: 'Only HR can view team members' });
            return;
        }

        const members = await prisma.user.findMany({
            where: { role: { in: ['HR', 'INTERVIEWER'] } },
            select: { id: true, email: true, name: true, role: true, createdAt: true },
            orderBy: [{ role: 'asc' }, { name: 'asc' }],
        });

        res.json(members);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch team members' });
    }
});

/**
 * GET /api/auth/interviewers
 * Get all users with INTERVIEWER role (for HR scheduling UI)
 */
router.get('/interviewers', authenticate as any, async (_req: AuthRequest, res: Response) => {
    try {
        const interviewers = await prisma.user.findMany({
            where: { role: 'INTERVIEWER' },
            select: { id: true, name: true, email: true },
            orderBy: { name: 'asc' },
        });
        res.json(interviewers);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch interviewers' });
    }
});

/**
 * GET /api/auth/me
 * Get current authenticated user info
 */
router.get('/me', authenticate as any, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }

        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: {
                candidate: {
                    include: { aiProfile: true },
                },
            },
        });

        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

/**
 * GET /api/auth/google
 * Redirect HR to Google OAuth consent screen
 */
router.get('/google', (_req: Request, res: Response) => {
    const url = getAuthUrl();
    res.redirect(url);
});

/**
 * GET /api/auth/google/callback
 * Google redirects here after consent; stores tokens and closes
 */
router.get('/google/callback', async (req: Request, res: Response) => {
    const code = req.query.code as string;
    if (!code) {
        res.status(400).send('Missing authorization code');
        return;
    }
    try {
        const client = createOAuth2Client();
        const { tokens } = await client.getToken(code);
        saveTokens(tokens);
        res.send(`
            <html><body style="font-family:sans-serif;text-align:center;padding:60px">
              <h2 style="color:#6c47ff">Google Calendar connected!</h2>
              <p>Real Google Meet links will now be generated for all interviews.</p>
              <p>You can close this tab.</p>
            </body></html>
        `);
    } catch (err) {
        console.error('[google] OAuth callback error:', err);
        res.status(500).send('Failed to exchange authorization code');
    }
});

/**
 * GET /api/auth/google/status
 * Check if Google Calendar is connected
 */
router.get('/google/status', authenticate as any, async (_req: AuthRequest, res: Response) => {
    res.json({ connected: isAuthorized() });
});

/**
 * POST /api/auth/forgot-password
 * Check email, generate 6-digit code, send it
 */
router.post('/forgot-password', async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        if (!email) {
            res.status(400).json({ error: 'Email is required' });
            return;
        }

        const user = await prisma.user.findUnique({ where: { email } });

        // Always return 200 to prevent email enumeration
        if (!user) {
            res.json({ message: 'If that email is registered, a code has been sent.' });
            return;
        }

        // Generate 6-digit code
        const code = String(Math.floor(100000 + crypto.randomInt(900000)));
        const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 min

        // Hash it before storing
        const hashed = await bcrypt.hash(code, 10);

        await prisma.user.update({
            where: { id: user.id },
            data: { resetCode: hashed, resetCodeExpiry: expiry },
        });

        await sendPasswordResetCode(user.email, code, user.name);
        if (process.env.NODE_ENV === 'development') console.log(`[DEV] Password reset code for ${user.email}: ${code}`);

        res.json({ message: 'If that email is registered, a code has been sent.' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Failed to send reset code' });
    }
});

/**
 * POST /api/auth/verify-reset-code
 * Verify the 6-digit code; if valid return a short-lived reset token
 */
router.post('/verify-reset-code', async (req: Request, res: Response) => {
    try {
        const { email, code } = req.body;
        if (!email || !code) {
            res.status(400).json({ error: 'Email and code are required' });
            return;
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.resetCode || !user?.resetCodeExpiry) {
            res.status(400).json({ error: 'Invalid or expired code' });
            return;
        }

        if (new Date() > user.resetCodeExpiry) {
            res.status(400).json({ error: 'Code has expired. Please request a new one.' });
            return;
        }

        const valid = await bcrypt.compare(code, user.resetCode);
        if (!valid) {
            res.status(400).json({ error: 'Incorrect code. Please try again.' });
            return;
        }

        // Issue a short-lived reset token (10 min)
        const resetToken = jwt.sign(
            { userId: user.id, purpose: 'password_reset' },
            config.jwtSecret,
            { expiresIn: '10m' }
        );

        res.json({ resetToken });
    } catch (error) {
        console.error('Verify reset code error:', error);
        res.status(500).json({ error: 'Failed to verify code' });
    }
});

/**
 * POST /api/auth/reset-password
 * Use resetToken + new password to update credentials
 */
router.post('/reset-password', async (req: Request, res: Response) => {
    try {
        const { resetToken, newPassword } = req.body;
        if (!resetToken || !newPassword) {
            res.status(400).json({ error: 'Reset token and new password are required' });
            return;
        }
        if (newPassword.length < 8) {
            res.status(400).json({ error: 'Password must be at least 8 characters' });
            return;
        }

        let payload: { userId: string; purpose: string };
        try {
            payload = jwt.verify(resetToken, config.jwtSecret) as typeof payload;
        } catch {
            res.status(400).json({ error: 'Invalid or expired reset token. Please start over.' });
            return;
        }

        if (payload.purpose !== 'password_reset') {
            res.status(400).json({ error: 'Invalid token' });
            return;
        }

        const hash = await bcrypt.hash(newPassword, 12);
        await prisma.user.update({
            where: { id: payload.userId },
            data: { passwordHash: hash, resetCode: null, resetCodeExpiry: null },
        });

        res.json({ message: 'Password reset successfully. You can now log in.' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Failed to reset password' });
    }
});

export default router;
