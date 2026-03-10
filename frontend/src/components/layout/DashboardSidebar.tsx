"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import styles from "./DashboardSidebar.module.css";
import { useThemeStore } from "@/store/theme.store";
import { useQueryClient } from "@tanstack/react-query";

interface SubItem {
    label: string;
    icon: string;
    href: string;
    dot?: "green";
    newBadge?: boolean;
}

interface NavItem {
    label: string;
    icon: string;
    href?: string;
    badge?: number;
    exact?: boolean;
    newBadge?: boolean;
    sub?: SubItem[];
}

interface Section {
    label: string;
    items: NavItem[];
}

const hrNav: Section[] = [
    {
        label: "Main",
        items: [
            { label: "Overview", icon: "🏠", href: "/hr", exact: true },
            {
                label: "Candidates", icon: "👥",
                sub: [
                    { label: "All Candidates", icon: "📋", href: "/hr/candidates" },
                    { label: "Upload / Add JD", icon: "📄", href: "/hr/requirements" },
                    { label: "Talent DB", icon: "💾", href: "/hr/talent-db" },
                ],
            },
            { label: "Pipeline", icon: "📋", href: "/hr/pipeline" },
            { label: "Schedule", icon: "📅", href: "/hr/schedule" },
        ],
    },
    {
        label: "Intelligence",
        items: [
            { label: "AI Insights", icon: "🧠", href: "/hr/insights" },
        ],
    },
    {
        label: "Account",
        items: [
            { label: "Settings", icon: "⚙️", href: "/hr/settings" },
        ],
    },
];

const interviewerNav: Section[] = [
    {
        label: "My Panel",
        items: [
            { label: "Dashboard",          icon: "🏠", href: "/interviewer",              exact: true },
            { label: "My Interviews",      icon: "📥", href: "/interviewer/interviews"   },
            { label: "Scorecard & Eval",   icon: "📊", href: "/interviewer/scorecard"    },
            { label: "Panel Collaboration",icon: "🤝", href: "/interviewer/collaboration" },
            { label: "My Analytics",       icon: "📈", href: "/interviewer/analytics" },
            { label: "Prep Kit",           icon: "🗒️", href: "/interviewer/prep-kit" },
            { label: "Live Room",          icon: "🟢", href: "/interviewer/live" },
        ],
    },
    {
        label: "Account",
        items: [
            { label: "Availability", icon: "🕐", href: "/interviewer/availability" },
            { label: "Settings",     icon: "⚙️", href: "#" },
        ],
    },
];

const candidateNav: Section[] = [
    {
        label: "My Application",
        items: [
            { label: "Application Journey", icon: "🗺️", href: "/candidate",               exact: true },
            { label: "My Interviews",        icon: "📅", href: "/candidate/schedule"      },
            { label: "My Profile & Resume",  icon: "👤", href: "/candidate/resume"        },
            { label: "Notifications",        icon: "🔔", href: "/candidate/notifications" },
            { label: "Current Openings",     icon: "💼", href: "/candidate/jobs"          },
        ],
    },
];

const navMap = { hr: hrNav, interviewer: interviewerNav, candidate: candidateNav };

interface Props {
    role: "hr" | "interviewer" | "candidate";
    mobileOpen?: boolean;
    onClose?: () => void;
}

