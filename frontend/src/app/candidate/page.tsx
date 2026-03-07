"use client";
import { useQuery } from "@tanstack/react-query";
import { authService } from "@/services/auth.service";
import { interviewService } from "@/services/interview.service";
import styles from "./candidate.module.css";

function formatDateTime(iso: string) {
    return new Date(iso).toLocaleString("en-US", {
        weekday: "short", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
}

function ivStatusClass(status: string): string {
    if (status === "SCHEDULED") return "st-sched";
    if (status === "COMPLETED") return "st-short";
    return "st-review";
}

export default function CandidateDashboard() {
    const { data: me } = useQuery({ queryKey: ["me"], queryFn: authService.me });

    const { data: interviews = [], isLoading } = useQuery({
        queryKey: ["my-interviews"],
        queryFn: () => interviewService.getAll(),
        enabled: !!me,
    });

    const upcoming = interviews.filter((i) => i.status === "SCHEDULED");
    const completed = interviews.filter((i) => i.status === "COMPLETED");
    const nextInterview = upcoming[0] ?? null;

    const meUser = me as unknown as {
        candidate?: {
            resumeUrl?: string;
            aiProfile?: { matchScore: number; hireProbability: number; experienceYears: number; seniorityLevel: string; extractedSkills: string[] };
        };
    };

    const candidate = meUser?.candidate;
    const ai = candidate?.aiProfile;

    return (
        <div>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.pageTitle}>My Dashboard</h1>
                    <p className={styles.pageSub}>Track your applications and upcoming interviews</p>
                </div>
            </div>

            <div className={styles.statsRow}>
                {[
                    { icon: "📋", val: interviews.length.toString(), label: "Total Interviews" },
                    { icon: "📅", val: upcoming.length.toString(), label: "Upcoming" },
                    { icon: "✅", val: completed.length.toString(), label: "Completed" },
                    { icon: "🧠", val: ai ? ai.seniorityLevel : "—", label: "Experience Level" },
                ].map((s) => (
                    <div className="kpi" key={s.label}>
                        <div className="kpi-icon">{s.icon}</div>
                        <div className="kpi-val">{s.val}</div>
                        <div className="kpi-lbl">{s.label}</div>
                    </div>
                ))}
            </div>

            <div className={styles.grid2}>
                {/* Resume & AI Profile */}
                <div className={styles.card}>
                    <div className={styles.cardHead}>
                        <span>My Resume</span>
                        {candidate?.resumeUrl ? <span className="ctag teal">Uploaded</span> : <span className="ctag">Not uploaded</span>}
                    </div>

                    {candidate?.resumeUrl ? (
                        <div className={styles.resumeBox}>
                            <div className={styles.resumeIcon}>📄</div>
                            <div className={styles.resumeInfo}>
                                <div className={styles.resumeName}>{candidate.resumeUrl}</div>
                                <div className={styles.resumeMeta}>{ai ? "AI analyzed ✓" : "Pending analysis"}</div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ textAlign: "center", padding: "20px 0" }}>
                            <a href="/candidate/resume" className="btn-pri" style={{ padding: "10px 24px", fontSize: 13, textDecoration: "none", borderRadius: 10 }}>
                                Upload Resume →
                            </a>
                        </div>
                    )}

                    {ai && (
                        <div className={styles.aiSummary}>
                            <h3 className={styles.aiTitle}>🧠 AI Profile Summary</h3>
                            <div className={styles.aiGrid}>
                                <div className={styles.aiItem}>
                                    <div className={styles.aiLbl}>Experience</div>
                                    <div className={styles.aiVal}>{ai.experienceYears} years</div>
                                </div>
                                <div className={styles.aiItem}>
                                    <div className={styles.aiLbl}>Seniority</div>
                                    <div className={styles.aiVal}>{ai.seniorityLevel}</div>
                                </div>
                            </div>
                            <div className={styles.aiSkills}>
                                {ai.extractedSkills.map((s) => (
                                    <span className="skill-pill" key={s}>{s}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column */}
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    {nextInterview && (
                        <div className={styles.card}>
                            <div className={styles.cardHead}>
                                <span>Next Interview</span>
                                <span className="ctag">Upcoming</span>
                            </div>
                            <div className={styles.nextIv}>
                                <div className={styles.nextIvRole}>Interview with {nextInterview.interviewer.name}</div>
                                <div className={styles.nextIvMeta}>
                                    {Math.round((new Date(nextInterview.endTime).getTime() - new Date(nextInterview.startTime).getTime()) / 60000)} min session
                                </div>
                                <div className={styles.nextIvTime}>🕐 {formatDateTime(nextInterview.startTime)}</div>
                                {nextInterview.meetLink && (
                                    <a href={nextInterview.meetLink} target="_blank" rel="noreferrer" className="btn-pri"
                                        style={{ marginTop: 16, padding: "10px 24px", fontSize: 13, display: "inline-block", textDecoration: "none", borderRadius: 10 }}>
                                        Join Meeting →
                                    </a>
                                )}
                            </div>
                        </div>
                    )}

                    {isLoading ? (
                        <p style={{ color: "var(--text-lite)", fontSize: 14 }}>Loading...</p>
                    ) : (
                        <div className={styles.card}>
                            <div className={styles.cardHead}>
                                <span>My Interviews</span>
                                <span className="ctag pink">{interviews.length}</span>
                            </div>
                            {interviews.length === 0 ? (
                                <p style={{ color: "var(--text-lite)", fontSize: 14 }}>No interviews yet. Make sure you have a resume uploaded and availability set.</p>
                            ) : (
                                <div className={styles.appList}>
                                    {interviews.map((iv) => (
                                        <div className={styles.appRow} key={iv.id}>
                                            <div>
                                                <div className={styles.appRole}>Interview with {iv.interviewer.name}</div>
                                                <div className={styles.appCompany}>{formatDateTime(iv.startTime)}</div>
                                            </div>
                                            <div className={styles.appRight}>
                                                <span className={`status-chip ${ivStatusClass(iv.status)}`}>
                                                    <span className="st-dot" />{iv.status.charAt(0) + iv.status.slice(1).toLowerCase()}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
