"use client";
import { useQuery } from "@tanstack/react-query";
import { interviewService, Interview } from "@/services/interview.service";
import styles from "../hr.module.css";

function formatDateTime(iso: string) {
    return new Date(iso).toLocaleString("en-US", {
        weekday: "short", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
}

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
    SCHEDULED: { label: "Scheduled", cls: "st-sched" },
    COMPLETED: { label: "Completed", cls: "st-short" },
    CANCELLED: { label: "Cancelled", cls: "st-review" },
};

export default function SchedulePage() {
    const { data: interviews = [], isLoading } = useQuery({
        queryKey: ["interviews"],
        queryFn: () => interviewService.getAll(),
    });

    const upcoming = interviews.filter((i) => i.status === "SCHEDULED");
    const past = interviews.filter((i) => i.status !== "SCHEDULED");

    return (
        <div>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.pageTitle}>Schedule</h1>
                    <p className={styles.pageSub}>All interviews — upcoming and completed</p>
                </div>
            </div>

            {isLoading ? (
                <p style={{ color: "var(--text-lite)", fontSize: 14 }}>Loading interviews...</p>
            ) : (
                <>
                    {/* Upcoming */}
                    <div className={styles.card} style={{ marginBottom: 20 }}>
                        <div className={styles.cardHead}>
                            <span>Upcoming Interviews</span>
                            <span className="ctag">{upcoming.length} scheduled</span>
                        </div>
                        {upcoming.length === 0 ? (
                            <p style={{ color: "var(--text-lite)", fontSize: 14 }}>No upcoming interviews.</p>
                        ) : (
                            <div className={styles.tableWrap}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Candidate</th>
                                        <th>Interviewer</th>
                                        <th>Date & Time</th>
                                        <th>Duration</th>
                                        <th>Meet Link</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {upcoming.map((iv: Interview) => {
                                        const duration = Math.round((new Date(iv.endTime).getTime() - new Date(iv.startTime).getTime()) / 60000);
                                        return (
                                            <tr key={iv.id}>
                                                <td>
                                                    <div className={styles.cName}>{iv.candidate.user.name}</div>
                                                    <div className={styles.cExp}>{iv.candidate.user.email}</div>
                                                </td>
                                                <td>{iv.interviewer.name}</td>
                                                <td>{formatDateTime(iv.startTime)}</td>
                                                <td>{duration} min</td>
                                                <td>
                                                    {iv.meetLink ? (
                                                        <a href={iv.meetLink} target="_blank" rel="noreferrer"
                                                            style={{ color: "var(--violet)", fontSize: 13, fontWeight: 600 }}>
                                                            Join →
                                                        </a>
                                                    ) : (
                                                        <span style={{ color: "var(--text-lite)", fontSize: 13 }}>—</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <span className={`status-chip ${STATUS_MAP[iv.status].cls}`}>
                                                        <span className="st-dot" />{STATUS_MAP[iv.status].label}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            </div>
                        )}
                    </div>

                    {/* Past */}
                    {past.length > 0 && (
                        <div className={styles.card}>
                            <div className={styles.cardHead}>
                                <span>Past Interviews</span>
                                <span className="ctag pink">{past.length} completed</span>
                            </div>
                            <div className={styles.tableWrap}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Candidate</th>
                                        <th>Interviewer</th>
                                        <th>Date & Time</th>
                                        <th>AI Score</th>
                                        <th>Feedback</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {past.map((iv: Interview) => (
                                        <tr key={iv.id}>
                                            <td>
                                                <div className={styles.cName}>{iv.candidate.user.name}</div>
                                            </td>
                                            <td>{iv.interviewer.name}</td>
                                            <td>{formatDateTime(iv.startTime)}</td>
                                            <td>
                                                {iv.candidate.aiProfile ? (
                                                    <span className={`${styles.scoreNum} ${iv.candidate.aiProfile.matchScore >= 80 ? "sc-hi" : "sc-md"}`}>
                                                        {iv.candidate.aiProfile.matchScore}%
                                                    </span>
                                                ) : "—"}
                                            </td>
                                            <td>
                                                <span style={{ fontSize: 13, color: iv.feedback ? "var(--text)" : "var(--text-lite)" }}>
                                                    {iv.feedback ? "Submitted" : "Pending"}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`status-chip ${STATUS_MAP[iv.status].cls}`}>
                                                    <span className="st-dot" />{STATUS_MAP[iv.status].label}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
