"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { interviewService, Interview } from "@/services/interview.service";
import styles from "../interviewer.module.css";

const COMPETENCY_QUESTIONS: Record<string, string[]> = {
    "Technical Depth": [
        "Walk me through your most complex technical challenge and how you solved it.",
        "Explain the architecture of a system you designed from scratch.",
        "How do you approach debugging a production issue under pressure?",
        "What's your experience with distributed systems and handling failures?",
    ],
    "Problem Solving": [
        "Given an array of integers, find the two numbers that sum to a target value. What's the optimal approach?",
        "How would you design an LRU cache? Describe the data structures.",
        "Walk through how you'd optimize a slow database query.",
        "How do you break down an ambiguous problem into actionable steps?",
    ],
    "Communication": [
        "Explain a complex technical concept to a non-technical stakeholder.",
        "Tell me about a time you had to influence a decision without authority.",
        "How do you handle disagreements within your team about technical choices?",
        "Describe how you document your code and share knowledge.",
    ],
    "Culture Fit": [
        "What type of team environment brings out your best work?",
        "Describe a time you went above and beyond your job description.",
        "How do you handle constructive criticism?",
        "What's a failure you've learned the most from?",
    ],
};

const CHECKLIST_ITEMS = [
    "Review candidate's resume and AI profile",
    "Check assigned tech requirement and required skills",
    "Prepare 2-3 role-specific technical questions",
    "Set up screen share / coding environment",
    "Review candidate's previous interview notes (if any)",
    "Join meeting link 5 minutes early",
    "Have feedback form ready to fill post-interview",
];

