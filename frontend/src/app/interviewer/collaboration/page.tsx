"use client";
import styles from "../interviewer.module.css";

const PANELISTS = [
    {
        name: "Rajesh Kumar",
        role: "Lead Interviewer · Technical",
        initials: "RK",
        color: "linear-gradient(135deg,#a78bfa,#6c47ff)",
        scores: { Technical: 4.5, Culture: 4.0, Overall: 4.3 },
        rec: "Hire",
        recColor: "var(--green)",
    },
    {
        name: "Anita Desai",
        role: "HR Panel · Culture Fit",
        initials: "AD",
        color: "linear-gradient(135deg,#fca5a5,#ef4444)",
        scores: { Technical: 3.8, Culture: 4.7, Overall: 4.1 },
        rec: "Hire",
        recColor: "var(--green)",
    },
    {
        name: "James Okafor",
        role: "Engineering Manager",
        initials: "JO",
        color: "linear-gradient(135deg,#6ee7b7,#059669)",
        scores: { Technical: 4.2, Culture: 3.5, Overall: 3.9 },
        rec: "Maybe",
        recColor: "var(--amber)",
    },
];

const CANDIDATE = {
    name: "Lena Schwartz",
    role: "UI Engineer Candidate",
    panelAvg: 4.1,
};

export default function CollaborationPage() {
    return (
        <div>
            <div className={styles.pageHeader}>
                <div className={styles.pageTitle}>🤝 Panel Collaboration</div>
                <div className={styles.pageSub}>Cross-panel score comparison and consensus view for active candidates.</div>
            </div>

            {/* Candidate context banner */}
            <div className={styles.card} style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                <div style={{
                    width: 48, height: 48, borderRadius: "50%",
                    background: "linear-gradient(135deg,#f9a8d4,#ec4899)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 20, fontWeight: 800, color: "#fff", flexShrink: 0,
                }}>L</div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>{CANDIDATE.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text-mid)" }}>{CANDIDATE.role}</div>
                </div>
                <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 11, color: "var(--text-lite)", marginBottom: 2 }}>Panel Avg</div>
                    <div style={{ fontSize: 24, fontWeight: 900, fontFamily: "'Fraunces', serif", color: "var(--green)" }}>
                        {CANDIDATE.panelAvg}
                    </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                    <span className={`${styles.chip} ${styles.chipGreen}`}>2 Hire</span>
                    <span className={`${styles.chip} ${styles.chipYellow}`}>1 Maybe</span>
                </div>
            </div>

            {/* Panelist cards */}
            <div className={styles.grid3}>
                {PANELISTS.map((p) => (
                    <div key={p.name} className={styles.panCard}>
                        <div className={styles.panHeader}>
                            <div className={styles.pAv} style={{ background: p.color }}>
                                {p.initials}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{p.name}</div>
                                <div style={{ fontSize: 11, color: "var(--text-mid)" }}>{p.role}</div>
                            </div>
                            <span style={{
                                padding: "4px 10px", borderRadius: 20,
                                fontSize: 11, fontWeight: 700,
                                background: p.rec === "Hire" ? "rgba(16,185,129,0.1)" : "rgba(251,191,36,0.12)",
                                color: p.recColor,
                            }}>
                                {p.rec}
                            </span>
                        </div>

                        <div className={styles.pScores}>
                            {Object.entries(p.scores).map(([key, val]) => (
                                <div key={key} className={styles.psBox}>
                                    <div className={styles.psVal}>{val}</div>
                                    <div className={styles.psLbl}>{key}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Score comparison */}
            <div className={styles.card} style={{ marginTop: 20 }}>
                <div className={styles.cardTitle}>Score Breakdown Comparison</div>
                {["Technical", "Culture", "Overall"].map((cat) => (
                    <div key={cat} style={{ marginBottom: 18 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>{cat}</div>
                        <div style={{ display: "flex", gap: 8 }}>
                            {PANELISTS.map((p) => {
                                const val = p.scores[cat as keyof typeof p.scores] as number;
                                return (
                                    <div key={p.name} style={{ flex: 1 }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                                            <span style={{ color: "var(--text-lite)" }}>{p.initials}</span>
                                            <span style={{ fontWeight: 700, color: "var(--text)" }}>{val}</span>
                                        </div>
                                        <div className={styles.progBar} style={{ marginBottom: 0 }}>
                                            <div className={styles.progFill} style={{ width: `${(val / 5) * 100}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