export default function DashboardSidebar({ role, mobileOpen = false, onClose }: Props) {
    const pathname = usePathname();
    const { theme, toggle } = useThemeStore();
    const qc = useQueryClient();

    // For candidates: show "Offer & Documents" only when status is HIRED
    const meData = qc.getQueryData<{ candidate?: { status?: string } }>(["me"]);
    const isHired = meData?.candidate?.status === "HIRED";

    const baseSections = navMap[role];
    const sections: Section[] =
        role === "candidate" && isHired
            ? [
                  ...baseSections,
                  {
                      label: "Offer",
                      items: [
                          { label: "Offer & Documents", icon: "📄", href: "/candidate/offer", newBadge: true },
                      ],
                  },
              ]
            : baseSections;

    // Track which collapsible items are open — default open if a child is active
    const [openItems, setOpenItems] = useState<Record<string, boolean>>(() => {
        const defaults: Record<string, boolean> = {};
        sections.forEach((sec) => {
            sec.items.forEach((item) => {
                if (item.sub) {
                    const childActive = item.sub.some((s) => pathname.startsWith(s.href));
                    defaults[item.label] = childActive;
                }
            });
        });
        return defaults;
    });

    const toggle_ = (label: string) =>
        setOpenItems((prev) => ({ ...prev, [label]: !prev[label] }));

    const close = () => onClose?.();

    const isActive = (item: NavItem): boolean => {
        if (!item.href) return false;
        return item.exact ? pathname === item.href : pathname.startsWith(item.href);
    };

    return (
        <>
            {mobileOpen && <div className={styles.overlay} onClick={close} />}

            <aside className={`${styles.sidebar} ${mobileOpen ? styles.sidebarOpen : ""}`}>
                <nav className={styles.nav}>
                    {sections.map((section) => (
                        <div key={section.label}>
                            <div className={styles.sectionLabel}>{section.label}</div>
                            {section.items.map((item) => (
                                <div key={item.label}>
                                    {item.sub ? (
                                        <>
                                            <button
                                                className={`${styles.navItem} ${item.sub.some(s => pathname.startsWith(s.href)) ? styles.active : ""}`}
                                                onClick={() => toggle_(item.label)}
                                            >
                                                <span className={styles.navIcon}>{item.icon}</span>
                                                <span className={styles.navLabel}>{item.label}</span>
                                                {item.badge && <span className={styles.badge}>{item.badge}</span>}
                                                <span className={`${styles.chevron} ${openItems[item.label] ? styles.chevronOpen : ""}`}>›</span>
                                            </button>
                                            <div className={`${styles.subMenu} ${openItems[item.label] ? styles.subMenuOpen : ""}`}>
                                                {item.sub.map((sub) => (
                                                    <Link
                                                        key={sub.href}
                                                        href={sub.href}
                                                        className={`${styles.subItem} ${pathname === sub.href ? styles.subActive : ""}`}
                                                        onClick={close}
                                                    >
                                                        <span className={styles.subIcon}>{sub.icon}</span>
                                                        <span>{sub.label}</span>
                                                        {sub.dot && <span className={styles.dotGreen} style={{ marginLeft: "auto" }} />}
                                                    </Link>
                                                ))}
                                            </div>
                                        </>
                                    ) : (
                                        <Link
                                            href={item.href!}
                                            className={`${styles.navItem} ${isActive(item) ? styles.active : ""}`}
                                            onClick={close}
                                        >
                                            <span className={styles.navIcon}>{item.icon}</span>
                                            <span className={styles.navLabel}>{item.label}</span>
                                            {item.badge && <span className={styles.badge}>{item.badge}</span>}
                                            {item.newBadge && (
                                                <span style={{
                                                    marginLeft: "auto",
                                                    fontSize: 10,
                                                    fontWeight: 700,
                                                    padding: "1px 6px",
                                                    borderRadius: 8,
                                                    background: "rgba(16,185,129,0.15)",
                                                    color: "#10b981",
                                                }}>New!</span>
                                            )}
                                        </Link>
                                    )}
                                </div>
                            ))}
                        </div>
                    ))}
                </nav>

                {/* Bottom actions */}
                <div className={styles.bottomActions}>
                    <button onClick={toggle} className={styles.navItem}>
                        <span className={styles.navIcon}>{theme === "dark" ? "☀️" : "🌙"}</span>
                        <span className={styles.navLabel}>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
                    </button>
                    <Link href="/login" className={styles.navItem} onClick={close}>
                        <span className={styles.navIcon}>🚪</span>
                        <span className={styles.navLabel}>Sign Out</span>
                    </Link>
                </div>

                {/* Powered by footer */}
                <div className={styles.poweredBy}>
                    <div className={styles.poweredByLabel}>Powered by</div>
                    <div className={styles.poweredByBrand}>
                        <div className={styles.poweredByIcon}>
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <rect x="1" y="2" width="3" height="10" rx="1.5" fill="white" opacity="0.95" />
                                <rect x="10" y="2" width="3" height="10" rx="1.5" fill="white" opacity="0.95" />
                                <rect x="1" y="5.5" width="12" height="3" rx="1.5" fill="white" opacity="0.95" />
                            </svg>
                        </div>
                        <span className={styles.poweredByName}>Hireon AI</span>
                    </div>
                    <div className={styles.poweredBySub}>Hire on autopilot</div>
                </div>
            </aside>
        </>
    );
}
