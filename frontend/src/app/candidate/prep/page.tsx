"use client";
import styles from "../candidate.module.css";

const TOPICS = [
    { icon: "⚛️",  ki: styles.ki1, name: "React & Frontend",  pct: 75 },
    { icon: "🏗️", ki: styles.ki2, name: "System Design",      pct: 40 },
    { icon: "🟡",  ki: styles.ki3, name: "JavaScript Core",    pct: 85 },
    { icon: "🤝",  ki: styles.ki4, name: "Behavioral",         pct: 60 },
];

const TIPS = [
    {
        icon: "💡",
        iconBg: "rgba(108,71,255,0.12)",
        text: "Review your past projects and be ready to explain your technical decisions clearly.",
        tag: "Technical",
        tagCls: styles.pttV,
    },
    {
        icon: "🌟",
        iconBg: "rgba(0,212,200,0.12)",
        text: "Practice the STAR method (Situation, Task, Action, Result) for behavioral questions.",
        tag: "Communication",
        tagCls: styles.pttT,
    },
    {
        icon: "🎧",
        iconBg: "rgba(16,185,129,0.12)",
        text: "Test your internet connection, camera and microphone setup 15 minutes before the interview.",
        tag: "Logistics",
        tagCls: styles.pttC,
    },
    {
        icon: "❓",
        iconBg: "rgba(251,191,36,0.12)",
        text: "Prepare 2–3 thoughtful questions to ask the interviewer about the role and team.",
        tag: "Preparation",
        tagCls: styles.pttW,
    },
];

export default function PrepPage() {
    return (
        <div>
            {/* Header */}
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>🎯 Interview Prep Hub</h1>
                    <p className={styles.pageSub}>
                        AI-curated preparation resources for <strong>Round 2 — Technical Interview</strong>
                    </p>
                </div>
                <span className={`${styles.chip} ${styles.chipTeal}`}>
                    <span className={styles.chipDot} />Today at 2:00 PM
                </span>
            </div>

            <div className={styles.grid2}>
                {/* LEFT — Topics + Flashcard */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {/* Topic progress */}
                    <div className={styles.card}>
                        <div className={styles.cardTitle}>Topic Readiness</div>
                        {TOPICS.map((t) => (
                            <div key={t.name} className={styles.phTopic}>
                                <div className={styles.phTopicHead}>
                                    <div className={`${styles.phTopicIco} ${t.ki}`}>{t.icon}</div>
                                    <div className={styles.phTopicName}>{t.name}</div>
                                    <div className={styles.phTopicPct}>{t.pct}%</div>
                                </div>
                                <div className={styles.phTopicBar}>
                                    <div
                                        className={styles.pfill}
                                        style={{ width: `${t.pct}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Flashcard */}
                    <div className={styles.flashcard}>
                        <div className={styles.flashcardLabel}>Featured Question · Technical</div>
                        <div className={styles.flashcardQ}>
                            What is the difference between <code style={{ background: "rgba(255,255,255,0.15)", padding: "1px 6px", borderRadius: 4 }}>useMemo</code> and{" "}
                            <code style={{ background: "rgba(255,255,255,0.15)", padding: "1px 6px", borderRadius: 4 }}>useCallback</code> in React?
                        </div>
                        <div className={styles.flashcardHint}>
                            Hint: Think about what each hook memoizes — a value vs a function reference.
                        </div>
                        <div style={{ marginTop: 8 }}>
                            <button className={`${styles.btn} ${styles.btnSm}`} style={{ background: "rgba(255,255,255,0.18)", color: "#fff", border: "none" }}>
                                Next Question →
                            </button>
                        </div>
                    </div>
                </div>

                {/* RIGHT — Prep Tips */}
                <div className={styles.card}>
                    <div className={styles.cardTitle}>Prep Tips for Today</div>
                    {TIPS.map((tip) => (
                        <div key={tip.tag} className={styles.prepTip}>
                            <div className={styles.prepTipIco} style={{ background: tip.iconBg }}>
                                {tip.icon}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div className={styles.prepTipText}>{tip.text}</div>
                                <span className={`${styles.prepTipTag} ${tip.tagCls}`}>{tip.tag}</span>
                            </div>
                        </div>
                    ))}

                    {/* Quick links */}
                    <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--card-border)", display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <button className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm}`}>
                            📚 Practice Questions
                        </button>
                        <button className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`}>
                            🎙️ Mock Interview
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
