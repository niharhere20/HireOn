"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import styles from "./hr.module.css";
import { candidateService } from "@/services/candidate.service";
import { interviewService } from "@/services/interview.service";

const ACTIVITY_ICONS = ["🧠", "📅", "✅", "🎉"];
const ACTIVITY_CLS = ["ki1", "ki2", "ki3", "ki4"];

export default function HROverview() {
    const { data: candidates = [], isLoading: cLoading } = useQuery({
        queryKey: ["candidates"],
        queryFn: () => candidateService.getAll(),
    });
    const { data: interviews = [], isLoading: iLoading } = useQuery({
        queryKey: ["interviews"],
        queryFn: () => interviewService.getAll(),
    });

    const today = new Date().toDateString();
    const todayIvs = interviews.filter(iv => new Date(iv.startTime).toDateString() === today);
    const shortlisted = candidates.filter(c => c.status === "SHORTLISTED");
    const hired = candidates.filter(c => c.status === "HIRED");

    // Real funnel data
    const appliedCount = candidates.length;
    const shortlistedCount = candidates.filter(c =>
        ["SHORTLISTED", "SCHEDULED", "INTERVIEWED", "HIRED"].includes(c.status)
    ).length;
    const interviewedCount = candidates.filter(c =>
        ["SCHEDULED", "INTERVIEWED", "HIRED"].includes(c.status)
    ).length;
    const hiredCount = hired.length;
    const maxVal = appliedCount || 1;

    const funnel = [
        { lbl: "Applied",     pct: `100%`,                                            cls: styles.fn1, val: String(appliedCount) },
        { lbl: "Shortlisted", pct: `${Math.round((shortlistedCount / maxVal) * 100)}%`, cls: styles.fn2, val: String(shortlistedCount) },
        { lbl: "Interviewed", pct: `${Math.round((interviewedCount / maxVal) * 100)}%`, cls: styles.fn3, val: String(interviewedCount) },
        { lbl: "Hired",       pct: `${Math.round((hiredCount / maxVal) * 100)}%`,       cls: styles.fn4, val: String(hiredCount) },
    ];

    const kpis = [
        { icon: "📥", cls: "ki1", val: String(candidates.length), lbl: "Resumes Processed", delta: "Total", up: true },
        { icon: "✅", cls: "ki2", val: String(shortlisted.length), lbl: "Auto-Shortlisted", delta: "Active", up: true },
        { icon: "📅", cls: "ki3", val: String(todayIvs.length), lbl: "Interviews Today", delta: "Today", up: true },
        { icon: "🎉", cls: "ki4", val: String(hired.length), lbl: "Hires Made", delta: "+recent", up: true },
    ];

    const recentActivity = [...interviews]
        .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
        .slice(0, 4);

    const displayTodayIvs = todayIvs.slice(0, 4);

    return (
        <div>
            <div className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>Good morning 👋</h1>
                <p className={styles.pageSub}>Here&apos;s your hiring pipeline at a glance — Hireon AI is working 24/7.</p>
            </div>

            {/* KPI Grid */}
            <div className={styles.grid4} style={{ marginBottom: 20 }}>
                {cLoading || iLoading ? (
                    <p style={{ color: "var(--text-lite)", fontSize: 14 }}>Loading...</p>
                ) : (
                    kpis.map((k) => (
                        <div key={k.lbl} className={styles.kpiCard}>
                            <div className={styles.kpiTop}>
                                <div className={`${styles.kpiIcon} ${styles[k.cls as keyof typeof styles]}`}>{k.icon}</div>
                                <div className={`${styles.kpiDelta} ${k.up ? styles.up : styles.dn}`}>{k.delta}</div>
                            </div>
                            <div className={styles.kpiVal}>{k.val}</div>
                            <div className={styles.kpiLbl}>{k.lbl}</div>
                        </div>
                    ))
                )}
            </div>

            {/* Funnel + Activity */}
            <div className={styles.grid2}>
                <div className={styles.card}>
                    <div className={styles.cardTitle}>
                        Hiring Funnel
                        <span className={styles.ctag}>This Month</span>
                    </div>
                    {funnel.map((f) => (
                        <div key={f.lbl} className={styles.funnelRow}>
                            <span className={styles.fnLbl}>{f.lbl}</span>
                            <div className={styles.fnTrack}>
                                <div className={`${styles.fnFill} ${f.cls}`} style={{ width: f.pct }} />
                            </div>
                            <span className={styles.fnNum}>{f.val}</span>
                        </div>
                    ))}
                </div>

                <div className={styles.card}>
                    <div className={styles.cardTitle}>
                        Recent Activity
                        <span className={`${styles.ctag} ${styles.ctagGreen}`}>Live</span>
                    </div>
                    <div className={styles.activityList}>
                        {iLoading ? (
                            <p style={{ color: "var(--text-lite)", fontSize: 14 }}>Loading...</p>
                        ) : recentActivity.length === 0 ? (
                            <p style={{ color: "var(--text-lite)", fontSize: 14 }}>No data yet.</p>
                        ) : (
                            recentActivity.map((iv, i) => (
                                <div key={iv.id} className={styles.activityItem}>
                                    <div className={`${styles.actIcon} ${styles[ACTIVITY_CLS[i % 4] as keyof typeof styles]}`}>
                                        {ACTIVITY_ICONS[i % 4]}
                                    </div>
                                    <div className={styles.actText}>
                                        <div className={styles.actTitle}>
                                            Interview — {iv.candidate?.user?.name ?? "Candidate"}
                                        </div>
                                        <div className={styles.actSub}>
                                            {iv.candidate?.aiProfile?.matchScore != null
                                                ? `${iv.candidate.aiProfile.matchScore}% match`
                                                : "Scheduled"}{" "}
                                            · {iv.status}
                                        </div>
                                    </div>
                                    <div className={styles.actTime}>
                                        {new Date(iv.startTime).toLocaleString()}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Today's Interviews */}
            <div style={{ marginTop: 20 }}>
                <div className={styles.card}>
                    <div className={styles.cardTitle}>
                        Today&apos;s Interviews
                        <span className={styles.ctag}>{new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                        <Link href="/hr/schedule" style={{ marginLeft: "auto" }}>
                            <button className={styles.btnGhostSm}>View Schedule →</button>
                        </Link>
                    </div>
                    {iLoading ? (
                        <p style={{ color: "var(--text-lite)", fontSize: 14 }}>Loading...</p>
                    ) : displayTodayIvs.length === 0 ? (
                        <p style={{ color: "var(--text-lite)", fontSize: 14 }}>No data yet.</p>
                    ) : (
                        <div className={styles.interviewGrid}>
                            {displayTodayIvs.map((iv) => {
                                const isConfirmed = iv.status === "SCHEDULED";
                                const isCompleted = iv.status === "COMPLETED";
                                return (
                                    <div key={iv.id} className={styles.interviewCard}>
                                        <div className={styles.ivTime}>
                                            {new Date(iv.startTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                                        </div>
                                        <div className={styles.ivName}>{iv.candidate?.user?.name ?? "Candidate"}</div>
                                        <div className={styles.ivRound}>Interview</div>
                                        <div style={{ marginTop: 8 }}>
                                            <span className={`${styles.chip} ${isCompleted ? styles.chipAmber : isConfirmed ? styles.chipGreen : styles.chipBlue}`}>
                                                <span className={styles.chipDot} />
                                                {isCompleted ? "Completed" : isConfirmed ? "Confirmed" : iv.status}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
