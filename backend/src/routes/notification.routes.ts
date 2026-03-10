import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middlewares/auth.middleware';
import * as notifService from '../services/notification.service';

const router = Router();
router.use(authenticate as any);

// GET /api/notifications — get all for current user
router.get('/', async (req: AuthRequest, res: Response) => {
    try {
        const notifications = await notifService.getNotificationsForUser(req.user!.id);
        res.json(notifications);
    } catch {
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

// PATCH /api/notifications/:id/read — mark one as read
router.patch('/:id/read', async (req: AuthRequest, res: Response) => {
    try {
        await notifService.markAsRead(req.params.id, req.user!.id);
        res.json({ ok: true });
    } catch {
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
});

// PATCH /api/notifications/read-all — mark all as read
router.patch('/read-all', async (req: AuthRequest, res: Response) => {
    try {
        await notifService.markAllAsRead(req.user!.id);
        res.json({ ok: true });
    } catch {
        res.status(500).json({ error: 'Failed to mark all as read' });
    }
});

export default router;
