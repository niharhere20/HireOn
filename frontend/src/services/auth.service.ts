import api from '@/lib/api';

export interface User {
    id: string;
    name: string;
    email: string;
    role: 'HR' | 'INTERVIEWER' | 'CANDIDATE';
}

export interface AuthResponse {
    user: User;
    token: string;
}

export interface TeamMember {
    id: string;
    name: string;
    email: string;
    role: 'HR' | 'INTERVIEWER';
    createdAt: string;
}

export const authService = {
    login: (email: string, password: string) =>
        api.post<AuthResponse>('/api/auth/login', { email, password }).then((r) => r.data),

    register: (name: string, email: string, password: string, role: string) =>
        api.post<AuthResponse>('/api/auth/register', { name, email, password, role }).then((r) => r.data),

    me: () => api.get<User>('/api/auth/me').then((r) => r.data),

    getInterviewers: () =>
        api.get<{ id: string; name: string; email: string }[]>('/api/auth/interviewers').then((r) => r.data),

    getTeam: () =>
        api.get<TeamMember[]>('/api/auth/team').then((r) => r.data),

    createMember: (name: string, email: string, password: string, role: 'HR' | 'INTERVIEWER') =>
        api.post<{ user: TeamMember }>('/api/auth/create-member', { name, email, password, role }).then((r) => r.data),
};
