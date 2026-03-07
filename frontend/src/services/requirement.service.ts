import api from '@/lib/api';

export interface TechRequirement {
    id: string;
    title: string;
    description: string | null;
    techStack: string[];
    minExperience: number;
    matchThreshold: number;
    openings: number;
    isActive: boolean;
    createdAt: string;
    createdByHR: { id: string; name: string };
    candidates: { id: string; user: { name: string }; status: string }[];
}

export const requirementService = {
    getAll: () =>
        api.get<TechRequirement[]>('/api/requirements').then((r) => r.data),

    getById: (id: string) =>
        api.get<TechRequirement>(`/api/requirements/${id}`).then((r) => r.data),

    create: (data: {
        title: string;
        description?: string;
        techStack: string[];
        minExperience: number;
        matchThreshold?: number;
        openings?: number;
    }) => api.post<TechRequirement>('/api/requirements', data).then((r) => r.data),

    update: (id: string, data: Partial<TechRequirement>) =>
        api.put<TechRequirement>(`/api/requirements/${id}`, data).then((r) => r.data),

    delete: (id: string) =>
        api.delete(`/api/requirements/${id}`).then((r) => r.data),
};
