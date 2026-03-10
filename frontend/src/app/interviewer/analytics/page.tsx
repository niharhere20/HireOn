"use client";
import styles from "../interviewer.module.css";

const kpis = [
    { icon: "📅", cls: styles.ki1, val: "28",  lbl: "Total Interviews",  delta: "This month",  deltaCls: styles.kpiDeltaNeu },
    { icon: "⭐", cls: styles.ki2, val: "4.2★", lbl: "Avg Rating",        delta: "+0.3",        deltaCls: styles.kpiDeltaUp },
    { icon: "🎯", cls: styles.ki3, val: "89%",  lbl: "Accuracy",          delta: "Score",       deltaCls: styles.kpiDeltaUp },
    { icon: "✅", cls: styles.ki4, val: "34%",  lbl: "Hire Rate",          delta: "Of total",    deltaCls: styles.kpiDeltaNeu },
];

const HISTORY = [
    { name: "Lena Schwartz",  role: "UI Engineer",         date: "Mar 7",  rec: "Hire",    score: "4.6" },
    { name: "Omar Farisi",    role: "Senior Backend Dev",  date: "Mar 5",  rec: "Maybe",   score: "3.8" },
    { name: "Sarah Chen",     role: "React Developer",     date: "Mar 4",  rec: "Hire",    score: "4.9" },
    { name: "Marcus Reid",    role: "Culture Fit",         date: "Mar 3",  rec: "No Hire", score: "2.5" },
    { name: "Priya Nair",     role: "Full Stack",          date: "Feb 28", rec: "Hire",    score: "4.1" },
];

const BARS = [
    { lbl: "Oct", val: 3 },
    { lbl: "Nov", val: 5 },
    { lbl: "Dec", val: 4 },
    { lbl: "Jan", val: 7 },
    { lbl: "Feb", val: 6 },
    { lbl: "Mar", val: 3 },
];

const BOTTOM_STATS = [
    { icon: "⚡", val: "24 min",  lbl: "Avg Scorecard Time" },
    { icon: "🔁", val: "2.1",     lbl: "Rounds per Hire" },
    { icon: "📬", val: "100%",    lbl: "Feedback Submission" },
];

const maxBar = Math.max(...BARS.map((b) => b.val));

function recColor(rec: string) {
    if (rec === "Hire") return "var(--green)";
    if (rec === "Maybe") return "var(--amber)";
    return "var(--red)";
}

function recBg(rec: string) {
    if (rec === "Hire") return "rgba(16,185,129,0.1)";
    if (rec === "Maybe") return "rgba(251,191,36,0.12)";
    return "rgba(239,68,68,0.1)";
}

export default function AnalyticsPage() {
    return (
        <div>
            <div className={styles.pageHeader}>
                <div className={styles.pageTitle}>📈 My Analytics</div>
                <div className={styles.pageSub}>Your personal interview performance and statistics.</div>
            </div>

            {/* KPIs */}
            <div className={styles.grid4} style={{ marginBottom: 24 }}>
                {kpis.map((k) => (
                    <div key={k.lbl} className={`${styles.kpiCard} ${k.cls}`}>
                        <div className={styles.kpiTop}>
                            <span className={styles.kpiIcon}>{k.icon}</span>
                            <span className={`${styles.kpiDelta} ${k.deltaCls}`}>{k.delta}</span>
                        </div>
                        <div className={styles.kpiVal}>{k.val}</div>
                        <div className={styles.kpiLbl}>{k.lbl}</div>
                    </div>
                ))}
            </div>

            {/* Grid: History + Bar chart */}
            <div className={styles.grid2} style={{ marginBottom: 20 }}>
                {/* Interview History */}
                <div className={styles.card}>
                    <div className={styles.cardTitle}>
                        Interview History
                        <span className={styles.ctag}>Last 5</span>
                    </div>
                    <div style={{ overflowX: "auto" }}>
                        <table className={styles.analyticsTable}>
                            <thead>
                                <tr>
                                    <th>Candidate</th>
                                    <th>Role</th>
                                    <th>Date</th>
                                    <th>Recommendation</th>
                                    <th>Score</th>
                                </tr>
                            </thead>
                            <tbody>
                                {HISTORY.map((row) => (
                                    <tr key={row.name}>
                                        <td style={{ fontWeight: 600 }}>{row.name}</td>
                                        <td style={{ color: "var(--text-mid)", fontSize: 12 }}>{row.role}</td>
                                        <td style={{ color: "var(--text-mid)", fontSize: 12 }}>{row.date}</td>
                                        <td>
                                            <span style={{
                                                padding: "3px 10px", borderRadius: 20,
                                                fontSize: 11, fontWeight: 700,
                                                background: recBg(row.rec),
                                                color: recColor(row.rec),
                                            }}>
                                                {row.rec}
                                            </span>
                                        </td>
                                        <td>
                                            <span style={{ fontWeight: 700, color: "var(--violet)" }}>{row.score}</span>
                                            <span style={{ fontSize: 10, color: "var(--text-lite)" }}>/5</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Performance Trend */}
                <div className={styles.card}>
                    <div className={styles.cardTitle}>
                        Performance Trend
                        <span className={styles.ctag}>6 months</span>
                    </div>
                    <div className={styles.barChart}>
                        {BARS.map((b) => (
                            <div key={b.lbl} className={styles.barWrap}>
                                <span className={styles.barVal}>{b.val > 0 ? b.val : ""}</span>
                                <div
                                    className={styles.bar}
                                    style={{ height: `${Math.max((b.val / maxBar) * 80, 4)}px` }}
                                />
                                <span className={styles.barLbl}>{b.lbl}</span>
                            </div>
                        ))}
                    </div>

                    <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 12 }}>
                        {[
                            { lbl: "Completion Rate",     val: 94, color: "var(--green)" },
                            { lbl: "On-time Feedback",    val: 87, color: "var(--violet)" },
                            { lbl: "Candidate Accuracy",  val: 89, color: "var(--teal)" },
                        ].map((m) => (
                            <div key={m.lbl}>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
                                    <span style={{ color: "var(--text-mid)" }}>{m.lbl}</span>
                                    <span style={{ fontWeight: 700, color: m.color }}>{m.val}%</span>
                                </div>
                                <div className={styles.progBar} style={{ marginBottom: 0 }}>
                                    <div className={styles.progFill} style={{ width: `${m.val}%`, background: m.color }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom stat cards */}
            <div className={styles.grid3}>
                {BOTTOM_STATS.map((s) => (
                    <div key={s.lbl} className={styles.card} style={{ textAlign: "center", padding: "22px 16px" }}>
                        <div style={{ fontSize: 26, marginBottom: 8 }}>{s.icon}</div>
                        <div className={styles.kpiVal} style={{ fontSize: 26 }}>{s.val}</div>
                        <div className={styles.kpiLbl}>{s.lbl}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
