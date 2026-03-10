"use client";
import { useState, useEffect } from "react";
import styles from "../interviewer.module.css";

const LQ_LABELS = ["Technical Depth", "Communication", "Problem Solving", "Culture Fit"];

const QUESTIONS = [
    "Tell me about yourself and your recent React projects.",
    "Walk me through a challenging performance issue you've debugged.",
    "How do you structure state in a large-scale React application?",
    "Explain your approach to component design and reusability.",
    "Do you have any questions for us?",
];

export default function LiveRoomPage() {
    const [running, setRunning] = useState(false);
    const [elapsed, setElapsed] = useState(0);
    const [lqStars, setLqStars] = useState<number[]>([0, 0, 0, 0]);
    const [lqHover, setLqHover] = useState<number[]>([-1, -1, -1, -1]);
    const [notes, setNotes] = useState("");
    const [asked, setAsked] = useState<Set<number>>(new Set());

    useEffect(() => {
        if (!running) return;
        const id = setInterval(() => setElapsed((e) => e + 1), 1000);
        return () => clearInterval(id);
    }, [running]);

    const fmt = (s: number) => {
        const m = Math.floor(s / 60).toString().padStart(2, "0");
        const sec = (s % 60).toString().padStart(2, "0");
        return `${m}:${sec}`;
    };

    const toggleAsked = (i: number) =>
        setAsked((prev) => {
            const next = new Set(prev);
            if (next.has(i)) next.delete(i); else next.add(i);
            return next;
        });

    return (
        <div>
            <div className={styles.pageHeader}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                    <div>
                        <div className={styles.pageTitle}>🟢 Live Room</div>
                        <div className={styles.pageSub}>Sarah Chen — Technical Round · In Progress</div>
                    </div>
                    {running && (
                        <span className={`${styles.chip} ${styles.chipTeal}`}>
                            <span className={styles.chipDot} />
                            Session Active
                        </span>
                    )}
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, alignItems: "start" }}>
                {/* Left main panel */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {/* Live banner */}
                    <div className={styles.liveBanner}>
                        <div>
                            <div className={styles.liveCName}>Sarah Chen</div>
                            <div className={styles.liveCMeta}>Technical Round · Senior React Developer</div>
                        </div>

                        <div className={styles.liveTimer}>
                            <div className={styles.timerVal}>{fmt(elapsed)}</div>
                            <div className={styles.timerLbl}>elapsed</div>
                            <div className={styles.timerBtns}>
                                {!running ? (
                                    <button
                                        className={styles.btnGreenSolid}
                                        onClick={() => { setRunning(true); setElapsed(0); }}
                                    >
                                        ▶ Start
                                    </button>
                                ) : (
                                    <button
                                        className={styles.btnRed}
                                        onClick={() => setRunning(false)}
                                    >
                                        ■ End Session
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Quick rating grid */}
                    <div className={styles.lqGrid}>
                        {LQ_LABELS.map((lbl, qi) => {
                            const display = lqHover[qi] >= 0 ? lqHover[qi] + 1 : lqStars[qi];
                            return (
                                <div key={lbl} className={styles.lqBox}>
                                    <div className={styles.lqLabel}>{lbl}</div>
                                    <div className={styles.lqStars}>
                                        {[0, 1, 2, 3, 4].map((n) => (
                                            <span
                                                key={n}
                                                className={`${styles.lqStar} ${n < display ? styles.lqStarOn : ""}`}
                                                onMouseEnter={() => setLqHover((h) => h.map((v, i) => i === qi ? n : v))}
                                                onMouseLeave={() => setLqHover((h) => h.map((v, i) => i === qi ? -1 : v))}
                                                onClick={() => setLqStars((s) => s.map((v, i) => i === qi ? n + 1 : v))}
                                            >
                                                ★
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Notes */}
                    <div className={styles.card} style={{ display: "flex", flexDirection: "column" }}>
                        <div className={styles.cardTitle}>📝 Live Notes</div>
                        <textarea
                            className={styles.liveNotesArea}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Take notes here during the interview — candidate responses, observations, key moments..."
                            style={{ flex: 1, minHeight: 200 }}
                        />
                    </div>
                </div>

                {/* Right panel: Question Queue */}
                <div className={styles.card}>
                    <div className={styles.cardTitle}>
                        Question Queue
                        <span className={styles.ctag}>{asked.size}/{QUESTIONS.length} asked</span>
                    </div>
                    {QUESTIONS.map((q, i) => (
                        <div
                            key={i}
                            className={`${styles.liveQItem} ${asked.has(i) ? styles.liveQAsked : ""}`}
                            onClick={() => toggleAsked(i)}
                        >
                            <span className={styles.liveQNum}>{i + 1}.</span>
                            <span className={styles.liveQText}>{q}</span>
                            <span style={{ fontSize: 14, color: asked.has(i) ? "var(--green)" : "var(--text-lite)", marginLeft: 4 }}>
                                {asked.has(i) ? "✓" : "○"}
                            </span>
                        </div>
                    ))}

                    <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--card-border)" }}>
                        <p style={{ fontSize: 11, color: "var(--text-lite)", margin: 0 }}>
                            Click a question to mark it as asked.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
