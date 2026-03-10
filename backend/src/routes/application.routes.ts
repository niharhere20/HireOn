import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middlewares/auth.middleware';
import * as appService from '../services/application.service';
import prisma from '../config/database';

const router = Router();
router.use(authenticate as any);

// POST /api/applications — candidate applies to a requirement
router.post('/', async (req: AuthRequest, res: Response) => {
    try {
        const { requirementId } = req.body;
        if (!requirementId) {
            res.status(400).json({ error: 'requirementId is required' });
            return;
        }

        // Get candidateId from the authenticated user
        const candidate = await prisma.candidate.findUnique({ where: { userId: req.user!.id } });
        if (!candidate) {
            res.status(404).json({ error: 'Candidate profile not found' });
            return;
        }
        if (!candidate.resumeUrl) {
            res.status(400).json({ error: 'Please upload your resume before applying' });
            return;
        }

        const application = await appService.createApplication(candidate.id, requirementId);
        res.status(201).json(application);
    } catch (error) {
        res.status(500).json({ error: 'Failed to submit application' });
    }
});

// GET /api/applications/mine — get all applications for the current candidate
router.get('/mine', async (req: AuthRequest, res: Response) => {
    try {
        const candidate = await prisma.candidate.findUnique({ where: { userId: req.user!.id } });
        if (!candidate) {
            res.json([]);
            return;
        }
        const applications = await appService.getApplicationsForCandidate(candidate.id);
        res.json(applications);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch applications' });
    }
});

export default router;
