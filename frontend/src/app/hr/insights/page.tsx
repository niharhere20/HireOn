"use client";
import { useQuery } from "@tanstack/react-query";
import { candidateService } from "@/services/candidate.service";
import styles from "../hr.module.css";

export default function InsightsPage() {
    const { data: candidates = [], isLoading } = useQuery({
        queryKey: ["candidates"],
        queryFn: () => candidateService.getAll(),
    });

    const analyzed = candidates.filter((c) => c.aiProfile);
    const total = analyzed.length;

    // Skill frequency map
    const skillMap: Record<string, number> = {};
    analyzed.forEach((c) => {
        const skills = (c.aiProfile?.extractedSkills ?? []) as string[];
        skills.forEach((s) => {
            skillMap[s] = (skillMap[s] ?? 0) + 1;
        });
    });
    const topSkills = Object.entries(skillMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 16);

    // Score distribution buckets
    const buckets = [
        { label: "0-39", min: 0, max: 40, color: "#ef4444" },
        { label: "40-59", min: 40, max: 60, color: "#f59e0b" },
        { label: "60-79", min: 60, max: 80, color: "#6c47ff" },
        { label: "80-100", min: 80, max: 101, color: "#10b981" },
    ];
    const bucketed = buckets.map((b) => ({
        ...b,
        count: analyzed.filter((c) => {
            const s = c.aiProfile?.matchScore ?? 0;
            return s >= b.min && s < b.max;
        }).length,
    }));
    const maxBucket = Math.max(...bucketed.map((b) => b.count), 1);

    // Seniority distribution
    const seniorityMap: Record<string, number> = {};
    analyzed.forEach((c) => {
        const level = c.aiProfile?.seniorityLevel ?? "Unknown";
        seniorityMap[level] = (seniorityMap[level] ?? 0) + 1;
    });

    // Avg hire probability
    const avgHireProb = total > 0
        ? Math.round(analyzed.reduce((sum, c) => sum + (c.aiProfile?.hireProbability ?? 0), 0) / total)
        : 0;

    const avgMatchScore = total > 0
        ? Math.round(analyzed.reduce((sum, c) => sum + (c.aiProfile?.matchScore ?? 0), 0) / total)
        : 0;

    // Top candidates
    const topCandidates = [...analyzed]
        .sort((a, b) => (b.aiProfile?.matchScore ?? 0) - (a.aiProfile?.matchScore ?? 0))
        .slice(0, 5);

    return (
        <div>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.pageTitle}>AI Insights</h1>
                    <p className={styles.pageSub}>Skill gap analysis, match score distribution and hiring intelligence</p>
                </div>
            </div>

            {isLoading ? (
                <p style={{ color: "var(--text-lite)", fontSize: 14 }}>Loading insights...</p>
            ) : total === 0 ? (
                <div style={{
                    textAlign: "center", padding: "60px 0", color: "var(--text-mid)",
                }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>🧠</div>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>No AI data yet</div>
                    <div style={{ fontSize: 13, marginTop: 6 }}>
                        Go to Candidates and run &quot;Analyze&quot; to generate AI insights
                    </div>
                </div>
            ) : (
                <>
                    {/* KPIs */}
                    <div className={styles.kpiGrid}>
                        {[
                            { icon: "🧠", val: total, label: "Profiles Analyzed" },
                            { icon: "🎯", val: `${avgMatchScore}%`, label: "Avg Match Score" },
                            { icon: "📊", val: `${avgHireProb}%`, label: "Avg Hire Probability" },
                            { icon: "🔧", val: topSkills.length, label: "Unique Skills Found" },
                        ].map((k) => (
                            <div className="kpi" key={k.label}>
                                <div className="kpi-icon">{k.icon}</div>
                                <div className="kpi-val">{k.val}</div>
                                <div className="kpi-lbl">{k.label}</div>
                            </div>
                        ))}
                    </div>

                    <div className={styles.midGrid}>
                        {/* Skill Heatmap */}
                        <div className={styles.card}>
                            <div className={styles.cardHead}>
                                <span>Skill Frequency Heatmap</span>
                                <span className="ctag">Top {topSkills.length}</span>
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                {topSkills.map(([skill, count]) => {
                                    const intensity = count / (topSkills[0]?.[1] ?? 1);
                                    const alpha = 0.1 + intensity * 0.7;
                                    return (
                                        <div
                                            key={skill}
                                            title={`${count} candidate${count > 1 ? "s" : ""}`}
                                            style={{
                                                padding: "6px 12px",
                                                borderRadius: 20,
                                                fontSize: 12,
                                                fontWeight: 700,
                                                background: `rgba(108,71,255,${alpha})`,
                                                color: intensity > 0.5 ? "#fff" : "var(--violet)",
                                                cursor: "default",
                                                transition: "transform 0.15s",
                                            }}
                                        >
                                            {skill}
                                            <span style={{
                                                marginLeft: 6, fontSize: 10, opacity: 0.8,
                                                background: "rgba(255,255,255,0.2)", borderRadius: 10,
                                                padding: "1px 5px",
                                            }}>{count}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Score Distribution */}
                        <div className={styles.card}>
                            <div className={styles.cardHead}>
                                <span>Match Score Distribution</span>
                                <span className="ctag teal">{total} analyzed</span>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                                {bucketed.map((b) => (
                                    <div key={b.label}>
                                        <div style={{
                                            display: "flex", justifyContent: "space-between",
                                            fontSize: 12, marginBottom: 6,
                                        }}>
                                            <span style={{ fontWeight: 600, color: b.color }}>{b.label}%</span>
                                            <span style={{ fontWeight: 700, color: "var(--text)" }}>{b.count}</span>
                                        </div>
                                        <div style={{
                                            height: 10, background: "rgba(108,71,255,0.08)",
                                            borderRadius: 5, overflow: "hidden",
                                        }}>
                                            <div style={{
                                                height: "100%", borderRadius: 5,
                                                background: b.color,
                                                width: `${(b.count / maxBucket) * 100}%`,
                                                transition: "width 1s ease",
                                            }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className={styles.midGrid} style={{ marginTop: 20 }}>
                        {/* Seniority Breakdown */}
                        <div className={styles.card}>
                            <div className={styles.cardHead}>
                                <span>Seniority Levels</span>
                                <span className="ctag pink">AI Classified</span>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                {Object.entries(seniorityMap).map(([level, count]) => (
                                    <div key={level} style={{
                                        display: "flex", alignItems: "center",
                                        justifyContent: "space-between",
                                        padding: "10px 14px",
                                        background: "rgba(108,71,255,0.04)",
                                        borderRadius: 10,
                                    }}>
                                        <span style={{ fontSize: 13, fontWeight: 600 }}>{level}</span>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                            <div style={{ width: 80, height: 6, background: "rgba(108,71,255,0.1)", borderRadius: 3 }}>
                                                <div style={{
                                                    height: "100%", borderRadius: 3,
                                                    background: "linear-gradient(90deg,#6c47ff,#ff6bc6)",
                                                    width: `${(count / total) * 100}%`,
                                                }} />
                                            </div>
                                            <span style={{ fontSize: 13, fontWeight: 700, minWidth: 24, textAlign: "right" }}>
                                                {count}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Top Performers */}
                        <div className={styles.card}>
                            <div className={styles.cardHead}>
                                <span>Top Performers</span>
                                <span className="ctag">Highest Match</span>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                {topCandidates.map((c, i) => (
                                    <div key={c.id} style={{
                                        display: "flex", alignItems: "center",
                                        gap: 12, padding: "8px 0",
                                        borderBottom: i < topCandidates.length - 1 ? "1px solid var(--table-border)" : "none",
                                    }}>
                                        <span style={{
                                            fontSize: 12, fontWeight: 800, color: "var(--text-lite)",
                                            width: 20, textAlign: "center",
                                        }}>#{i + 1}</span>
                                        <div style={{
                                            width: 32, height: 32, borderRadius: "50%",
                                            background: "linear-gradient(135deg,#ddd6fe,#a78bfa)",
                                            display: "flex", alignItems: "center",
                                            justifyContent: "center", fontWeight: 700, fontSize: 14,
                                        }}>
                                            {c.user.name.charAt(0)}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 13, fontWeight: 600 }}>{c.user.name}</div>
                                            <div style={{ fontSize: 11, color: "var(--text-lite)" }}>
                                                {c.aiProfile?.seniorityLevel} · {c.aiProfile?.experienceYears}y
                                            </div>
                                        </div>
                                        <span style={{
                                            fontSize: 13, fontWeight: 800,
                                            color: (c.aiProfile?.matchScore ?? 0) >= 80 ? "#10b981" : "#6c47ff",
                                        }}>
                                            {c.aiProfile?.matchScore}%
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
