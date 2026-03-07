import prisma from '../config/database';
import { CandidateStatus } from '@prisma/client';

/**
 * Create a new candidate profile linked to a user
 */
export async function createCandidate(userId: string) {
    return prisma.candidate.create({
        data: { userId },
        include: { user: true },
    });
}

/**
 * Get candidate by user ID
 */
export async function getCandidateByUserId(userId: string) {
    return prisma.candidate.findUnique({
        where: { userId },
        include: {
            user: true,
            aiProfile: true,
            assignedRequirement: true,
        },
    });
}

/**
 * Get candidate by candidate ID
 */
export async function getCandidateById(id: string) {
    return prisma.candidate.findUnique({
        where: { id },
        include: {
            user: true,
            aiProfile: true,
            assignedRequirement: true,
            interviews: {
                include: {
                    interviewer: true,
                },
            },
        },
    });
}

/**
 * Update resume data for a candidate
 */
export async function updateResume(
    candidateId: string,
    resumeUrl: string,
    resumeText: string
) {
    return prisma.candidate.update({
        where: { id: candidateId },
        data: { resumeUrl, resumeText },
    });
}

/**
 * Update candidate status
 */
export async function updateCandidateStatus(
    candidateId: string,
    status: CandidateStatus
) {
    return prisma.candidate.update({
        where: { id: candidateId },
        data: { status },
    });
}

/**
 * Assign candidate to a tech requirement
 */
export async function assignToRequirement(
    candidateId: string,
    requirementId: string
) {
    return prisma.candidate.update({
        where: { id: candidateId },
        data: { assignedRequirementId: requirementId },
    });
}

/**
 * Get all candidates with optional filters
 */
export async function getAllCandidates(filters?: {
    status?: CandidateStatus;
    requirementId?: string;
    minMatchScore?: number;
}) {
    return prisma.candidate.findMany({
        where: {
            ...(filters?.status && { status: filters.status }),
            ...(filters?.requirementId && {
                assignedRequirementId: filters.requirementId,
            }),
            ...(filters?.minMatchScore && {
                aiProfile: { matchScore: { gte: filters.minMatchScore } },
            }),
        },
        include: {
            user: true,
            aiProfile: true,
            assignedRequirement: true,
        },
        orderBy: {
            aiProfile: { matchScore: 'desc' },
        },
    });
}

/**
 * Auto-shortlist candidates who meet the threshold
 */
export async function autoShortlistForRequirement(requirementId: string) {
    const requirement = await prisma.techRequirement.findUnique({
        where: { id: requirementId },
    });

    if (!requirement) {
        throw new Error('Requirement not found');
    }

    // Find candidates with AI profiles that meet the threshold
    const eligibleCandidates = await prisma.candidate.findMany({
        where: {
            status: 'APPLIED',
            aiProfile: {
                matchScore: { gte: requirement.matchThreshold },
                experienceYears: { gte: requirement.minExperience },
            },
        },
        include: { aiProfile: true },
    });

    // Update all eligible candidates
    const updates = eligibleCandidates.map((candidate) =>
        prisma.candidate.update({
            where: { id: candidate.id },
            data: {
                status: 'SHORTLISTED',
                assignedRequirementId: requirementId,
            },
        })
    );

    return prisma.$transaction(updates);
}
