"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import styles from "../candidate.module.css";
import api from "@/lib/api";

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
}

function relativeTime(date: Date): string {
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days === 1) return "1 day ago";
    if (days < 7) return `${days} days ago`;
    return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const TYPE_ICON: Record<string, string> = {
    WELCOME: "👋",
    RESUME_UPLOADED: "📄",
    SHORTLISTED: "✅",
    INTERVIEW_SCHEDULED: "📅",
    INTERVIEW_COMPLETED: "📊",
    HIRED: "🎉",
    AI_ANALYZED: "🧠",
};

const TYPE_BG: Record<string, string> = {
    WELCOME: "rgba(108,71,255,0.12)",
    RESUME_UPLOADED: "rgba(108,71,255,0.10)",
    SHORTLISTED: "rgba(16,185,129,0.12)",
    INTERVIEW_SCHEDULED: "rgba(0,212,200,0.12)",
    INTERVIEW_COMPLETED: "rgba(0,212,200,0.12)",
    HIRED: "rgba(16,185,129,0.15)",
    AI_ANALYZED: "rgba(108,71,255,0.12)",
};

export default function NotificationsPage() {
    const qc = useQueryClient();

    const { data: notifications = [], isLoading } = useQuery<Notification[]>({
        queryKey: ["notifications"],
        queryFn: () => api.get("/api/notifications").then((r) => r.data),
    });

    const markAllRead = useMutation({
        mutationFn: () => api.patch("/api/notifications/read-all"),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
    });

    const markRead = useMutation({
        mutationFn: (id: string) => api.patch(`/api/notifications/${id}/read`),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
    });

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    if (isLoading) {
        return <p style={{ color: "var(--text-lite)", fontSize: 14, padding: "20px 0" }}>Loading...</p>;
    }

    return (
        <div>
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>🔔 Notifications</h1>
                    <p className={styles.pageSub}>Stay up to date on your application progress</p>
                </div>
                {unreadCount > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{
                            padding: "5px 14px", borderRadius: 20, fontSize: 13, fontWeight: 700,
                            background: "linear-gradient(135deg,var(--violet),var(--pink))", color: "#fff",
                        }}>
                            {unreadCount} new
                        </span>
                        <button
                            onClick={() => markAllRead.mutate()}
                            style={{
                                fontSize: 12, color: "var(--text-lite)", background: "none",
                                border: "1px solid var(--card-border)", borderRadius: 8,
                                padding: "5px 12px", cursor: "pointer",
                            }}
                        >
                            Mark all read
                        </button>
                    </div>
                )}
            </div>

            {notifications.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-mid)" }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>🔔</div>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>No notifications yet</div>
                    <div style={{ fontSize: 13, marginTop: 6 }}>Updates will appear here as your application progresses.</div>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {notifications.map((n) => (
                        <div
                            key={n.id}
                            className={`${styles.notifItem} ${!n.isRead ? styles.notifUnread : ""}`}
                            onClick={() => { if (!n.isRead) markRead.mutate(n.id); }}
                            style={{ cursor: !n.isRead ? "pointer" : "default" }}
                        >
                            <div className={styles.notifIco} style={{ background: TYPE_BG[n.type] || "rgba(108,71,255,0.10)" }}>
                                {TYPE_ICON[n.type] || "🔔"}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div className={styles.notifTitle} style={{ fontWeight: !n.isRead ? 700 : 500 }}>
                                    {n.title}
                                </div>
                                <div className={styles.notifSub}>{n.message}</div>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
                                <span className={styles.notifTime}>{relativeTime(new Date(n.createdAt))}</span>
                                {!n.isRead && (
                                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--violet)", display: "block" }} />
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
