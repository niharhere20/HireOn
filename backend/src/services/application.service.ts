import prisma from '../config/database';

export async function createApplication(candidateId: string, requirementId: string) {
    return prisma.application.upsert({
        where: { candidateId_requirementId: { candidateId, requirementId } },
        create: { candidateId, requirementId, status: 'APPLIED' },
        update: {},
        include: { requirement: true },
    });
}

export async function getApplicationsForCandidate(candidateId: string) {
    return prisma.application.findMany({
        where: { candidateId },
        include: {
            requirement: {
                select: { id: true, title: true, techStack: true, minExperience: true, openings: true },
            },
        },
        orderBy: { appliedAt: 'desc' },
    });
}

export async function getApplicationsForRequirement(requirementId: string) {
    return prisma.application.findMany({
        where: { requirementId },
        include: {
            candidate: {
                include: { user: { select: { id: true, name: true, email: true } }, aiProfile: true },
            },
        },
        orderBy: { appliedAt: 'desc' },
    });
}
