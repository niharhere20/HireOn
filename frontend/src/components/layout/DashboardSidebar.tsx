"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import styles from "./DashboardSidebar.module.css";
import { useThemeStore } from "@/store/theme.store";

interface NavItem {
    label: string;
    icon: string;
    href: string;
}

interface Props {
    role: "hr" | "interviewer" | "candidate";
}

const navItems: Record<string, NavItem[]> = {
    hr: [
        { label: "Overview", icon: "📊", href: "/hr" },
        { label: "Candidates", icon: "👥", href: "/hr/candidates" },
        { label: "Pipeline", icon: "🔄", href: "/hr/pipeline" },
        { label: "Analytics", icon: "📈", href: "/hr/analytics" },
        { label: "AI Insights", icon: "🧠", href: "/hr/insights" },
        { label: "Talent DB", icon: "🗄️", href: "/hr/talent-db" },
        { label: "Schedule", icon: "📅", href: "/hr/schedule" },
        { label: "Requirements", icon: "📋", href: "/hr/requirements" },
        { label: "Team", icon: "🏢", href: "/hr/team" },
    ],
    interviewer: [
        { label: "My Schedule", icon: "📅", href: "/interviewer" },
        { label: "Interviews", icon: "💬", href: "/interviewer/interviews" },
        { label: "Scorecard", icon: "📝", href: "/interviewer/scorecard" },
        { label: "Prep Kit", icon: "🎯", href: "/interviewer/prep-kit" },
        { label: "Live Room", icon: "🎙️", href: "/interviewer/live" },
        { label: "Collaboration", icon: "🤝", href: "/interviewer/collaboration" },
        { label: "Analytics", icon: "📊", href: "/interviewer/analytics" },
        { label: "Availability", icon: "🕐", href: "/interviewer/availability" },
    ],
    candidate: [
        { label: "Dashboard", icon: "🏠", href: "/candidate" },
        { label: "My Resume", icon: "📄", href: "/candidate/resume" },
        { label: "Open Jobs", icon: "💼", href: "/candidate/jobs" },
        { label: "Applications", icon: "📋", href: "/candidate/applications" },
        { label: "Prep Kit", icon: "🎯", href: "/candidate/prep" },
        { label: "Schedule", icon: "📅", href: "/candidate/schedule" },
        { label: "Offer Letter", icon: "🎉", href: "/candidate/offer" },
        { label: "Notifications", icon: "🔔", href: "/candidate/notifications" },
    ],
};

export default function DashboardSidebar({ role }: Props) {
    const pathname = usePathname();
    const { theme, toggle } = useThemeStore();
    const [mobileOpen, setMobileOpen] = useState(false);

    const close = () => setMobileOpen(false);

    return (
        <>
            {/* Mobile hamburger button */}
            <button
                className={styles.hamburger}
                onClick={() => setMobileOpen((v) => !v)}
                aria-label="Toggle menu"
            >
                <span className={styles.hamLine} />
                <span className={styles.hamLine} />
                <span className={styles.hamLine} />
            </button>

            {/* Overlay (mobile) */}
            {mobileOpen && (
                <div className={styles.overlay} onClick={close} />
            )}

            {/* Sidebar */}
            <aside className={`${styles.sidebar} ${mobileOpen ? styles.sidebarOpen : ""}`}>
                <Link href="/" className={styles.logo} onClick={close}>
                    <div className={styles.logoIcon}>✦</div>
                    <span className={styles.logoText}>HireOn</span>
                </Link>

                <div className={styles.roleTag}>
                    {role === "hr" ? "HR Manager" : role === "interviewer" ? "Interviewer" : "Candidate"}
                </div>

                <nav className={styles.nav}>
                    {navItems[role].map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`${styles.navItem} ${pathname === item.href ? styles.active : ""}`}
                            onClick={close}
                        >
                            <span className={styles.navIcon}>{item.icon}</span>
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className={styles.bottom}>
                    <button onClick={toggle} className={styles.navItem}>
                        <span className={styles.navIcon}>{theme === "dark" ? "☀️" : "🌙"}</span>
                        <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
                    </button>
                    <Link href="#" className={styles.navItem} onClick={close}>
                        <span className={styles.navIcon}>⚙️</span>
                        <span>Settings</span>
                    </Link>
                    <Link href="/login" className={styles.navItem} onClick={close}>
                        <span className={styles.navIcon}>🚪</span>
                        <span>Sign Out</span>
                    </Link>
                </div>
            </aside>
        </>
    );
}