export default function PrepKitPage() {
    const [checkState, setCheckState] = useState<Record<number, boolean>>({});
    const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);

    const { data: interviews = [] } = useQuery({
        queryKey: ["interviews"],
        queryFn: () => interviewService.getAll(),
    });

    const upcoming = interviews.filter((i) => i.status === "SCHEDULED");
    const toggle = (idx: number) => setCheckState((s) => ({ ...s, [idx]: !s[idx] }));
    const checkedCount = Object.values(checkState).filter(Boolean).length;

    const selectedAI = selectedInterview?.candidate?.aiProfile;

    return (
        <div>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.pageTitle}>Prep Kit</h1>
                    <p className={styles.pageSub}>AI-generated questions and pre-interview checklist</p>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                {/* Left: Pre-interview Checklist */}
                <div>
                    <div className={styles.card}>
                        <div className={styles.cardHead}>
                            <span>Pre-interview Checklist</span>
                            <span className="ctag">{checkedCount}/{CHECKLIST_ITEMS.length}</span>
                        </div>

                        {/* Progress bar */}
                        <div style={{
                            height: 6, background: "rgba(108,71,255,0.1)",
                            borderRadius: 3, marginBottom: 16, overflow: "hidden",
                        }}>
                            <div style={{
                                height: "100%", borderRadius: 3,
                                background: "linear-gradient(90deg,#6c47ff,#ff6bc6)",
                                width: `${(checkedCount / CHECKLIST_ITEMS.length) * 100}%`,
                                transition: "width 0.4s ease",
                            }} />
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {CHECKLIST_ITEMS.map((item, i) => (
                                <label
                                    key={i}
                                    style={{
                                        display: "flex", alignItems: "center", gap: 12,
                                        padding: "10px 12px", borderRadius: 10, cursor: "pointer",
                                        background: checkState[i] ? "rgba(16,185,129,0.06)" : "rgba(108,71,255,0.03)",
                                        border: `1px solid ${checkState[i] ? "rgba(16,185,129,0.2)" : "var(--table-border)"}`,
                                        transition: "all 0.2s",
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={!!checkState[i]}
                                        onChange={() => toggle(i)}
                                        style={{ width: 16, height: 16, accentColor: "#6c47ff", cursor: "pointer" }}
                                    />
                                    <span style={{
                                        fontSize: 13,
                                        color: checkState[i] ? "var(--text-lite)" : "var(--text)",
                                        textDecoration: checkState[i] ? "line-through" : "none",
                                        transition: "all 0.2s",
                                    }}>
                                        {item}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Upcoming interviews */}
                    <div className={styles.card} style={{ marginTop: 16 }}>
                        <div className={styles.cardHead}>
                            <span>Upcoming Interviews</span>
                            <span className="ctag">{upcoming.length}</span>
                        </div>
                        {upcoming.length === 0 ? (
                            <p style={{ fontSize: 13, color: "var(--text-lite)" }}>No upcoming interviews.</p>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                {upcoming.map((iv) => (
                                    <button
                                        key={iv.id}
                                        onClick={() => setSelectedInterview(iv.id === selectedInterview?.id ? null : iv)}
                                        style={{
                                            width: "100%", textAlign: "left", padding: "10px 14px",
                                            borderRadius: 10, cursor: "pointer",
                                            border: `1px solid ${selectedInterview?.id === iv.id ? "#6c47ff" : "var(--table-border)"}`,
                                            background: selectedInterview?.id === iv.id ? "rgba(108,71,255,0.07)" : "transparent",
                                            transition: "all 0.2s",
                                        }}
                                    >
                                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
                                            {iv.candidate.user.name}
                                        </div>
                                        <div style={{ fontSize: 11, color: "var(--text-lite)", marginTop: 2 }}>
                                            {new Date(iv.startTime).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Question Bank */}
                <div>
                    {selectedInterview && selectedAI && (
                        <div className={styles.card} style={{ marginBottom: 16 }}>
                            <div className={styles.cardHead}>
                                <span>Candidate Brief</span>
                                <span className="ctag pink">AI Summary</span>
                            </div>
                            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
                                        {selectedInterview.candidate.user.name}
                                    </div>
                                    <div style={{ fontSize: 12, color: "var(--text-lite)", marginBottom: 12 }}>
                                        {selectedInterview.candidate.user.email}
                                    </div>
                                    <div style={{ display: "flex", gap: 16 }}>
                                        <div>
                                            <div style={{ fontSize: 11, color: "var(--text-lite)" }}>Match Score</div>
                                            <div style={{ fontSize: 20, fontWeight: 800, color: selectedAI.matchScore >= 80 ? "#10b981" : "#6c47ff" }}>
                                                {selectedAI.matchScore}%
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 11, color: "var(--text-lite)" }}>Hire Prob</div>
                                            <div style={{ fontSize: 20, fontWeight: 800, color: "var(--violet)" }}>
                                                {selectedAI.hireProbability}%
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className={styles.card}>
                        <div className={styles.cardHead}>
                            <span>Question Bank</span>
                            <span className="ctag">4 categories</span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            {Object.entries(COMPETENCY_QUESTIONS).map(([category, questions]) => (
                                <QuestionCategory key={category} category={category} questions={questions} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function QuestionCategory({ category, questions }: { category: string; questions: string[] }) {
    const [open, setOpen] = useState(false);
    return (
        <div style={{ border: "1px solid var(--table-border)", borderRadius: 10, overflow: "hidden" }}>
            <button
                onClick={() => setOpen(!open)}
                style={{
                    width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "12px 14px", background: "rgba(108,71,255,0.04)",
                    border: "none", cursor: "pointer", textAlign: "left",
                }}
            >
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{category}</span>
                <span style={{ fontSize: 12, transform: open ? "rotate(180deg)" : "none", transition: "0.2s", color: "var(--text-mid)" }}>▼</span>
            </button>
            {open && (
                <div style={{ padding: "8px 14px 14px" }}>
                    <ol style={{ margin: 0, padding: "0 0 0 16px", display: "flex", flexDirection: "column", gap: 8 }}>
                        {questions.map((q, i) => (
                            <li key={i} style={{ fontSize: 13, color: "var(--text-mid)", lineHeight: 1.5 }}>{q}</li>
                        ))}
                    </ol>
                </div>
            )}
        </div>
    );
}
