"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { interviewService, Interview } from "@/services/interview.service";
import styles from "../interviewer.module.css";

const COMPETENCIES = [
    { key: "technical", label: "Technical Skills", icon: "⚙️" },
    { key: "problemSolving", label: "Problem Solving", icon: "🧩" },
    { key: "communication", label: "Communication", icon: "💬" },
    { key: "attitude", label: "Attitude & Culture", icon: "🤝" },
    { key: "leadership", label: "Leadership Potential", icon: "🚀" },
];

const DECISIONS = [
    { value: "STRONG_YES", label: "Strong Yes", color: "#10b981" },
    { value: "YES", label: "Yes", color: "#6c47ff" },
    { value: "MAYBE", label: "Maybe", color: "#f59e0b" },
    { value: "NO", label: "No", color: "#ef4444" },
];

function avgScore(scores: Record<string, number>) {
    const vals = Object.values(scores);
    if (vals.length === 0) return 0;
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

export default function ScorecardPage() {
    const qc = useQueryClient();
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [scores, setScores] = useState<Record<string, number>>({});
    const [decision, setDecision] = useState("");
    const [notes, setNotes] = useState("");
    const [submitted, setSubmitted] = useState(false);

    const { data: interviews = [], isLoading } = useQuery({
        queryKey: ["interviews"],
        queryFn: () => interviewService.getAll(),
    });

    const completedPendingFeedback = interviews.filter(
        (i) => i.status === "COMPLETED" && !i.feedback
    );

    const submitMutation = useMutation({
        mutationFn: (interviewId: string) => {
            const avg = avgScore(scores);
            const decisionLabel = DECISIONS.find((d) => d.value === decision)?.label ?? decision;
            const feedback = `Decision: ${decisionLabel} | Overall Score: ${avg}/10\n\n` +
                COMPETENCIES.map((c) => `${c.label}: ${scores[c.key] ?? "—"}/10`).join(" | ") +
                (notes ? `\n\nNotes: ${notes}` : "");
            return interviewService.submitFeedback(interviewId, feedback);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["interviews"] });
            setSubmitted(true);
        },
    });

    const selected = interviews.find((i) => i.id === selectedId);

    const handleSubmit = () => {
        if (!selectedId || !decision) return;
        submitMutation.mutate(selectedId);
    };

    if (submitted) {
        return (
            <div>
                <div className={styles.header}>
                    <div>
                        <h1 className={styles.pageTitle}>Scorecard</h1>
                        <p className={styles.pageSub}>Structured evaluation form</p>
                    </div>
                </div>
                <div style={{ textAlign: "center", padding: "80px 0" }}>
                    <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
                    <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Scorecard Submitted!</div>
                    <div style={{ fontSize: 14, color: "var(--text-mid)", marginBottom: 24 }}>
                        Your evaluation has been recorded.
                    </div>
                    <button
                        onClick={() => { setSubmitted(false); setSelectedId(null); setScores({}); setDecision(""); setNotes(""); }}
                        style={{
                            padding: "10px 24px", borderRadius: 10, fontSize: 14,
                            background: "linear-gradient(135deg,#6c47ff,#ff6bc6)",
                            color: "#fff", border: "none", cursor: "pointer", fontWeight: 700,
                        }}
                    >
                        Submit Another
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.pageTitle}>Scorecard</h1>
                    <p className={styles.pageSub}>Rate candidates on key competencies</p>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 20 }}>
                {/* Left: Interview selector */}
                <div className={styles.card}>
                    <div className={styles.cardHead}>
                        <span>Select Interview</span>
                        <span className="ctag">{completedPendingFeedback.length} pending</span>
                    </div>
                    {isLoading ? (
                        <p style={{ fontSize: 13, color: "var(--text-lite)" }}>Loading...</p>
                    ) : completedPendingFeedback.length === 0 ? (
                        <p style={{ fontSize: 13, color: "var(--text-lite)" }}>
                            No interviews pending feedback.
                        </p>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {completedPendingFeedback.map((iv) => (
                                <button
                                    key={iv.id}
                                    onClick={() => { setSelectedId(iv.id); setScores({}); setDecision(""); setNotes(""); }}
                                    style={{
                                        width: "100%", textAlign: "left", padding: "12px 14px",
                                        borderRadius: 10, cursor: "pointer",
                                        border: `1px solid ${selectedId === iv.id ? "#6c47ff" : "var(--table-border)"}`,
                                        background: selectedId === iv.id ? "rgba(108,71,255,0.07)" : "transparent",
                                        transition: "all 0.2s",
                                    }}
                                >
                                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
                                        {iv.candidate.user.name}
                                    </div>
                                    <div style={{ fontSize: 11, color: "var(--text-lite)", marginTop: 2 }}>
                                        {new Date(iv.startTime).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                    </div>
                                    {iv.candidate.aiProfile && (
                                        <div style={{ fontSize: 11, marginTop: 4, color: "var(--violet)", fontWeight: 700 }}>
                                            AI: {iv.candidate.aiProfile.matchScore}%
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right: Scorecard form */}
                <div>
                    {!selected ? (
                        <div className={styles.card} style={{ textAlign: "center", padding: "60px 40px" }}>
                            <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
                            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Select an interview</div>
                            <div style={{ fontSize: 13, color: "var(--text-mid)" }}>
                                Choose an interview from the left to start evaluating
                            </div>
                        </div>
                    ) : (
                        <div className={styles.card}>
                            {/* Candidate Info */}
                            <div style={{
                                display: "flex", alignItems: "center", gap: 14,
                                marginBottom: 24, padding: "16px", background: "rgba(108,71,255,0.04)", borderRadius: 12,
                            }}>
                                <div style={{
                                    width: 44, height: 44, borderRadius: "50%",
                                    background: "linear-gradient(135deg,#ddd6fe,#a78bfa)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: 18, fontWeight: 700,
                                }}>
                                    {selected.candidate.user.name.charAt(0)}
                                </div>
                                <div>
                                    <div style={{ fontSize: 16, fontWeight: 700 }}>{selected.candidate.user.name}</div>
                                    <div style={{ fontSize: 12, color: "var(--text-lite)" }}>{selected.candidate.user.email}</div>
                                </div>
                                {selected.candidate.aiProfile && (
                                    <div style={{ marginLeft: "auto", textAlign: "right" }}>
                                        <div style={{ fontSize: 11, color: "var(--text-lite)" }}>AI Score</div>
                                        <div style={{ fontSize: 20, fontWeight: 800, color: "var(--violet)" }}>
                                            {selected.candidate.aiProfile.matchScore}%
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Overall score preview */}
                            {Object.keys(scores).length > 0 && (
                                <div style={{ marginBottom: 20, textAlign: "center" }}>
                                    <div style={{ fontSize: 12, color: "var(--text-lite)", marginBottom: 4 }}>Overall Score</div>
                                    <div style={{ fontSize: 32, fontWeight: 900, color: "var(--violet)" }}>
                                        {avgScore(scores)}<span style={{ fontSize: 16, fontWeight: 600, color: "var(--text-lite)" }}>/10</span>
                                    </div>
                                </div>
                            )}

                            {/* Competency sliders */}
                            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
                                {COMPETENCIES.map((c) => (
                                    <div key={c.key}>
                                        <div style={{
                                            display: "flex", justifyContent: "space-between",
                                            alignItems: "center", marginBottom: 8,
                                        }}>
                                            <span style={{ fontSize: 13, fontWeight: 600 }}>
                                                {c.icon} {c.label}
                                            </span>
                                            <span style={{
                                                fontSize: 16, fontWeight: 800,
                                                color: (scores[c.key] ?? 0) >= 7 ? "#10b981" : (scores[c.key] ?? 0) >= 5 ? "#6c47ff" : "var(--text-lite)",
                                                minWidth: 40, textAlign: "right",
                                            }}>
                                                {scores[c.key] !== undefined ? `${scores[c.key]}/10` : "—"}
                                            </span>
                                        </div>
                                        <input
                                            type="range" min={1} max={10} step={1}
                                            value={scores[c.key] ?? 5}
                                            onChange={(e) => setScores((s) => ({ ...s, [c.key]: Number(e.target.value) }))}
                                            style={{ width: "100%", accentColor: "#6c47ff" }}
                                        />
                                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text-lite)", marginTop: 2 }}>
                                            <span>1 — Poor</span>
                                            <span>10 — Exceptional</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Hiring decision */}
                            <div style={{ marginBottom: 20 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Hiring Decision</div>
                                <div style={{ display: "flex", gap: 8 }}>
                                    {DECISIONS.map((d) => (
                                        <button
                                            key={d.value}
                                            onClick={() => setDecision(d.value)}
                                            style={{
                                                flex: 1, padding: "9px 4px", borderRadius: 10, fontSize: 12,
                                                fontWeight: 700, cursor: "pointer",
                                                border: `2px solid ${decision === d.value ? d.color : "var(--table-border)"}`,
                                                background: decision === d.value ? `${d.color}18` : "transparent",
                                                color: decision === d.value ? d.color : "var(--text-mid)",
                                                transition: "all 0.2s",
                                            }}
                                        >
                                            {d.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Notes */}
                            <div style={{ marginBottom: 20 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Additional Notes</div>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Add any additional observations or notes..."
                                    rows={3}
                                    style={{
                                        width: "100%", padding: "10px 14px", borderRadius: 10,
                                        border: "1px solid var(--input-border)", fontSize: 13,
                                        background: "var(--input-bg)", color: "var(--text)",
                                        resize: "vertical", outline: "none", fontFamily: "inherit",
                                        boxSizing: "border-box",
                                    }}
                                />
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={!decision || Object.keys(scores).length < COMPETENCIES.length || submitMutation.isPending}
                                style={{
                                    width: "100%", padding: "12px", borderRadius: 12, border: "none",
                                    background: "linear-gradient(135deg,#6c47ff,#ff6bc6)",
                                    color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer",
                                    opacity: (!decision || Object.keys(scores).length < COMPETENCIES.length) ? 0.5 : 1,
                                    transition: "opacity 0.2s",
                                }}
                            >
                                {submitMutation.isPending ? "Submitting..." : "Submit Scorecard"}
                            </button>
                            {(!decision || Object.keys(scores).length < COMPETENCIES.length) && (
                                <p style={{ fontSize: 12, color: "var(--text-lite)", textAlign: "center", marginTop: 8 }}>
                                    Rate all competencies and select a decision to submit
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
