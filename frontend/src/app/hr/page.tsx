"use client";
import { useQuery } from "@tanstack/react-query";
import { candidateService } from "@/services/candidate.service";
import { interviewService } from "@/services/interview.service";
import styles from "./hr.module.css";

function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

export default function HRDashboard() {
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
    const scheduled = interviews.filter((i) => i.status === "SCHEDULED").length;
    const hired = candidates.filter((c) => c.status === "HIRED").length;

    const kpis = [
        { icon: "📥", val: total.toString(), label: "Resumes Processed", delta: "Total applicants", up: true },
        { icon: "✅", val: shortlisted.toString(), label: "Auto-Shortlisted", delta: `${total > 0 ? Math.round((shortlisted / total) * 100) : 0}% of total`, up: true },
        { icon: "📅", val: scheduled.toString(), label: "Interviews Booked", delta: "Upcoming", up: true },
        { icon: "🎉", val: hired.toString(), label: "Hires Made", delta: "All time", up: hired > 0 },
    ];

    const funnelData = [
        { label: "Applied", width: "100%", val: total.toString(), cls: styles.fn1 },
        { label: "Shortlisted", width: total > 0 ? `${(shortlisted / total) * 100}%` : "0%", val: shortlisted.toString(), cls: styles.fn2 },
        { label: "Scheduled", width: total > 0 ? `${(scheduled / total) * 100}%` : "0%", val: scheduled.toString(), cls: styles.fn3 },
        { label: "Hired", width: total > 0 ? `${(hired / total) * 100}%` : "0%", val: hired.toString(), cls: styles.fn4 },
    ];

    const activities = [
        ...candidates.slice(0, 3).map((c) => ({
            time: timeAgo(c.createdAt), text: `${c.user.name} applied`, icon: "📥",
        })),
        ...interviews.slice(0, 2).map((iv) => ({
            time: timeAgo(iv.createdAt),
            text: `Interview scheduled: ${iv.candidate.user.name} with ${iv.interviewer.name}`,
            icon: "📅",
        })),
    ].slice(0, 5);

    const topCandidates = [...candidates]
        .filter((c) => c.aiProfile)
        .sort((a, b) => (b.aiProfile?.matchScore ?? 0) - (a.aiProfile?.matchScore ?? 0))
        .slice(0, 5);

    const STATUS_CLS: Record<string, string> = {
        APPLIED: "st-new", SHORTLISTED: "st-short", SCHEDULED: "st-sched",
        INTERVIEWED: "st-sched", HIRED: "st-short", REJECTED: "st-review",
    };

    return (
        <div>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.pageTitle}>Dashboard</h1>
                    <p className={styles.pageSub}>Welcome back! Here&apos;s your hiring overview.</p>
                </div>
                <div className={styles.headerActions}>
                    <button className="btn-gl" style={{ padding: "10px 20px", fontSize: 13 }}>Export Report</button>
                    <a href="/hr/requirements" className="btn-pri" style={{ padding: "10px 20px", fontSize: 13, textDecoration: "none", borderRadius: 10 }}>+ New Requirement</a>
                </div>
            </div>

            <div className={styles.kpiGrid}>
                {kpis.map((k) => (
                    <div className="kpi" key={k.label}>
                        <div className="kpi-icon">{k.icon}</div>
                        <div className="kpi-val">{k.val}</div>
                        <div className="kpi-lbl">{k.label}</div>
                        <div className={`kpi-delta ${k.up ? "up" : "dn"}`}>{k.delta}</div>
                    </div>
                ))}
            </div>

            <div className={styles.midGrid}>
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
                                    <div className={`${styles.fnFill} ${row.cls}`} style={{ width: row.width }} />
                                </div>
                                <span className={styles.fnNum}>{row.val}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardHead}>
                        <span>Recent Activity</span>
                        <span className="ctag teal">Live</span>
                    </div>
                    <div className={styles.actList}>
                        {activities.length === 0 ? (
                            <p style={{ color: "var(--text-lite)", fontSize: 13 }}>No activity yet.</p>
                        ) : activities.map((a, i) => (
                            <div className={styles.actRow} key={i}>
                                <span className={styles.actIcon}>{a.icon}</span>
                                <div className={styles.actInfo}>
                                    <div className={styles.actText}>{a.text}</div>
                                    <div className={styles.actTime}>{a.time}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className={styles.card} style={{ marginTop: 20 }}>
                <div className={styles.cardHead}>
                    <span>Top Candidates</span>
                    <span className="ctag pink">AI Ranked</span>
                </div>
                {topCandidates.length === 0 ? (
                    <p style={{ color: "var(--text-lite)", fontSize: 14, padding: "12px 0" }}>No analyzed candidates yet. Go to Candidates → Analyze.</p>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Candidate</th>
                                <th>AI Score</th>
                                <th>Skills</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topCandidates.map((c) => (
                                <tr key={c.id}>
                                    <td>
                                        <div className={styles.cCell}>
                                            <div className={styles.cAv} style={{ background: "linear-gradient(135deg,#ddd6fe,#a78bfa)" }}>
                                                {c.user.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className={styles.cName}>{c.user.name}</div>
                                                <div className={styles.cExp}>{c.aiProfile?.experienceYears}y exp</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className={styles.scoreCell}>
                                            <div className="match-bar-wrap">
                                                <div className="match-bar-fill" style={{ width: `${c.aiProfile?.matchScore}%` }} />
                                            </div>
                                            <span className={`${styles.scoreNum} ${(c.aiProfile?.matchScore ?? 0) >= 80 ? "sc-hi" : "sc-md"}`}>
                                                {c.aiProfile?.matchScore}%
                                            </span>
                                        </div>
                                    </td>
                                    <td>{(c.aiProfile?.extractedSkills as string[] ?? []).slice(0, 3).map((s) => <span className="skill-pill" key={s}>{s}</span>)}</td>
                                    <td>
                                        <span className={`status-chip ${STATUS_CLS[c.status] ?? "st-new"}`}>
                                            <span className="st-dot" />{c.status.charAt(0) + c.status.slice(1).toLowerCase()}
                                        </span>
                                    </td>
                                    <td>
                                        <div className={styles.actions}>
                                            <a href="/hr/candidates" className="action-btn ab-pri" style={{ textDecoration: "none" }}>View</a>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
