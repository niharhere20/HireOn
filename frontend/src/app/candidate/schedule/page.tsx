"use client";
import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import styles from "../candidate.module.css";
import { interviewService } from "@/services/interview.service";

export default function SchedulePage() {
    const [feedbackModal, setFeedbackModal] = useState<{ open: boolean; text: string | null; title: string }>({
        open: false,
        text: null,
        title: "",
    });

    const { data: interviews = [], isLoading } = useQuery({
        queryKey: ["interviews"],
        queryFn: () => interviewService.getAll(),
    });

    const now = new Date();

    const upcoming = interviews
        .filter((iv) => iv.status === "SCHEDULED" && new Date(iv.startTime) >= now)
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    const past = interviews
        .filter((iv) => iv.status === "COMPLETED")
        .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

    if (isLoading) {
        return (
            <p style={{ color: "var(--text-lite)", fontSize: 14, padding: "20px 0" }}>Loading...</p>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>📅 My Interviews</h1>
                    <p className={styles.pageSub}>Upcoming and past interview sessions</p>
                </div>
                <span className={`${styles.chip} ${styles.chipTeal}`}>
                    <span className={styles.chipDot} />{upcoming.length} Upcoming
                </span>
            </div>

            {/* Upcoming */}
            <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-lite)", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 10 }}>
                    Upcoming
                </div>

                {upcoming.length === 0 ? (
                    <p style={{ color: "var(--text-lite)", fontSize: 14, padding: "12px 0" }}>No data yet.</p>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {upcoming.map((iv, idx) => {
                            const start = new Date(iv.startTime);
                            const end = new Date(iv.endTime);
                            const isToday = start.toDateString() === now.toDateString();
                            const timeStr = start.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
                            const [timePart, ampm] = timeStr.split(" ");
                            const dateStr = start.toLocaleDateString("en-US", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                            });
                            const duration = Math.round((end.getTime() - start.getTime()) / 60000);
                            const roundNum = past.length + idx + 1;

                            return (
                                <div key={iv.id} className={`${styles.intCard} ${styles.icLive}`}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                                        {/* Left — time */}
                                        <div>
                                            <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                                                <span className={styles.intTime}>{timePart}</span>
                                                <span className={styles.intAmPm}>{ampm}</span>
                                                {isToday && (
                                                    <span className={`${styles.chip} ${styles.chipTeal}`} style={{ marginLeft: 8, fontSize: 10 }}>Today</span>
                                                )}
                                            </div>
                                            <div className={styles.intDt}>{dateStr}</div>
                                        </div>

                                        {/* Right — live badge */}
                                        <span style={{
                                            display: "inline-flex", alignItems: "center", gap: 6,
                                            padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                                            background: "rgba(0,212,200,0.12)", color: "var(--teal)",
                                        }}>
                                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--teal)", display: "inline-block", animation: "pulse 2s infinite" }} />
                                            {isToday ? "Live Soon" : "Scheduled"}
                                        </span>
                                    </div>

                                    <div>
                                        <div className={styles.intTitle}>Round {roundNum} — Interview</div>
                                        <div className={styles.intRound}>with {iv.interviewer.name}</div>
                                    </div>

                                    <div className={styles.intMeta}>
                                        <span className={styles.intMetaItem}>📅 {dateStr}</span>
                                        <span className={styles.intMetaItem}>⏱ {duration} min</span>
                                        <span className={styles.intMetaItem}>👤 {iv.interviewer.name}</span>
                                    </div>

                                    {iv.meetLink && (
                                        <div>
                                            <a href={iv.meetLink} target="_blank" rel="noreferrer" className={styles.intLink}>
                                                🔗 {iv.meetLink}
                                            </a>
                                        </div>
                                    )}

                                    <div className={styles.intActions}>
                                        {iv.meetLink ? (
                                            <a
                                                href={iv.meetLink}
                                                target="_blank"
                                                rel="noreferrer"
                                                className={`${styles.btn} ${styles.btnTeal}`}
                                            >
                                                Join Meeting
                                            </a>
                                        ) : (
                                            <button className={`${styles.btn} ${styles.btnTeal}`} disabled>
                                                Link Pending
                                            </button>
                                        )}
                                        <Link href="/candidate/prep" className={`${styles.btn} ${styles.btnGhost}`}>
                                            🎯 Prep Kit
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Past Interviews */}
            <div style={{ marginTop: 28 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-lite)", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 10 }}>
                    Past Interviews
                </div>

                {past.length === 0 ? (
                    <p style={{ color: "var(--text-lite)", fontSize: 14, padding: "12px 0" }}>No data yet.</p>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {past.map((iv, idx) => {
                            const start = new Date(iv.startTime);
                            const end = new Date(iv.endTime);
                            const duration = Math.round((end.getTime() - start.getTime()) / 60000);
                            const dateStr = start.toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                            });
                            const roundNum = past.length - idx;

                            return (
                                <div key={iv.id} className={`${styles.intCard} ${styles.icDone}`}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                                        <div>
                                            <div className={styles.intTitle}>Round {roundNum} — Interview</div>
                                            <div className={styles.intMeta} style={{ marginTop: 6 }}>
                                                <span className={styles.intMetaItem}>📅 {dateStr}</span>
                                                <span className={styles.intMetaItem}>⏱ {duration} min</span>
                                                <span className={styles.intMetaItem}>👤 {iv.interviewer.name}</span>
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                            <span className={`${styles.chip} ${styles.chipGreen}`}>
                                                <span className={styles.chipDot} />Done ✅
                                            </span>
                                            <button
                                                className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`}
                                                onClick={() =>
                                                    setFeedbackModal({
                                                        open: true,
                                                        text: iv.feedback,
                                                        title: `Round ${roundNum} Feedback`,
                                                    })
                                                }
                                            >
                                                View Feedback
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Feedback Modal */}
            {feedbackModal.open && (
                <div
                    style={{
                        position: "fixed", inset: 0, zIndex: 1000,
                        background: "rgba(0,0,0,0.55)", display: "flex",
                        alignItems: "center", justifyContent: "center", padding: 24,
                    }}
                    onClick={() => setFeedbackModal({ open: false, text: null, title: "" })}
                >
                    <div
                        style={{
                            background: "var(--card-bg)", borderRadius: 16, padding: 28,
                            maxWidth: 480, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
                            border: "1px solid var(--card-border)",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 14 }}>
                            {feedbackModal.title}
                        </div>
                        <p style={{ fontSize: 14, color: "var(--text-mid)", lineHeight: 1.7 }}>
                            {feedbackModal.text || "No feedback provided yet."}
                        </p>
                        <button
                            className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`}
                            style={{ marginTop: 20 }}
                            onClick={() => setFeedbackModal({ open: false, text: null, title: "" })}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
