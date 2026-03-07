"use client";
import { useQuery } from "@tanstack/react-query";
import { interviewService } from "@/services/interview.service";
import styles from "../interviewer.module.css";

function parseScorecard(feedback: string): {
    decision: string;
    overall: number;
    competencies: Record<string, number>;
} | null {
    if (!feedback) return null;

    // Extract decision
    const decisionMatch = feedback.match(/Decision:\s*([^\n|]+)/);
    const decision = decisionMatch ? decisionMatch[1].trim() : "Unknown";

    // Extract overall score
    const overallMatch = feedback.match(/Overall Score:\s*(\d+)\/10/);
    const overall = overallMatch ? parseInt(overallMatch[1]) : 0;

    // Extract competencies
    const competencies: Record<string, number> = {};
    const compRegex = /([A-Za-z &]+):\s*(\d+)\/10/g;
    let match;
    while ((match = compRegex.exec(feedback)) !== null) {
        const key = match[1].trim();
        if (key !== "Overall Score") {
            competencies[key] = parseInt(match[2]);
        }
    }

    return { decision, overall, competencies };
}

export default function CollaborationPage() {
    const { data: interviews = [], isLoading } = useQuery({
        queryKey: ["interviews"],
        queryFn: () => interviewService.getAll(),
    });

    // Group interviews by candidate
    const byCandidateMap = new Map<string, typeof interviews>();
    interviews.forEach((iv) => {
        const key = iv.candidateId;
        if (!byCandidateMap.has(key)) byCandidateMap.set(key, []);
        byCandidateMap.get(key)!.push(iv);
    });

    // Only show candidates with multiple completed interviews with feedback
    const panels = Array.from(byCandidateMap.entries())
        .map(([, ivs]) => ({
            candidate: ivs[0].candidate,
            interviews: ivs.filter((i) => i.status === "COMPLETED" && i.feedback),
        }))
        .filter((p) => p.interviews.length > 0);

    return (
        <div>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.pageTitle}>Collaboration</h1>
                    <p className={styles.pageSub}>Cross-panelist score comparison and consensus view</p>
                </div>
            </div>

            {isLoading ? (
                <p style={{ color: "var(--text-lite)", fontSize: 14 }}>Loading data...</p>
            ) : panels.length === 0 ? (
                <div style={{ textAlign: "center", padding: "80px 40px", background: "var(--kpi-bg, #fff)", border: "1px solid var(--table-border)", borderRadius: 16 }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>🤝</div>
                    <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>No panel data yet</div>
                    <div style={{ fontSize: 13, color: "var(--text-mid)", maxWidth: 360, margin: "0 auto" }}>
                        When multiple interviewers complete structured scorecards for a candidate, comparisons will appear here.
                    </div>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    {panels.map(({ candidate, interviews: panelIvs }) => {
                        const scorecards = panelIvs.map((iv) => ({
                            interviewer: iv.interviewer.name,
                            parsed: parseScorecard(iv.feedback ?? ""),
                        })).filter((s) => s.parsed);

                        const avgOverall = scorecards.length > 0
                            ? Math.round(scorecards.reduce((s, c) => s + (c.parsed?.overall ?? 0), 0) / scorecards.length)
                            : 0;

                        // Collect all competency keys
                        const compKeys = Array.from(new Set(
                            scorecards.flatMap((s) => Object.keys(s.parsed?.competencies ?? {}))
                        ));

                        return (
                            <div key={candidate.id} className={styles.card}>
                                {/* Candidate header */}
                                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
                                    <div style={{
                                        width: 44, height: 44, borderRadius: "50%",
                                        background: "linear-gradient(135deg,#ddd6fe,#a78bfa)",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: 18, fontWeight: 700, flexShrink: 0,
                                    }}>
                                        {candidate.user.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 15, fontWeight: 700 }}>{candidate.user.name}</div>
                                        <div style={{ fontSize: 12, color: "var(--text-lite)" }}>{candidate.user.email}</div>
                                    </div>
                                    <div style={{ marginLeft: "auto", textAlign: "center" }}>
                                        <div style={{ fontSize: 11, color: "var(--text-lite)" }}>Panel Avg</div>
                                        <div style={{
                                            fontSize: 24, fontWeight: 800,
                                            color: avgOverall >= 7 ? "#10b981" : avgOverall >= 5 ? "#6c47ff" : "#ef4444",
                                        }}>{avgOverall}/10</div>
                                    </div>
                                    {candidate.aiProfile && (
                                        <div style={{ textAlign: "center" }}>
                                            <div style={{ fontSize: 11, color: "var(--text-lite)" }}>AI Score</div>
                                            <div style={{ fontSize: 24, fontWeight: 800, color: "var(--violet)" }}>
                                                {candidate.aiProfile.matchScore}%
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Decisions row */}
                                <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
                                    {scorecards.map((s) => {
                                        const decisionColor = s.parsed?.decision.includes("Strong Yes") ? "#10b981"
                                            : s.parsed?.decision.includes("Yes") ? "#6c47ff"
                                            : s.parsed?.decision.includes("Maybe") ? "#f59e0b"
                                            : "#ef4444";
                                        return (
                                            <div key={s.interviewer} style={{
                                                padding: "8px 14px", borderRadius: 10,
                                                border: `1px solid ${decisionColor}30`,
                                                background: `${decisionColor}0d`,
                                            }}>
                                                <div style={{ fontSize: 11, color: "var(--text-lite)", marginBottom: 2 }}>{s.interviewer}</div>
                                                <div style={{ fontSize: 13, fontWeight: 700, color: decisionColor }}>{s.parsed?.decision}</div>
                                                <div style={{ fontSize: 11, color: "var(--text-mid)", marginTop: 1 }}>{s.parsed?.overall}/10 overall</div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Competency comparison */}
                                {compKeys.length > 0 && (
                                    <div>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-lite)", marginBottom: 12, letterSpacing: "0.5px" }}>
                                            COMPETENCY BREAKDOWN
                                        </div>
                                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                            {compKeys.map((comp) => {
                                                const vals = scorecards
                                                    .map((s) => ({ name: s.interviewer, score: s.parsed?.competencies[comp] ?? 0 }))
                                                    .filter((v) => v.score > 0);
                                                const avg = vals.length > 0
                                                    ? Math.round(vals.reduce((s, v) => s + v.score, 0) / vals.length * 10) / 10
                                                    : 0;
                                                return (
                                                    <div key={comp}>
                                                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                                                            <span style={{ fontWeight: 600 }}>{comp}</span>
                                                            <span style={{ color: "var(--text-lite)" }}>avg: <strong style={{ color: "var(--text)" }}>{avg}/10</strong></span>
                                                        </div>
                                                        <div style={{ display: "flex", gap: 4 }}>
                                                            {vals.map((v) => (
                                                                <div key={v.name} style={{ flex: 1 }}>
                                                                    <div style={{ height: 8, borderRadius: 4, background: "rgba(108,71,255,0.1)", overflow: "hidden" }}>
                                                                        <div style={{
                                                                            height: "100%", borderRadius: 4,
                                                                            background: `linear-gradient(90deg,#6c47ff,#ff6bc6)`,
                                                                            width: `${(v.score / 10) * 100}%`,
                                                                        }} />
                                                                    </div>
                                                                    <div style={{ fontSize: 9, color: "var(--text-lite)", marginTop: 2, textAlign: "center" }}>
                                                                        {v.name.split(" ")[0]}: {v.score}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
