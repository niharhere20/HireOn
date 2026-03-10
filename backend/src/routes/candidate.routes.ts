import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import * as candidateCtrl from '../controllers/candidate.controller';

const router = Router();

// All routes require authentication
router.use(authenticate as any);

// Get all candidates (HR only)
router.get('/', authorize('HR') as any, candidateCtrl.getAllCandidates as any);

// Get single candidate (HR or the candidate themselves)
router.get('/:id', candidateCtrl.getCandidateById as any);

// Upload/update resume (candidate themselves)
router.put(
    '/:candidateId/resume',
    authorize('CANDIDATE') as any,
    candidateCtrl.uploadResume as any
);

// Trigger AI analysis (HR only)
router.post(
    '/:candidateId/analyze',
    authorize('HR') as any,
    candidateCtrl.analyzeCandidate as any
);

// Update candidate status (HR only)
router.patch(
    '/:candidateId/status',
    authorize('HR') as any,
    candidateCtrl.updateStatus as any
);

// Update candidate profile fields (candidate themselves)
router.patch(
    '/:candidateId/profile',
    authorize('CANDIDATE') as any,
    candidateCtrl.updateProfile as any
);

// Auto-shortlist for a requirement (HR only)
router.post(
    '/auto-shortlist/:requirementId',
    authorize('HR') as any,
    candidateCtrl.autoShortlist as any
);

export default router;
