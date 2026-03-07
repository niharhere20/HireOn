"use client";
import { useQuery } from "@tanstack/react-query";
import { authService } from "@/services/auth.service";
import styles from "../candidate.module.css";

const TOPIC_QUESTIONS: Record<string, { questions: string[]; icon: string }> = {
    "Data Structures": {
        icon: "🌲",
        questions: [
            "Explain the difference between Array and LinkedList and their time complexities.",
            "When would you use a HashMap vs a TreeMap?",
            "How does a binary search tree differ from a heap?",
            "Describe BFS vs DFS and their real-world applications.",
            "What is the difference between a stack and a queue?",
        ],
    },
    "System Design": {
        icon: "🏗️",
        questions: [
            "How would you design a URL shortener like bit.ly?",
            "Walk me through designing a scalable notification service.",
            "How do you handle database sharding in a high-traffic system?",
            "Explain the CAP theorem and its trade-offs.",
            "Design a rate limiter for an API gateway.",
        ],
    },
    "Behavioral": {
        icon: "🤝",
        questions: [
            "Tell me about a time you handled a disagreement with a team member.",
            "Describe a challenging project and how you overcame obstacles.",
            "How do you prioritize tasks when multiple deadlines conflict?",
            "Give an example of a time you took ownership of a failing project.",
            "How do you stay updated with new technologies?",
        ],
    },
    "Algorithms": {
        icon: "⚙️",
        questions: [
            "Explain dynamic programming with an example.",
            "How does quicksort work and what is its average complexity?",
            "What are greedy algorithms? Give an example problem.",
            "Describe the sliding window technique and when to use it.",
            "Walk through Dijkstra's algorithm step by step.",
        ],
    },
    "JavaScript / React": {
        icon: "⚛️",
        questions: [
            "Explain the event loop and how it handles asynchronous code.",
            "What is the difference between `useEffect` and `useLayoutEffect`?",
            "How does React reconciliation work?",
            "Explain closures and give a practical example.",
            "What are React hooks rules and why do they exist?",
        ],
    },
    "Databases": {
        icon: "🗄️",
        questions: [
            "Explain ACID properties in relational databases.",
            "What is an index and how does it improve query performance?",
            "Describe the differences between SQL and NoSQL databases.",
            "What is database normalization? Explain 1NF, 2NF, 3NF.",
            "How do you handle N+1 query problems in ORM?",
        ],
    },
};

export default function PrepPage() {
    const { data: me } = useQuery({ queryKey: ["me"], queryFn: authService.me });

    const meUser = me as unknown as {
        candidate?: {
            resumeUrl?: string;
            aiProfile?: {
                extractedSkills: string[];
                seniorityLevel: string;
                experienceYears: number;
                strengths: string;
                weaknesses: string;
            };
        };
    };

    const ai = meUser?.candidate?.aiProfile;
    const extractedSkills = (ai?.extractedSkills ?? []) as string[];

    // Readiness = profile completeness (has resume + AI profile = 100%, resume only = 50%, nothing = 0%)
    const readiness = ai ? 100 : meUser?.candidate?.resumeUrl ? 50 : 0;

    // Map skills to relevant topics
    const topicKeys = Object.keys(TOPIC_QUESTIONS);

    return (
        <div>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.pageTitle}>Interview Prep Kit</h1>
                    <p className={styles.pageSub}>AI-curated questions and readiness score for your upcoming interview</p>
                </div>
            </div>

            {/* Readiness Score */}
            <div className={styles.card} style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
                    {/* Circle */}
                    <div style={{ position: "relative", flexShrink: 0 }}>
                        <svg width={100} height={100}>
                            <defs>
                                <linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#6c47ff" />
                                    <stop offset="100%" stopColor="#ff6bc6" />
                                </linearGradient>
                            </defs>
                            <circle cx={50} cy={50} r={40} fill="none" stroke="rgba(108,71,255,0.1)" strokeWidth={8} />
                            <circle
                                cx={50} cy={50} r={40} fill="none"
                                stroke="url(#rg)" strokeWidth={8}
                                strokeLinecap="round"
                                strokeDasharray={251.2}
                                strokeDashoffset={251.2 - (251.2 * readiness) / 100}
                                transform="rotate(-90 50 50)"
                                style={{ transition: "stroke-dashoffset 1.2s ease" }}
                            />
                            <text x={50} y={46} textAnchor="middle" fontSize={18} fontWeight={900} fill="var(--text)" fontFamily="serif">
                                {readiness}%
                            </text>
                            <text x={50} y={60} textAnchor="middle" fontSize={9} fill="var(--text-mid)" fontFamily="sans-serif">
                                Profile
                            </text>
                        </svg>
                    </div>

                    <div style={{ flex: 1 }}>
                        {ai ? (
                            <>
                                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
                                    Profile complete — review your strengths and practice the topics below
                                </div>
                                <div style={{ display: "flex", gap: 20, fontSize: 13, color: "var(--text-mid)", marginBottom: 12 }}>
                                    <span>Level: <strong style={{ color: "var(--text)" }}>{ai.seniorityLevel}</strong></span>
                                    <span>Experience: <strong style={{ color: "var(--text)" }}>{ai.experienceYears}y</strong></span>
                                </div>
                                <div style={{ fontSize: 13, marginBottom: 8 }}>
                                    <strong style={{ color: "#10b981" }}>Strengths:</strong>{" "}
                                    <span style={{ color: "var(--text-mid)" }}>{ai.strengths}</span>
                                </div>
                                <div style={{ fontSize: 13 }}>
                                    <strong style={{ color: "#ef4444" }}>Areas to improve:</strong>{" "}
                                    <span style={{ color: "var(--text-mid)" }}>{ai.weaknesses}</span>
                                </div>
                            </>
                        ) : (
                            <div>
                                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Upload & analyze your resume</div>
                                <div style={{ fontSize: 13, color: "var(--text-mid)" }}>
                                    Get a personalized readiness score and tailored prep questions after AI analyzes your resume.
                                </div>
                                <a href="/candidate/resume" className="btn-pri"
                                    style={{ marginTop: 14, padding: "9px 20px", fontSize: 13, display: "inline-block", textDecoration: "none", borderRadius: 10 }}>
                                    Upload Resume →
                                </a>
                            </div>
                        )}
                    </div>

                    {/* Skills */}
                    {extractedSkills.length > 0 && (
                        <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-lite)", marginBottom: 8, letterSpacing: "0.5px" }}>
                                YOUR SKILLS
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                {extractedSkills.map((s) => (
                                    <span key={s} className="skill-pill">{s}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Practice Questions */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
                {topicKeys.map((topic) => (
                    <TopicCard key={topic} topic={topic} data={TOPIC_QUESTIONS[topic]} />
                ))}
            </div>
        </div>
    );
}

function TopicCard({ topic, data }: { topic: string; data: { questions: string[]; icon: string } }) {
    return (
        <div className={styles.card}>
            <div className={styles.cardHead}>
                <span>{data.icon} {topic}</span>
                <span className="ctag">{data.questions.length} Q&apos;s</span>
            </div>
            <ol style={{ margin: 0, padding: "0 0 0 18px", display: "flex", flexDirection: "column", gap: 10 }}>
                {data.questions.map((q, i) => (
                    <li key={i} style={{ fontSize: 13, color: "var(--text-mid)", lineHeight: 1.5 }}>
                        {q}
                    </li>
                ))}
            </ol>
        </div>
    );
}
