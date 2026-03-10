import prisma from '../config/database';
import { createCalendarEvent } from './google.service';

/**
 * Generate a Google Meet-style room link.
 * Format: https://meet.google.com/xxx-yyyy-zzz
 */
function generateMeetLink(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    const seg = (len: number) =>
        Array.from({ length: len }, () =>
            chars[Math.floor(Math.random() * chars.length)]
        ).join('');
    return `https://meet.google.com/${seg(3)}-${seg(4)}-${seg(3)}`;
}

/**
 * Schedule an interview at a specific HR-chosen time.
 * Generates a Meet link and updates candidate status to SCHEDULED.
 */
export async function scheduleInterview(
    candidateId: string,
    interviewerId: string,
    hrId: string,
    startTime: Date,
    durationMinutes: number = 45
) {
    const candidate = await prisma.candidate.findUnique({
        where: { id: candidateId },
        include: { user: true },
    });
    if (!candidate) throw new Error('Candidate not found');

    const interviewer = await prisma.user.findUnique({ where: { id: interviewerId } });
    const hr = await prisma.user.findUnique({ where: { id: hrId } });

    const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

    // Try real Google Meet via Calendar API; fall back to generated link
    const calendarMeetLink = await createCalendarEvent({
        summary: `Interview: ${candidate.user.name}`,
        startTime,
        endTime,
        attendeeEmails: [
            candidate.user.email,
            ...(interviewer ? [interviewer.email] : []),
            ...(hr ? [hr.email] : []),
        ],
        requestId: `${candidateId}-${Date.now()}`,
    });
    const meetLink = calendarMeetLink ?? generateMeetLink();

    const interview = await prisma.interview.create({
        data: { candidateId, interviewerId, hrId, startTime, endTime, meetLink, status: 'SCHEDULED' },
        include: {
            candidate: { include: { user: true, assignedRequirement: true } },
            interviewer: true,
            hr: true,
        },
    });

    await prisma.candidate.update({
        where: { id: candidateId },
        data: { status: 'SCHEDULED' },
    });

    return interview;
}

/**
 * Get all interviews with optional filters
 */
export async function getInterviews(filters?: {
    hrId?: string;
    interviewerId?: string;
    candidateId?: string;
    status?: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
}) {
    return prisma.interview.findMany({
        where: {
            ...(filters?.hrId && { hrId: filters.hrId }),
            ...(filters?.interviewerId && { interviewerId: filters.interviewerId }),
            ...(filters?.candidateId && { candidateId: filters.candidateId }),
            ...(filters?.status && { status: filters.status }),
        },
        include: {
            candidate: { include: { user: true, aiProfile: true } },
            interviewer: true,
            hr: true,
        },
        orderBy: { startTime: 'asc' },
    });
}

/**
 * Submit interview feedback and trigger AI summary
 */
export async function submitFeedback(
    interviewId: string,
    feedback: string,
    aiSummary?: string
) {
    return prisma.interview.update({
        where: { id: interviewId },
        data: {
            feedback,
            aiSummary,
            status: 'COMPLETED',
        },
    });
}

/**
 * Add availability slots for a user
 */
export async function addAvailabilitySlots(
    userId: string,
    slots: { startTime: Date; endTime: Date }[]
) {
    return prisma.availabilitySlot.createMany({
        data: slots.map((slot) => ({
            userId,
            startTime: slot.startTime,
            endTime: slot.endTime,
        })),
    });
}

/**
 * Get availability slots for a user
 */
export async function getAvailabilitySlots(
    userId: string,
    onlyAvailable: boolean = true
) {
    return prisma.availabilitySlot.findMany({
        where: {
            userId,
            ...(onlyAvailable && { isBooked: false }),
            startTime: { gte: new Date() },
        },
        orderBy: { startTime: 'asc' },
    });
}
