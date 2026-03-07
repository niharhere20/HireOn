"use client";
import { useQuery } from "@tanstack/react-query";
import { interviewService, Interview } from "@/services/interview.service";
import styles from "./interviewer.module.css";

function formatDateTime(iso: string) {
    return new Date(iso).toLocaleString("en-US", {
        weekday: "short", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
}

export default function InterviewerDashboard() {
    const { data: interviews = [], isLoading } = useQuery({
        queryKey: ["interviews"],
        queryFn: () => interviewService.getAll(),
    });

    const upcoming = interviews.filter((i) => i.status === "SCHEDULED");
    const pendingFeedback = interviews.filter((i) => i.status === "COMPLETED" && !i.feedback);
    const completed = interviews.filter((i) => i.status === "COMPLETED");

    return (
        <div>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.pageTitle}>My Schedule</h1>
                    <p className={styles.pageSub}>Your upcoming interviews and feedback queue</p>
                </div>
            </div>

            <div className={styles.statsRow}>
                {[
                    { icon: "📅", val: upcoming.length.toString(), label: "Upcoming" },
                    { icon: "✅", val: completed.length.toString(), label: "Completed" },
                    { icon: "💬", val: pendingFeedback.length.toString(), label: "Feedback Pending" },
                ].map((s) => (
                    <div className="kpi" key={s.label}>
                        <div className="kpi-icon">{s.icon}</div>
                        <div className="kpi-val">{s.val}</div>
                        <div className="kpi-lbl">{s.label}</div>
                    </div>
                ))}
            </div>

            {isLoading ? (
                <p style={{ color: "var(--text-lite)", fontSize: 14 }}>Loading interviews...</p>
            ) : (
                <>
                    <div className={styles.card}>
                        <div className={styles.cardHead}>
                            <span>Upcoming Interviews</span>
                            <span className="ctag">{upcoming.length} scheduled</span>
                        </div>
                        {upcoming.length === 0 ? (
                            <p style={{ color: "var(--text-lite)", fontSize: 14 }}>No upcoming interviews.</p>
                        ) : (
                            <div className={styles.interviewList}>
                                {upcoming.map((iv: Interview) => {
                                    const duration = Math.round((new Date(iv.endTime).getTime() - new Date(iv.startTime).getTime()) / 60000);
                                    return (
                                        <div className={styles.ivCard} key={iv.id}>
                                            <div className={styles.ivLeft}>
                                                <div className={styles.ivAv} style={{ background: "linear-gradient(135deg,#ddd6fe,#a78bfa)" }}>
                                                    {iv.candidate.user.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className={styles.ivName}>{iv.candidate.user.name}</div>
                                                    <div className={styles.ivRole}>{iv.candidate.user.email}</div>
                                                </div>
                                            </div>
                                            <div className={styles.ivMid}>
                                                <div className={styles.ivTime}>🕐 {formatDateTime(iv.startTime)}</div>
                                                <div className={styles.ivDur}>{duration} min</div>
                                            </div>
                                            <div className={styles.ivActions}>
                                                {iv.meetLink ? (
                                                    <a href={iv.meetLink} target="_blank" rel="noreferrer" className="action-btn ab-pri" style={{ textDecoration: "none" }}>
                                                        Join Meeting
                                                    </a>
                                                ) : (
                                                    <span className="action-btn ab-sec" style={{ opacity: 0.5 }}>No Link Yet</span>
                                                )}
                                                <a href="/interviewer/interviews" className="action-btn ab-sec" style={{ textDecoration: "none" }}>View Profile</a>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {pendingFeedback.length > 0 && (
                        <div className={styles.card} style={{ marginTop: 20 }}>
                            <div className={styles.cardHead}>
                                <span>Feedback Queue</span>
                                <span className="ctag pink">Action Required</span>
                            </div>
                            <div className={styles.interviewList}>
                                {pendingFeedback.map((iv: Interview) => (
                                    <div className={styles.ivCard} key={iv.id}>
                                        <div className={styles.ivLeft}>
                                            <div className={styles.ivAv} style={{ background: "linear-gradient(135deg,#fce7f3,#f9a8d4)" }}>
                                                {iv.candidate.user.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className={styles.ivName}>{iv.candidate.user.name}</div>
                                                <div className={styles.ivRole}>{formatDateTime(iv.startTime)}</div>
                                            </div>
                                        </div>
                                        <div className={styles.ivMid}>
                                            {iv.candidate.aiProfile && (
                                                <span className={`${styles.scoreNum} sc-md`}>
                                                    AI: {iv.candidate.aiProfile.matchScore}%
                                                </span>
                                            )}
                                        </div>
                                        <div className={styles.ivActions}>
                                            <a href="/interviewer/interviews" className="action-btn ab-pri" style={{ textDecoration: "none" }}>
                                                Submit Feedback
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
