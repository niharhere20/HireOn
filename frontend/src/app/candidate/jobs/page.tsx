"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { requirementService, TechRequirement } from "@/services/requirement.service";
import styles from "../candidate.module.css";

export default function JobsPage() {
    const [search, setSearch] = useState("");

    const { data: requirements = [], isLoading } = useQuery({
        queryKey: ["requirements"],
        queryFn: requirementService.getAll,
    });

    const active = requirements.filter((r) => r.isActive);
    const filtered = active.filter((r) =>
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        (r.description ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (r.techStack as string[]).some((s) => s.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.pageTitle}>Open Positions</h1>
                    <p className={styles.pageSub}>Browse active job requirements and apply</p>
                </div>
                <span className="ctag">{active.length} open</span>
            </div>

            {/* Search */}
            <div style={{ marginBottom: 20 }}>
                <input
                    type="text"
                    placeholder="Search by role, skill, or description..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                        width: "100%", maxWidth: 480, padding: "10px 16px",
                        borderRadius: 10, border: "1px solid rgba(108,71,255,.15)",
                        fontSize: 13, outline: "none",
                        background: "var(--input-bg)", color: "var(--text)",
                    }}
                />
            </div>

            {isLoading ? (
                <p style={{ color: "var(--text-lite)", fontSize: 14 }}>Loading positions...</p>
            ) : filtered.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-mid)" }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>💼</div>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>No open positions found</div>
                    <div style={{ fontSize: 13, marginTop: 6 }}>Check back later or adjust your search</div>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {filtered.map((req) => (
                        <JobCard key={req.id} req={req} />
                    ))}
                </div>
            )}
        </div>
    );
}

function JobCard({ req }: { req: TechRequirement }) {
    const [expanded, setExpanded] = useState(false);
    const techStack = req.techStack as string[];

    return (
        <div className={styles.card} style={{ transition: "all 0.2s" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
                <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                        <div style={{
                            width: 40, height: 40, borderRadius: 10,
                            background: "linear-gradient(135deg,rgba(108,71,255,0.15),rgba(255,107,198,0.1))",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 18, flexShrink: 0,
                        }}>
                            💼
                        </div>
                        <div>
                            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "var(--text)" }}>
                                {req.title}
                            </h3>
                            <div style={{ fontSize: 12, color: "var(--text-lite)", marginTop: 2 }}>
                                Posted by {req.createdByHR.name}
                            </div>
                        </div>
                    </div>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                        {techStack.map((s) => (
                            <span key={s} className="skill-pill">{s}</span>
                        ))}
                    </div>

                    <div style={{ display: "flex", gap: 20, fontSize: 13, color: "var(--text-mid)" }}>
                        <span>
                            <strong style={{ color: "var(--text)" }}>{req.minExperience}+</strong> years exp
                        </span>
                        <span>
                            <strong style={{ color: "var(--text)" }}>{req.openings}</strong> opening{req.openings > 1 ? "s" : ""}
                        </span>
                        <span>
                            Match threshold: <strong style={{ color: "var(--violet)" }}>{req.matchThreshold}%</strong>
                        </span>
                    </div>

                    {expanded && req.description && (
                        <div style={{
                            marginTop: 14, fontSize: 13, color: "var(--text-mid)",
                            lineHeight: 1.7, padding: "12px 16px",
                            background: "rgba(108,71,255,0.04)", borderRadius: 10,
                        }}>
                            {req.description}
                        </div>
                    )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
                    <span style={{
                        padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                        background: "rgba(16,185,129,0.1)", color: "#10b981",
                    }}>
                        Active
                    </span>
                    {req.description && (
                        <button
                            onClick={() => setExpanded(!expanded)}
                            style={{
                                padding: "7px 14px", borderRadius: 8, fontSize: 12,
                                border: "1px solid rgba(108,71,255,.2)", background: "transparent",
                                color: "var(--violet)", cursor: "pointer", fontWeight: 600,
                            }}
                        >
                            {expanded ? "Less" : "Details"}
                        </button>
                    )}
                </div>
            </div>

            <div style={{
                marginTop: 14, paddingTop: 14,
                borderTop: "1px solid var(--table-border)",
                display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
                <div style={{ fontSize: 12, color: "var(--text-lite)" }}>
                    {req.candidates.length} applicant{req.candidates.length !== 1 ? "s" : ""}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-lite)" }}>
                    Upload your resume and our HR team will match you automatically
                </div>
            </div>
        </div>
    );
}
