import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import * as requirementService from '../services/requirement.service';

export async function createRequirement(req: AuthRequest, res: Response) {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }

        const requirement = await requirementService.createRequirement({
            ...req.body,
            createdByHRId: req.user.id,
        });

        res.status(201).json(requirement);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create requirement' });
    }
}

export async function getAllRequirements(req: AuthRequest, res: Response) {
    try {
        const requirements = await requirementService.getAllRequirements();
        res.json(requirements);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch requirements' });
    }
}

export async function getRequirementById(req: AuthRequest, res: Response) {
    try {
        const requirement = await requirementService.getRequirementById(req.params.id as string);
        if (!requirement) {
            res.status(404).json({ error: 'Requirement not found' });
            return;
        }
        res.json(requirement);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch requirement' });
    }
}

export async function updateRequirement(req: AuthRequest, res: Response) {
    try {
        const requirement = await requirementService.updateRequirement(
            req.params.id as string,
            req.body
        );
        res.json(requirement);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update requirement' });
    }
}

export async function deleteRequirement(req: AuthRequest, res: Response) {
    try {
        await requirementService.deactivateRequirement(req.params.id as string);
        res.json({ message: 'Requirement deactivated' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete requirement' });
    }
}
