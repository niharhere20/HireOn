import { create } from 'zustand';

interface ThemeState {
    theme: 'light' | 'dark';
    toggle: () => void;
    init: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
    theme: 'light',

    toggle: () => {
        const next = get().theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', next);
        document.documentElement.setAttribute('data-theme', next);
        set({ theme: next });
    },

    init: () => {
        const saved = localStorage.getItem('theme') as 'light' | 'dark' | null;
        const theme = saved ?? 'light';
        document.documentElement.setAttribute('data-theme', theme);
        set({ theme });
    },
}));
