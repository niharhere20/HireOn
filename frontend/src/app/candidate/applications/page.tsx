"use client";
import { useQuery } from "@tanstack/react-query";
import styles from "../candidate.module.css";
import api from "@/lib/api";
import { interviewService } from "@/services/interview.service";

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

function statusChipClass(status: string) {
    switch (status) {
        case "HIRED":       return `${styles.chip} ${styles.chipGreen}`;
        case "SCHEDULED":
        case "INTERVIEWED": return `${styles.chip} ${styles.chipTeal}`;
        case "SHORTLISTED": return `${styles.chip} ${styles.chipViolet}`;
        case "REJECTED":    return `${styles.chip} ${styles.chipAmber}`;
        default:            return `${styles.chip} ${styles.chipViolet}`;
    }
}

function statusLabel(status: string) {
    switch (status) {
        case "APPLIED":     return "Under Review";
        case "SHORTLISTED": return "Shortlisted";
        case "SCHEDULED":   return "Interview Scheduled";
        case "INTERVIEWED": return "Interviewed";
        case "HIRED":       return "Hired";
        case "REJECTED":    return "Rejected";
        default:            return status;
    }
}

export default function ApplicationsPage() {
    const { data: me, isLoading: meLoading } = useQuery<MeResponse>({
        queryKey: ["me"],
        queryFn: () => api.get("/api/auth/me").then((r) => r.data),
    });

    const { data: interviews = [], isLoading: ivLoading } = useQuery({
        queryKey: ["interviews"],
        queryFn: () => interviewService.getAll(),
    });

    const isLoading = meLoading || ivLoading;

    const candidate = me?.candidate;
    const completedInterviews = interviews.filter((iv) => iv.status === "COMPLETED");
    const scheduledInterviews = interviews.filter((iv) => iv.status === "SCHEDULED");

    // Determine current stage label
    const stageLabel = (() => {
        if (!candidate) return "—";
        const s = candidate.status;
        if (s === "SCHEDULED" && scheduledInterviews.length > 0) {
            return `Round ${completedInterviews.length + 1} — Scheduled`;
        }
        if (s === "INTERVIEWED") return `Round ${completedInterviews.length} — Completed`;
        return statusLabel(s);
    })();

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
                    <h1 className={styles.pageTitle}>📋 My Applications</h1>
                    <p className={styles.pageSub}>Track the status of every role you have applied for</p>
                </div>
                <span className={`${styles.chip} ${styles.chipViolet}`}>
                    <span className={styles.chipDot} />{candidate ? "1" : "0"} Application{candidate ? "" : "s"}
                </span>
            </div>

            <div className={styles.card} style={{ padding: 0, overflow: "hidden" }}>
                <table className={styles.appTable}>
                    <thead>
                        <tr>
                            <th>Role</th>
                            <th>AI Match</th>
                            <th>Stage</th>
                            <th>Interviews</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {candidate ? (
                            <tr>
                                <td>
                                    <span style={{ fontWeight: 600, color: "var(--text)", fontSize: 13 }}>
                                        Application on Record
                                    </span>
                                </td>
                                <td>
                                    {candidate.aiProfile ? (
                                        <span style={{ fontWeight: 700, color: "var(--violet)" }}>
                                            {candidate.aiProfile.matchScore}%
                                        </span>
                                    ) : (
                                        <span style={{ color: "var(--text-lite)" }}>—</span>
                                    )}
                                </td>
                                <td>{stageLabel}</td>
                                <td>
                                    {completedInterviews.length} done
                                    {scheduledInterviews.length > 0 && ` · ${scheduledInterviews.length} upcoming`}
                                </td>
                                <td>
                                    <span className={statusChipClass(candidate.status)}>
                                        <span className={styles.chipDot} />
                                        {statusLabel(candidate.status)}
                                    </span>
                                </td>
                                <td>
                                    <button className={`${styles.btn} ${styles.btnGhost} ${styles.btnXs}`}>
                                        View Details
                                    </button>
                                </td>
                            </tr>
                        ) : (
                            <tr>
                                <td colSpan={6}>
                                    <p style={{ color: "var(--text-lite)", fontSize: 14, padding: "12px 0" }}>
                                        No data yet.
                                    </p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
