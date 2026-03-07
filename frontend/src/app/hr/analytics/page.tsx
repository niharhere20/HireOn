"use client";
import { useQuery } from "@tanstack/react-query";
import { candidateService } from "@/services/candidate.service";
import { interviewService } from "@/services/interview.service";
import styles from "../hr.module.css";

export default function AnalyticsPage() {
    const { data: candidates = [] } = useQuery({
        queryKey: ["candidates"],
        queryFn: () => candidateService.getAll(),
    });

    const { data: interviews = [] } = useQuery({
        queryKey: ["interviews"],
        queryFn: () => interviewService.getAll(),
    });

    const total = candidates.length;
    const shortlisted = candidates.filter((c) => ["SHORTLISTED", "SCHEDULED", "INTERVIEWED", "HIRED"].includes(c.status)).length;
    const scheduled = candidates.filter((c) => ["SCHEDULED", "INTERVIEWED"].includes(c.status)).length;
    const hired = candidates.filter((c) => c.status === "HIRED").length;
    const analyzed = candidates.filter((c) => c.aiProfile).length;

    const avgScore = analyzed > 0
        ? Math.round(candidates.filter((c) => c.aiProfile).reduce((sum, c) => sum + (c.aiProfile?.matchScore ?? 0), 0) / analyzed)
        : 0;

    const funnelData = [
        { label: "Applied", val: total, color: "linear-gradient(90deg,var(--violet),var(--violet-mid))" },
        { label: "Shortlisted", val: shortlisted, color: "linear-gradient(90deg,var(--violet-mid),var(--pink))" },
        { label: "Scheduled", val: scheduled, color: "linear-gradient(90deg,var(--pink),var(--pink-lite))" },
        { label: "Hired", val: hired, color: "linear-gradient(90deg,var(--teal),var(--teal-lite))" },
    ];

    const statusBreakdown = ["APPLIED", "SHORTLISTED", "SCHEDULED", "INTERVIEWED", "HIRED", "REJECTED"].map((s) => ({
        status: s,
        count: candidates.filter((c) => c.status === s).length,
    })).filter((s) => s.count > 0);

    return (
        <div>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.pageTitle}>Analytics</h1>
                    <p className={styles.pageSub}>Hiring pipeline performance and AI insights</p>
                </div>
            </div>

            {/* KPI Row */}
            <div className={styles.kpiGrid}>
                {[
                    { icon: "📥", val: total, label: "Total Applicants" },
                    { icon: "🧠", val: analyzed, label: "AI Analyzed" },
                    { icon: "✅", val: shortlisted, label: "Shortlisted" },
                    { icon: "📅", val: interviews.length, label: "Interviews Run" },
                ].map((k) => (
                    <div className="kpi" key={k.label}>
                        <div className="kpi-icon">{k.icon}</div>
                        <div className="kpi-val">{k.val}</div>
                        <div className="kpi-lbl">{k.label}</div>
                    </div>
                ))}
            </div>

            <div className={styles.midGrid}>
                {/* Hiring Funnel */}
                <div className={styles.card}>
                    <div className={styles.cardHead}>
                        <span>Hiring Funnel</span>
                        <span className="ctag">All time</span>
                    </div>
                    <div className={styles.funnel}>
                        {funnelData.map((row) => (
                            <div className={styles.fnRow} key={row.label}>
                                <span className={styles.fnLbl}>{row.label}</span>
                                <div className={styles.fnTrack}>
                                    <div
                                        style={{
                                            height: "100%", borderRadius: 6,
                                            background: row.color,
                                            width: total > 0 ? `${Math.max((row.val / total) * 100, row.val > 0 ? 4 : 0)}%` : "0%",
                                            transition: "width 1s ease",
                                        }}
                                    />
                                </div>
                                <span className={styles.fnNum}>{row.val}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Status Breakdown */}
                <div className={styles.card}>
                    <div className={styles.cardHead}>
                        <span>Status Breakdown</span>
                        <span className="ctag teal">Live</span>
                    </div>
                    {statusBreakdown.length === 0 ? (
                        <p style={{ color: "var(--text-lite)", fontSize: 14 }}>No candidate data yet.</p>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            {statusBreakdown.map(({ status, count }) => (
                                <div key={status} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "rgba(108,71,255,.04)", borderRadius: 10 }}>
                                    <span style={{ fontSize: 13, fontWeight: 600 }}>{status.charAt(0) + status.slice(1).toLowerCase()}</span>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                        <div style={{ width: 120, height: 6, background: "rgba(108,71,255,.1)", borderRadius: 3 }}>
                                            <div style={{ height: "100%", borderRadius: 3, background: "var(--violet)", width: `${(count / total) * 100}%` }} />
                                        </div>
                                        <span style={{ fontSize: 13, fontWeight: 700, minWidth: 24, textAlign: "right" }}>{count}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {analyzed > 0 && (
                        <div style={{ marginTop: 20, padding: "14px 16px", background: "rgba(108,71,255,.05)", borderRadius: 12 }}>
                            <div style={{ fontSize: 12, color: "var(--text-lite)", marginBottom: 4 }}>Avg AI Match Score</div>
                            <div style={{ fontSize: 24, fontWeight: 800, color: "var(--violet)" }}>{avgScore}%</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
