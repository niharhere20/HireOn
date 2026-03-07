import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { config } from '../config';
import { authenticate, AuthRequest } from '../middlewares/auth.middleware';
import { createOAuth2Client, getAuthUrl, saveTokens, isAuthorized } from '../services/google.service';

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

        // If user is a candidate, create candidate profile
        if (role === 'CANDIDATE') {
            await prisma.candidate.create({
                data: { userId: user.id },
            });
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

export default router;
