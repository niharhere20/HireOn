"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import styles from "./candidate.module.css";
import api from "@/lib/api";
import { interviewService } from "@/services/interview.service";
import { useAuthStore } from "@/store/auth.store";

interface MeResponse {
    id: string;
    name: string;
    email: string;
    role: string;
    candidate?: {
        id: string;
        status: string;
        resumeUrl: string | null;
        aiProfile?: {
            matchScore: number;
            hireProbability: number;
            experienceYears: number;
            seniorityLevel: string;
            extractedSkills: string[];
            inferredSkills: string[];
        } | null;
    } | null;
}

const STEPS = [
    { label: "Applied"     },
    { label: "Shortlisted" },
    { label: "Round 1"     },
    { label: "Round 2"     },
    { label: "Round 3"     },
    { label: "HR Round"    },
    { label: "Offer"       },
];

function stepClass(state: string) {
    if (state === "done")   return styles.tStepDone;
    if (state === "active") return styles.tStepActive;
    return styles.tStepPending;
}

function stepIcon(state: string, idx: number) {
    if (state === "done")   return "✓";
    if (state === "active") return "●";
    return String(idx + 1);
}

export default function CandidateDashboard() {
    const authUser = useAuthStore((s) => s.user);

    const { data: me, isLoading: meLoading } = useQuery<MeResponse>({
        queryKey: ["me"],
        queryFn: () => api.get("/api/auth/me").then((r) => r.data),
    });

    const { data: interviews = [], isLoading: ivLoading } = useQuery({
        queryKey: ["interviews"],
        queryFn: () => interviewService.getAll(),
    });

    const { data: myApplications = [] } = useQuery<{ id: string }[]>({
        queryKey: ["my-applications"],
        queryFn: () => api.get("/api/applications/mine").then((r) => r.data),
    });

    const hasResume = !!me?.candidate?.resumeUrl;
    const status = me?.candidate?.status || "APPLIED";
    const completedInterviews = interviews.filter((iv) => iv.status === "COMPLETED");
    const scheduledInterviews = interviews.filter((iv) => iv.status === "SCHEDULED");

    const getStepState = (idx: number): "done" | "active" | "pending" => {
        if (status === "HIRED") return "done";
        if (idx === 0) {
            return status !== "APPLIED" ? "done" : interviews.length === 0 ? "active" : "done";
        }
        if (idx === 1) {
            if (["SHORTLISTED", "SCHEDULED", "INTERVIEWED", "HIRED"].includes(status)) {
                return status === "SHORTLISTED" ? "active" : "done";
            }
            return "pending";
        }
        // Round steps (indices 2-6)
        const roundIdx = idx - 2;
        if (completedInterviews.length > roundIdx) return "done";
        if (scheduledInterviews.length > roundIdx) return "active";
        return "pending";
    };

    // Determine active step label for header chip
    const activeStepIdx = STEPS.findIndex((_, i) => getStepState(i) === "active");
    const activeStepLabel = activeStepIdx >= 0 ? STEPS[activeStepIdx].label : status;

    // Next scheduled interview (soonest)
    const nextInterview = scheduledInterviews
        .slice()
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0];

    // KPI values
    const matchScore = me?.candidate?.aiProfile?.matchScore;
    const roundsPassed = completedInterviews.length;
    const totalRounds = interviews.length;

    // Round history rows: show all interviews + pending placeholder steps
    const now = new Date();

    const kpis = [
        {
            icon: "🧠",
            ki: styles.ki1,
            val: matchScore !== undefined ? `${matchScore}%` : "—",
            lbl: "AI Match Score",
            delta: matchScore !== undefined ? "Top 5%" : "N/A",
            dc: styles.kdUp,
        },
        {
            icon: "🏆",
            ki: styles.ki2,
            val: totalRounds > 0 ? `${roundsPassed} of ${totalRounds}` : String(roundsPassed),
            lbl: "Rounds Passed",
            delta: "On track",
            dc: styles.kdNeu,
        },
        {
            icon: "📅",
            ki: styles.ki3,
            val: String(interviews.length),
            lbl: "Total Interviews",
            delta: status,
            dc: styles.kdNeu,
        },
        {
            icon: "💼",
            ki: styles.ki4,
            val: String(myApplications.length),
            lbl: "Active Applications",
            delta: myApplications.length > 0 ? "Applied" : "None yet",
            dc: styles.kdAmber,
        },
    ];

    // Build round history from real interviews sorted by startTime
    const sortedInterviews = interviews
        .slice()
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    if (meLoading || ivLoading) {
        return (
            <p style={{ color: "var(--text-lite)", fontSize: 14, padding: "20px 0" }}>Loading...</p>
        );
    }

    // No resume uploaded yet — show get-started prompt
    if (!hasResume) {
        return (
            <div>
                <div className={styles.pageHeader}>
                    <div>
                        <h1 className={styles.pageTitle}>Your Application Journey 🗺️</h1>
                        <p className={styles.pageSub}>
                            Welcome back, <strong>{me?.name || authUser?.name || "Candidate"}</strong>
                        </p>
                    </div>
                </div>
                <div className={styles.stageDetailCard} style={{ textAlign: "center", padding: "48px 32px" }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>📄</div>
                    <div className={styles.stageTitle} style={{ marginBottom: 10 }}>No Application Yet</div>
                    <div className={styles.stageSub} style={{ marginBottom: 24 }}>
                        Upload your resume to get started. Our AI will analyze your profile and match you to open roles.
                    </div>
                    <Link href="/candidate/resume" className={`${styles.btn} ${styles.btnTeal} ${styles.btnSm}`}>
                        Upload Resume →
                    </Link>
                </div>
            </div>
        );
    }

    // Resume uploaded but no applications yet
    if (myApplications.length === 0) {
        return (
            <div>
                <div className={styles.pageHeader}>
                    <div>
                        <h1 className={styles.pageTitle}>Your Application Journey 🗺️</h1>
                        <p className={styles.pageSub}>
                            Welcome back, <strong>{me?.name || authUser?.name || "Candidate"}</strong>
                        </p>
                    </div>
                </div>
                <div className={styles.stageDetailCard} style={{ textAlign: "center", padding: "48px 32px" }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>🚀</div>
                    <div className={styles.stageTitle} style={{ marginBottom: 10 }}>You haven&apos;t applied yet</div>
                    <div className={styles.stageSub} style={{ marginBottom: 24 }}>
                        Your resume is ready! Browse current openings and apply to positions that match your profile.
                    </div>
                    <Link href="/candidate/jobs" className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm}`}>
                        Browse Openings →
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>Your Application Journey 🗺️</h1>
                    <p className={styles.pageSub}>
                        Welcome back, <strong>{me?.name || authUser?.name || "Candidate"}</strong>
                        &nbsp;&nbsp;
                        <span className={`${styles.chip} ${styles.chipTeal}`}>
                            <span className={styles.chipDot} />
                            {activeStepLabel}
                            {getStepState(activeStepIdx) === "active" ? " — In Progress" : ""}
                        </span>
                    </p>
                </div>
            </div>

            {/* Tracker */}
            <div className={styles.card} style={{ marginBottom: 20 }}>
                <div className={styles.cardTitle}>Application Tracker</div>
                <div className={styles.trackerWrap}>
                    <div className={styles.trackerLine} />
                    <div className={styles.trackerProgress} />
                    <div className={styles.trackerSteps}>
                        {STEPS.map((step, i) => {
                            const state = getStepState(i);
                            return (
                                <div key={step.label} className={`${styles.tStep} ${stepClass(state)}`}>
                                    <div className={styles.tStepDot}>{stepIcon(state, i)}</div>
                                    <div className={styles.tStepLabel}>{step.label}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Current Stage Detail */}
            <div className={styles.stageDetailCard}>
                <div className={styles.stageLabel}>Current Stage</div>
                <div className={styles.stageTitle}>
                    {nextInterview
                        ? `Round ${scheduledInterviews.indexOf(nextInterview) + completedInterviews.length + 1} — Interview`
                        : status === "HIRED"
                        ? "Offer Extended"
                        : status === "SHORTLISTED"
                        ? "Shortlisted — Awaiting Schedule"
                        : `Status: ${status}`}
                </div>
                <div className={styles.stageSub}>
                    {nextInterview
                        ? `Your next interview is scheduled for ${new Date(nextInterview.startTime).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })} with ${nextInterview.interviewer.name}.`
                        : completedInterviews.length > 0
                        ? `You have completed ${completedInterviews.length} interview${completedInterviews.length > 1 ? "s" : ""} so far.`
                        : "Your application is being reviewed. Stay tuned for updates."}
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <Link href="/candidate/schedule" className={`${styles.btn} ${styles.btnTeal} ${styles.btnSm}`}>
                        📅 View Interview Details
                    </Link>
                </div>
            </div>

            {/* Grid2 — Round History + KPIs */}
            <div className={styles.grid2}>
                {/* Round History */}
                <div className={styles.card}>
                    <div className={styles.cardTitle}>Round History</div>
                    {sortedInterviews.length === 0 ? (
                        <p style={{ color: "var(--text-lite)", fontSize: 14, padding: "12px 0" }}>No data yet.</p>
                    ) : (
                        sortedInterviews.map((iv, idx) => {
                            const isCompleted = iv.status === "COMPLETED";
                            const isScheduled = iv.status === "SCHEDULED";
                            const isToday = new Date(iv.startTime).toDateString() === now.toDateString();
                            const dot = isCompleted ? "done" : isScheduled ? "active" : "pend";
                            const dateStr = new Date(iv.startTime).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                            });
                            const sub = isCompleted
                                ? "Completed ✅"
                                : isScheduled
                                ? isToday
                                    ? "Today"
                                    : "Scheduled"
                                : "Cancelled";
                            return (
                                <div key={iv.id} className={styles.rhItem}>
                                    <div
                                        className={styles.rhDot}
                                        style={{
                                            background:
                                                dot === "done"
                                                    ? "#10b981"
                                                    : dot === "active"
                                                    ? "var(--teal)"
                                                    : "var(--card-border)",
                                            boxShadow:
                                                dot === "active"
                                                    ? "0 0 0 3px rgba(0,212,200,0.2)"
                                                    : undefined,
                                        }}
                                    />
                                    <div>
                                        <div className={styles.rhName}>Round {idx + 1} — Interview</div>
                                        <div className={styles.rhDate}>
                                            {dateStr} · {sub}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* KPI Grid */}
                <div className={styles.grid2} style={{ alignContent: "start" }}>
                    {kpis.map((k) => (
                        <div key={k.lbl} className={styles.kpiCard}>
                            <div className={styles.kpiTop}>
                                <div className={`${styles.kpiIcon} ${k.ki}`}>{k.icon}</div>
                                <span className={`${styles.kpiDelta} ${k.dc}`}>{k.delta}</span>
                            </div>
                            <div className={styles.kpiVal}>{k.val}</div>
                            <div className={styles.kpiLbl}>{k.lbl}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
