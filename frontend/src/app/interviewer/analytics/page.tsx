"use client";
import { useQuery } from "@tanstack/react-query";
import { interviewService } from "@/services/interview.service";
import styles from "../interviewer.module.css";

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function InterviewerAnalyticsPage() {
    const { data: interviews = [], isLoading } = useQuery({
        queryKey: ["interviews"],
        queryFn: () => interviewService.getAll(),
    });

    const total = interviews.length;
    const completed = interviews.filter((i) => i.status === "COMPLETED");
    const upcoming = interviews.filter((i) => i.status === "SCHEDULED");
    const withFeedback = completed.filter((i) => i.feedback);
    const cancelled = interviews.filter((i) => i.status === "CANCELLED");

    const feedbackRate = completed.length > 0
        ? Math.round((withFeedback.length / completed.length) * 100)
        : 0;

    // Average AI scores of candidates interviewed
    const aiScored = completed.filter((i) => i.candidate.aiProfile);
    const avgCandidateScore = aiScored.length > 0
        ? Math.round(aiScored.reduce((s, i) => s + (i.candidate.aiProfile?.matchScore ?? 0), 0) / aiScored.length)
        : 0;

    // Monthly breakdown (last 6 months)
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
        return {
            label: d.toLocaleDateString("en-US", { month: "short" }),
            year: d.getFullYear(),
            month: d.getMonth(),
        };
    });

    const monthlyData = months.map((m) => ({
        label: m.label,
        count: interviews.filter((i) => {
            const d = new Date(i.startTime);
            return d.getFullYear() === m.year && d.getMonth() === m.month;
        }).length,
    }));

    const maxMonthly = Math.max(...monthlyData.map((m) => m.count), 1);

    // Turnaround time (time between interview and feedback submission)
    const avgTurnaround = withFeedback.length > 0 ? 1.5 : 0; // Static for now — no timestamp on feedback

    return (
        <div>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.pageTitle}>My Analytics</h1>
                    <p className={styles.pageSub}>Personal performance and interview statistics</p>
                </div>
            </div>

            {isLoading ? (
                <p style={{ color: "var(--text-lite)", fontSize: 14 }}>Loading analytics...</p>
            ) : (
                <>
                    {/* KPIs */}
                    <div className={styles.statsRow}>
                        {[
                            { icon: "📅", val: total, label: "Total Interviews" },
                            { icon: "✅", val: completed.length, label: "Completed" },
                            { icon: "💬", val: withFeedback.length, label: "Feedback Submitted" },
                            { icon: "📊", val: `${feedbackRate}%`, label: "Feedback Rate" },
                        ].map((k) => (
                            <div className="kpi" key={k.label}>
                                <div className="kpi-icon">{k.icon}</div>
                                <div className="kpi-val">{k.val}</div>
                                <div className="kpi-lbl">{k.label}</div>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 20 }}>
                        {/* Monthly Activity */}
                        <div className={styles.card}>
                            <div className={styles.cardHead}>
                                <span>Monthly Activity</span>
                                <span className="ctag">Last 6 months</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 120 }}>
                                {monthlyData.map((m) => (
                                    <div key={m.label} style={{
                                        flex: 1, display: "flex", flexDirection: "column",
                                        alignItems: "center", gap: 6,
                                    }}>
                                        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text)" }}>
                                            {m.count > 0 ? m.count : ""}
                                        </span>
                                        <div style={{
                                            width: "100%", borderRadius: "4px 4px 0 0",
                                            background: m.count > 0 ? "linear-gradient(180deg,#6c47ff,#ff6bc6)" : "rgba(108,71,255,0.1)",
                                            height: `${Math.max((m.count / maxMonthly) * 80, m.count > 0 ? 8 : 4)}px`,
                                            transition: "height 0.6s ease",
                                        }} />
                                        <span style={{ fontSize: 10, color: "var(--text-lite)" }}>{m.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Performance Metrics */}
                        <div className={styles.card}>
                            <div className={styles.cardHead}>
                                <span>Performance Metrics</span>
                                <span className="ctag pink">Personal</span>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                                {[
                                    {
                                        label: "Completion Rate",
                                        val: total > 0 ? Math.round((completed.length / total) * 100) : 0,
                                        suffix: "%",
                                        color: "#10b981",
                                    },
                                    {
                                        label: "Avg Candidate AI Score",
                                        val: avgCandidateScore,
                                        suffix: "%",
                                        color: "#6c47ff",
                                    },
                                    {
                                        label: "Feedback Rate",
                                        val: feedbackRate,
                                        suffix: "%",
                                        color: "#f59e0b",
                                    },
                                    {
                                        label: "Upcoming Scheduled",
                                        val: upcoming.length,
                                        suffix: "",
                                        color: "#06b6d4",
                                    },
                                ].map(({ label, val, suffix, color }) => (
                                    <div key={label}>
                                        <div style={{
                                            display: "flex", justifyContent: "space-between",
                                            marginBottom: 6, fontSize: 13,
                                        }}>
                                            <span style={{ color: "var(--text-mid)" }}>{label}</span>
                                            <span style={{ fontWeight: 700, color }}>{val}{suffix}</span>
                                        </div>
                                        {suffix === "%" && (
                                            <div style={{ height: 6, background: "rgba(108,71,255,0.08)", borderRadius: 3, overflow: "hidden" }}>
                                                <div style={{
                                                    height: "100%", borderRadius: 3, background: color,
                                                    width: `${val}%`, transition: "width 1s ease",
                                                }} />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Recent Interviews */}
                    <div className={styles.card} style={{ marginTop: 20 }}>
                        <div className={styles.cardHead}>
                            <span>Recent Interviews</span>
                            <span className="ctag">{completed.length} completed</span>
                        </div>
                        {completed.length === 0 ? (
                            <p style={{ color: "var(--text-lite)", fontSize: 14 }}>No completed interviews yet.</p>
                        ) : (
                            <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 400 }}>
                                <thead>
                                    <tr style={{ background: "var(--table-head)" }}>
                                        {["Candidate", "Date", "AI Score", "Feedback"].map((h) => (
                                            <th key={h} style={{
                                                padding: "10px 16px", textAlign: "left",
                                                fontSize: 11, fontWeight: 700, letterSpacing: "0.8px",
                                                textTransform: "uppercase", color: "var(--text-lite)",
                                                borderBottom: "1px solid var(--table-border)",
                                            }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {completed.slice(0, 8).map((iv) => (
                                        <tr key={iv.id} style={{ borderBottom: "1px solid var(--table-border)" }}>
                                            <td style={{ padding: "12px 16px" }}>
                                                <div style={{ fontSize: 13, fontWeight: 600 }}>{iv.candidate.user.name}</div>
                                                <div style={{ fontSize: 11, color: "var(--text-lite)" }}>{iv.candidate.user.email}</div>
                                            </td>
                                            <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--text-mid)" }}>
                                                {formatDate(iv.startTime)}
                                            </td>
                                            <td style={{ padding: "12px 16px" }}>
                                                {iv.candidate.aiProfile ? (
                                                    <span style={{
                                                        fontWeight: 700, fontSize: 13,
                                                        color: iv.candidate.aiProfile.matchScore >= 80 ? "#10b981" : "#6c47ff",
                                                    }}>
                                                        {iv.candidate.aiProfile.matchScore}%
                                                    </span>
                                                ) : <span style={{ color: "var(--text-lite)", fontSize: 12 }}>—</span>}
                                            </td>
                                            <td style={{ padding: "12px 16px" }}>
                                                {iv.feedback ? (
                                                    <span style={{
                                                        padding: "3px 10px", borderRadius: 20, fontSize: 11,
                                                        fontWeight: 700, background: "rgba(16,185,129,0.1)", color: "#10b981",
                                                    }}>Submitted</span>
                                                ) : (
                                                    <span style={{
                                                        padding: "3px 10px", borderRadius: 20, fontSize: 11,
                                                        fontWeight: 700, background: "rgba(239,68,68,0.1)", color: "#ef4444",
                                                    }}>Pending</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
