import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import * as requirementCtrl from '../controllers/requirement.controller';

const router = Router();

// All routes require authentication
router.use(authenticate as any);

// Create requirement (HR only)
router.post('/', authorize('HR') as any, requirementCtrl.createRequirement as any);

// Get all requirements (any authenticated user)
router.get('/', requirementCtrl.getAllRequirements as any);

// Get single requirement
router.get('/:id', requirementCtrl.getRequirementById as any);

// Update requirement (HR only)
router.put('/:id', authorize('HR') as any, requirementCtrl.updateRequirement as any);

// Delete requirement (HR only)
router.delete('/:id', authorize('HR') as any, requirementCtrl.deleteRequirement as any);

export default router;
