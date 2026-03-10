"use client";
import { useState } from "react";
import styles from "../interviewer.module.css";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { interviewService } from "@/services/interview.service";

const SCORE_ROWS = [
    { key: "technical",    name: "Technical Skills",  desc: "Coding, architecture & system knowledge", weight: "35%", default: 4 },
    { key: "problem",      name: "Problem Solving",   desc: "Logical thinking & debugging",            weight: "25%", default: 4 },
    { key: "communication",name: "Communication",     desc: "Clarity, articulation & listening",       weight: "20%", default: 5 },
    { key: "culture",      name: "Cultural Fit",      desc: "Team alignment & values",                 weight: "10%", default: 4 },
    { key: "initiative",   name: "Initiative",        desc: "Proactiveness & ownership",               weight: "10%", default: 3 },
];

export default function ScorecardPage() {
    const [stars, setStars] = useState<Record<string, number>>(
        Object.fromEntries(SCORE_ROWS.map((r) => [r.key, r.default]))
    );
    const [hovered, setHovered] = useState<Record<string, number>>({});
    const [rec, setRec] = useState<string | null>(null);
    const [notes, setNotes] = useState("");
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const { data: interviews = [], isLoading } = useQuery({
        queryKey: ['interviews', 'completed'],
        queryFn: () => interviewService.getAll({ status: 'COMPLETED' }),
    });

    const pending = interviews.filter(iv => !iv.feedback);
    const done = interviews.filter(iv => iv.feedback);

    const selected = interviews.find(iv => iv.id === selectedId) || pending[0] || null;

    const qc = useQueryClient();
    const feedbackMutation = useMutation({
        mutationFn: ({ id, feedback }: { id: string; feedback: string }) =>
            interviewService.submitFeedback(id, feedback),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['interviews'] });
            setNotes('');
            setRec(null);
        },
    });

    const weighted = SCORE_ROWS.reduce((sum, r) => {
        const w = parseInt(r.weight) / 100;
        return sum + (stars[r.key] ?? 0) * w;
    }, 0);

    return (
        <div>
            <div className={styles.pageHeader}>
                <div className={styles.pageTitle}>📊 Scorecard &amp; Evaluation</div>
                <div className={styles.pageSub}>
                    Rate and evaluate your candidate
                    {selected ? ` — ${selected.candidate.user.name}` : ''}
                </div>
            </div>

            {isLoading ? (
                <p style={{color:'var(--text-lite)',fontSize:14,padding:'20px 0'}}>Loading...</p>
            ) : pending.length === 0 && done.length === 0 ? (
                <p style={{color:'var(--text-lite)',fontSize:14,padding:'20px 0'}}>No interviews pending feedback.</p>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 20, alignItems: "start" }}>
                    {/* Left column */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                        {/* Pending feedback list */}
                        {pending.length > 0 && (
                            <div className={styles.card}>
                                <div className={styles.cardTitle}>Pending Feedback</div>
                                {pending.map((iv) => (
                                    <div
                                        key={iv.id}
                                        className={styles.activityItem}
                                        style={{
                                            cursor: 'pointer',
                                            background: selected?.id === iv.id ? 'var(--bg-hover,rgba(108,71,255,0.08))' : undefined,
                                            borderRadius: 8,
                                            padding: '6px 8px',
                                        }}
                                        onClick={() => setSelectedId(iv.id)}
                                    >
                                        <div
                                            className={styles.actIcon}
                                            style={{ background: 'linear-gradient(135deg,#f9a8d4,#ec4899)', color: '#fff', flexShrink: 0 }}
                                        >
                                            {iv.candidate.user.name.charAt(0)}
                                        </div>
                                        <div className={styles.actText}>
                                            <div className={styles.actTitle}>{iv.candidate.user.name}</div>
                                            <div className={styles.actSub}>{iv.candidate.user.email}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Candidate profile */}
                        {selected && (
                            <div className={styles.card}>
                                <div className={styles.cardTitle}>Candidate Profile</div>

                                {/* Avatar + name */}
                                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                                    <div style={{
                                        width: 52, height: 52, borderRadius: "50%",
                                        background: "linear-gradient(135deg,#f9a8d4,#ec4899)",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: 22, fontWeight: 800, color: "#fff", flexShrink: 0,
                                    }}>{selected.candidate.user.name.charAt(0)}</div>
                                    <div>
                                        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>{selected.candidate.user.name}</div>
                                        <div style={{ fontSize: 12, color: "var(--text-mid)" }}>{selected.candidate.user.email}</div>
                                    </div>
                                </div>

                                {/* AI match score */}
                                {selected.candidate.aiProfile && (
                                    <div className={styles.dfGrid} style={{ marginBottom: 12 }}>
                                        <div className={styles.dfBox}>
                                            <div className={styles.dfLabel}>Match Score</div>
                                            <div className={styles.dfVal}>{selected.candidate.aiProfile.matchScore}%</div>
                                        </div>
                                        <div className={styles.dfBox}>
                                            <div className={styles.dfLabel}>Hire Probability</div>
                                            <div className={styles.dfVal}>{selected.candidate.aiProfile.hireProbability}%</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Recommendation */}
                        {selected && (
                            <div className={styles.card}>
                                <div className={styles.cardTitle}>Recommendation</div>
                                <div className={styles.recBtns}>
                                    <button
                                        className={`${styles.recBtn} ${styles.recHire} ${rec === "hire" ? styles.recSelected : ""}`}
                                        onClick={() => setRec(rec === "hire" ? null : "hire")}
                                    >
                                        ✅ Hire
                                    </button>
                                    <button
                                        className={`${styles.recBtn} ${styles.recMaybe} ${rec === "maybe" ? styles.recSelected : ""}`}
                                        onClick={() => setRec(rec === "maybe" ? null : "maybe")}
                                    >
                                        🤔 Maybe
                                    </button>
                                    <button
                                        className={`${styles.recBtn} ${styles.recNo} ${rec === "no" ? styles.recSelected : ""}`}
                                        onClick={() => setRec(rec === "no" ? null : "no")}
                                    >
                                        ❌ No Hire
                                    </button>
                                </div>
                                <textarea
                                    className={styles.liveNotesArea}
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Add interview notes, observations, key moments..."
                                    rows={5}
                                    style={{ minHeight: 110 }}
                                />
                            </div>
                        )}
                    </div>

                    {/* Right column */}
                    <div className={styles.card}>
                        <div className={styles.cardTitle}>
                            Evaluation Scorecard
                            <span className={styles.ctag}>
                                Weighted: {weighted.toFixed(1)} / 5
                            </span>
                        </div>

                        {SCORE_ROWS.map((row) => {
                            const display = hovered[row.key] ?? stars[row.key] ?? 0;
                            return (
                                <div key={row.key} className={styles.scRow}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div className={styles.scName}>{row.name}</div>
                                        <div className={styles.scDesc}>{row.desc}</div>
                                    </div>
                                    <div className={styles.scStars}>
                                        {[1, 2, 3, 4, 5].map((n) => (
                                            <span
                                                key={n}
                                                className={`${styles.scStar} ${n <= display ? styles.scStarOn : ""}`}
                                                onMouseEnter={() => setHovered((h) => ({ ...h, [row.key]: n }))}
                                                onMouseLeave={() => setHovered((h) => { const next = { ...h }; delete next[row.key]; return next; })}
                                                onClick={() => setStars((s) => ({ ...s, [row.key]: n }))}
                                            >
                                                ★
                                            </span>
                                        ))}
                                    </div>
                                    <span className={styles.scWeight}>{row.weight}</span>
                                </div>
                            );
                        })}

                        {/* AI Analysis + Submit */}
                        <div style={{ marginTop: 24, display: "flex", gap: 10 }}>
                            <button className={styles.btnPrimary} style={{ flex: 1 }}>
                                🤖 Generate AI Analysis
                            </button>
                            <button
                                className={styles.btnGreenSolid}
                                style={{ flex: 1 }}
                                disabled={!rec || !selected || feedbackMutation.isPending}
                                onClick={() => {
                                    if (!selected || !rec) return;
                                    feedbackMutation.mutate({
                                        id: selected.id,
                                        feedback: `Recommendation: ${rec}\n\nNotes: ${notes}`,
                                    });
                                }}
                            >
                                {feedbackMutation.isPending ? 'Submitting...' : 'Submit Scorecard'}
                            </button>
                        </div>
                        {!rec && (
                            <p style={{ fontSize: 12, color: "var(--text-lite)", textAlign: "center", marginTop: 8 }}>
                                Select a recommendation to submit
                            </p>
                        )}
                        {feedbackMutation.isSuccess && (
                            <p style={{ fontSize: 12, color: "var(--success,#059669)", textAlign: "center", marginTop: 8 }}>
                                Scorecard submitted successfully!
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
