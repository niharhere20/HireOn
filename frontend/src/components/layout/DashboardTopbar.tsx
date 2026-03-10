"use client";
import styles from "./DashboardTopbar.module.css";
import { useThemeStore } from "@/store/theme.store";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

interface Props {
    role: "hr" | "interviewer" | "candidate";
    mobileOpen: boolean;
    onHamburger: () => void;
}

const roleLabels: Record<string, string> = {
    hr: "HR Manager",
    interviewer: "Interviewer",
    candidate: "Candidate",
};

export default function DashboardTopbar({ role, mobileOpen, onHamburger }: Props) {
    const { theme, toggle } = useThemeStore();

    const { data: me } = useQuery<{ name: string; profilePictureUrl: string | null }>({
        queryKey: ["me"],
        queryFn: () => api.get("/api/auth/me").then((r) => r.data),
        staleTime: 60_000,
    });

    const initial = (me?.name || "U").charAt(0).toUpperCase();

    return (
        <header className={styles.topbar}>
            {/* Logo */}
            <div className={styles.logo}>
                <div className={styles.logoOrbit}>
                    <div className={styles.logoOrbitRing} />
                    <div className={styles.logoBox}>
                        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                            <rect x="2" y="3" width="4" height="16" rx="2" fill="white" opacity="0.95" />
                            <rect x="16" y="3" width="4" height="16" rx="2" fill="white" opacity="0.95" />
                            <rect x="2" y="9" width="18" height="4" rx="2" fill="white" opacity="0.95" />
                            <path d="M16 5 L20 1 M18.2 1 L20 1 L20 2.8" stroke="rgba(0,212,200,1)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                </div>
                <span className={`${styles.wordmark} ${theme === "dark" ? styles.lwd : styles.lwl}`}>
                    Hireon
                </span>
            </div>

            {/* Search */}
            <div className={styles.search}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                </svg>
                <input type="search" placeholder="Search…" />
            </div>

            {/* Right */}
            <div className={styles.right}>
                <span className={styles.roleBadge}>{roleLabels[role]}</span>
                <button onClick={toggle} className={styles.themeBtn} aria-label="Toggle theme">
                    {theme === "dark" ? "☀️" : "🌙"}
                </button>
                <div className={styles.avatar} title={me?.name}>
                    {me?.profilePictureUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={me.profilePictureUrl}
                            alt="avatar"
                            style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
                        />
                    ) : (
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{initial}</span>
                    )}
                </div>
                <button
                    className={`${styles.hamburger} ${mobileOpen ? styles.hamburgerOpen : ""}`}
                    onClick={onHamburger}
                    aria-label="Toggle menu"
                >
                    <span className={styles.hamLine} />
                    <span className={styles.hamLine} />
                    <span className={styles.hamLine} />
                </button>
            </div>
        </header>
    );
}
