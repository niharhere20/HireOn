import { create } from 'zustand';

export interface AuthUser {
    id: string;
    name: string;
    email: string;
    role: 'HR' | 'INTERVIEWER' | 'CANDIDATE';
}

interface AuthState {
    user: AuthUser | null;
    token: string | null;
    isLoaded: boolean;
    setAuth: (user: AuthUser, token: string) => void;
    clearAuth: () => void;
    loadFromStorage: () => void;
}

function setCookie(name: string, value: string, days = 7) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function deleteCookie(name: string) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    token: null,
    isLoaded: false,

    setAuth: (user, token) => {
        // Persist to localStorage (for API interceptor) + cookies (for middleware)
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        setCookie('token', token);
        setCookie('user', JSON.stringify(user));
        set({ user, token });
    },

    clearAuth: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        deleteCookie('token');
        deleteCookie('user');
        set({ user: null, token: null });
    },

    loadFromStorage: () => {
        try {
            const token = localStorage.getItem('token');
            const userRaw = localStorage.getItem('user');
            if (token && userRaw) {
                set({ user: JSON.parse(userRaw), token, isLoaded: true });
            } else {
                set({ isLoaded: true });
            }
        } catch {
            set({ isLoaded: true });
        }
    },
}));
