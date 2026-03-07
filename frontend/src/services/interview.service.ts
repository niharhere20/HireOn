import api from '@/lib/api';

export interface AvailabilitySlot {
    id: string;
    userId: string;
    startTime: string;
    endTime: string;
    isBooked: boolean;
}

export interface Interview {
    id: string;
    candidateId: string;
    interviewerId: string;
    hrId: string;
    startTime: string;
    endTime: string;
    meetLink: string | null;
    status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
    feedback: string | null;
    aiSummary: string | null;
    createdAt: string;
    candidate: {
        id: string;
        user: { name: string; email: string };
        aiProfile: { matchScore: number; hireProbability: number } | null;
    };
    interviewer: { id: string; name: string; email: string };
    hr: { id: string; name: string };
}

export const interviewService = {
    getAll: (params?: { status?: string }) =>
        api.get<Interview[]>('/api/interviews', { params }).then((r) => r.data),

    schedule: (candidateId: string, interviewerId: string, startTime: string, durationMinutes?: number) =>
        api.post<Interview>('/api/interviews/schedule', {
            candidateId,
            interviewerId,
            startTime,
            durationMinutes: durationMinutes ?? 45,
        }).then((r) => r.data),

    submitFeedback: (interviewId: string, feedback: string) =>
        api.post<Interview>(`/api/interviews/${interviewId}/feedback`, { feedback }).then((r) => r.data),

    addAvailability: (slots: { startTime: string; endTime: string }[]) =>
        api.post('/api/interviews/availability', { slots }).then((r) => r.data),

    getAvailability: (userId: string) =>
        api.get<AvailabilitySlot[]>(`/api/interviews/availability/${userId}`).then((r) => r.data),
};
