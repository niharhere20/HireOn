"use client";
import { useQuery } from "@tanstack/react-query";
import { authService } from "@/services/auth.service";
import { interviewService } from "@/services/interview.service";
import styles from "../candidate.module.css";

function formatDateTime(iso: string) {
    return new Date(iso).toLocaleString("en-US", {
        weekday: "short", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
}

function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

interface Notification {
    id: string;
    type: "interview_scheduled" | "interview_completed" | "status_change" | "offer" | "feedback";
    title: string;
    body: string;
    time: string;
    read: boolean;
    icon: string;
    color: string;
}

export default function NotificationsPage() {
    const { data: me } = useQuery({ queryKey: ["me"], queryFn: authService.me });
    const { data: interviews = [] } = useQuery({
        queryKey: ["my-interviews"],
        queryFn: () => interviewService.getAll(),
        enabled: !!me,
    });

    const meUser = me as unknown as {
        name?: string;
        candidate?: { status?: string };
    };
    const candidateStatus = meUser?.candidate?.status;

    // Derive notifications from real data
    const notifications: Notification[] = [];

    // Status-based notifications
    if (candidateStatus === "HIRED") {
        notifications.push({
            id: "hired",
            type: "offer",
            title: "Congratulations! You have been hired",
            body: "Your offer letter is now available. Check the Offer Letter section.",
            time: new Date().toISOString(),
            read: false,
            icon: "🎉",
            color: "#10b981",
        });
    }

    if (candidateStatus === "SHORTLISTED") {
        notifications.push({
            id: "shortlisted",
            type: "status_change",
            title: "You have been shortlisted",
            body: "Great news! Our AI has shortlisted you. Expect an interview invitation soon.",
            time: new Date(Date.now() - 3600000).toISOString(),
            read: false,
            icon: "✅",
            color: "#6c47ff",
        });
    }

    if (candidateStatus === "REJECTED") {
        notifications.push({
            id: "rejected",
            type: "status_change",
            title: "Application update",
            body: "We regret to inform you that your application was not successful this time. Keep improving!",
            time: new Date(Date.now() - 86400000).toISOString(),
            read: true,
            icon: "📋",
            color: "#ef4444",
        });
    }

    // Interview-based notifications
    interviews.forEach((iv) => {
        if (iv.status === "SCHEDULED") {
            notifications.push({
                id: `iv-sched-${iv.id}`,
                type: "interview_scheduled",
                title: `Interview scheduled with ${iv.interviewer.name}`,
                body: `Your interview is on ${formatDateTime(iv.startTime)}.${iv.meetLink ? " Meeting link is ready." : ""}`,
                time: iv.createdAt,
                read: false,
                icon: "📅",
                color: "#06b6d4",
            });
        }
        if (iv.status === "COMPLETED") {
            notifications.push({
                id: `iv-done-${iv.id}`,
                type: "interview_completed",
                title: `Interview completed — ${iv.interviewer.name}`,
                body: iv.feedback
                    ? `Feedback received: "${iv.feedback.slice(0, 80)}${iv.feedback.length > 80 ? "..." : ""}"`
                    : "Your interview is complete. Feedback is being reviewed.",
                time: iv.startTime,
                read: true,
                icon: "💬",
                color: "#8b5cf6",
            });
        }
    });

    // Sort by time desc
    notifications.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    const unreadCount = notifications.filter((n) => !n.read).length;

    return (
        <div>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.pageTitle}>Notifications</h1>
                    <p className={styles.pageSub}>Interview reminders, status updates, and offers</p>
                </div>
                {unreadCount > 0 && (
                    <span style={{
                        padding: "4px 14px", borderRadius: 20, fontSize: 13, fontWeight: 700,
                        background: "linear-gradient(135deg,#6c47ff,#ff6bc6)", color: "#fff",
                    }}>
                        {unreadCount} new
                    </span>
                )}
            </div>

            {notifications.length === 0 ? (
                <div style={{
                    textAlign: "center", padding: "80px 40px",
                    background: "var(--kpi-bg, #fff)",
                    border: "1px solid var(--table-border)",
                    borderRadius: 16,
                }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>🔔</div>
                    <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>All caught up!</div>
                    <div style={{ fontSize: 13, color: "var(--text-mid)" }}>No notifications yet.</div>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {notifications.map((n) => (
                        <div
                            key={n.id}
                            style={{
                                display: "flex", alignItems: "flex-start", gap: 14,
                                padding: "16px 20px",
                                background: n.read ? "var(--kpi-bg, #fff)" : `rgba(108,71,255,0.04)`,
                                border: `1px solid ${n.read ? "var(--table-border)" : "rgba(108,71,255,0.12)"}`,
                                borderRadius: 12,
                                transition: "all 0.2s",
                            }}
                        >
                            <div style={{
                                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                                background: `${n.color}18`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 18,
                            }}>
                                {n.icon}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{
                                    fontSize: 14, fontWeight: n.read ? 500 : 700,
                                    color: "var(--text)", marginBottom: 4,
                                }}>
                                    {n.title}
                                </div>
                                <div style={{ fontSize: 13, color: "var(--text-mid)", lineHeight: 1.5 }}>
                                    {n.body}
                                </div>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                                <span style={{ fontSize: 11, color: "var(--text-lite)" }}>{timeAgo(n.time)}</span>
                                {!n.read && (
                                    <div style={{
                                        width: 8, height: 8, borderRadius: "50%",
                                        background: n.color,
                                    }} />
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
