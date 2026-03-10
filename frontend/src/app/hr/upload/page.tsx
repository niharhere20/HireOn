"use client";
import { useState } from "react";
import styles from "../hr.module.css";

const DEMO_CANDIDATES = [
    { key: "sarah",  label: "👩‍💻 Sarah Chen",  name: "Sarah Chen",  role: "Sr React Dev",      exp: "6.5", score: 87, seniority: "Senior",    prob: "72%", skills: ["React", "TypeScript", "Node.js"] },
    { key: "marcus", label: "👨‍💼 Marcus Reid",  name: "Marcus Reid", role: "React Developer",   exp: "5.2", score: 81, seniority: "Mid-Senior", prob: "65%", skills: ["React", "Redux", "JS"] },
    { key: "priya",  label: "🧑‍💻 Priya Nair",   name: "Priya Nair",  role: "Frontend Engineer", exp: "4.0", score: 71, seniority: "Mid",        prob: "54%", skills: ["Vue.js", "CSS", "JS"] },
    { key: "omar",   label: "👨‍🔬 Omar Farisi",  name: "Omar Farisi", role: "Sr React Dev",      exp: "7.0", score: 95, seniority: "Senior",    prob: "88%", skills: ["React", "GraphQL", "AWS"] },
];

const STEPS = [
    { id: "parse",  icon: "📄", label: "Parsing document" },
    { id: "skills", icon: "🏷️", label: "Extracting explicit skills" },
    { id: "infer",  icon: "🔍", label: "Inferring hidden skills" },
    { id: "exp",    icon: "📅", label: "Calculating experience" },
    { id: "score",  icon: "🎯", label: "Generating match score" },
    { id: "decide", icon: "⚡", label: "Making shortlist decision" },
];

export default function UploadResumePage() {
    const [running, setRunning] = useState(false);
    const [doneSteps, setDoneSteps] = useState<number>(-1);
    const [result, setResult] = useState<typeof DEMO_CANDIDATES[0] | null>(null);
    const [dragOver, setDragOver] = useState(false);

    const runDemo = (key: string) => {
        const cand = DEMO_CANDIDATES.find((c) => c.key === key)!;
        setResult(null);
        setDoneSteps(-1);
        setRunning(true);
        STEPS.forEach((_, i) => {
            setTimeout(() => {
                setDoneSteps(i);
                if (i === STEPS.length - 1) {
                    setRunning(false);
                    setResult(cand);
                }
            }, (i + 1) * 600);
        });
    };

    return (
        <div>
            <div className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>Upload Resume</h1>
                <p className={styles.pageSub}>Drop a resume and watch Hireon AI analyse it in seconds.</p>
            </div>

            <div className={styles.grid2}>
                {/* Left */}
                <div>
                    <div className={styles.card} style={{ marginBottom: 20 }}>
                        <div className={styles.cardTitle}>Job Requirement</div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Role Title</label>
                            <input className={styles.formInput} defaultValue="Senior React Developer" type="text" />
                        </div>
                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Min. Experience (yrs)</label>
                                <input className={styles.formInput} defaultValue="5" type="number" />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Match Threshold (%)</label>
                                <input className={styles.formInput} defaultValue="80" type="number" />
                            </div>
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Required Skills</label>
                            <input className={styles.formInput} defaultValue="React, TypeScript, Node.js" type="text" />
                        </div>
                    </div>

                    <div
                        className={`${styles.uploadZone} ${dragOver ? styles.uploadZoneDrag : ""}`}
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={(e) => { e.preventDefault(); setDragOver(false); }}
                    >
                        <input type="file" accept=".pdf,.doc,.docx,.txt" style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }} />
                        <div style={{ fontSize: 44, marginBottom: 14 }}>📄</div>
                        <div className={styles.uploadTitle}>Drop a resume here or click to browse</div>
                        <div className={styles.uploadSub}>Simulates real AI parsing — try any PDF or DOCX</div>
                        <div className={styles.uploadTypes}>
                            <span className={styles.utype}>PDF</span>
                            <span className={styles.utype}>DOCX</span>
                            <span className={styles.utype}>TXT</span>
                        </div>
                    </div>

                    <div style={{ marginTop: 16, textAlign: "center" }}>
                        <div style={{ fontSize: 12, color: "var(--text-lite)", marginBottom: 12 }}>— or demo with a sample candidate —</div>
                        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                            {DEMO_CANDIDATES.map((c) => (
                                <button key={c.key} className={styles.btnGhostSm} onClick={() => runDemo(c.key)}>
                                    {c.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right */}
                <div>
                    {(running || doneSteps >= 0) && (
                        <div className={styles.analysisBox}>
                            <div className={styles.analysisHeader}>
                                <div className={`${styles.analysisSpinner} ${!running ? styles.analysisSpinnerDone : ""}`} />
                                <div>
                                    <div className={styles.analysisTitle}>{running ? "Analysing resume..." : "Analysis complete!"}</div>
                                </div>
                                <div className={styles.analysisStatus}>{Math.min(doneSteps + 1, STEPS.length)} / {STEPS.length}</div>
                            </div>
                            <div className={styles.analysisSteps}>
                                {STEPS.map((step, i) => (
                                    <div key={step.id} className={styles.aStep}>
                                        <div className={`${styles.aStepIcon} ${i <= doneSteps ? styles.aStepDone : i === doneSteps + 1 && running ? styles.aStepRunning : ""}`}>
                                            {step.icon}
                                        </div>
                                        <div className={`${styles.aStepName} ${i <= doneSteps ? styles.aStepNameDone : i === doneSteps + 1 && running ? styles.aStepNameRunning : ""}`}>
                                            {step.label}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {result && (
                        <div className={styles.resultCard}>
                            <div className={styles.resultHeader}>
                                <div className={styles.resultScoreCircle}>
                                    <svg width="90" height="90" viewBox="0 0 80 80">
                                        <defs>
                                            <linearGradient id="sg"><stop offset="0%" stopColor="#6c47ff" /><stop offset="100%" stopColor="#ff6bc6" /></linearGradient>
                                        </defs>
                                        <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(108,71,255,.12)" strokeWidth="8" />
                                        <circle cx="40" cy="40" r="32" fill="none" stroke="url(#sg)" strokeWidth="8" strokeLinecap="round"
                                            strokeDasharray="201" strokeDashoffset={201 - (201 * result.score) / 100}
                                            style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }} />
                                        <text x="40" y="43" textAnchor="middle" fill="var(--text)" fontFamily="Fraunces,serif" fontSize="20" fontWeight="900">{result.score}%</text>
                                        <text x="40" y="54" textAnchor="middle" fill="var(--text-mid)" fontSize="9" fontFamily="Sora,sans-serif">match</text>
                                    </svg>
                                </div>
                                <div>
                                    <div className={styles.resultName}>{result.name}</div>
                                    <div className={styles.resultRole}>{result.role}</div>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                                        {result.skills.map((s) => (
                                            <span key={s} className={styles.skillPill}>{s}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className={styles.resultGrid}>
                                <div className={styles.resultMetric}><div className={styles.rmVal}>{result.exp}</div><div className={styles.rmLbl}>Years Exp.</div></div>
                                <div className={styles.resultMetric}><div className={styles.rmVal}>{result.seniority}</div><div className={styles.rmLbl}>Level</div></div>
                                <div className={styles.resultMetric}><div className={styles.rmVal}>{result.prob}</div><div className={styles.rmLbl}>Hire Prob.</div></div>
                            </div>
                            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                                <button className={styles.scheduleBtn}>✅ Shortlist</button>
                                <button className={styles.btnGhostSm}>📅 Schedule Interview</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
