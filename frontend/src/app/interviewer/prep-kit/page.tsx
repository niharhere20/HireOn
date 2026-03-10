"use client";
import { useState } from "react";
import styles from "../interviewer.module.css";

const QUESTIONS = [
    { text: "Walk me through your experience with React hooks and state management.", cat: "Technical" },
    { text: "Describe a challenging bug you solved — your debugging process?", cat: "Technical" },
    { text: "How do you handle conflicting priorities in a fast-paced team?", cat: "Culture" },
    { text: "Explain the virtual DOM and when you'd use useMemo.", cat: "Technical" },
    { text: "What's your approach to code reviews?", cat: "Culture" },
];

const CHECKLIST = [
    { text: "Review candidate resume",        default: true  },
    { text: "Test meeting link",              default: true  },
    { text: "Prepare role-specific questions", default: false },
    { text: "Check evaluation criteria",      default: false },
    { text: "Set up screen sharing",          default: false },
];

export default function PrepKitPage() {
    const [checked, setChecked] = useState<boolean[]>(CHECKLIST.map((c) => c.default));

    const toggle = (i: number) =>
        setChecked((prev) => prev.map((v, idx) => (idx === i ? !v : v)));

    const done = checked.filter(Boolean).length;
    const pct = Math.round((done / CHECKLIST.length) * 100);

    return (
        <div>
            <div className={styles.pageHeader}>
                <div className={styles.pageTitle}>🗒️ Prep Kit</div>
                <div className={styles.pageSub}>Interview questions and pre-interview checklist for today&apos;s sessions.</div>
            </div>

            <div className={styles.grid2}>
                {/* Left: Questions */}
                <div className={styles.card}>
                    <div className={styles.cardTitle}>
                        Interview Questions
                        <span className={styles.ctag}>{QUESTIONS.length} questions</span>
                    </div>

                    {QUESTIONS.map((q, i) => (
                        <div key={i} className={styles.prepQ}>
                            <span className={styles.prepQNum}>{i + 1}</span>
                            <span className={styles.prepQText}>{q.text}</span>
                            <span
                                className={`${styles.prepQCat} ${
                                    q.cat === "Technical" ? styles.catTech : styles.catCulture
                                }`}
                            >
                                {q.cat}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Right: Checklist */}
                <div className={styles.card}>
                    <div className={styles.cardTitle}>
                        Interview Checklist
                        <span className={styles.ctag}>{done}/{CHECKLIST.length}</span>
                    </div>

                    {/* Progress bar */}
                    <div className={styles.progBar}>
                        <div className={styles.progFill} style={{ width: `${pct}%` }} />
                    </div>
                    <p style={{ fontSize: 12, color: "var(--text-mid)", marginBottom: 16 }}>
                        {pct}% complete — {CHECKLIST.length - done} items remaining
                    </p>

                    {CHECKLIST.map((item, i) => (
                        <div
                            key={i}
                            className={`${styles.checklistItem} ${checked[i] ? styles.chkDone : ""}`}
                            onClick={() => toggle(i)}
                        >
                            <div className={styles.chk}>
                                {checked[i] && "✓"}
                            </div>
                            <span className={styles.chkText}>{item.text}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
