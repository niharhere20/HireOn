import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import * as interviewCtrl from '../controllers/interview.controller';

const router = Router();

// All routes require authentication
router.use(authenticate as any);

// Schedule interview (HR only)
router.post(
    '/schedule',
    authorize('HR') as any,
    interviewCtrl.scheduleInterview as any
);

// Get interviews (role-filtered automatically)
router.get('/', interviewCtrl.getInterviews as any);

// Submit feedback (Interviewer only)
router.post(
    '/:interviewId/feedback',
    authorize('INTERVIEWER') as any,
    interviewCtrl.submitFeedback as any
);

// Add availability (Interviewer or Candidate)
router.post(
    '/availability',
    authorize('INTERVIEWER', 'CANDIDATE') as any,
    interviewCtrl.addAvailability as any
);

// Get availability for a user
router.get('/availability/:userId', interviewCtrl.getAvailability as any);

export default router;
