import prisma from '../config/database';

/**
 * Create a new tech requirement (job role)
 */
export async function createRequirement(data: {
    title: string;
    description?: string;
    techStack: string[];
    minExperience: number;
    matchThreshold?: number;
    openings?: number;
    createdByHRId: string;
}) {
    return prisma.techRequirement.create({
        data: {
            title: data.title,
            description: data.description,
            techStack: data.techStack,
            minExperience: data.minExperience,
            matchThreshold: data.matchThreshold ?? 80,
            openings: data.openings ?? 1,
            createdByHRId: data.createdByHRId,
        },
    });
}

/**
 * Get all tech requirements
 */
export async function getAllRequirements(onlyActive: boolean = true) {
    return prisma.techRequirement.findMany({
        where: onlyActive ? { isActive: true } : undefined,
        include: {
            candidates: {
                include: { user: true, aiProfile: true },
            },
            createdByHR: true,
        },
        orderBy: { createdAt: 'desc' },
    });
}

/**
 * Get a single requirement by ID
 */
export async function getRequirementById(id: string) {
    return prisma.techRequirement.findUnique({
        where: { id },
        include: {
            candidates: {
                include: { user: true, aiProfile: true },
            },
            createdByHR: true,
        },
    });
}

/**
 * Update a tech requirement
 */
export async function updateRequirement(
    id: string,
    data: Partial<{
        title: string;
        description: string;
        techStack: string[];
        minExperience: number;
        matchThreshold: number;
        openings: number;
        isActive: boolean;
    }>
) {
    return prisma.techRequirement.update({
        where: { id },
        data,
    });
}

/**
 * Delete (deactivate) a tech requirement
 */
export async function deactivateRequirement(id: string) {
    return prisma.techRequirement.update({
        where: { id },
        data: { isActive: false },
    });
}
