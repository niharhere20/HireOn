"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { candidateService, Candidate } from "@/services/candidate.service";
import { requirementService } from "@/services/requirement.service";
import { interviewService } from "@/services/interview.service";
import { authService } from "@/services/auth.service";
import styles from "../hr.module.css";

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
    APPLIED: { label: "Applied", cls: "st-new" },
    SHORTLISTED: { label: "Shortlisted", cls: "st-short" },
    SCHEDULED: { label: "Scheduled", cls: "st-sched" },
    INTERVIEWED: { label: "Interviewed", cls: "st-sched" },
    HIRED: { label: "Hired", cls: "st-short" },
    REJECTED: { label: "Rejected", cls: "st-review" },
};

export default function CandidatesPage() {
    const qc = useQueryClient();
    const [statusFilter, setStatusFilter] = useState("");
    const [search, setSearch] = useState("");
    const [schedulingId, setSchedulingId] = useState<string | null>(null);
    const [selectedInterviewer, setSelectedInterviewer] = useState("");
    const [schedDate, setSchedDate] = useState("");
    const [schedTime, setSchedTime] = useState("");
    const [schedDuration, setSchedDuration] = useState(45);

    const { data: candidates = [], isLoading } = useQuery({
        queryKey: ["candidates", statusFilter],
        queryFn: () => candidateService.getAll(statusFilter ? { status: statusFilter } : undefined),
    });

    const { data: requirements = [] } = useQuery({
        queryKey: ["requirements"],
        queryFn: requirementService.getAll,
    });

    const { data: interviewers = [] } = useQuery({
        queryKey: ["interviewers"],
        queryFn: authService.getInterviewers,
    });

    const analyzeMutation = useMutation({
        mutationFn: (candidateId: string) => candidateService.analyze(candidateId),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["candidates"] }),
    });

    const scheduleMutation = useMutation({
        mutationFn: ({ candidateId, interviewerId, startTime, durationMinutes }: {
            candidateId: string; interviewerId: string; startTime: string; durationMinutes: number;
        }) => interviewService.schedule(candidateId, interviewerId, startTime, durationMinutes),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["candidates"] });
            setSchedulingId(null);
            setSelectedInterviewer("");
            setSchedDate("");
            setSchedTime("");
            setSchedDuration(45);
        },
    });

    const filtered = candidates.filter((c) =>
        c.user.name.toLowerCase().includes(search.toLowerCase()) ||
        c.user.email.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.pageTitle}>Candidates</h1>
                    <p className={styles.pageSub}>All applicants — search, filter, analyze & schedule</p>
                </div>
            </div>

            {/* Filters */}
            <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                        flex: 1, padding: "10px 16px", borderRadius: 10,
                        border: "1px solid rgba(108,71,255,.15)", fontSize: 13,
                        background: "#fff", outline: "none",
                    }}
                />
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{
                        padding: "10px 16px", borderRadius: 10,
                        border: "1px solid rgba(108,71,255,.15)", fontSize: 13,
                        background: "#fff", cursor: "pointer",
                    }}
                >
                    <option value="">All Statuses</option>
                    {Object.keys(STATUS_LABELS).map((s) => (
                        <option key={s} value={s}>{STATUS_LABELS[s].label}</option>
                    ))}
                </select>
            </div>

            <div className={styles.card}>
                <div className={styles.cardHead}>
                    <span>All Candidates</span>
                    <span className="ctag pink">{filtered.length} total</span>
                </div>

                {isLoading ? (
                    <p style={{ color: "var(--text-lite)", fontSize: 14, padding: "20px 0" }}>Loading candidates...</p>
                ) : filtered.length === 0 ? (
                    <p style={{ color: "var(--text-lite)", fontSize: 14, padding: "20px 0" }}>No candidates found.</p>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Candidate</th>
                                <th>AI Score</th>
                                <th>Requirement</th>
                                <th>Skills</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((c: Candidate) => {
                                const st = STATUS_LABELS[c.status] ?? { label: c.status, cls: "st-new" };
                                return (
                                    <tr key={c.id}>
                                        <td>
                                            <div className={styles.cCell}>
                                                <div className={styles.cAv} style={{ background: "linear-gradient(135deg,#ddd6fe,#a78bfa)" }}>
                                                    {c.user.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className={styles.cName}>{c.user.name}</div>
                                                    <div className={styles.cExp}>{c.user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            {c.aiProfile ? (
                                                <div className={styles.scoreCell}>
                                                    <div className="match-bar-wrap">
                                                        <div className="match-bar-fill" style={{ width: `${c.aiProfile.matchScore}%` }} />
                                                    </div>
                                                    <span className={`${styles.scoreNum} ${c.aiProfile.matchScore >= 80 ? "sc-hi" : c.aiProfile.matchScore >= 60 ? "sc-md" : "sc-lo"}`}>
                                                        {c.aiProfile.matchScore}%
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="sc-new" style={{ padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>Not analyzed</span>
                                            )}
                                        </td>
                                        <td>
                                            <span style={{ fontSize: 13, color: "var(--text-mid)" }}>
                                                {c.assignedRequirement?.title ?? "—"}
                                            </span>
                                        </td>
                                        <td>
                                            {c.aiProfile?.extractedSkills?.slice(0, 3).map((s: string) => (
                                                <span className="skill-pill" key={s}>{s}</span>
                                            )) ?? "—"}
                                        </td>
                                        <td>
                                            <span className={`status-chip ${st.cls}`}>
                                                <span className="st-dot" />{st.label}
                                            </span>
                                        </td>
                                        <td>
                                            <div className={styles.actions}>
                                                {!c.aiProfile && c.resumeText && (
                                                    <button
                                                        className="action-btn ab-pri"
                                                        onClick={() => analyzeMutation.mutate(c.id)}
                                                        disabled={analyzeMutation.isPending}
                                                    >
                                                        {analyzeMutation.isPending && analyzeMutation.variables === c.id ? "..." : "Analyze"}
                                                    </button>
                                                )}
                                                {c.status === "SHORTLISTED" && (
                                                    <button
                                                        className="action-btn ab-sec"
                                                        onClick={() => setSchedulingId(c.id)}
                                                    >
                                                        Schedule
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Schedule Modal */}
            {schedulingId && (() => {
                const schedCandidate = filtered.find((c) => c.id === schedulingId);
                const ai = schedCandidate?.aiProfile;
                const startISO = schedDate && schedTime ? new Date(`${schedDate}T${schedTime}`).toISOString() : "";
                const canSubmit = !!selectedInterviewer && !!startISO;
                return (
                    <div style={{
                        position: "fixed", inset: 0, background: "rgba(0,0,0,.45)",
                        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
                    }}>
                        <div style={{
                            background: "var(--card-bg, #fff)", borderRadius: 20, width: 460,
                            boxShadow: "0 20px 60px rgba(108,71,255,.18)", overflow: "hidden",
                        }}>
                            {/* Header */}
                            <div style={{
                                background: "linear-gradient(135deg,#6c47ff,#a78bfa)",
                                padding: "24px 28px", color: "#fff",
                            }}>
                                <div style={{ fontSize: 11, fontWeight: 600, opacity: .75, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
                                    Schedule Interview
                                </div>
                                <div style={{ fontSize: 18, fontWeight: 700 }}>{schedCandidate?.user.name}</div>
                                {ai && (
                                    <div style={{ marginTop: 10, display: "flex", gap: 16 }}>
                                        <div style={{ background: "rgba(255,255,255,.18)", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 600 }}>
                                            Match Score: {ai.matchScore}%
                                        </div>
                                        <div style={{ background: "rgba(255,255,255,.18)", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 600 }}>
                                            Hire Probability: {ai.hireProbability}%
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Body */}
                            <div style={{ padding: "24px 28px" }}>
                                {/* Interviewer */}
                                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-lite,#888)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: .5 }}>
                                    Interviewer
                                </label>
                                <select
                                    value={selectedInterviewer}
                                    onChange={(e) => setSelectedInterviewer(e.target.value)}
                                    style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(108,71,255,.2)", fontSize: 13, marginBottom: 18, background: "var(--card-bg,#fff)", color: "var(--text-main,#111)" }}
                                >
                                    <option value="">— Choose interviewer —</option>
                                    {interviewers.map((iv) => (
                                        <option key={iv.id} value={iv.id}>{iv.name} ({iv.email})</option>
                                    ))}
                                </select>

                                {/* Date + Time */}
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
                                    <div>
                                        <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-lite,#888)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: .5 }}>
                                            Date
                                        </label>
                                        <input
                                            type="date"
                                            value={schedDate}
                                            min={new Date().toISOString().split("T")[0]}
                                            onChange={(e) => setSchedDate(e.target.value)}
                                            style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(108,71,255,.2)", fontSize: 13, background: "var(--card-bg,#fff)", color: "var(--text-main,#111)", boxSizing: "border-box" }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-lite,#888)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: .5 }}>
                                            Time
                                        </label>
                                        <input
                                            type="time"
                                            value={schedTime}
                                            onChange={(e) => setSchedTime(e.target.value)}
                                            style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(108,71,255,.2)", fontSize: 13, background: "var(--card-bg,#fff)", color: "var(--text-main,#111)", boxSizing: "border-box" }}
                                        />
                                    </div>
                                </div>

                                {/* Duration */}
                                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-lite,#888)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: .5 }}>
                                    Duration
                                </label>
                                <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                                    {[30, 45, 60].map((d) => (
                                        <button
                                            key={d}
                                            onClick={() => setSchedDuration(d)}
                                            style={{
                                                flex: 1, padding: "9px 0", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer",
                                                border: schedDuration === d ? "2px solid #6c47ff" : "1px solid rgba(108,71,255,.2)",
                                                background: schedDuration === d ? "rgba(108,71,255,.08)" : "transparent",
                                                color: schedDuration === d ? "#6c47ff" : "var(--text-mid,#555)",
                                            }}
                                        >
                                            {d} min
                                        </button>
                                    ))}
                                </div>

                                {scheduleMutation.isError && (
                                    <p style={{ color: "#ef4444", fontSize: 13, marginBottom: 12 }}>
                                        Failed to schedule interview. Please try again.
                                    </p>
                                )}

                                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                                    <button
                                        className="btn-gl"
                                        style={{ padding: "10px 20px", fontSize: 13 }}
                                        onClick={() => { setSchedulingId(null); setSelectedInterviewer(""); setSchedDate(""); setSchedTime(""); setSchedDuration(45); }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="btn-pri"
                                        style={{ padding: "10px 20px", fontSize: 13 }}
                                        disabled={!canSubmit || scheduleMutation.isPending}
                                        onClick={() => scheduleMutation.mutate({
                                            candidateId: schedulingId,
                                            interviewerId: selectedInterviewer,
                                            startTime: startISO,
                                            durationMinutes: schedDuration,
                                        })}
                                    >
                                        {scheduleMutation.isPending ? "Scheduling..." : "Confirm & Send Invite"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
