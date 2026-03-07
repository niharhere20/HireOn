"use client";
import { useQuery } from "@tanstack/react-query";
import { interviewService } from "@/services/interview.service";
import { authService } from "@/services/auth.service";
import styles from "../candidate.module.css";

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
    APPLIED: { label: "Applied", cls: "st-new" },
    SHORTLISTED: { label: "Shortlisted", cls: "st-short" },
    SCHEDULED: { label: "Scheduled", cls: "st-sched" },
    INTERVIEWED: { label: "Interviewed", cls: "st-sched" },
    HIRED: { label: "Hired", cls: "st-short" },
    REJECTED: { label: "Rejected", cls: "st-review" },
};

function formatDateTime(iso: string) {
    return new Date(iso).toLocaleString("en-US", {
        weekday: "short", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
}

export default function ApplicationsPage() {
    const { data: me } = useQuery({ queryKey: ["me"], queryFn: authService.me });

    const { data: interviews = [], isLoading } = useQuery({
        queryKey: ["my-interviews"],
        queryFn: () => interviewService.getAll(),
        enabled: !!me,
    });

    return (
        <div>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.pageTitle}>My Applications</h1>
                    <p className={styles.pageSub}>Track your application status and interview history</p>
                </div>
            </div>

            {isLoading ? (
                <p style={{ color: "var(--text-lite)", fontSize: 14 }}>Loading...</p>
            ) : interviews.length === 0 ? (
                <div className={styles.card} style={{ textAlign: "center", padding: 48 }}>
                    <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
                    <p style={{ color: "var(--text-mid)", fontSize: 14 }}>No interviews scheduled yet. Stay tuned!</p>
                </div>
            ) : (
                <div className={styles.card}>
                    <div className={styles.cardHead}>
                        <span>Interview History</span>
                        <span className="ctag pink">{interviews.length} total</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        {interviews.map((iv) => {
                            const ivStatus = iv.status === "SCHEDULED" ? "SCHEDULED" : iv.status === "COMPLETED" ? "INTERVIEWED" : "APPLIED";
                            const st = STATUS_MAP[ivStatus] ?? STATUS_MAP["APPLIED"];
                            const duration = Math.round((new Date(iv.endTime).getTime() - new Date(iv.startTime).getTime()) / 60000);
                            return (
                                <div key={iv.id} style={{ border: "1px solid rgba(108,71,255,.08)", borderRadius: 14, padding: "20px 24px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: 15 }}>
                                                Interview with {iv.interviewer.name}
                                            </div>
                                            <div style={{ fontSize: 13, color: "var(--text-mid)", marginTop: 2 }}>
                                                🕐 {formatDateTime(iv.startTime)} · {duration} min
                                            </div>
                                        </div>
                                        <span className={`status-chip ${st.cls}`}>
                                            <span className="st-dot" />{st.label}
                                        </span>
                                    </div>
                                    {iv.meetLink && iv.status === "SCHEDULED" && (
                                        <a
                                            href={iv.meetLink}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="btn-pri"
                                            style={{ display: "inline-block", padding: "8px 20px", fontSize: 13, textDecoration: "none", borderRadius: 10, marginTop: 4 }}
                                        >
                                            Join Meeting →
                                        </a>
                                    )}
                                    {iv.status === "COMPLETED" && iv.aiSummary && (
                                        <div style={{ background: "rgba(108,71,255,.05)", borderRadius: 10, padding: "12px 14px", marginTop: 8 }}>
                                            <div style={{ fontSize: 12, color: "var(--text-lite)", marginBottom: 4 }}>🧠 AI Feedback Summary</div>
                                            <p style={{ fontSize: 13, color: "var(--text-mid)" }}>{iv.aiSummary}</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
