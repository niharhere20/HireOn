"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { interviewService, Interview } from "@/services/interview.service";
import styles from "../interviewer.module.css";

function formatDateTime(iso: string) {
    return new Date(iso).toLocaleString("en-US", {
        weekday: "short", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
}

export default function InterviewsPage() {
    const qc = useQueryClient();
    const [feedbackId, setFeedbackId] = useState<string | null>(null);
    const [feedbackText, setFeedbackText] = useState("");

    const { data: interviews = [], isLoading } = useQuery({
        queryKey: ["interviews"],
        queryFn: () => interviewService.getAll({ status: "COMPLETED" }),
    });

    const feedbackMutation = useMutation({
        mutationFn: ({ id, feedback }: { id: string; feedback: string }) =>
            interviewService.submitFeedback(id, feedback),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["interviews"] });
            setFeedbackId(null);
            setFeedbackText("");
        },
    });

    const pendingFeedback = interviews.filter((i) => i.status === "COMPLETED" && !i.feedback);
    const submitted = interviews.filter((i) => i.feedback);

    return (
        <div>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.pageTitle}>Past Interviews</h1>
                    <p className={styles.pageSub}>Submit feedback and view AI summaries</p>
                </div>
            </div>

            {isLoading ? (
                <p style={{ color: "var(--text-lite)", fontSize: 14 }}>Loading...</p>
            ) : (
                <>
                    {/* Pending Feedback */}
                    {pendingFeedback.length > 0 && (
                        <div className={styles.card} style={{ marginBottom: 20 }}>
                            <div className={styles.cardHead}>
                                <span>Feedback Required</span>
                                <span className="ctag pink">{pendingFeedback.length} pending</span>
                            </div>
                            <div className={styles.interviewList}>
                                {pendingFeedback.map((iv: Interview) => (
                                    <div key={iv.id} className={styles.ivCard}>
                                        <div className={styles.ivLeft}>
                                            <div className={styles.ivAv} style={{ background: "linear-gradient(135deg,#ddd6fe,#a78bfa)" }}>
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
                                            <button className="action-btn ab-pri" onClick={() => setFeedbackId(iv.id)}>
                                                Submit Feedback
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Submitted Feedback */}
                    {submitted.length > 0 && (
                        <div className={styles.card}>
                            <div className={styles.cardHead}>
                                <span>Submitted Feedback</span>
                                <span className="ctag">{submitted.length}</span>
                            </div>
                            <div className={styles.interviewList}>
                                {submitted.map((iv: Interview) => (
                                    <div key={iv.id} style={{ padding: "16px", border: "1px solid rgba(108,71,255,.08)", borderRadius: 12, marginBottom: 12 }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: 14 }}>{iv.candidate.user.name}</div>
                                                <div style={{ fontSize: 12, color: "var(--text-lite)" }}>{formatDateTime(iv.startTime)}</div>
                                            </div>
                                            {iv.candidate.aiProfile && (
                                                <span className="sc-hi" style={{ padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                                                    {iv.candidate.aiProfile.matchScore}%
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ fontSize: 13, color: "var(--text-mid)", marginBottom: 8 }}>
                                            <strong>Your feedback:</strong> {iv.feedback}
                                        </div>
                                        {iv.aiSummary && (
                                            <div style={{ background: "rgba(108,71,255,.05)", padding: "10px 14px", borderRadius: 10, fontSize: 13 }}>
                                                <strong>🧠 AI Summary:</strong>
                                                <div style={{ marginTop: 6, color: "var(--text-mid)" }}>{iv.aiSummary}</div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {interviews.length === 0 && (
                        <div className={styles.card} style={{ textAlign: "center", padding: 48 }}>
                            <div style={{ fontSize: 32, marginBottom: 12 }}>💬</div>
                            <p style={{ color: "var(--text-mid)", fontSize: 14 }}>No completed interviews yet.</p>
                        </div>
                    )}
                </>
            )}

            {/* Feedback Modal */}
            {feedbackId && (
                <div style={{
                    position: "fixed", inset: 0, background: "rgba(0,0,0,.4)",
                    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
                }}>
                    <div style={{ background: "var(--modal-bg)", borderRadius: 16, padding: 32, width: "min(480px, calc(100vw - 32px))" }}>
                        <h3 style={{ fontWeight: 700, marginBottom: 16, color: "var(--text)" }}>Submit Interview Feedback</h3>
                        <p style={{ fontSize: 13, color: "var(--text-mid)", marginBottom: 16 }}>
                            Your feedback will be summarized by AI and shared with HR.
                        </p>
                        <textarea
                            rows={6}
                            value={feedbackText}
                            onChange={(e) => setFeedbackText(e.target.value)}
                            placeholder="Describe the candidate's technical skills, communication, problem-solving approach, and your hire/no-hire recommendation..."
                            style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid var(--input-border)", fontSize: 13, resize: "vertical", fontFamily: "inherit", background: "var(--input-bg)", color: "var(--text)", boxSizing: "border-box" }}
                        />
                        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
                            <button className="btn-gl" style={{ padding: "10px 20px", fontSize: 13 }} onClick={() => setFeedbackId(null)}>Cancel</button>
                            <button
                                className="btn-pri"
                                style={{ padding: "10px 20px", fontSize: 13 }}
                                disabled={!feedbackText.trim() || feedbackMutation.isPending}
                                onClick={() => feedbackMutation.mutate({ id: feedbackId, feedback: feedbackText })}
                            >
                                {feedbackMutation.isPending ? "Submitting..." : "Submit Feedback"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
