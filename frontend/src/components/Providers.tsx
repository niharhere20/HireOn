"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useThemeStore } from "@/store/theme.store";

export default function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                retry: 1,
                staleTime: 15_000,
                gcTime: 5 * 60_000,
                refetchOnWindowFocus: false,
                refetchOnReconnect: true,
            },
            mutations: {
                onError: (err) => console.error('[mutation]', err),
            },
        },
    }));

    const init = useThemeStore((s) => s.init);

    useEffect(() => {
        init();
    }, [init]);

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}
