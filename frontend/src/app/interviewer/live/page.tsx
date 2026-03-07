"use client";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { interviewService, Interview } from "@/services/interview.service";
import styles from "../interviewer.module.css";

const LIVE_QUESTIONS = [
    "Tell me about yourself and your recent projects.",
    "What's the most technically challenging problem you've solved?",
    "How do you handle tight deadlines and competing priorities?",
    "Describe your ideal development workflow.",
    "Walk me through a system design decision you made recently.",
    "How do you approach code reviews — both giving and receiving?",
    "What are your biggest technical strengths?",
    "What would you like to learn or improve in the next 12 months?",
    "Do you have any questions for us?",
];

export default function LiveInterviewPage() {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [currentQ, setCurrentQ] = useState(0);
    const [sessionActive, setSessionActive] = useState(false);
    const [elapsed, setElapsed] = useState(0);
    const [notes, setNotes] = useState<string[]>(LIVE_QUESTIONS.map(() => ""));
    const [checkedQ, setCheckedQ] = useState<Set<number>>(new Set());

    const { data: interviews = [] } = useQuery({
        queryKey: ["interviews"],
        queryFn: () => interviewService.getAll(),
    });

    const upcoming = interviews.filter((i) => i.status === "SCHEDULED");
    const selected = interviews.find((i) => i.id === selectedId);

    // Timer
    useEffect(() => {
        if (!sessionActive) return;
        const id = setInterval(() => setElapsed((e) => e + 1), 1000);
        return () => clearInterval(id);
    }, [sessionActive]);

    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60).toString().padStart(2, "0");
        const s = (secs % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    };

    const totalDuration = selected
        ? Math.round((new Date(selected.endTime).getTime() - new Date(selected.startTime).getTime()) / 60000)
        : 45;

    const handleStart = () => {
        setSessionActive(true);
        setElapsed(0);
        setCurrentQ(0);
    };

    return (
        <div>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.pageTitle}>Live Interview Room</h1>
                    <p className={styles.pageSub}>Real-time question ticking and note-taking during the interview</p>
                </div>
            </div>

            {!sessionActive ? (
                <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 20 }}>
                    {/* Select interview */}
                    <div className={styles.card}>
                        <div className={styles.cardHead}>
                            <span>Select Interview</span>
                        </div>
                        {upcoming.length === 0 ? (
                            <p style={{ fontSize: 13, color: "var(--text-lite)" }}>No upcoming interviews.</p>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                {upcoming.map((iv) => (
                                    <button
                                        key={iv.id}
                                        onClick={() => setSelectedId(iv.id)}
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
                                        <div style={{ fontSize: 11, color: "var(--text-lite)", marginTop: 3 }}>
                                            {new Date(iv.startTime).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Info + Start */}
                    <div className={styles.card} style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: 320 }}>
                        {selected ? (
                            <>
                                <div style={{ textAlign: "center", marginBottom: 32 }}>
                                    <div style={{
                                        width: 64, height: 64, borderRadius: "50%",
                                        background: "linear-gradient(135deg,#ddd6fe,#a78bfa)",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: 26, fontWeight: 700, margin: "0 auto 12px",
                                    }}>
                                        {selected.candidate.user.name.charAt(0)}
                                    </div>
                                    <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
                                        {selected.candidate.user.name}
                                    </div>
                                    <div style={{ fontSize: 13, color: "var(--text-lite)" }}>
                                        {totalDuration} minute session
                                    </div>
                                    {selected.candidate.aiProfile && (
                                        <div style={{ marginTop: 8, fontSize: 13, color: "var(--violet)", fontWeight: 700 }}>
                                            AI Match: {selected.candidate.aiProfile.matchScore}%
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={handleStart}
                                    style={{
                                        padding: "14px 40px", borderRadius: 12, border: "none",
                                        background: "linear-gradient(135deg,#6c47ff,#ff6bc6)",
                                        color: "#fff", fontWeight: 700, fontSize: 16,
                                        cursor: "pointer",
                                    }}
                                >
                                    Start Interview Session
                                </button>
                                {selected.meetLink && (
                                    <a
                                        href={selected.meetLink}
                                        target="_blank"
                                        rel="noreferrer"
                                        style={{
                                            marginTop: 12, fontSize: 13, color: "var(--violet)",
                                            textDecoration: "none", fontWeight: 600,
                                        }}
                                    >
                                        Join Meeting Link →
                                    </a>
                                )}
                            </>
                        ) : (
                            <div style={{ textAlign: "center", color: "var(--text-lite)" }}>
                                <div style={{ fontSize: 40, marginBottom: 12 }}>🎙️</div>
                                <div style={{ fontSize: 15, fontWeight: 600 }}>Select an interview to begin</div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* Active Session */
                <div>
                    {/* Timer bar */}
                    <div style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "14px 20px", background: "var(--kpi-bg, #fff)",
                        border: "1px solid var(--table-border)", borderRadius: 12, marginBottom: 20,
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#10b981", animation: "pulse 2s infinite" }} />
                            <span style={{ fontSize: 14, fontWeight: 700 }}>Live — {selected?.candidate.user.name}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                            <div style={{ textAlign: "center" }}>
                                <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "monospace", color: elapsed >= totalDuration * 60 ? "#ef4444" : "var(--text)" }}>
                                    {formatTime(elapsed)}
                                </div>
                                <div style={{ fontSize: 10, color: "var(--text-lite)" }}>elapsed</div>
                            </div>
                            <div style={{ textAlign: "center" }}>
                                <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "monospace", color: "var(--text-mid)" }}>
                                    {formatTime(Math.max(totalDuration * 60 - elapsed, 0))}
                                </div>
                                <div style={{ fontSize: 10, color: "var(--text-lite)" }}>remaining</div>
                            </div>
                        </div>
                        <button
                            onClick={() => { setSessionActive(false); setSelectedId(null); }}
                            style={{
                                padding: "8px 18px", borderRadius: 8, border: "1px solid rgba(239,68,68,.2)",
                                background: "rgba(239,68,68,.06)", color: "#ef4444",
                                cursor: "pointer", fontSize: 13, fontWeight: 600,
                            }}
                        >
                            End Session
                        </button>
                    </div>

                    {/* Progress bar */}
                    <div style={{ height: 4, background: "rgba(108,71,255,0.1)", borderRadius: 2, marginBottom: 20, overflow: "hidden" }}>
                        <div style={{
                            height: "100%", borderRadius: 2,
                            background: "linear-gradient(90deg,#6c47ff,#ff6bc6)",
                            width: `${Math.min((elapsed / (totalDuration * 60)) * 100, 100)}%`,
                            transition: "width 1s linear",
                        }} />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                        {/* Question ticker */}
                        <div className={styles.card}>
                            <div className={styles.cardHead}>
                                <span>Questions</span>
                                <span className="ctag">{currentQ + 1}/{LIVE_QUESTIONS.length}</span>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                {LIVE_QUESTIONS.map((q, i) => (
                                    <div
                                        key={i}
                                        onClick={() => setCurrentQ(i)}
                                        style={{
                                            padding: "10px 14px", borderRadius: 10, cursor: "pointer",
                                            border: `1px solid ${i === currentQ ? "#6c47ff" : checkedQ.has(i) ? "rgba(16,185,129,0.3)" : "var(--table-border)"}`,
                                            background: i === currentQ ? "rgba(108,71,255,0.08)" : checkedQ.has(i) ? "rgba(16,185,129,0.05)" : "transparent",
                                            transition: "all 0.15s",
                                        }}
                                    >
                                        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                                            <span style={{ fontSize: 11, fontWeight: 700, color: i === currentQ ? "#6c47ff" : "var(--text-lite)", minWidth: 20, marginTop: 1 }}>
                                                {i + 1}.
                                            </span>
                                            <span style={{
                                                fontSize: 13, flex: 1,
                                                color: checkedQ.has(i) ? "var(--text-lite)" : i === currentQ ? "var(--text)" : "var(--text-mid)",
                                                textDecoration: checkedQ.has(i) ? "line-through" : "none",
                                                lineHeight: 1.5,
                                            }}>{q}</span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setCheckedQ((s) => {
                                                        const next = new Set(s);
                                                        if (next.has(i)) next.delete(i);
                                                        else next.add(i);
                                                        return next;
                                                    });
                                                }}
                                                style={{
                                                    background: "none", border: "none",
                                                    cursor: "pointer", fontSize: 14,
                                                    color: checkedQ.has(i) ? "#10b981" : "var(--text-lite)",
                                                }}
                                            >
                                                {checkedQ.has(i) ? "✓" : "○"}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                                <button
                                    onClick={() => setCurrentQ((q) => Math.max(0, q - 1))}
                                    disabled={currentQ === 0}
                                    style={{
                                        flex: 1, padding: "9px", borderRadius: 9, border: "1px solid var(--table-border)",
                                        background: "transparent", cursor: "pointer", fontSize: 13, fontWeight: 600,
                                        color: "var(--text-mid)", opacity: currentQ === 0 ? 0.4 : 1,
                                    }}
                                >
                                    ← Prev
                                </button>
                                <button
                                    onClick={() => setCurrentQ((q) => Math.min(LIVE_QUESTIONS.length - 1, q + 1))}
                                    disabled={currentQ === LIVE_QUESTIONS.length - 1}
                                    style={{
                                        flex: 1, padding: "9px", borderRadius: 9, border: "none",
                                        background: "linear-gradient(135deg,#6c47ff,#ff6bc6)",
                                        cursor: "pointer", fontSize: 13, fontWeight: 700, color: "#fff",
                                        opacity: currentQ === LIVE_QUESTIONS.length - 1 ? 0.4 : 1,
                                    }}
                                >
                                    Next →
                                </button>
                            </div>
                        </div>

                        {/* Notes */}
                        <div className={styles.card}>
                            <div className={styles.cardHead}>
                                <span>Notes — Q{currentQ + 1}</span>
                            </div>
                            <div style={{
                                fontSize: 13, fontWeight: 600, color: "var(--violet)",
                                padding: "10px 14px", background: "rgba(108,71,255,0.06)",
                                borderRadius: 10, marginBottom: 12, lineHeight: 1.5,
                            }}>
                                {LIVE_QUESTIONS[currentQ]}
                            </div>
                            <textarea
                                value={notes[currentQ]}
                                onChange={(e) => {
                                    const next = [...notes];
                                    next[currentQ] = e.target.value;
                                    setNotes(next);
                                }}
                                placeholder="Type observations and notes here..."
                                style={{
                                    width: "100%", minHeight: 200, padding: "10px 14px",
                                    borderRadius: 10, border: "1px solid var(--input-border)",
                                    background: "var(--input-bg)", color: "var(--text)",
                                    fontSize: 13, resize: "vertical", outline: "none",
                                    fontFamily: "inherit", lineHeight: 1.6, boxSizing: "border-box",
                                }}
                            />
                            <div style={{ marginTop: 12, fontSize: 12, color: "var(--text-lite)" }}>
                                {notes.filter(Boolean).length}/{notes.length} questions have notes
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
