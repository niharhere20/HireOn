import api from '@/lib/api';

export interface AIProfile {
    experienceYears: number;
    seniorityLevel: string;
    extractedSkills: string[];
    inferredSkills: string[];
    strengths: string;
    weaknesses: string;
    matchScore: number;
    hireProbability: number;
}

export interface Candidate {
    id: string;
    userId: string;
    resumeUrl: string | null;
    resumeText: string | null;
    status: 'APPLIED' | 'SHORTLISTED' | 'SCHEDULED' | 'INTERVIEWED' | 'HIRED' | 'REJECTED';
    assignedRequirementId: string | null;
    createdAt: string;
    user: { id: string; name: string; email: string };
    aiProfile: AIProfile | null;
    assignedRequirement: { id: string; title: string } | null;
}

export const candidateService = {
    getAll: (params?: { status?: string; requirementId?: string; minMatchScore?: number }) =>
        api.get<Candidate[]>('/api/candidates', { params }).then((r) => r.data),

    getById: (id: string) =>
        api.get<Candidate>(`/api/candidates/${id}`).then((r) => r.data),

    updateStatus: (candidateId: string, status: string) =>
        api.patch(`/api/candidates/${candidateId}/status`, { status }).then((r) => r.data),

    analyze: (candidateId: string) =>
        api.post<Candidate>(`/api/candidates/${candidateId}/analyze`).then((r) => r.data),

    autoShortlist: (requirementId: string) =>
        api.post(`/api/candidates/auto-shortlist/${requirementId}`).then((r) => r.data),

    uploadResume: (candidateId: string, file: File) => {
        const formData = new FormData();
        formData.append('resume', file);
        return api.post(`/api/upload/resume/${candidateId}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }).then((r) => r.data);
    },

    updateResumeText: (candidateId: string, resumeUrl: string, resumeText: string) =>
        api.put(`/api/candidates/${candidateId}/resume`, { resumeUrl, resumeText }).then((r) => r.data),

    getMine: () =>
        api.get<{ id: string }>('/api/auth/me').then((r) => r.data),
};
