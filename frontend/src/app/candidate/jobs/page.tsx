"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import styles from "../candidate.module.css";
import { requirementService, TechRequirement } from "@/services/requirement.service";
import api from "@/lib/api";
import Link from "next/link";

const FILTERS = ["All", "Frontend", "Backend", "Full Stack", "Design"];

interface Application {
    id: string;
    requirementId: string;
    status: string;
    appliedAt: string;
}

export default function JobsPage() {
    const [search, setSearch] = useState("");
    const [activeFilter, setActiveFilter] = useState("All");
    const [detailReq, setDetailReq] = useState<TechRequirement | null>(null);
    const [applyToast, setApplyToast] = useState("");
    const qc = useQueryClient();

    const { data: me } = useQuery({
        queryKey: ["me"],
        queryFn: () => api.get("/api/auth/me").then((r) => r.data),
    });

    const hasResume = !!me?.candidate?.resumeUrl;

    const { data: requirements = [], isLoading } = useQuery({
        queryKey: ["requirements"],
        queryFn: () => requirementService.getAll(),
    });

    const { data: myApplications = [] } = useQuery<Application[]>({
        queryKey: ["my-applications"],
        queryFn: () => api.get("/api/applications/mine").then((r) => r.data),
    });

    const appliedIds = new Set(myApplications.map((a) => a.requirementId));

    const applyMutation = useMutation({
        mutationFn: (requirementId: string) =>
            api.post("/api/applications", { requirementId }),
        onSuccess: (_data, requirementId) => {
            qc.invalidateQueries({ queryKey: ["my-applications"] });
            const req = requirements.find((r) => r.id === requirementId);
            setApplyToast(`Interest expressed for "${req?.title}"! HR will review your profile.`);
            setTimeout(() => setApplyToast(""), 4000);
        },
    });

    const filtered = requirements
        .filter((r) => r.isActive)
        .filter(
            (r) =>
                search === "" ||
                r.title.toLowerCase().includes(search.toLowerCase()) ||
                r.techStack.some((t) => t.toLowerCase().includes(search.toLowerCase()))
        )
        .filter(
            (r) =>
                activeFilter === "All" ||
                r.techStack.some((t) => t.toLowerCase().includes(activeFilter.toLowerCase()))
        );

    function handleApply(req: TechRequirement) {
        if (appliedIds.has(req.id) || !hasResume || applyMutation.isPending) return;
        applyMutation.mutate(req.id);
    }

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
                    <h1 className={styles.pageTitle}>🏢 Current Openings</h1>
                    <p className={styles.pageSub}>Browse active positions matched to your profile</p>
                </div>
                <span className={`${styles.chip} ${styles.chipGreen}`}>
                    <span className={styles.chipDot} />{requirements.filter((r) => r.isActive).length} open
                </span>
            </div>

            {/* Toast */}
            {applyToast && (
                <div style={{
                    padding: "12px 18px", borderRadius: 12, marginBottom: 16,
                    background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)",
                    color: "#10b981", fontSize: 13, fontWeight: 600,
                }}>
                    ✅ {applyToast}
                </div>
            )}

            {/* Search + Filters */}
            <div className={styles.searchRow}>
                <input
                    type="text"
                    placeholder="Search by role or skill…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className={styles.searchInput}
                />
                <div className={styles.filterPills}>
                    {FILTERS.map((f) => (
                        <button
                            key={f}
                            className={`${styles.filterPill} ${activeFilter === f ? styles.filterPillActive : ""}`}
                            onClick={() => setActiveFilter(f)}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Job Cards */}
            {filtered.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-mid)" }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>💼</div>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>No positions found</div>
                    <div style={{ fontSize: 13, marginTop: 6 }}>Try adjusting your search or filter</div>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {filtered.map((req) => {
                        const applied = appliedIds.has(req.id);
                        return (
                            <div key={req.id} className={styles.jobCard}>
                                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                                    {/* Left */}
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                                            <div style={{
                                                width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                                                background: "linear-gradient(135deg,rgba(108,71,255,0.15),rgba(255,107,198,0.1))",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                fontSize: 18,
                                            }}>💼</div>
                                            <div>
                                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                    <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>{req.title}</span>
                                                    {applied && (
                                                        <span className={`${styles.chip} ${styles.chipGreen}`} style={{ fontSize: 10 }}>Applied</span>
                                                    )}
                                                </div>
                                                <div style={{ fontSize: 12, color: "var(--text-lite)", marginTop: 2 }}>
                                                    {req.createdByHR.name}&apos;s Team
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ display: "flex", gap: 16, fontSize: 13, color: "var(--text-mid)", flexWrap: "wrap", marginBottom: 10 }}>
                                            <span>📋 {req.openings} opening{req.openings !== 1 ? "s" : ""}</span>
                                            <span>🎯 {req.minExperience}+ yrs exp</span>
                                            <span>⭐ {req.matchThreshold}% match threshold</span>
                                        </div>

                                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                            {req.techStack.map((t) => (
                                                <span key={t} className={styles.spill}>{t}</span>
                                            ))}
                                        </div>

                                        {req.description && (
                                            <div style={{ fontSize: 13, color: "var(--text-mid)", marginTop: 10, lineHeight: 1.6 }}>
                                                {req.description}
                                            </div>
                                        )}
                                    </div>

                                    {/* Right — Actions */}
                                    <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0, minWidth: 130, alignItems: "flex-end" }}>
                                        <button
                                            className={`${styles.btn} ${applied || !hasResume ? styles.btnGhost : styles.btnPrimary} ${styles.btnSm}`}
                                            style={{ width: "100%", opacity: applied || !hasResume ? 0.55 : 1 }}
                                            onClick={() => hasResume && handleApply(req)}
                                            disabled={applied || !hasResume || applyMutation.isPending}
                                            title={!hasResume ? "Upload your resume first" : undefined}
                                        >
                                            {applied ? "✅ Applied" : applyMutation.isPending ? "Applying…" : "Apply Now"}
                                        </button>
                                        {!hasResume && (
                                            <Link href="/candidate/resume" style={{ fontSize: 11, color: "var(--violet)", textDecoration: "none", textAlign: "center", width: "100%" }}>
                                                Upload resume first →
                                            </Link>
                                        )}
                                        <button
                                            className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`}
                                            style={{ width: "100%" }}
                                            onClick={() => setDetailReq(req)}
                                        >
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Detail Modal */}
            {detailReq && (
                <div
                    style={{
                        position: "fixed", inset: 0, zIndex: 1000,
                        background: "rgba(0,0,0,0.55)", display: "flex",
                        alignItems: "center", justifyContent: "center", padding: 24,
                    }}
                    onClick={() => setDetailReq(null)}
                >
                    <div
                        style={{
                            background: "var(--card-bg)", borderRadius: 16, padding: 32,
                            maxWidth: 520, width: "100%",
                            boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
                            border: "1px solid var(--card-border)",
                            maxHeight: "80vh", overflowY: "auto",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal header */}
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
                            <div>
                                <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", marginBottom: 4 }}>
                                    {detailReq.title}
                                </div>
                                <div style={{ fontSize: 12, color: "var(--text-lite)" }}>
                                    {detailReq.createdByHR.name}&apos;s Team
                                </div>
                            </div>
                            <button
                                onClick={() => setDetailReq(null)}
                                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "var(--text-lite)", padding: 4 }}
                            >✕</button>
                        </div>

                        {/* Stats */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
                            {[
                                { label: "Openings", val: String(detailReq.openings) },
                                { label: "Min Experience", val: `${detailReq.minExperience}+ yrs` },
                                { label: "Match Threshold", val: `${detailReq.matchThreshold}%` },
                            ].map((s) => (
                                <div key={s.label} style={{
                                    background: "var(--kpi-bg)", border: "1px solid var(--card-border)",
                                    borderRadius: 10, padding: "10px 12px",
                                }}>
                                    <div style={{ fontSize: 10, color: "var(--text-lite)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 3 }}>
                                        {s.label}
                                    </div>
                                    <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text)" }}>{s.val}</div>
                                </div>
                            ))}
                        </div>

                        {/* Tech Stack */}
                        <div style={{ marginBottom: 18 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-lite)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
                                Tech Stack
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                {detailReq.techStack.map((t) => (
                                    <span key={t} className={styles.spill}>{t}</span>
                                ))}
                            </div>
                        </div>

                        {/* Description */}
                        {detailReq.description && (
                            <div style={{ marginBottom: 24 }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-lite)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
                                    About This Role
                                </div>
                                <p style={{ fontSize: 14, color: "var(--text-mid)", lineHeight: 1.7 }}>
                                    {detailReq.description}
                                </p>
                            </div>
                        )}

                        {/* Note */}
                        <div style={{
                            padding: "12px 14px", borderRadius: 10,
                            background: "rgba(108,71,255,0.06)", border: "1px solid rgba(108,71,255,0.12)",
                            fontSize: 12, color: "var(--text-mid)", lineHeight: 1.6, marginBottom: 20,
                        }}>
                            💡 <strong>How it works:</strong> Express your interest below. HR will review your profile and AI match score, and reach out if you&apos;re a strong fit.
                        </div>

                        {/* Actions */}
                        <div style={{ display: "flex", gap: 10 }}>
                            <button
                                className={`${styles.btn} ${appliedIds.has(detailReq.id) || !hasResume ? styles.btnGhost : styles.btnPrimary}`}
                                style={{ flex: 1, opacity: appliedIds.has(detailReq.id) || !hasResume ? 0.55 : 1 }}
                                onClick={() => { if (hasResume && !appliedIds.has(detailReq.id)) { handleApply(detailReq); setDetailReq(null); } }}
                                disabled={appliedIds.has(detailReq.id) || !hasResume || applyMutation.isPending}
                                title={!hasResume ? "Upload your resume first" : undefined}
                            >
                                {appliedIds.has(detailReq.id) ? "✅ Interest Expressed" : !hasResume ? "Upload Resume First" : "Express Interest"}
                            </button>
                            <button
                                className={`${styles.btn} ${styles.btnOutline}`}
                                onClick={() => setDetailReq(null)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
