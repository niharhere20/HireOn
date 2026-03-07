import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import * as candidateService from '../services/candidate.service';
import * as aiService from '../services/ai.service';
import { CandidateStatus } from '@prisma/client';

export async function getAllCandidates(req: AuthRequest, res: Response) {
    try {
        const { status, requirementId, minMatchScore } = req.query;
        const candidates = await candidateService.getAllCandidates({
            status: status as CandidateStatus | undefined,
            requirementId: requirementId as string | undefined,
            minMatchScore: minMatchScore ? parseFloat(minMatchScore as string) : undefined,
        });
        res.json(candidates);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch candidates' });
    }
}

export async function getCandidateById(req: AuthRequest, res: Response) {
    try {
        const candidate = await candidateService.getCandidateById(req.params.id as string);
        if (!candidate) {
            res.status(404).json({ error: 'Candidate not found' });
            return;
        }
        res.json(candidate);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch candidate' });
    }
}

export async function uploadResume(req: AuthRequest, res: Response) {
    try {
        const candidateId = req.params.candidateId as string;
        const { resumeUrl, resumeText } = req.body;

        const candidate = await candidateService.updateResume(
            candidateId,
            resumeUrl,
            resumeText
        );
        res.json(candidate);
    } catch (error) {
        res.status(500).json({ error: 'Failed to upload resume' });
    }
}

export async function analyzeCandidate(req: AuthRequest, res: Response) {
    try {
        const candidateId = req.params.candidateId as string;
        const candidate = await candidateService.getCandidateById(candidateId);

        if (!candidate || !candidate.resumeText) {
            res.status(400).json({ error: 'Candidate has no resume text' });
            return;
        }

        const requirement = candidate.assignedRequirement;
        const techStack = requirement
            ? (requirement.techStack as string[])
            : [];
        const minExperience = requirement?.minExperience ?? 0;

        const force = req.query.force === 'true';
        await aiService.analyzeAndSaveProfile(
            candidateId,
            candidate.resumeText,
            techStack,
            minExperience,
            force
        );

        // Fetch updated candidate with AI profile
        const updated = await candidateService.getCandidateById(candidateId);
        res.json(updated);
    } catch (error) {
        console.error('Analyze candidate error:', error);
        res.status(500).json({ error: 'Failed to analyze candidate' });
    }
}

export async function updateStatus(req: AuthRequest, res: Response) {
    try {
        const candidateId = req.params.candidateId as string;
        const { status } = req.body;

        const candidate = await candidateService.updateCandidateStatus(
            candidateId,
            status
        );
        res.json(candidate);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update status' });
    }
}

export async function autoShortlist(req: AuthRequest, res: Response) {
    try {
        const requirementId = req.params.requirementId as string;
        const result = await candidateService.autoShortlistForRequirement(requirementId);
        res.json({ shortlisted: result.length, candidates: result });
    } catch (error) {
        res.status(500).json({ error: 'Failed to auto-shortlist' });
    }
}
